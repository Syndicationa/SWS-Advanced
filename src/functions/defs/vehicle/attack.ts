import { compose, compareArray, sumArrays} from "../../functions";
import { replaceInArray } from "../../functions";
import { updateActiveDef, mergeVehicleArrays, getActiveShields, getShieldIndex, vehiclesOnLine, sameVehicle } from "./retrieve";
import {getWeapIndex, getActiveDefs, getAmmoOfTool, getPlayerVehicles, vehiclesInRadius} from "./retrieve";
import { oldArea } from "./vehicle";
import { sub, unitDotProduct, distance } from "../../vectors";
import { vehicle } from "../../types/vehicleTypes";
import { line, locationVector, rotationVector, statusUtil, weapon, weaponWithCount } from "../../types/types";
import {hit, hitOptions, hitNumbers} from "../../types/types";


type damage = [vehicleDamage: number, shieldDamage: number];
type damages = damage[];

type attackReturn = {modifiedVehicles: vehicle[], damage: damages};
type targetArray = [primaryVehicle:vehicle, ...rest: vehicle[]];

export const inFiringRot = (fLoc: locationVector, tLoc: locationVector, fRot:rotationVector, wRot: number, offset:rotationVector): boolean => {
    const distVec = sub(tLoc, fLoc);
    if (compareArray(distVec, new Array(distVec.length).fill(() => 0))) return true;
    const uDP = unitDotProduct(distVec, sumArrays(fRot, offset));
    const result = Math.round(400*(1 - (uDP*Math.abs(uDP))))/100;
    return result <= wRot;
};

export const canFire = (attacker: vehicle, target: vehicle, weapon: weapon | weaponWithCount): boolean => {
    const {prevLoc:attackerLocation, rotation} = attacker.Location;
    const targetLocation = target.Location.prevLoc;
    const {energy, heat} = attacker.State;
    const {Mov, MaxHeat} = attacker.Stats;

    const fireCount = 
        "fireCount" in weapon 
            ? weapon.fireCount
            : attacker.Weap.fireCount[getWeapIndex(attacker.Weap.Data, weapon)];
    const ammoCount = getAmmoOfTool(weapon, attacker.Ammo);
    const heatLoad = "HeatLoad" in weapon ? weapon.HeatLoad:0;

    const trueWrot = (weapon.Wrot ?? 0) + Math.round(Mov / 6);
    const offsetValue = weapon.Offset ?? [0, -1];

    const hasAmmo = (ammoCount > 0);
    const hasEnergy = energy >= weapon.EnergyCost;
    const isCoolEnough = heat + heatLoad <= MaxHeat;
    const fireRate = fireCount < weapon.FireRate;
    const range = weapon.WMran === undefined || weapon.WMran <= distance(attackerLocation, targetLocation);
    const validRotation = weapon.Wrot === undefined || inFiringRot(attackerLocation, targetLocation, rotation, trueWrot, offsetValue);

    return hasAmmo && hasEnergy && isCoolEnough && fireRate && range && validRotation;
};

//#region Hit Chance Helpers

//Finds every vehicle with defenses weapons in range of a location
const defensesInArea =  (vehicleArray: vehicle[], tLoc: locationVector): [defenders: vehicle[], location: locationVector] => {
    const defenders = vehicleArray.filter((vehicle) => {
        const weaponData = vehicle.Weap.Data;
        const {Weapons, wActive} = vehicle.Defenses;
        const dWeaps = Weapons.filter(( w, i) => wActive[i]);
        if (dWeaps.length === 0) return false;
        const dist = distance(tLoc, vehicle.Location.prevLoc);
        return dWeaps.some((wInd) => weaponData[wInd].Wran >= dist);
    });
    return [defenders, tLoc];
};

const calcDefVehicle = (vehicleArray: vehicle[], tLoc: locationVector) => {
    return vehicleArray.reduce((total, vehicle) => {
        const weaponData = vehicle.Weap.Data;
        const dist = distance(tLoc, vehicle.Location.prevLoc);
        const dWeaps = 
            getActiveDefs(vehicle.Defenses)
                .filter((w) => dist <= weaponData[w].Wran)
                .map((wInd) => weaponData[wInd]);
        return total + dWeaps.reduce((acc, weapon) => {
            if (!("Defensive" in weapon) || !weapon.Defensive) return acc;
            const wCov  = weapon.Wcov;
            const dHit = weapon.Whit;
            return acc + ((dHit*wCov)/20)/Math.max(dist - 4, 1);
        }, 0);
		
    }, 0);
};

const calcInterceptChance = compose(calcDefVehicle, defensesInArea);

export const calcGenHitChance = (attacker: vehicle, target: vehicle, tool: weapon | statusUtil): [hit: number, intercept: number] => {
    const {Whit, Wran} = tool;
    const Acc = attacker.Stats.Acc;
    const Mov = target.Stats.Mov;
    const dist = distance(attacker.Location.prevLoc, target.Location.prevLoc);

    let hitChance = (Whit + Acc) + (-25*Math.tanh((Mov- 15)/5) + 25);
    hitChance /= (dist > Wran) ? (dist - Wran + 1):1;
    return [hitChance, hitChance];
};

export const calcDefHitChance = (attacker: vehicle, target: vehicle, weap: weapon, vehicleArray: vehicle[]): [hit: number, intercept: number] => {
    const hitChance = calcGenHitChance(attacker, target, weap)[0];
    const playerVehicles = getPlayerVehicles(target, vehicleArray);
    const hitDifference = calcInterceptChance(playerVehicles, target.Location.prevLoc);
    const interceptHitChance = hitChance - hitDifference;
    return [hitChance, interceptHitChance];
};

export const calcRangeHC = (fVehicle: vehicle, tVehicle: vehicle, range: number): hit => {
    const dist = distance(fVehicle.Location.prevLoc, tVehicle.Location.prevLoc);
    return dist <= range ? "Hit": "Miss";
};
//#endregion

export const calcHit = ([hitChance, interceptChance]): hit => {
    const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
    return hitOptions[(hitChance > rand ? 1: 0) + (interceptChance > rand ? 1:0)];
};

//#region Damage Calculations
const calcBaseDamage = (attacker: vehicle, target: vehicle, weapon: weapon): number => {
    const wAtk = weapon.Watk;
    const wRan = weapon.Wran;
    const wMran = weapon.WMran ?? 0;
    const wRAtk = weapon.WRatk;
    const dist = distance(attacker.Location.prevLoc, target.Location.prevLoc);
    let damage = wAtk + wRAtk*(dist - wMran + (wRan - dist)*((wRAtk >= 0 && dist >= wRan) ? 1:0));
    damage = Math.round(damage);
    return Math.max(damage, 0);
};

const calcGenDamage = (target: vehicle, damage: number) => {
    const def = target.Stats.Def;
    return damage - def;
};

const calcShieldDamage = (target: vehicle, damage: number) => {
    const shields = getActiveShields(target.Defenses);

    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return [damage, 0];

    const shieldDamage= Math.floor(damage*damageShield.Intercept);
    const passthroughDamage = damage - shieldDamage;
    const dSIndex = getShieldIndex(target.Defenses.Shields, damageShield);

    const totalShieldDamage = target.Defenses.sDamage[dSIndex] + shieldDamage;
    const vehicleDamage = Math.max(totalShieldDamage - damageShield.MaxDamage, 0) + passthroughDamage;
    return [vehicleDamage, shieldDamage];
};

export const calculateDamage = (attacker: vehicle, target: vehicle[], weapon: weapon): damages => {
    const hasEran = weapon.Eran !== undefined;

    return target.map((vehicle, i) => {
        const dMult = (hasEran && i !== 0) ? 0.75:1;
        const baseDamage = Math.round(calcBaseDamage(attacker, vehicle, weapon)*dMult);
        const [passthrough, shieldDamage] = calcShieldDamage(vehicle, baseDamage);
        const vehicleDamage = calcGenDamage(vehicle, passthrough);
        return [vehicleDamage, shieldDamage];
    });
};
//#endregion

//#region Application functions
export const consumeAmmo = (ammo, ammoType = 0) => {
    return {...ammo, count: replaceInArray(ammo.count, ammoType, ammo.count[ammoType] - 1)
    };
};

const updateFireRate = (Weap, weapon) => {
    const weapIndex = getWeapIndex(Weap.Data, weapon);
    const nFireCount = Weap.fireCount[weapIndex] + 1;
    return {...Weap, fireCount: replaceInArray(Weap.fireCount, weapIndex, nFireCount)};
};

export const applyDamage = (damage: number, target: vehicle): vehicle => {
    const {hp, maxHP} = target.State;
    return {...target,
        State: {
            ...target.State,
            hp: Math.min(hp - damage, maxHP),
            maxHP: maxHP - ((damage > 0) ? Math.round(damage/5):0)
        }
    };
};

const applyAttacker = (attacker: vehicle, weap: weapon): vehicle => {
    const {energy: initEnergy, heat: initHeat} = attacker.State;
    const energy = initEnergy - weap.EnergyCost;
    const heat = initHeat + ("HeatLoad" in weap ? weap.HeatLoad: 0);
    //Escaping the other bounds is prevented by canFire
    return {...attacker,
        State: {
            ...attacker.State,
            energy: Math.min(attacker.Stats.MaxEnergy, energy),
            heat: Math.max(0, heat),
            hasFired: true,
        },
        Ammo: consumeAmmo(attacker.Ammo, getAmmoOfTool(weap, attacker.Ammo)),
        Weap: updateFireRate(attacker.Weap, weap)
    };
};

const applyTarget = ([damage, sDamage]: damage, target: vehicle): vehicle => {
    if (target === undefined) throw Error("Vehicle not found");
    return consumeShield(applyDamage(damage, target), sDamage);
};

const applyTargets = (damage: damages, target: vehicle[]): vehicle[] => {
    if (target === undefined) throw Error("Vehicle not found");
    return target.map((vehicle, i) => applyTarget(damage[i], vehicle));
};

const consumeDefAmmo = (loc: locationVector) => (vehicle: vehicle) => {
    const weaponData = vehicle.Weap.Data;
    const dist = distance(loc, vehicle.Location.prevLoc);

    const weapons = 
        getActiveDefs(vehicle.Defenses)
            .filter((w) => dist <= weaponData[w].Wran)
            .map(index => weaponData[index]);
    const ammos = weapons.map((weapon) => getAmmoOfTool(weapon, vehicle.Ammo));
    const nAmmo = ammos.reduce((acc, ammo) => consumeAmmo(acc, ammo),vehicle.Ammo);
    return updateActiveDef({
        ...vehicle,
        Ammo: nAmmo
    });
};

const consumeShield = (vehicle, sDam) => {
    const shields = getActiveShields(vehicle.Defenses);
    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return vehicle;
    const dSIndex = getShieldIndex(vehicle.Defenses.Shields, damageShield);

    const takenDamage = vehicle.Defenses.sDamage[dSIndex] + sDam;
    const active = takenDamage < damageShield.MaxDamage;
    const sDamage = replaceInArray(vehicle.Defenses.sDamage, dSIndex, takenDamage);
    const sActive = replaceInArray(vehicle.Defenses.sActive, dSIndex, active);

    return {
        ...vehicle,
        Defenses: {
            ...vehicle.Defenses,
            sDamage,
            sActive
        }
    };
};

const createDataStr = (fVehicle: vehicle, tVehicle: vehicle | vehicle[], weap: weapon, damage, hit) => {
    if (tVehicle instanceof Array) return tVehicle.reduce((acc, vehicle, i) => 
        acc + createDataStr(fVehicle, vehicle, weap, damage[i], hit), "");
    
    const fhasName = fVehicle.Appearance.name !== fVehicle.Type.Class;
    const thasName = tVehicle.Appearance.name !== tVehicle.Type.Class;

    const fName = fhasName ? "The": "~F " + fVehicle.Appearance.name;
    const tName = thasName ? "the": "~T " + tVehicle.Appearance.name;

    switch (weap.Type) {
        case "Generic":
        case "Missile":
        case "Ramming":
        case "Destruct":
            if (hit === 2) {
                return `${fName} hits ${tName} for ${damage} HP.\n`;
            } else if (hit === 1) {
                return `${fName}'s fire is intercepted before hitting ${tName}\n`;
            } else {
                return `${fName} misses ${tName}.\n`;
            }
        default:
            throw Error("Unexpected Weapon Type");
    }
};
//#endregion

const performDamage = (attacker: vehicle, target: vehicle[], weapon: weapon) => {
    const damage = calculateDamage(attacker, target, weapon);
    const newTarget = applyTargets(damage, target);
    return {damage, newTarget};
};

const greaterThan = a => b => b > a;

const generateLine = (attacker, target) => {
    return {
        a: attacker.Location.prevLoc,
        b: target.Location.prevLoc
    };
};

const genNewLine = (line: line, vehicleList: vehicle[]): line => {
    const [dx, dy] = sub(line.b, line.a);
    const xFunction = dx < 0 ? Math.min:Math.max;
    const yFunction = dy < 0 ? Math.min:Math.max;

    const [x,y] = vehicleList.reduce((furthest, vehicle) => {
        const location = vehicle.Location.prevLoc;
        const nX = xFunction(furthest[0], location[0]);
        const nY = yFunction(furthest[1], location[1]);
        return [nX, nY];
    },line.b);

    if (dx === 0) {
        if (dy === 0) {
            return {a: [-Infinity, -Infinity], b: [-Infinity, -Infinity]};
        }
        return {a: line.b, b: [line.b[0], y]};
    } else if (dy === 0) {
        return {a: line.b, b: [x, line.b[1]]};
    }

    const nX = (dx/dy)*(y - line.b[1]) + line.b[0];
    const nY = (dy/dx)*(x - line.b[0]) + line.b[1];

    return {
        a: line.b,
        b: nX > x ? [x, nY]:[nX, y]
    };
};

const generateHitList = (vehicleList: vehicle[], target: vehicle) => {
    let position = 0;
    return vehicleList.map(vehicle => {
        const hitValue = vehicle === target ? 10:
            vehicle.State.intercept + (vehicle.Stats.Intercept ?? 0) + 5;
        position += hitValue;
        return position;
    });
};

//#region Attacks
const newDamage = (damage: damage, hp: number) => {
    const vehicleDamage = damage[0];
    return vehicleDamage - hp;
};

type returnDamages = {targetArray: vehicle[], weap: weapon} | {targetArray: [], weap: weapon};
const interceptDamage = (vehicleList: vehicle[], hitList: number[], attacker: vehicle, target: vehicle | undefined, weapon: weapon): returnDamages => {
    if (hitList.length === 0) return {targetArray: [], weap: weapon};
    const position = hitList.slice(-1)[0];
    let ran = Math.random()*position;
    let weap = weapon;
    let targetIndex: number;

    let newTarget: vehicle;
    let newTargetArr: vehicle[];
    let damage: damages;
    let hp: number;

    const targetArray: vehicle[] = [];
    while (weap.Watk > 0) {
        targetIndex = hitList.findIndex(greaterThan(ran));
        newTarget = vehicleList[targetIndex];
        console.log(hitList, newTarget, target);
        hp = newTarget.State.hp;
        if (sameVehicle(target ?? {Ownership: {Player: "", vID: -Infinity}}, newTarget)) break;
        if (calcHit(calcGenHitChance(attacker, newTarget, weap)) !== "Hit") {
            ran = Math.random()*(position - hitList[targetIndex]) + hitList[targetIndex];
            continue;
        }
        ({damage, newTarget: newTargetArr} = performDamage(attacker, [newTarget], weapon));
        console.log(newTargetArr);
        targetArray.push(newTargetArr[0]);
        
        weap = {...weap, Watk: newDamage(damage[0], hp)};

        ran = Math.random()*(position - hitList[targetIndex]) + hitList[targetIndex];
    }

    return {targetArray, weap};
};

const interceptAttack = (attacker: vehicle, target: vehicle[], weapon: weapon, vehicleArray: vehicle[]): {hit: hit, trueTarget: targetArray} => {
    const line = generateLine(attacker, target[0]);
    const targetAndPrevious = vehiclesOnLine(line, vehicleArray, target[0]);
    const hitPreTarget = generateHitList(targetAndPrevious, target[0]);

    const {targetArray, weap} = 
        interceptDamage(targetAndPrevious, hitPreTarget, attacker, target[0], weapon);

    const hit = calcHit(calcGenHitChance(attacker, target[0], weap));
    
    if (weap.Watk <= 0) return {
        hit: "Miss", 
        trueTarget: [target[0], ...targetArray]};

    let damage: damage = [0,0];
    let newTarget = target;
    let postTargetWeapon = weap;

    if (hit === "Hit") {
        const {damage: d, newTarget: nT} = performDamage(attacker, target, weap);
        damage = d[0];
        newTarget = nT;
        postTargetWeapon = {...weap, Watk: damage[0] + damage[1] - target[0].State.hp};
    }

    if (postTargetWeapon.Watk <= 0) return {
        hit: hit, 
        trueTarget: [target[0], ...targetArray, ...newTarget]
    };

    const newLine = genNewLine(line, vehicleArray);
    const postTarget = vehiclesOnLine(newLine, vehicleArray, target[0]).slice(1);
    const hitPostTarget = generateHitList(postTarget, target[0]);

    const {targetArray: postTargets} = interceptDamage(postTarget, hitPostTarget, attacker, undefined, postTargetWeapon);

    return {
        hit: hit, 
        trueTarget: [target[0], ...targetArray, ...newTarget, ...postTargets]
    };
};

const trueHit = (attacker: vehicle) => attacker.State.statuses.find(status => status.Type === "True Hit")?.function ?? (() => false);

const genericAttack = (attacker: vehicle, target: vehicle[], weapon: weapon, vehicleArray: vehicle[]): {hit: hit, trueTarget: vehicle[]} => {
    if (trueHit(attacker)(target[0])) return {
        hit: calcHit(calcGenHitChance(attacker, target[0], weapon)),
        trueTarget: target
    };

    return interceptAttack(attacker, target, weapon, vehicleArray);
};

const missileAttack = (attacker: vehicle, target: vehicle[], weapon: weapon, vehicleArray: vehicle[], hit: hit): attackReturn => {
    const newAttacker = applyAttacker(attacker, weapon);
    if (hit !== "Hit") return {
        modifiedVehicles: [newAttacker],
        damage: [[0,0]]
    };

    const {damage, newTarget} = performDamage(attacker, target, weapon);

    const newVehicleArray = mergeVehicleArrays(getPlayerVehicles(newTarget[0], vehicleArray), newTarget);

    const returnTarget = newVehicleArray.map(consumeDefAmmo(target[0].Location.loc));
    
    return {
        modifiedVehicles: [newAttacker, ...returnTarget],
        damage
    };
};

const selfDestruct = (attacker: vehicle, target: vehicle[], weapon: weapon, hit: hit): attackReturn => {
    //FIX SOON
    const newAttacker = {...attacker, State: {...attacker.State, hp: 0, maxHP: 0}};
    if (hit !== "Hit") return {
        modifiedVehicles: [newAttacker],
        damage: [[0,0]]
    };
    const {damage, newTarget} = performDamage(attacker, target, weapon);
    
    return {
        modifiedVehicles: [newAttacker, ...newTarget],
        damage
    };
};

const rammingAttack = (attacker: vehicle, target: vehicle[], weapon: weapon, hit: hit): attackReturn => {
    const newAttacker = applyAttacker(attacker, weapon);
    if (hit !== "Hit") return {
        modifiedVehicles: [newAttacker],
        damage: [[0,0]]
    };
    const {damage, newTarget} = performDamage(attacker, target, weapon);
    
    return {
        modifiedVehicles: [newAttacker, ...newTarget],
        damage
    };
};
//#endregion

export const attack = (vehicleArray: vehicle[], attacker: vehicle, target: vehicle, weapon: weapon): string => {
    const {Type, Eran, Wran} = weapon;

    const location = (Eran === undefined ? attacker:target).Location.prevLoc;
    const nearTarget = vehiclesInRadius(vehicleArray, location, Eran ?? Wran);

    let trueTarget = Eran === undefined ? [target]:nearTarget;
    let hit: hit = "Miss";

    switch (Type) {
        case "Generic":
            ({hit, trueTarget}
                = genericAttack(attacker, trueTarget, weapon, vehicleArray));
            break;
        case "Missile":
            hit = calcHit(calcDefHitChance(attacker, target[0], weapon, vehicleArray));
            break;
        case "Ramming":
            hit = calcRangeHC(attacker, target[0], weapon.Wran);
            break;
        case "Destruct":
            hit = "Hit";
            break;
        default:
            throw Error("Unknown Weapon");
    }
    const move = 
    `${attacker.Ownership.vID}.${
        getWeapIndex(attacker.Weap.Data, weapon)}.${
        JSON.stringify(trueTarget.map((target) => target.Ownership.Player))}.${
        JSON.stringify(trueTarget.map((target) => target.Ownership.vID))}.${
        hitNumbers[hit]}`;
    return move;
};

export const applyAttack = (vehicleArray: vehicle[], attacker: vehicle, target: vehicle[], weapon: weapon, hitValue: number): [merged: vehicle[], dataString: string] => {
    const Type = weapon.Type;
    const hit: hit = hitOptions[hitValue];

    let modifiedVehicles: vehicle[] = [];
    let damage: damages = [];

    switch (Type) {
        case "Generic":
            if (trueHit(attacker)(target[0])) {
                const nAttacker = applyAttacker(attacker, weapon);
                const nTargets = target.flatMap((target) => {
                    const {damage: dam, newTarget} = performDamage(attacker, [target], weapon);
                    damage.push(dam[0]);
                    return newTarget;
                });
                modifiedVehicles = [nAttacker, ...nTargets];
            } else {
                const tWeapon = weapon; 
                const nAttacker = applyAttacker(attacker, weapon);
                const nTargets = target.flatMap((targetVehicle, i) => {
                    if (i === 0 || (targetVehicle === target[0] && hit !== "Hit")) return targetVehicle; 
                    const {damage: dam, newTarget} = performDamage(attacker, [targetVehicle], tWeapon);
                    tWeapon.Watk = newDamage(dam[0], targetVehicle.State.hp);
                    damage.push(dam[0]);
                    return newTarget;
                });
                modifiedVehicles = [nAttacker, ...nTargets];
            }
            break;
        case "Missile":
            ({modifiedVehicles, damage} = missileAttack(attacker, target, weapon, vehicleArray, hit));
            break;
        case "Ramming":
            ({modifiedVehicles, damage} = rammingAttack(attacker, target, weapon, hit));
            break;
        case "Destruct":
            ({modifiedVehicles, damage} = selfDestruct(attacker, target, weapon, hit));
            break;
        default:
            throw Error("Unknown Weapon");
    }

    modifiedVehicles = modifiedVehicles.map(oldArea);

    const merged = mergeVehicleArrays(vehicleArray, modifiedVehicles);
    const dataString = createDataStr(attacker, target, weapon, damage, hit);
    return [merged, dataString];
};

//export const runApply = (fVehicle, tVehicle, vehicleArray, weap, hit) => applyAttack(calculateDamage([hit, cleanAttackInput([fVehicle, tVehicle, vehicleArray, weap])]));

export const finalizeAttack = (vehicle: vehicle): vehicle => {
    return {
        ...vehicle,
        State: {...vehicle.State, hasMoved: false},
        Weap: {...vehicle.Weap, fireCount: vehicle.Weap.fireCount.map(() => 0)}
    };
};
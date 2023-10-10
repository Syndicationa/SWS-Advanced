import { compose, curry, map, compareArray, sumArrays, reverseArray} from '../../functions.mjs';
import { replaceInArray } from '../../functions.mjs';
import { updateActiveDef, mergeShipArrays, getActiveShields, getShieldIndex, shipsOnLine } from './retrieve.mjs';
import {getWeapIndex, getActiveDefs, getAmmoOfWeap, getAmmo, getPlayerShips, shipsInRadius} from './retrieve.mjs';
import { updateArea, reArea } from "./vehicle.mjs"
import { sub, unitDotProduct, distance } from '../../vectors.mjs';


export const inFiringRot = (fLoc = [0,0], tLoc = [0,0], fRot = [0, 0], wRot = 0, offset = [0, 0]) => {
    const distVec = sub(tLoc, fLoc);
	if (compareArray(distVec, new Array(distVec.length).fill(() => 0))) return true;
    const uDP = unitDotProduct(distVec, sumArrays(fRot, offset))
    const result = Math.round(400*(1 - (uDP*Math.abs(uDP))))/100
    return result <= wRot;
}

const cFWeaponTemplate = {weapon: {}, ammoCount: 0}

export const canFire = curry((fShip, tLoc, weap = cFWeaponTemplate) => {
	const {prevLoc:fLoc, rotation} = fShip.Location;
	const {energy: fEnergy, mov: Mov} = fShip.State;
	const {weapon, ammoCount} = weap;

	const trueWrot = weapon.Wrot + Math.round(Mov / 6);

	const hasAmmo = (ammoCount > 0);
	const hasEnergy = fEnergy >= weapon.EnergyCost;
	const fireRate = weapon.fireCount < weapon.FireRate;
	const range = weapon.WMran === undefined || weapon.WMran <= distance(fLoc, tLoc);
	const validRotation = weapon.Wrot === undefined || inFiringRot(fLoc, tLoc, rotation, trueWrot, weapon.Offset);

	return hasAmmo && hasEnergy && fireRate && range && validRotation;
});

//#region Hit Chance Helpers

//Finds every ship with defenses weapons in range of a location
const defensesInArea =  (shipArray, tLoc) => {
	const defenders = shipArray.filter((ship) => {
		const weaponData = ship.Weap.Data;
		const {Weapons, wActive} = ship.Defenses;
		const dWeaps = Weapons.filter(( w, i) => wActive[i]);
		if (dWeaps.length === 0) return false;
		const dist = distance(tLoc, ship.Location.prevLoc);
		return dWeaps.some((wInd) => weaponData[wInd].Wran >= dist);
	});
	return [defenders, tLoc];
}

const calcDefShip = (shipArray, tLoc) => {
	return shipArray.reduce((total, ship) => {
		const weaponData = ship.Weap.Data;
        const dist = distance(tLoc, ship.Location.prevLoc);
		const dWeaps = 
            getActiveDefs(ship.Defenses)
                .filter((w) => dist <= weaponData[w].Wran)
                .map((wInd) => weaponData[wInd]);
		return total + dWeaps.reduce((acc, weapon) => {
			const wCov  = weapon.Wcov;
			const dHit = weapon.Whit;
			return acc + ((dHit*wCov)/20)/Math.max(dist - 4, 1);
		})
		
	}, 0)
}

const calcInterceptChance = compose(calcDefShip, defensesInArea);

export const calcGenHitChance = (attacker, target, weap) => {
    const {Whit, Wran} = weap;
    const Acc = attacker.Stats.Acc;
	const Mov = target.State.mov;
    const dist = distance(attacker.Location.prevLoc, target.Location.prevLoc);

	let hitChance = (Whit + Acc) + (-25*Math.tanh((Mov- 15)/5) + 25)
	hitChance /= (dist > Wran) ? (dist - Wran + 1):1;

    return [hitChance, hitChance];
}

export const calcDefHitChance = (attacker, target, weap, shipArray) => {
    const hitChance = calcGenHitChance(attacker, target, weap)[0];
    const playerShips = getPlayerShips(target, shipArray);
    const hitDifference = calcInterceptChance(playerShips, target.Location.prevLoc);
	const interceptHitChance = hitChance - hitDifference;
    return [hitChance, interceptHitChance];
}

export const calcRangeHC = (fShip, tShip, range) => {
    const dist = distance(fShip.Location.prevLoc, tShip.Location.prevLoc);
    return dist <= range;
}
//#endregion

export const calcHit = ([hitChance, interceptChance]) => {
	const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
	return (hitChance > rand) + (interceptChance > rand);
}

//#region Damage Calculations
const calcBaseDamage = (attacker, target, weapon) => {
    const wAtk = weapon.Watk;
	const wRan = weapon.Wran;
	const wMran = weapon.WMran ?? 0;
	const wRAtk = weapon.WRatk;
	const dist = distance(attacker.Location.prevLoc, target.Location.prevLoc);
	let damage = wAtk + wRAtk*(dist - wMran + (wRan - dist)*(wRAtk >= 0 && dist >= wRan));
	damage = Math.round(damage);
    return Math.max(damage, 0);
}

const calcGenDamage = (target, damage) => {
	const def = target.Stats.Def;
	return damage - def;
}

const calcShieldDamage = (target, damage) => {
    const shields = getActiveShields(target.Defenses);

    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return [damage, 0];

    const shieldDamage= Math.floor(damage*damageShield.Intercept)
    const passthroughDamage = damage - shieldDamage;
    const dSIndex = getShieldIndex(target.Defenses.Shields, damageShield);

    const totalShieldDamage = target.Defenses.sDamage[dSIndex] + shieldDamage;
    const shipDamage = Math.max(totalShieldDamage - damageShield.MaxDamage, 0) + passthroughDamage;
    return [shipDamage, shieldDamage];
}

const calculateDamage = (attacker, target, weapon) => {
    const hasEran = weapon.Eran !== undefined;

    const damage = target.map((ship, i) => {
        const dMult = (hasEran && i !== 0) ? 0.75:1;
        const baseDamage = Math.round(calcBaseDamage(attacker, ship, weapon)*dMult);
        const [passthrough, shieldDamage] = calcShieldDamage(ship, baseDamage);
        const shipDamage = calcGenDamage(ship, passthrough);

        return [shipDamage, shieldDamage]
    })
    return [...reverseArray(damage), target];
}
//#endregion

//#region Application functions
export const consumeAmmo = (ammo, ammoType = 0) => {
    return {...ammo, count: replaceInArray(ammo.count, ammoType, ammo.count[ammoType] - 1)
    }
}

const updateFireRate = (Weap, weapon) => {
    const weapIndex = getWeapIndex(Weap.Data, weapon);
    const nFireCount = Weap.fireCount[weapIndex] + 1;
    return {...Weap, fireCount: replaceInArray(Weap.fireCount, weapIndex, nFireCount)}
}

export const applyDamage = (damage, target) => {
    const {hp, maxHP} = target.State;
    return {...target,
        State: {
            hp: Math.min(hp - damage, maxHP),
            maxHP: maxHP - ((damage > 0) ? Math.round(damage/5):0)
        }
    }
}

const applyAttacker = (attacker, weap) => {
    return {...attacker,
        State: {
            ...attacker.State,
            energy: Math.min(attacker.Stats.MaxEnergy, attacker.State.energy - weap.EnergyCost),
            hasFired: true,
        },
        Ammo: consumeAmmo(attacker.Ammo, getAmmoOfWeap(weap, attacker.Ammo)),
        Weap: updateFireRate(attacker.Weap, weap)
    }
}

const applyTarget = ([damage, sDamage], target) => {
    if (target === undefined) return {};
    else if (target instanceof Array)
        return target.map((ship, i) => applyTarget(ship, [damage[i], sDamage[i]]))

    return consumeShield(applyDamage(damage, target), sDamage);
}

const consumeDefAmmo = (loc) => (ship) => {
    const weaponData = ship.Weap.Data;
    const dist = distance(loc, ship.Location.prevLoc);

    const weapons = getActiveDefs(ship.Defenses).filter((w) => dist <= weaponData[w].Wran);
    const ammos = weapons.map((weapon) => getAmmoOfWeap(weapon, ship.Ammo));
    const nAmmo = ammos.reduce((acc, ammo) => consumeAmmo(acc, ammo),ship.Ammo);
    return updateActiveDef({
        ...ship,
        Ammo: nAmmo
    })
}

const consumeShield = (ship, sDam) => {
    const shields = getActiveShields(ship.Defenses);
    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return ship;
    const dSIndex = getShieldIndex(ship.Defenses.Shields, damageShield);

    const takenDamage = ship.Defenses.sDamage[dSIndex] + sDam;
    const active = takenDamage < damageShield.MaxDamage;
    const sDamage = replaceInArray(ship.Defenses.sDamage, dSIndex, takenDamage);
    const sActive = replaceInArray(ship.Defenses.sActive, dSIndex, active);

    return {
        ...ship,
        Defenses: {
            ...ship.Defenses,
            sDamage,
            sActive
        }
    }
}

const createDataStr = (fShip, tShip, weap, damage, hit) => {
    if (tShip instanceof Array) return tShip.reduce((acc, ship, i) => 
        acc + createDataStr(fShip, ship, weap, damage[i], hit), "");
    
    const fhasName = fShip.Appearance.name !== fShip.Type.Class;
    const thasName = tShip.Appearance.name !== tShip.Type.Class;

    const fName = fhasName ? 'The': '~F ' + fShip.Appearance.name;
    const tName = thasName ? 'the': '~T ' + tShip.Appearance.name;

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
        case "Healing":
            return `${fName} heals ${tName} for ${-damage} HP.\n`;
        case "Resupplying":
            const ammoNum = getAmmo(weap.dType, tShip.Ammo);
            const ammoName = tShip.Ammo.Ammo(ammoNum).Name;
            return `${fName} resupplies ${tName}'s ${ammoName} round supply.\n`;
        case "Energy":
            return `${fName} sends Energy to ${tName}.\n`;
        default:
            throw Error("Unexpected Weapon Type")
    }
}
//#endregion

const performDamage = (attacker, target, weapon) => {
    const damage = calculateDamage(attacker, target, weapon);
    const newTarget = applyTarget(damage, target);
    return {damage, newTarget};
}

const greaterThan = a => b => b > a;

const generateLine = (attacker, target) => {
    return {
        a: attacker.Location.prevLoc,
        b: target.Location.prevLoc
    }
}

const genNewLine = (line, shipList) => {
    const [dx, dy] = sub(line.b, line.a);
    const xFunction = dx < 0 ? Math.min:Math.max;
    const yFunction = dy < 0 ? Math.min:Math.max;

    const [x,y] = shipList.reduce((furthest, ship) => {
        const location = ship.Location.prevLoc
        const nX = xFunction(furthest[0], location[0]);
        const nY = yFunction(furthest[1], location[1]);
        return [nX, nY];
    },line.b);

    if (dx === 0) {
        if (dy === 0) {
            return [];
        }
        return {a: line.b, b: [line.b[0], y]};
    }

    const nX = (dx/dy)*(y - line.b[1]) + line.b[0];
    const nY = (dy/dx)*(x - line.b[0]) + line.b[1];

    return {
        a: line.b,
        b: nX > x ? [x, nY]:[nX, y]
    };
}

const generateHitList = (shipList, target) => {
    let position = 0;
    return shipList.map(ship => {
        const hitValue = ship === target ? position/4:
            ship.intercept + 5;
        position += hitValue;
        return position;
    })
}

//#region Attacks
const standardAttack = (attacker, target, weapon, shipArray) => {
    const hit = calcHit(calcGenHitChance(attacker, target, weapon, shipArray));
    const newAttacker = applyAttacker(attacker, weapon);
    if (hit < 2) return {
        modifiedShips: [newAttacker],
        damage: [[0,0]],
        hit: [hit]
    }

    const {damage, newTarget} = performDamage(attacker, target, weapon);
    
    return {
        modifiedShips: [newAttacker, ...newTarget],
        damage,
        hit: [hit]
    }
}

const interceptDamage = (shipList, hitList, attacker, target, weapon) => {
    const position = hitList.slice(-1);
    let ran = Math.random()*position;
    let weap = weapon;
    let targetIndex;

    let newTarget;
    let damage;
    let hp;

    let targetArray;
    let damages;
    while (weap.Watk > 0) {
        targetIndex = hitList.findIndex(greaterThan(ran));
        newTarget = shipList[targetIndex];
        hp = newTarget.State.hp;
        if (newTarget === target || newTarget === undefined) break;

        if (calcHit(calcGenHitChance(attacker, newTarget, weap))) {
            ran = Math.random()*(position - ran) + ran;
            continue;
        }

        ({damage, newTarget} = performDamage(attacker, newTarget, weapon));
        targetArray.push(newTarget);
        damages.push(damage);
        damage = damage[0] + damage[1];
        
        weap = {...weap, Watk: damage - hp};

        ran = Math.random()*(position - ran) + ran
    }

    return {damages, targetArray, weap};
}

const interceptAttack = (attacker, target, weapon, shipArray) => {
    const line = generateLine(attacker, target[0]);
    const targetAndPrevious = shipsOnLine(line, shipArray, target);
    const hitPreTarget = generateHitList(targetAndPrevious);
    const newAttacker = applyAttacker(attacker, weapon);

    const {damages, targetArray, weap} = 
        interceptDamage(targetAndPrevious, hitPreTarget, attacker, target, weapon);

    const hit = calcHit(calcGenHitChance(attacker, target, weap));
    
    if (weap.Watk <= 0 && hit < 2) return {
        modifiedShips: [newAttacker, ...targetArray], 
        damage: damages, 
        hit: damages.map(() => 2), 
        trueTarget: targetArray};

    const {damage, newTarget} = performDamage(attacker, target, weap);
    const postTargetWeapon = {...weap, Watk: damage - target.State.hp};

    if (postTargetWeapon.Watk <= 0) return {
        modifiedShips: [newAttacker, ...targetArray, newTarget], 
        damage: [...damages, damage], 
        hit: [...damages.map(() => 2), 2], 
        trueTarget: [...targetArray, newTarget]
    };

    const newLine = genNewLine(line, shipArray);
    const postTarget = shipsOnLine(newLine, target).pop();
    const hitPostTarget = generateHitList(postTarget, target);

    const {postDamages, postTargets} = interceptDamage(postTarget, hitPostTarget, target);

    return {
        modifiedShips: [newAttacker, ...targetArray, newTarget, ...postTargets], 
        damage: [...damages, damage, ...postDamages], 
        hit: [...damages.map(() => 2), 2, ...postDamages.map(() => 2)], 
        trueTarget: [...targetArray, newTarget, ...postTargets]
    };
};

const genericAttack = (attacker, target, weapon, shipArray) => {
    const trueHit = 
        attacker.State.statuses.find(status => status.Type === "True Hit").function ?? (() => false);

    if (trueHit(target)) return {
        ...standardAttack(attacker, target, weapon, shipArray),
        trueTarget: target
    }

    return interceptAttack(attacker, target, weapon, shipArray);
}

const missileAttack = (attacker, target, weapon, shipArray) => {
    const hit = calcHit(calcDefHitChance(attacker, target[0], weapon, shipArray));
    const newAttacker = applyAttacker(attacker, weapon);
    if (hit < 2) return {
        modifiedShips: [newAttacker],
        damage: [[0,0]],
        hit
    }

    const {damage, newTarget} = performDamage(attacker, target, weapon);

    const returnTarget = map(consumeDefAmmo(target[0].Location.loc)(), newTarget)
    
    return {
        modifiedShips: [newAttacker, ...returnTarget],
        damage,
        hit
    }
};

const selfDestruct = (attacker, target, weapon) => {
    const hit = calcRangeHC(attacker, target[0], weapon.Wran);
    const newAttacker = {...attacker, State: {...attacker.State, hp: 0, maxHP: 0}};
    if (!hit) return {
        modifiedShips: [newAttacker],
        damage: [[0,0]],
        hit: [0]
    }
    const {damage, newTarget} = performDamage(attacker, target, weapon);
    
    return {
        modifiedShips: [newAttacker, ...newTarget],
        damage,
        hit: [2]
    }
};

const rammingAttack = (attacker, target, weapon) => {
    const newAttacker = applyAttacker(attacker, weapon);
    const {damage, newTarget} = performDamage(attacker, target, weapon);
    
    return {
        modifiedShips: [newAttacker, ...newTarget],
        damage,
        hit: [2]
    }
};
//#endregion

export const attack = (attacker, target, weapon, shipArray) => {
    const {Type, Eran, Wran} = weapon;

    const location = (Eran === undefined ? attacker:target).Location.prevLoc;
    const nearTarget = shipsInRadius(shipArray, location, Eran ?? Wran);

    let trueTarget = Eran === undefined ? [target]:nearTarget;

    let modifiedShips = [];
    let damage = [0,0];
    let hit = [0];

    switch (Type) {
        case "Generic":
            ({modifiedShips, damage, hit, trueTarget}
                = genericAttack(attacker, trueTarget, weapon, shipArray));
            break;
        case "Missile":
            ({modifiedShips, damage, hit} = missileAttack());
            break;
        case "Ramming":
            ({modifiedShips, damage, hit} = rammingAttack());
            break;
        case "Destruct":
            ({modifiedShips, damage, hit} = selfDestruct(attacker, nearTarget, weapon, shipArray));
            break;
        default:
            throw Error("Unknown Weapon");
    }
    modifiedShips = modifiedShips.map(updateArea(reArea(true, false)));

    const merged = mergeShipArrays(shipArray, modifiedShips);
    const move = [
        attacker.Ownership.vID, getWeapIndex(attacker.Weap.Data, weapon), 
        trueTarget.map((target) => target.Owner.Player), trueTarget.map((target) => target.Owner.vID), 
        hit
    ]

    const dataString = createDataStr(attacker, trueTarget, weapon, damage, hit);
    return [merged, move, dataString]
}

//export const runApply = (fShip, tShip, shipArray, weap, hit) => applyAttack(calculateDamage([hit, cleanAttackInput([fShip, tShip, shipArray, weap])]));

export const finalizeAttack = (ship) => {
    return {
        ...ship,
        State: {...ship.State, hasMoved: false},
        Weap: {...ship.Weap, fireCount: ship.Weap.fireCount.map(() => 0)}
    }
}
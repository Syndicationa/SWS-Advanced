import { compose, curry, map, compareArray, sumArrays, reverseArray} from '../../functions.mjs';
import { replaceInArray } from '../../functions.mjs';
import { updateActiveDef, mergeShipArrays, sameVehicle, getActiveShields, getShieldIndex } from './retrieve.mjs';
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
	const {energy: fEnergy} = fShip.State;
	const {Mov} = fShip.Stats;
	const {weapon, ammoCount} = weap;

	const trueWrot = weapon.Wrot + Math.round(Mov / 6);

	const ammo = (ammoCount > 0);
	const energy = fEnergy >= weapon.EnergyCost;
	const fireRate = weapon.fireCount < weapon.FireRate;
	const ran = weapon.WMran === undefined || weapon.WMran <= distance(fLoc, tLoc);
	const rot = weapon.Wrot === undefined || inFiringRot(fLoc, tLoc, rotation, trueWrot, weapon.Offset);

	return ammo && energy && fireRate && ran && rot;
});

//#region Attack Ship components
export const cleanAttackInput = ([fShip, tShip, shipArray, weap]) => {
    const {Type, Eran, Wran} = weap;
    if (Type === "Destruct") {
        return [fShip, shipsInRadius(shipArray, fShip.Location.prevLoc, Wran), shipArray, weap];
    } else if (Eran !== undefined) {
        const tShips = shipsInRadius(shipArray, tShip.Location.prevLoc, Eran).filter((s) => 
            !sameVehicle(tShip, s));
        return [fShip, [tShip, ...tShips], shipArray, weap];
    } else if (Type === "Deploying") {
        return [fShip, fShip.Location.prevLoc, shipArray, weap];
    }
    return {fShip, tShip, shipArray, weap};
}

//#region Hit Chance Helpers
const defensesInArea =  (shipArray, tLoc) => {
	const defenders = shipArray.filter((ship) => {
		const weaponData = ship.Weap.Data;
		const [Weapons, wActive] = ship.Defenses;
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
		const [Weapons, wActive] = ship.Defenses;
		const dWeaps = Weapons.filter(( w, i) => wActive[i]).map((wInd) => weaponData[wInd]);
		const dist = distance(tLoc, ship.Location.prevLoc);
		return total + dWeaps.reduce((acc, weapon) => {
			const wCov  = weapon.Wcov;
			const dHit = weapon.Whit;
			return acc + ((dHit*wCov)/20)/(dist + 1);
		})
		
	}, 0)
}

const calcInterceptChance = compose(calcDefShip, defensesInArea);

const hitTypes = (weap) => {
    switch (weap.Type) {
        case "Generic":
            return "Gen";
        case "Missile":
            return "GenD";
        case "Ramming":
        case "Healing":
        case "Resupplying":
        case "Energy":
            return "Range";
        case "Destruct":
        case "Deploying":
            return "True";
        default:
            return "Err";
    }
}

const calcGenHitChance = (fShip, tShip, weap) => {
    const {Whit, Wran} = weap;
    const Acc = fShip.Stats.Acc;
	const Mov = tShip.Stats.Mov;
    const dist = distance(fShip.Location.prevLoc, tShip.Location.prevLoc);

	let hitChance = (Whit + Acc) - (25*Math.tanh((Mov- 15)/5) + 25)
	hitChance /= (dist > Wran) ? (dist - Wran + 1):1;

    return [hitChance, hitChance];
}

const calcDefHitChance = (fShip, tShip, shipArray, weap) => {
    const hitChance = calcGenHitChance(fShip, tShip, weap)[0];
    const playerShips = getPlayerShips(tShip, shipArray);
    const hitDifference = calcInterceptChance(playerShips, tShip.Location.prevLoc);
	const interceptHitChance = hitChance - hitDifference;
    return [hitChance, interceptHitChance];
}

const calcRangeHC = (fShip, tShip, range) => {
    const dist = distance(fShip.Location.prevLoc, tShip.Location.prevLoc);
    const hitChance = dist <= range ? 100:0;
    return [hitChance, hitChance];
}
//#endregion

export const calcHitChance = ({fShip, tShip, shipArray, weap}) => {
	const data = {fShip, tShip, shipArray, weap};
    const hitType = hitTypes(weap);

    const hasEran = weap.Eran !== undefined;
    const target = hasEran ? tShip[0] : tShip;

    if (hitType === "Err") throw TypeError("Weapon doesn't have a valid Type");

    switch (hitType) {
        case "Gen":
            return [calcGenHitChance(fShip, target, weap), data];
        case "GenD":
            return [calcDefHitChance(fShip, target, shipArray, weap), data];
        case "Range":
            return [calcRangeHC(fShip, target, weap.Wran), data];
        case "True":
            return [[100, 100], data]
        default:
            throw Error("Unexpected Weapon Type")
    }
}

const calcHit = ([[hitChance, interceptChance], data]) => {
	const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
	const hit = (hitChance > rand) + (interceptChance > rand);

	return [hit, data];
}

const damType = (weap) => {
    const hasEran = weap.Eran !== undefined;
    switch (weap.Type) {
        case "Generic":
        case "Missile":
        case "Ramming":
            return hasEran ? "Expl":"Gen";
        case "Destruct":
            return "Expl";
        case "Healing":
            return "Heal";
        case "Resupplying":
        case "Deploying":
        case "Energy":
            return "Zero";
        default:
            return "Err";
    }
}

const calcGenDamage = (data) => {
    const {fShip, tShip, weap} = data;
    const wAtk = weap.Watk;
	const wRan = weap.Wran;
	const wMran = weap.WMran ?? 0;
	const wRAtk = weap.WRatk;
	const def = tShip.Stats.Def;
	const dist = distance(fShip.Location.prevLoc, tShip.Location.prevLoc);
	let damage = wAtk - def + wRAtk*(dist - wMran + (wRan - dist)*(wRAtk >= 0 && dist >= wRan));
	damage = Math.round(damage);
	damage = damage*(damage > 0);
    return calcShieldDamage(data, damage);
}

const calcShieldDamage = (data, damage) => {
    const {tShip} = data;
    const shields = getActiveShields(tShip.Defenses);

    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return [damage, 0];

    const damageVal = Math.floor(damage*damageShield.Intercept)
    const remainingDamage = damage - damageVal;
    const dSIndex = getShieldIndex(tShip.Defenses.Shields, damageShield);

    const takenDamage = tShip.Defenses.sDamage[dSIndex] + damageVal;
    const carryDamage = Math.max(takenDamage - damageShield.dThreshold, 0) + remainingDamage;
    return [takenDamage, carryDamage];
}

const calculateDamage = ([hit, data]) => {
	const {tShip, weap} = data;
    const hasEran = weap.Eran !== undefined;
    const dType = damType(weap);
    switch (dType) {
        case "Gen":
            return [calcGenDamage(data), hit, data];
        case "Expl":
            const damage = tShip.map((ship, i) => {
                const dMult = (hasEran && i !== 0) ? 0.75:1;
                const damage = calcGenDamage({...data, tShip: ship})
                return Math.round(dMult*damage);
            })
            const sDamage = tShip.map((ship, i) => {
                const dMult = (hasEran && i !== 0) ? 0.75:1;
                const damage =  calcShieldDamage({...data, tShip: ship})
                return Math.round(dMult*damage);
            })
            return [reverseArray(damage), reverseArray(sDamage), hit, data];
        case "Heal":
            return [-weap.Watk, 0, hit, data];
        case "Zero":
            return [0, 0, hit, data];
        default:
            throw Error("Unexpected Weapon Type");
    }
}

//#region applyHelpers
const consumeAmmo = (ammo, ammoType = 0) => {
    return {...ammo, count: replaceInArray(ammo.count, ammoType, ammo.count[ammoType] - 1)
    }
}

const updateFireRate = (Weap, weapon) => {
    const weapIndex = getWeapIndex(Weap.Data, weapon);
    const nFireCount = Weap.fireCount[weapIndex] + 1;
    return {...Weap, fireCount: replaceInArray(Weap.fireCount, weapIndex, nFireCount)}
}

const applyDamage = (damage, hit, tShip) => {
    if (hit !== 2) return tShip;
    const {hp, maxHP} = tShip.State;
    return {...tShip,
        State: {
            hp: Math.min(hp - damage, maxHP),
            maxHP: maxHP - ((damage > 0) ? Math.round(damage/5):0)
        }
    }
}

const shiftEnergy = (fState, target) => {
	const fEnergy = fState.energy;
	const MaxEnergy = target.Stats.MaxEnergy;
	const tEnergy = target.State.energy;
    const totalEn = fEnergy + tEnergy;
	const overflow = totalEn - MaxEnergy;
    const fOutEn = Math.max(0, overflow);
	const tOutEn = totalEn - fOutEn;

	return {fState: {...fState, energy: fOutEn},
			tState: {...target.State, energy: tOutEn}};
}

const applyEnergy = (fShip, tShip, hit) => {
    if (hit !== 2) return [fShip, tShip];
    const states = shiftEnergy(fShip.State, tShip);
    return [
        {...fShip, State: states.fState},
        {...tShip, State: states.tState}
    ]
}

const shiftAmmo = (fAmmo, tAmmo, fInd, tInd) => {
    const source = fAmmo.Ammo(fInd);
    const reciever = tAmmo.Ammo(tInd);
    const totalAmmo = source.count + reciever.count;
    const overflow = totalAmmo - reciever.MCount;
    const sAmmo = Math.max(0, overflow);
    const rAmmo = totalAmmo - sAmmo;
    return {fAmmo: {...fAmmo, count: replaceInArray(fAmmo.count, fInd, sAmmo)},
            tAmmo: {...tAmmo, count: replaceInArray(tAmmo.count, tInd, rAmmo)}}
}

const appShiftAmmo = (fShip, tShip, weap, hit) => {
    if (hit !== 2) return [fShip, tShip];
    const fIndex = getAmmoOfWeap(weap, fShip.Ammo);
    const tIndex = getAmmo(weap.dType, tShip.Ammo);
    const Ammos = shiftAmmo(fShip.Ammo, tShip.Ammo, fIndex, tIndex);
    return [
        {...fShip, Ammo: Ammos.fAmmo},
        {...tShip, Ammo: Ammos.tAmmo}
    ]
}

const applyFship = (fShip, weap) => {
    if (weap.Type === "Destruct") {
        return {...fShip, State: {...fShip.State, hp: 0, maxHP: 0}}
    }
    return {...fShip,
        State: {
            ...fShip.State,
            energy: Math.min(fShip.Stats.MaxEnergy, fShip.State.energy - weap.EnergyCost),
            hasFired: true,
        },
        Ammo: consumeAmmo(fShip.Ammo, getAmmoOfWeap(weap, fShip.Ammo)),
        Weap: updateFireRate(fShip.Weap, weap)
    }
}

const applyTShip = (tShip, damage, sDamage, hit, weap) => {
    if (tShip === undefined) return {};
    else if (weap.Type === "Deploying") {
        return;
    } else if (tShip instanceof Array)
        return tShip.map((ship, i) => applyTShip(ship, damage[i], sDamage[i], hit, weap))

    return consuseShield(applyDamage(damage, hit, tShip), sDamage);
}

const consumeDefAmmo = (ship) => {
    const weapons = getActiveDefs(ship.Defenses);
    const ammos = weapons.map((weapon) => getAmmoOfWeap(weapon, ship.Ammo));
    const nAmmo = ammos.reduce((acc, ammo) => consumeAmmo(acc, ammo),ship.Ammo);
    return {
        ...ship,
        Ammo: nAmmo
    }
}

const consuseShield = (ship, sDam) => {
    const shields = getActiveShields(ship.Defenses);
    const damageShield = shields.find((s) => s.Type === "Default");
    if (damageShield === undefined) return ship;
    const dSIndex = getShieldIndex(ship.Defenses.Shields, damageShield);

    const takenDamage = ship.Defenses.sDamage[dSIndex] + sDam;
    const active = takenDamage >= damageShield.Threshold;
    const sDamage = replaceInArray(ship.Defenses.sDamage, dSIndex, active);
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

const updateShips = (fShip, tShip, weap, damage, hit) => {
    const uFShip = applyFship(fShip, weap);
    const uTShip = applyTShip(tShip, damage, hit, weap);
    const type = weap.Type;
    if (type === "Energy") return applyEnergy(uFShip, uTShip, hit);
    else if (type === "Resupplying") return appShiftAmmo(uFShip, uTShip, weap, hit)
    if (uTShip instanceof Array) return [uFShip, ...uTShip];
    return [uFShip, uTShip]
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
        case "Deploying":
            const depName = tShip.Appearance.name;
            return `${fName} deploys a ${depName}.\n`;
        default:
            throw Error("Unexpected Weapon Type")
    }
}
//#endregion

const applyAttack = ([damage, sDamage, hit, {fShip, tShip, shipArray, weap}]) => {    
    const uPShips = updateShips(fShip, tShip, weap, damage, hit);
    const dShips = weap.Type === "Missile" ? 
    map(compose(updateActiveDef, consumeDefAmmo), defensesInArea(shipArray, tShip.Location.prevLoc)): 
    [];
    const updated = mergeShipArrays(uPShips, dShips);
    const updatedShipArray = mergeShipArrays(shipArray, updated);

    const tShipOwner = tShip.Ownership ?? tShip[0].Ownership;

    const move = [
        fShip.Ownership.vID, getWeapIndex(fShip.Weap.Data, weap), 
        tShipOwner.Player, tShipOwner.vID, 
        hit
    ]

    const dataStr = createDataStr(uPShips[0], uPShips[1], weap, damage, hit);

	return [updatedShipArray.map(updateArea(reArea(true, false))), move, dataStr]
}
//#endregion

export const attackShip = compose(applyAttack, calculateDamage, calcHit, calcHitChance, cleanAttackInput);

export const runApply = (fShip, tShip, shipArray, weap, hit) => applyAttack(calculateDamage([hit, cleanAttackInput([fShip, tShip, shipArray, weap])]));

export const finalizeAttack = (ship) => {
    return {
        ...ship,
        State: {...ship.State, hasMoved: false},
        Weap: {...ship.Weap, fireCount: ship.Weap.fireCount.map(() => 0)}
    }
}
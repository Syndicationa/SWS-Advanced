import { mergeArrays } from '../../functions.mjs';
import { distance, sub } from '../../vectors.mjs';

//#region weapon and ammo retrieval
export const getDefWeaps = (weapDataList) => {
	return weapDataList.reduce((list, weap, i) => weap.Defensive ? [...list, i]: list, []);
}

export const updateActiveDef = (ship) => {
    const {wActive: cWact, Weapons} = ship.Defenses;
    const wActive = cWact.map((val, i) => {
        const Count = ship.Ammo.Ammo([getAmmoOfWeap(Weapons[i])]).count;
        return val && (Count > 0);
    })
    return {...ship, Defenses: {...ship.Defenses, wActive}};
}

export const getWeapIndex = (WeapData, weapon) => {
    return WeapData.findIndex(weap => weap.Name === weapon.Name);
}

export const getUtilIndex = (Utils, util) => {
    return Utils.findIndex(utility => utility.Name === util.Name);
}

export const getShieldIndex = (ShieldData, shield) => {
    return ShieldData.findIndex(s => s.Name === shield.Name);
}

export const getActiveDefs = (defenses) => defenses.Weapons.filter((w, i) => defenses.wActive[i]);

export const getActiveShields = (shields) => shields.Shields.filter((s, i) => shields.sActive[i]);

export const getAmmoOfWeap = (weapon = Object, ammo) => {
	if (weapon.aType === undefined) return -1;
	const ammoType = weapon.aType;
	return getAmmo(ammoType, ammo);
}

export const getAmmo = (ammoType, ammo) => ammo.Data.findIndex((type) => type.Name === ammoType);

export const getShipIndex = (ship, shipArray) => shipArray.findIndex((ship2) => {
    return sameVehicle(ship, ship2);
});

export const gShipFromID = (pID, vID, shipArray) => 
    shipArray[getShipIndex({Ownership: {Player: pID, vID}}, shipArray)];

export const getPlayerShips = (ship, shipArray) => getPlayShips(ship.Ownership.Player, shipArray)

export const getPlayShips = (pID, shipArray) => shipArray.filter((arrShip) => 
arrShip.Ownership.Player === pID);

//#endregion

export const shipsInRadius = (shipArray, loc, dist) => shipArray.filter((s) => distance(s.Location.loc, loc) <= dist || distance(s.Location.prevLoc, loc) <= dist);

export const shipsInPosition = (shipArr, loc) => shipsInRadius(shipArr, loc, 0);

export const shipsOnLine = (line, shipArray, target) => {
    const [dx, dy] = sub(line.b, line.a)
    const shipList = [];
    if (dx === 0) {
        if (dy === 0) return [target];
        const [x, yOffset] = (dy < 0 ? line.b:line.a);
        for (let y = 1; y < Math.abs(dy); y++) {
            shipList.push(...shipsInPosition(shipArray, [x, y + yOffset]))
        }
    } else {
        const slope = dy/dx;
        let [xOffset,y] = (dx < 0 ? line.b:line.a);

        for (let x = 1; x < Math.abs(dx); x++) {
            y += slope;

            shipList.push(...shipsInPosition(shipArray, [xOffset + x, Math.round(y)]))
        }
    }

    shipList.push(target);
    return getPlayerShips(target, shipList)
}

export const sameVehicle = (ship1, ship2) => {
    const Owner = ship1.Ownership;
    const Owner2 = ship2.Ownership;
    return (Owner.vID === Owner2.vID) && (Owner.Player === Owner2.Player)
}

export const mergeShip = (ship1, ship2) => {
    return {...ship1, ...ship2};
}

export const mergeShipArrays = mergeArrays(sameVehicle, mergeShip);

//import { getDefWeaps, updateActiveDef, getWeapIndex, getActiveDefs, getAmmoOfWeap, getAmmo, sameVehicle, getShipIndex, getPlayerShips } from './retrieve.mjs';

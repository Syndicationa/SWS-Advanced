import { mergeArrays } from '../../functions.mjs';
import { distance } from '../../vectors.mjs';

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

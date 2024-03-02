import { mergeArrays } from "../../functions";
import { line, locationVector, shield, util, utilWithCount, weapon, weaponWithCount } from "../../types/types";
import { vehicle } from "../../types/vehicleTypes.js";
import { distance, sub } from "../../vectors";

//#region weapon and ammo retrieval
export const getDefWeaps = (weapDataList: weapon[]): number[] => {
    return weapDataList.reduce((list, weap, i) => {
        if (!("Defensive" in weap)) return list;
        if (!weap.Defensive) return list;
        return [...list, i];
    }, []);
};

export const updateActiveDef = (vehicle: vehicle) => {
    const {wActive: cWact, Weapons} = vehicle.Defenses;
    const wActive = cWact.map((val, i) => {
        const Count = vehicle.Ammo.Ammo(getAmmoOfWeap(vehicle.Weap.Weap(Weapons[i]), vehicle.Ammo)).count;
        return val && (Count > 0);
    });
    return {...vehicle, Defenses: {...vehicle.Defenses, wActive}};
};

export const getWeapIndex = (WeapData: weapon[], weapon: weapon | weaponWithCount) => {
    return WeapData.findIndex(weap => weap.Name === weapon.Name);
};

export const getUtilIndex = (Utils:util[], util:util | utilWithCount) => {
    return Utils.findIndex(utility => utility.Name === util.Name);
};

export const getShieldIndex = (ShieldData, shield) => {
    return ShieldData.findIndex(s => s.Name === shield.Name);
};

export const getActiveDefs = (defenses: vehicle["Defenses"]) => defenses.Weapons.filter((w, i) => defenses.wActive[i]);

export const getActiveShields = (shields: {Shields: shield[], sActive: boolean[]}): shield[] => shields.Shields.filter((s, i) => shields.sActive[i]);

export const getAmmoOfWeap = (weapon: weapon, ammo: vehicle["Ammo"]) => {
    if (weapon.aType === undefined) return -1;
    const ammoType = weapon.aType;
    return getAmmo(ammoType, ammo);
};

export const getAmmo = (ammoType: string, ammo: vehicle["Ammo"]) => ammo.Data.findIndex((type) => type.Name === ammoType);

export const getVehicleIndex = (vehicle: vehicle | {Ownership: vehicle["Ownership"]}, vehicleArray: vehicle[]) => vehicleArray.findIndex((vehicle2) => {
    return sameVehicle(vehicle, vehicle2);
});

export const gVehicleFromID = (pID: string, vID: number, vehicleArray: vehicle[]) => 
    vehicleArray[getVehicleIndex({Ownership: {Player: pID, vID}}, vehicleArray)];

export const getPlayerVehicles = (vehicle: vehicle, vehicleArray: vehicle[]) => getPlayVehicles(vehicle.Ownership.Player, vehicleArray);

export const getPlayVehicles = (pID: string, vehicleArray: vehicle[]) => vehicleArray.filter((arrVehicle) => 
    arrVehicle.Ownership.Player === pID);

//#endregion

export const vehiclesInRadius = (vehicleArray: vehicle[], loc: locationVector, dist: number): vehicle[] => vehicleArray.filter((s) => distance(s.Location.loc, loc) <= dist || distance(s.Location.prevLoc, loc) <= dist);

export const vehiclesInPosition = (vehicleArr: vehicle[], loc: locationVector): vehicle[] => vehiclesInRadius(vehicleArr, loc, 0);

export const vehiclesOnLine = (line: line, vehicleArray: vehicle[], target: vehicle) => {
    const [dx, dy] = sub(line.b, line.a);
    const vehicleList: vehicle[] = [];
    if (dx === 0) {
        if (dy === 0) return [target];
        const [x, yOffset] = (dy < 0 ? line.b:line.a);
        for (let y = 1; y < Math.abs(dy); y++) {
            vehicleList.push(...vehiclesInPosition(vehicleArray, [x, y + yOffset]));
        }
    } else {
        const slope = dy/dx;
        const point = (dx < 0 ? line.b:line.a);
        const xOffset = point[0];
        let y = point[1];

        for (let x = 1; x < Math.abs(dx); x++) {
            y += slope;

            vehicleList.push(...vehiclesInPosition(vehicleArray, [xOffset + x, Math.round(y)]));
        }
    }

    vehicleList.push(target);
    return getPlayerVehicles(target, vehicleList);
};

export const sameVehicle = (vehicle1: vehicle | {Ownership: vehicle["Ownership"]}, vehicle2: vehicle) => {
    const Owner = vehicle1.Ownership;
    const Owner2 = vehicle2.Ownership;
    return (Owner.vID === Owner2.vID) && (Owner.Player === Owner2.Player);
};

export const mergeVehicle = (vehicle1: vehicle, vehicle2: vehicle) => {
    return {...vehicle1, ...vehicle2};
};

export const mergeVehicleArrays: (a: vehicle[], v: vehicle[]) => vehicle[] = mergeArrays(sameVehicle, mergeVehicle);

//import { getDefWeaps, updateActiveDef, getWeapIndex, getActiveDefs, getAmmoOfWeap, getAmmo, sameVehicle, getVehicleIndex, getPlayerVehicles } from './retrieve.mjs';

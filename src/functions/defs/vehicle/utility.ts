import { clone, replaceInArray } from "../../functions";
import { applyDamage, calcGenHitChance, calcHit, calcRangeHC, consumeAmmo } from "./attack";
import { getAmmo, getAmmoOfTool, getPlayerVehicles, getUtilIndex, mergeVehicleArrays } from "./retrieve";
import { makeVehicle, oldArea } from "./vehicle";
import { data } from "../../../slicers/dataInit.mjs";
import { vehicle } from "../../types/vehicleTypes";
import { deployingUtil, energyUtil, healingUtil, hit, hitNumbers, resupplyingUtil, status, statusUtil, util, velocityVector } from "../../types/types";
import { addVectors, magnitude } from "../../vectors";

export const canUtil = (source: vehicle, target: vehicle, util: util): boolean => {
    if (util.Type === "Deploying") return true;
    return calcRangeHC(source, target, util.Wran) === "Hit";
};

//#region Application Funcs
const shiftEnergy = (fState: vehicle["State"], target: vehicle): {fState: vehicle["State"], tState: vehicle["State"]} => {
    const fEnergy = fState.energy;
    const MaxEnergy = target.Stats.MaxEnergy;
    const tEnergy = target.State.energy;
    const totalEn = fEnergy + tEnergy;
    const overflow = totalEn - MaxEnergy;
    const fOutEn = Math.max(0, overflow);
    const tOutEn = totalEn - fOutEn;

    return {fState: {...fState, energy: fOutEn},
        tState: {...target.State, energy: tOutEn}};
};

const shiftAmmo = (fAmmo: vehicle["Ammo"], tAmmo: vehicle["Ammo"], fInd: number, tInd: number): {fAmmo: vehicle["Ammo"], tAmmo: vehicle["Ammo"]} => {
    const source = fAmmo.Ammo(fInd);
    const reciever = tAmmo.Ammo(tInd);
    const totalAmmo = source.count + reciever.count;
    const overflow = totalAmmo - reciever.MCount;
    const sAmmo = Math.max(0, overflow);
    const rAmmo = totalAmmo - sAmmo;
    return {fAmmo: {...fAmmo, count: replaceInArray(fAmmo.count, fInd, sAmmo)},
        tAmmo: {...tAmmo, count: replaceInArray(tAmmo.count, tInd, rAmmo)}};
};

const updateFireRate = (Utils: vehicle["Utils"], util: util): vehicle["Utils"] => {
    const weapIndex = getUtilIndex(Utils.Data, util);
    const nFireCount = Utils.fireCount[weapIndex] + 1;
    return {...Utils, fireCount: replaceInArray(Utils.fireCount, weapIndex, nFireCount)};
};

const applyStatus = (target: vehicle, status: status): vehicle => {
    const statuses = target.State.statuses;
    const typeStatus = statuses.find(stat => status.Type === stat.Type);

    if (typeStatus === undefined) 
        return {...target, State: {...target.State, statuses: [...statuses, status]}};

    const nonTypeStatus = statuses.filter(stat => stat !== typeStatus);
    const combinedStatus = typeStatus.combine(typeStatus, status);

    return {...target, State: {...target.State, statuses: [...nonTypeStatus, ...combinedStatus]}};
};

const applySource = (source: vehicle, util: util): vehicle => {
    return {...source,
        State: {
            ...source.State,
            energy: Math.min(source.Stats.MaxEnergy, source.State.energy - util.EnergyCost),
            heat: Math.min(source.Stats.MaxHeat, source.State.heat + util.HeatLoad),
            hasFired: true,
        },
        Ammo: consumeAmmo(source.Ammo, getAmmoOfTool(util, source.Ammo)),
        Utils: updateFireRate(source.Utils, util)
    };
};
//#endregion

//#region Utilities
const heal = (source:vehicle, target:vehicle, util: healingUtil, hitValue: hit): {modifiedVehicles: vehicle[], healed: number} => {
    const newSource = applySource(source, util);
    if (hitValue === "Miss") return {
        modifiedVehicles: [newSource],
        healed: 0
    };
    const newTarget = applyDamage(util.Heal, target);

    return {
        modifiedVehicles: [newSource, newTarget],
        healed: Math.min(target.Stats.MaxHP - target.State.hp, util.Heal)
    };
};

const resupply = (source: vehicle, target: vehicle, util: resupplyingUtil, hitValue: hit): {modifiedVehicles: vehicle[], transferred: number} => {
    if (hitValue === "Miss") return {
        modifiedVehicles: [],
        transferred: 0
    };
    const sourceIndex = getAmmoOfTool(util, source.Ammo);
    const targetIndex = getAmmo(util.dType, target.Ammo);
    const Ammos = shiftAmmo(source.Ammo, target.Ammo, sourceIndex, targetIndex);

    const newSource = {...source, Ammo: Ammos.fAmmo};
    const newTarget = {...target, Ammo: Ammos.tAmmo};

    return {
        modifiedVehicles: [newSource, newTarget],
        transferred: source.Ammo.Ammo(sourceIndex).count - Ammos.fAmmo.Ammo(sourceIndex).count,
    };
};

const energyTransfer = (source: vehicle, target: vehicle, util: energyUtil, hitValue: hit): {modifiedVehicles: vehicle[], transferred: number} => {
    if (hitValue === "Miss") return {
        modifiedVehicles: [],
        transferred: 0
    };

    const {fState, tState} = shiftEnergy(source.State, target);

    const newSource = {...source, State: fState};
    const newTarget = {...target, State: tState};

    return {
        modifiedVehicles: [newSource, newTarget],
        transferred: source.State.energy - fState.energy
    };
};

const inflictStatus = (source: vehicle, target: vehicle, util: statusUtil, hitValue: hit): vehicle[] => {
    const [targetName, status] = util.Status;
    const newSource = applySource(source, util);

    if (hitValue === "Miss" && targetName !== "Self") newSource;

    const modifiedVehicles = targetName === "Self" ?
        [applyStatus(newSource, status)]:
        [newSource, applyStatus(target, status)];

    return modifiedVehicles;
};

const deployVehicle = (source: vehicle, vehicleArray: vehicle[], util: deployingUtil, Data = data): vehicle[] => {
    const shipNum = getPlayerVehicles(source, vehicleArray)
        .reduce(
            (acc,vehicle) => Math.max(acc, vehicle.Ownership.vID),0) + 1;
    const deployedVehicle = 
        makeVehicle(
            Data.shipTypes[source.Type.Faction][util.Deploys],
            source.Ownership.Player,
            shipNum,
            source.Location.location,
            source.Location.rotation);

    const velocityFixedVehicle = {...deployedVehicle, Velocity: clone(source.Velocity)};

    const newSource = applySource(source, util);

    return [newSource, velocityFixedVehicle];
};
//#endregion

//Main Utility

// case "Healing":
//     return `${fName} heals ${tName} for ${-damage} HP.\n`;
// case "Resupplying": 
// case "Energy":
//     return `${fName} sends Energy to ${tName}.\n`;case "Healing":
//     return `${fName} heals ${tName} for ${-damage} HP.\n`;
// case "Resupplying": {
//     const ammoNum = getAmmo(weap.dType, tVehicle.Ammo);
//     const ammoName = tVehicle.Ammo.Ammo(ammoNum).Name;
//     return `${fName} resupplies ${tName}'s ${ammoName} round supply.\n`;
// }
// case "Energy":
//     return `${fName} sends Energy to ${tName}.\n`;

const createDataStr = (source: vehicle, target: vehicle, util: util, number: number, hit: hit) => {
    const {Type} = util;

    const fhasName = source.Appearance.name !== source.Type.Class;
    const thasName = target.Appearance.name !== target.Type.Class;

    const fName = fhasName ? "The": "~F " + source.Appearance.name;
    const tName = thasName ? "the": "~T " + target.Appearance.name;

    switch (Type) {
        //"Healing/Resupplying/Energy/Deploying/Status"
        case "Healing":
            if (hit === "Hit") return `${fName} healed ${tName} for ${number} HP.\n`;
            else return `${fName} wasn't in range to heal ${tName}`;
        case "Resupplying": {
            const ammoNum = getAmmo(util.dType, target.Ammo);
            const ammoName = target.Ammo.Ammo(ammoNum).Name;
            return `${fName} resupplies ${tName} ${number} ${ammoName} rounds.\n`;
        }
        case "Energy":
            if (hit === "Hit") return `${fName} sent ${tName} ${number} Energy.\n`;
            else return `${fName} wasn't in range to tranfer energy to ${tName}`;
        case "Deploying":
            return `${fName} deployed a ${target.Appearance.name}`;
        case "Status":
            if (hit === "Hit") return `${fName} applied a ${util.Status[1].Type} status to ${util.Status[0] === "Self" ? "itself": tName}.\n`;
            else return `${fName} missed`;
        default:
            throw Error("Unknown Type of Utility");
    }
};

export const utility = (source: vehicle, target: vehicle, util: util): string => {
    console.log(source, target, util);
    const {Type} = util;
    let hit: hit;

    switch (Type) {
        //"Healing/Resupplying/Energy/Deploying/Status"
        case "Healing":
            hit = calcRangeHC(source, target, util.Wran);
            break;
        case "Resupplying":
            hit = calcRangeHC(source, target, util.Wran);
            break;
        case "Energy":
            hit = calcRangeHC(source, target, util.Wran);
            break;
        case "Deploying":
            hit = "Hit";
            break;
        case "Status":
            hit = calcHit(calcGenHitChance(source, target, util));
            if (util.Status[0] === "Self") hit = "Hit";
            break;
        default:
            throw Error("Unknown Type of Utility");
    }
    const move = [
        getUtilIndex(source.Utils.Data, util), 
        target.Ownership.Player, target.Ownership.vID, 
        hitNumbers[hit]
    ];
    return JSON.stringify(move);
};

export const applyUtility = (Data, shipArray: vehicle[], source: vehicle, target: vehicle, util: util, hit: hit): [merged: vehicle[], dataString: string] => {
    const {Type} = util;

    let modifiedVehicles: vehicle[] = [];
    let number = 0;
    
    let altTarget = target;

    switch (Type) {
        //"Healing/Resupplying/Energy/Deploying/Status"
        case "Healing":
            ({modifiedVehicles, healed: number} = heal(source, target, util, hit));
            break;
        case "Resupplying":
            ({modifiedVehicles, transferred: number} = resupply(source, target, util, hit));
            break;
        case "Energy":
            ({modifiedVehicles, transferred: number} = energyTransfer(source, target, util, hit));
            break;
        case "Deploying":
            modifiedVehicles = deployVehicle(source, shipArray, util, Data);
            altTarget = modifiedVehicles[1];
            break;
        case "Status":
            modifiedVehicles = inflictStatus(source, target, util, hit);
            break;
        default:
            throw Error("Unknown Type of Utility");
    }
    modifiedVehicles = modifiedVehicles.map(oldArea);

    const merged = mergeVehicleArrays(shipArray, modifiedVehicles);

    const dataString = createDataStr(source, altTarget, util, number, hit);
    return [merged, dataString];
};

export const finalizeUtility = (vehicle: vehicle): vehicle => {
    const {Velocity, Location, State} = vehicle;
    const hasMoved = magnitude(Velocity.deltaVelocity) !== 0;
    const finalVelocity = addVectors(Velocity.velocity, Velocity.deltaVelocity);

    const cState =  {...State, hasMoved};
    const cVel = {velocity: finalVelocity, deltaVelocity: [0,0] as velocityVector};
    const cLoc = {...Location, location: Location.nextLocation, nextLocation: addVectors(Location.nextLocation, finalVelocity)};
    const cVeh = {
        ...vehicle,
        State: cState,
        Velocity: cVel,
        Location: cLoc,
    };
    return oldArea(cVeh);
};
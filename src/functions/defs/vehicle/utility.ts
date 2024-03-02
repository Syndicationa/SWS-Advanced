import { clone, curry, replaceInArray, compareArray, sumArrays } from "../../functions";
import { statusTemplate, utilityTemplate, vehicleTemplate } from "../templates.mjs";
import { applyDamage, calcGenHitChance, calcHit, calcRangeHC, consumeAmmo } from "./attack";
import { getAmmo, getAmmoOfWeap, getPlayerVehicles, getUtilIndex, mergeVehicleArrays } from "./retrieve";
import { makeVehicle, reArea, updateArea } from "./vehicle";
import { data } from "../../../slicers/dataInit.mjs";

//#region Application Funcs
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
};

const shiftAmmo = (fAmmo, tAmmo, fInd, tInd) => {
    const source = fAmmo.Ammo(fInd);
    const reciever = tAmmo.Ammo(tInd);
    const totalAmmo = source.count + reciever.count;
    const overflow = totalAmmo - reciever.MCount;
    const sAmmo = Math.max(0, overflow);
    const rAmmo = totalAmmo - sAmmo;
    return {fAmmo: {...fAmmo, count: replaceInArray(fAmmo.count, fInd, sAmmo)},
        tAmmo: {...tAmmo, count: replaceInArray(tAmmo.count, tInd, rAmmo)}};
};

const updateFireRate = (Utils, util) => {
    const weapIndex = getUtilIndex(Utils.Data, util);
    const nFireCount = Utils.fireCount[weapIndex] + 1;
    return {...Utils, fireCount: replaceInArray(Utils.fireCount, weapIndex, nFireCount)};
};

const applyStatus = (target = vehicleTemplate, status = statusTemplate) => {
    const statuses = target.State.statuses;
    const typeStatus = statuses.find(stat => status.Type === stat.Type);

    if (typeStatus === undefined) 
        return {...target, State: {...target.State, statuses: [...statuses, status]}};

    const nonTypeStatus = statuses.filter(stat => stat !== typeStatus);
    const combinedStatus = typeStatus.combine(typeStatus, status);

    return {...target, State: {...target.State, statuses: [...nonTypeStatus, ...combinedStatus]}};
};

const applySource = (source = vehicleTemplate, util = utilityTemplate) => {
    return {...source,
        State: {
            ...source.State,
            energy: Math.min(source.Stats.MaxEnergy, source.State.energy - util.EnergyCost),
            heat: Math.min(source.Stats.MaxHeat, source.State.heat + util.HeatLoad),
            hasFired: true,
        },
        Ammo: consumeAmmo(source.Ammo, getAmmoOfWeap(util, source.Ammo)),
        Weap: updateFireRate(source.Utils, util)
    };
};
//#endregion

//#region Utilities
const heal = (source, target, util = utilityTemplate, hitValue) => {
    const hit = hitValue ?? calcRangeHC(source, target, util.Wran);
    if (!hit) return {
        modifiedShips: [],
        damage: [[0,0]],
        hit: 0
    };

    const newSource = applySource(source, util);
    const newTarget = applyDamage(util.Heal, target);

    return {
        modifiedShips: [newSource, newTarget],
        damage: [[util.Heal, 0]],
        hit: 2
    };
};

const resupply = (source = vehicleTemplate, target = vehicleTemplate, util = utilityTemplate, hitValue) => {
    const hit = hitValue ?? calcRangeHC(source, target, util.Wran);
    if (!hit) return {
        modifiedShips: [],
        damage: [[0,0]],
        hit: 0
    };

    const sourceIndex = getAmmoOfWeap(util, source.Ammo);
    const targetIndex = getAmmo(util.dType, target.Ammo);
    const Ammos = shiftAmmo(source.Ammo, target.Ammo, sourceIndex, targetIndex);

    const newSource = {...source, Ammo: Ammos.fAmmo};
    const newTarget = {...target, Ammo: Ammos.tAmmo};

    return {
        modifiedShips: [newSource, newTarget],
        damage: [[source.Ammo.Ammo(sourceIndex).count - Ammos.fAmmo.Ammo(sourceIndex), 0]],
        hit: 2
    };
};

const energyTransfer = (source = vehicleTemplate, target = vehicleTemplate, util = utilityTemplate, hitValue) => {
    const hit = hitValue ?? calcRangeHC(source, target, util.Wran);
    if (!hit) return {
        modifiedShips: [],
        damage: [[0,0]],
        hit: 0
    };

    const {fState, tState} = shiftEnergy(source.State.energy, target);

    const newSource = {...source, State: fState};
    const newTarget = {...target, State: tState};

    return {
        modifiedShips: [newSource, newTarget],
        damage: [[source.State.energy - fState.energy, 0]],
        hit: 2
    };
};

const deployVehicle = (source = vehicleTemplate, vehicleArray = [vehicleTemplate], util = utilityTemplate, Data = data) => {
    const shipNum = getPlayerVehicles(source, vehicleArray)
        .reduce(
            (acc,vehicle) => Math.max(acc, vehicle.Ownership.vID),0) + 1;
    const deployedVehicle = 
        makeVehicle(
            Data.shipTypes[source.Type.Faction][util.Deploys],
            source.Ownership.Player,
            shipNum,
            source.Location.prevLoc,
            source.Location.rotation);

    const velocityFixedVehicle = {...deployedVehicle, Velocity: clone(source.Velocity)};

    const newSource = applySource(source, util);

    return {
        modifiedShips: [newSource, velocityFixedVehicle],
        damage: [[0, 0]],
        hit: 2
    };
    
};

const inflictStatus = (source = vehicleTemplate, target = vehicleTemplate, util = utilityTemplate, hitValue) => {
    const [targetName, status] = util.Status;
    const hit = hitValue ?? calcHit(calcGenHitChance(source, target, util));

    const newSource = applySource(source, util);

    if (hit === 0 && targetName !== "Self") return {
        modifiedShips: [newSource],
        damage: [[0,0]],
        hit: 0
    };

    const modifiedShips = targetName === "Self" ?
        [applyStatus(newSource, status)]:
        [...newSource, applyStatus(target, status)];

    return {
        modifiedShips,
        damage: [[0, 0]],
        hit: 2
    };
};
//#endregion

//Main Utility

const createDataStr = () => "";

export const utility = curry((Data, shipArray, source, target, util) => {
    const {Type} = util;

    let modifiedShips = [];
    let damage = [0,0];
    let hit = 0;

    let trueTarget = [target];

    switch (Type) {
        //"Healing/Resupplying/Energy/Deploying/Status"
        case "Healing":
            ({modifiedShips, damage, hit} = heal(source, target, util));
            break;
        case "Resupplying":
            ({modifiedShips, damage, hit} = resupply(source, target, util));
            break;
        case "Energy":
            ({modifiedShips, damage, hit} = energyTransfer(source, target, util));
            break;
        case "Deploying":
            ({modifiedShips, damage, hit} = deployVehicle(source, shipArray, util, Data));
            break;
        case "Status":
            ({modifiedShips, damage, hit} = inflictStatus(source, shipArray, util, Data));
            break;
        default:
            break;
    }
    modifiedShips = modifiedShips.map(updateArea(reArea(true, false)));

    const merged = mergeVehicleArrays(shipArray, modifiedShips);
    const move = [
        getUtilIndex(source.Utils.Data, util), 
        trueTarget.map((target) => target.Ownership.Player), trueTarget.map((target) => target.Ownership.vID), 
        hit
    ];

    const dataString = createDataStr(source, trueTarget, util, damage, hit);
    return [merged, JSON.stringify(move), dataString];
});

export const applyUtility = curry((Data, shipArray, source = vehicleTemplate, target = vehicleTemplate, util = utilityTemplate, hit = 0) => {
    const {Type} = util;

    let modifiedShips = [];
    let damage = [0,0];

    let trueTarget = [target];

    switch (Type) {
        //"Healing/Resupplying/Energy/Deploying/Status"
        case "Healing":
            ({modifiedShips, damage} = heal(source, target, util, hit));
            break;
        case "Resupplying":
            ({modifiedShips, damage} = resupply(source, target, util, hit));
            break;
        case "Energy":
            ({modifiedShips, damage} = energyTransfer(source, target, util, hit));
            break;
        case "Deploying":
            ({modifiedShips, damage} = deployVehicle(source, shipArray, util, Data, hit));
            break;
        case "Status":
            ({modifiedShips, damage} = inflictStatus(source, shipArray, util, Data, hit));
            break;
        default:
            break;
    }
    modifiedShips = modifiedShips.map(updateArea(reArea(false, false)));

    const merged = mergeVehicleArrays(shipArray, modifiedShips);

    const dataString = createDataStr(source, trueTarget, util, damage, hit);
    return [merged, dataString];
});

export const finalizeUtility = V => {
    const {Velocity, Location, State, Appearance} = V;
    const hasMoved = compareArray([0,0], Velocity.vel);
    const cState =  {...State, hasFired: false, hasMoved};
    const newVel = sumArrays(Velocity.vel, Velocity.prevVel);
    const cVel = {...Velocity, prevVel: newVel, vel: newVel};
    const cLoc = {...Location, prevLoc: Location.loc, loc: sumArrays(Location.loc, newVel)};
    const cApp = {...Appearance, area: reArea(true, false, cLoc, Appearance.Size)};
    const cVeh = {
        ...V,
        State: cState,
        Velocity: cVel,
        Location: cLoc,
        Appearance: cApp
    };
    return cVeh;
};
import {curry, rectangle, isInRectangle, compareArray} from "../../functions";
import { ammo, locationVector, rotationVector, sizeVector, util, weapon } from "../../types/types";
import { baseVehicle, vehicle } from "../../types/vehicleTypes";
import { getDefWeaps, updateActiveDef } from "./retrieve";

type combo = {Weap: vehicle["Weap"], Utils: vehicle["Utils"], Ammo: vehicle["Ammo"]};

const addEE = (weapons: vehicle["Weap"], utils: vehicle["Utils"], ammo: vehicle["Ammo"], HP: number): combo => {
    const hasExplode = weapons.Data.some((weapon) => weapon.Type === "Destruct");
    const hasEnergy = utils.Data.some((utility) => utility.Type === "Energy");

    const energyUtil: util = {
        Name: "Energy Transfer", 
        Type:"Energy", 
        aType:"Energy", 
        EnergyCost: 0, 
        HeatLoad: 0, 
        FireRate: Infinity, 
        Wran: 5
    };
    const energyAmmo = {Name: "Energy", MCount: Infinity};
    
    const Watk = Math.round(20*Math.log10(HP)) + 20;
    const Wran = Math.round((8/3)*Math.log10(HP));
    const WRatk = Math.floor(-Watk/(Wran + 1));
    const explodeWeap: weapon =  {Name: "Self Destruct", Type:"Destruct", aType:"Explodium", 
        Watk, Whit: 75, Wran, WRatk, 
        EnergyCost: 0, FireRate: 1};
    const explodeAmmo: ammo = {Name: "Explodium", MCount: Infinity};

    const nWeaps = hasExplode ? weapons: {
        ...weapons,
        Data: [...weapons.Data, explodeWeap],
        fireCount: [...weapons.fireCount, 0]
    };

    const nUtils = hasEnergy ? utils: {
        ...utils,
        Data: [...utils.Data, energyUtil],
        fireCount: [...utils.fireCount, 0]
    };

    const newAmmo = [...(hasEnergy ? []:[energyAmmo]), ...(hasExplode ? []:[explodeAmmo])];
    const newCount = newAmmo.map(() => 0);

    const nAmmo = {
        ...ammo,
        Data: [...ammo.Data, ...newAmmo],
        count: [...ammo.count, ...newCount]
    };

    return {Weap: nWeaps, Utils: nUtils, Ammo: nAmmo};
};

export const makeVehicle = (source: baseVehicle | vehicle, 
    playerID: string, vID: number, 
    pos: locationVector, r: rotationVector, parent: string = ""): vehicle => {
    
    const {
        Type: Type, Stats: Stats, 
        Appearance: app, 
        Weap: weap, Utils: utils, 
        Ammo: ammo, Defenses: def} = source;

    const Ownership = {Player: playerID, vID: vID};
    const Appearance = {area: [], name: Type.Class, visible: true, ...app};

    const State = "State" in source ? source.State: {
        hp: Stats.MaxHP, maxHP: Stats.MaxHP, 
        energy: Stats.MaxEnergy,
        heat: 0,
        intercept: 5,
        hasMoved: false, hasFired: false, 
        statuses: []
    };

    const origWeap: vehicle["Weap"] = "fireCount" in weap ? weap: {
        Data: weap, 
        fireCount: new Array(weap.length).fill(0),
        Weap (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    };

    const origUtils: vehicle["Utils"] = "fireCount" in utils ? utils: {
        Data: utils, fireCount: new Array(utils.length).fill(0),
        Util (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    };

    const origAmmo: vehicle["Ammo"] = "count" in ammo ? ammo: {
        Data: ammo, 
        count: ammo.map((ammoType) => 
            ammoType.sCount ?? ammoType.MCount ?? Infinity),
        Ammo (i) {
            return {...this.Data[i], count: this.count[i]};
        }
    };

    const {Weap, Utils, Ammo} = addEE(origWeap, origUtils, origAmmo, Stats.MaxHP);

    const defWeaps = getDefWeaps(Weap.Data);
    const shields = def.Shields ?? []; 
    const origDWeap = "wActive" in def ? def:{
        Weapons: defWeaps, wActive: defWeaps.map(() => true),
    };
    const origShields = "sActive" in def ? def:{
        Shields: shields,
        sDamage: shields.map(() => 0),
        sActive: shields.map(() => false),
    };
    const Defenses: vehicle["Defenses"] = {
        ...origDWeap, ...origShields
    };

    const Location: vehicle["Location"] = {prevLoc: pos, loc: pos, rotation: [...r], parent};
    const Velocity: vehicle["Velocity"] = {vel: [0,0], prevVel: [0,0]};

    const updateShip = (vehicle: vehicle) => updateActiveDef(updateArea(reArea(true, false))(vehicle));

    return updateShip({
        Ownership, Type, Stats,
        Appearance, State,
        Weap, Utils, Ammo, Defenses,
        Location, Velocity
    });
};

export const applyStatuses = (vehicle: vehicle): vehicle => {
    const statuses = vehicle.State.statuses.map((status) => {return {...status, time: status.time - 1};});
    const nVeh = statuses.reduce((accVeh, status) => {
        if (status.time === 0) return status.reset(accVeh);
        return status.apply(accVeh);
    }, vehicle);
    const trimmedStatuses = statuses.reduce((acc, status) => status.time === 0 ? acc:[...acc, status],[]);

    return {...nVeh, State: {...nVeh.State, statuses: trimmedStatuses}};
};

export const updateArea = (areaFunc) => (ship: vehicle): vehicle => {
    const loc = ship.Location;
    const {Size, area} = ship.Appearance;
    const shipReturn = (area: locationVector[]): vehicle => {return {...ship, Appearance: {...ship.Appearance, area}};};
    if (ship.State.hp <= 0) return shipReturn([]);
    return shipReturn(areaFunc(loc, Size, area));
};

export const reArea = curry((old: boolean, both: boolean, locInfo: vehicle["Location"], size: sizeVector) => {
    const {prevLoc, loc, rotation} = locInfo;
    let Area: locationVector[] = [];
    const location = old ? prevLoc : loc;

    //The both parameter covers the chance that both that both positions must be covered
    if (both) {
        Area = reArea(!old, false, locInfo, size);
    }

    //if a ship is a 1x1 then all Area needs to be is itself
    if (size.reduce((cumulative,val) => cumulative*val, 1) === 1) {
        return [...Area, location];
    }
    
    const rect = rectangle(location, size, rotation); //returns the four corners of the rectangle
    const extremes = rect.reduce((previous, current) => {
        if (previous.length === 0) return [current[0], current[1], current[0], current[1]];
        return previous.map((val, i) => {
            const xory = i % 2;
            if (i > 1) return Math.ceil(Math.max(val, current[xory]));
            return Math.floor(Math.min(val, current[xory]));
        });
    }, []);

    for (let x = extremes[0]; x <= extremes[2]; x++) {
        for (let y = extremes[1]; y <= extremes[3]; y++) {
            if (isInRectangle([x + 0.5,y + 0.5], rect)) {
                const alreadyIn = Area.some((loc) => {
                    return compareArray(loc, [x,y]);
                });
                if (!alreadyIn) {
                    Area.push([x,y]);
                }
            }
        }
    }
    return Area;
});

// const shiftArea = curry(([dx, dy], locInfo= locInfoTemplate, size = [1,1], area = areaTemplate) => {
//     let areaLen = reArea(true, false)(locInfo, size, area).length;
//     return area.map((each, index) => index < areaLen ? each: [each[0] + dx, each[1] + dy]);
// })
import { rectangle, isInRectangle, compareArray, objectMap} from "../../functions";
import { ammo, locationVector, player, rotationVector, sizeVector, util, weapon } from "../../types/types";
import { baseVehicle, isVehicle, modifiers, vehicle } from "../../types/vehicleTypes";
import { distance } from "../../vectors";
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

    const updateVehicle = (vehicle: vehicle) => updateActiveDef(updateArea(reArea(true, false))(vehicle));
    const Location: vehicle["Location"] = {location: pos, nextLocation: pos, rotation: [...r], parent};
    const Velocity: vehicle["Velocity"] = {velocity: [0,0], deltaVelocity: [0,0]};
    
    if (isVehicle(source)) return updateVehicle({...source, Location, Velocity});
    
    const {
        Type: Type, Stats: stats, 
        Appearance: app, 
        Weap: weap, Utils: utils, 
        Ammo: ammo, Defenses: def} = source;

    const Ownership = {Player: playerID, vID: vID};
    const Appearance = {area: [], name: Type.Class, visible: true, ...app};

    const {MaxHP, MaxEnergy} = stats;

    const Stats = {...stats, TrueStats: stats};
    const modifiers: modifiers = objectMap(Stats)(() => [0, 1]);


    const State = {
        hp: MaxHP, 
        energy: MaxEnergy,
        heat: 0,
        intercept: 5,
        hasMoved: false, hasFired: false, 
        statuses: [],
        modifiers
    };

    const origWeap: vehicle["Weap"] = {
        Data: weap, 
        fireCount: new Array(weap.length).fill(0),
        Weap (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    };

    const origUtils: vehicle["Utils"] = {
        Data: utils, fireCount: new Array(utils.length).fill(0),
        Util (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    };

    const origAmmo: vehicle["Ammo"] = {
        Data: ammo, 
        count: ammo.map((ammoType) => 
            ammoType.sCount ?? ammoType.MCount ?? Infinity),
        Ammo (i) {
            return {...this.Data[i], count: this.count[i]};
        }
    };

    const {Weap, Utils, Ammo} = addEE(origWeap, origUtils, origAmmo, MaxHP);

    const defWeaps = getDefWeaps(Weap.Data);
    const shields = def.Shields ?? []; 
    const origDWeap = {
        Weapons: defWeaps, wActive: defWeaps.map(() => true),
    };
    const origShields = {
        Shields: shields,
        sDamage: shields.map(() => 0),
        sActive: shields.map(() => false),
    };
    const Defenses: vehicle["Defenses"] = {
        ...origDWeap, ...origShields
    };

    return updateVehicle({
        Ownership, Type, Stats,
        Appearance, State,
        Weap, Utils, Ammo, Defenses,
        Location, Velocity
    });
};

export const determineStealth = (Vehicles: vehicle[], vehicle: vehicle, player: player): vehicle => {
    if (vehicle.Ownership.Player === player.User.ID || vehicle.Stats.StealthLevel === undefined) 
        return {...vehicle, Appearance: {...vehicle.Appearance, visible: true}};
    for (const viewer of Vehicles) {
        if (viewer.Ownership.Player === player.User.ID) continue;
        const range = vehicle.Stats.StealthLevel + (viewer.Stats.ScannerLevel ?? 0);
        if (distance(viewer.Location.location, vehicle.Location.location) <= range)
            return {...vehicle, Appearance: {...vehicle.Appearance, visible: true}};
    }
    console.log("Stealthy!");
    return {...vehicle, Appearance: {...vehicle.Appearance, visible: false}};
};

export const applyStatuses = (vehicle: vehicle): vehicle => {
    const modifiers: modifiers = objectMap(vehicle.Stats.TrueStats)(() => [0, 1]);
    const defaultedVehicle = {...vehicle, State: {...vehicle.State, modifiers}};

    const statuses = vehicle.State.statuses.map((status) => {return {...status, time: status.time - 1};});
    const activeStatuses = statuses.filter(status => status.time !== 0);

    const deactivated = statuses.reduce((vehicle, status) => status.reset(vehicle), defaultedVehicle);
    const finalVehicle = activeStatuses.reduce((vehicle, status) => status.apply(vehicle), deactivated);

    const modifiedStats = objectMap(finalVehicle.Stats.TrueStats)((stat, key) => {
        if (stat === undefined) return stat;
        if (key === undefined) throw Error("How");
        const [summand, multiplier] = finalVehicle.State.modifiers[key];
        return stat*multiplier + summand;
    });

    const Stats = {...modifiedStats, TrueStats: finalVehicle.Stats.TrueStats};

    console.log(finalVehicle);

    return {...finalVehicle, Stats, State: {...finalVehicle.State, statuses: activeStatuses}};
};

const shipReturn = (area: locationVector[], vehicle: vehicle): vehicle => {
    return {...vehicle, Appearance: {...vehicle.Appearance, area}};
};

type areaFunction = (location: vehicle["Location"], Size: sizeVector) => locationVector[];

const updateArea = (areaFunc: areaFunction) => (vehicle: vehicle): vehicle => {
    const loc = vehicle.Location;
    const {Size, visible} = vehicle.Appearance;
    if (vehicle.State.hp <= 0 || !visible) return shipReturn([], vehicle);
    return shipReturn(areaFunc(loc, Size), vehicle);
};

const reArea = (old: boolean, both: boolean): areaFunction => (locInfo: vehicle["Location"], size: sizeVector) => {
    const {location: loc, nextLocation, rotation} = locInfo;
    let Area: locationVector[] = [];
    const location = old ? loc:nextLocation;

    //The both parameter covers the chance that both that both positions must be covered
    if (both) {
        Area = reArea(!old, false)(locInfo, size);
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
};

export const oldArea = updateArea(reArea(true, false));
export const newArea = updateArea(reArea(false, false));
export const bothArea = updateArea(reArea(true, true));

// const shiftArea = curry(([dx, dy], locInfo= locInfoTemplate, size = [1,1], area = areaTemplate) => {
//     let areaLen = reArea(true, false)(locInfo, size, area).length;
//     return area.map((each, index) => index < areaLen ? each: [each[0] + dx, each[1] + dy]);
// })
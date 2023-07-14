import {curry, rectangle, isInRectangle, compose} from '../../functions.mjs';
import { compareArray } from '../../functions.mjs';
import { getDefWeaps, updateActiveDef } from './retrieve.mjs';

const conditionalArray = (...conds) => (...vals) => {
    return conds.reduce((a, v, i) => [...a, ...(v ? []:[vals[i]])],[])
}

const addEEWeapons = (weapon, ammo) => HP => {
    const [hasEnergy, hasExplode] = weapon.Data.reduce((previous, type) => {
        let hasEnergy = type.Type === "Energy" || previous[0];
        let hasExplode = type.Type === "Destruct" || previous[1];
        return [hasEnergy, hasExplode];
    }, [false, false]);

    const energyWeap = {Name: "Energy Transfer", Type:"Energy", aType:"Energy", EnergyCost: 0, FireRate: Infinity};
    const energyAmmo = {Name: "Energy", MCount: Infinity};
    
    const Watk = Math.round(20*Math.log10(HP)) + 20;
    const Wran = Math.round((8/3)*Math.log10(HP));
    const WRatk = Math.floor(-Watk/(Wran + 1));
    const explodeWeap =  {Name: "Self Destruct", Type:"Destruct", aType:"Explodium", 
        Watk, Whit: 75, Wran, WRatk, 
        EnergyCost: 0, FireRate: 1};
    const explodeAmmo = {Name: "Explodium", MCount: Infinity};

    const eeArray = conditionalArray(hasEnergy, hasExplode);

    const extraWeaps = eeArray(energyWeap, explodeWeap);
    const extraFC = eeArray(0, 0);
    const extraAmmo = eeArray(energyAmmo, explodeAmmo);
    const extraC = eeArray(Infinity, Infinity);

    const nWeap = {
        ...weapon,
        Data: [...weapon.Data, ...extraWeaps],
        fireCount: [...weapon.fireCount, ...extraFC]
    }

    const nAmmo = {
        ...ammo,
        Data: [...ammo.Data, ...extraAmmo],
        count: [...ammo.count, ...extraC]
    }

    return [nWeap, nAmmo];
}


export const makeVehicle = (source, playerID, vID, pos, r, parent = "") => {
    const {
        Type: type, Stats: stats, 
        State: state, Appearance: app, 
        Weap: weap, Ammo: ammo, Defenses: def} = source;
    const Ownership = {Player: playerID, vID: vID};
    const Type = type;
    const Stats = stats;
    const Appearance = {area: [], name: type.Class, visible: true, ...app};

    const State = state ?? {hp: stats.MaxHP, maxHP: stats.MaxHP, energy: stats.MaxEnergy,
        hasMoved: false, hasFired: false, statuses: [], mov: stats.Mov};

    const origWeap = weap.fireCount !== undefined ? weap:
        {Data: weap, fireCount: new Array(weap.length).fill(0),
        Weap (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]}
        }};

    const origAmmo = ammo.count !== undefined ? ammo:
        {Data: ammo, 
            count: ammo.fill(0).map((u, i) => 
            ammo[i].sCount ?? ammo[i].MCount ?? Infinity),
        Ammo (i) {
            return {...this.Data[i], count: this.count[i]}
        }};

    const [Weap, Ammo] = addEEWeapons(origWeap, origAmmo)(Stats.MaxHP)

    const defWeaps = getDefWeaps(Weap.Data);
    const shields = def.Shields ?? []; 
    const origDWeap = def.wActive !== undefined ? def:{
        Weapons: defWeaps, wActive: defWeaps.fill(true),
    };
    const origShields = def.sActive !== undefined ? def:{
        Shields: shields,
        sDamage: shields.fill(0),
        sActive: shields.fill(false),
    }
    const Defenses = {
        ...origDWeap, ...origShields
    };

    const Location = {prevLoc: pos, loc: pos, rotation: r, parent};
    const Velocity = {vel: [0,0], prevVel: [0,0]};

    const updateShip = compose(updateActiveDef, updateArea(reArea(true, false)));

    return updateShip({
        Ownership, Type, Stats,
        Appearance, State,
        Weap, Ammo, Defenses,
        Location, Velocity
    })
}

export const applyStatuses = (vehicle) => {
    const statuses = vehicle.State.status.map((status) => {return {...status, time: status.time - 1}});
    const nVeh = statuses.reduce((accVeh, status) => {
        if (status.time === 0) return status.reset(accVeh);
        return status.func(accVeh);
    }, vehicle);
    const trimmedStatuses = statuses.reduce((acc, status) => status.time === 0 ? acc:[...acc, status],[]);

    return {...nVeh, State: {...nVeh.State, statuses: trimmedStatuses}};
}

export const updateArea = curry((func, ship) => {
	const loc = ship.Location;
	const {Size, area} = ship.Appearance;
	const shipReturn = (area) => {return {...ship, Appearance: {...ship.Appearance, area}}};
	if (ship.State.hp <= 0) return shipReturn([]);
	return shipReturn(func(loc, Size, area));
})

export const reArea = curry((old, both, locInfo, size) => {
    const {prevLoc, loc, rotation} = locInfo;
    let Area = [];
    const location = old ? prevLoc : loc;

    if (both) {
        Area = reArea(locInfo, size, !old);
    }

    //if a ship is a 1x1 then all Area needs to be is itself
    if (size.reduce((cumulative,val) => cumulative*val, 1) === 1) {
        return [...Area, location];
    }
    
    const rect = rectangle(location, size, rotation);
    const extremes = rect.reduce((previous, current) => {
        if (previous.length === 0) return [current[0], current[1], current[0], current[1]];
        return previous.map((val, i) => {
            const xory = i % 2;
            if (i > 1) return Math.ceil(Math.max(val, current[xory]));
            return Math.floor(Math.min(val, current[xory]));
        })
    }, [])

    for (let x = extremes[0]; x <= extremes[2]; x++) {
        for (let y = extremes[1]; y <= extremes[3]; y++) {
            if (isInRectangle([x + 0.5,y + 0.5], rect)) {
                const alreadyIn = Area.some((loc) => {
                    return compareArray(loc, [x,y])
                })
                if (!alreadyIn) {
                    Area.push([x,y]);
                }
            }
        }
    }
    return Area;
})

// const shiftArea = curry(([dx, dy], locInfo= locInfoTemplate, size = [1,1], area = areaTemplate) => {
//     let areaLen = reArea(true, false)(locInfo, size, area).length;
//     return area.map((each, index) => index < areaLen ? each: [each[0] + dx, each[1] + dy]);
// })
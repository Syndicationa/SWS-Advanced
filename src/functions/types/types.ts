import { baseVehicle, vehicle } from "./vehicleTypes";

export type sizeVector =     [sx: number, sy: number];
export type locationVector = [ x: number,  y: number];
export type velocityVector = [dx: number, dy: number];
export type rotationVector = [rx: number, ry: number];

export type line = {a: locationVector, b: locationVector};

export type status = {
    time: number,
    data: object | undefined,
    Type: "Generic" | "Movement" | "Accuracy" | "Damage" | "True Hit" | "Countermeasures" | "Other Ideas",
    combine: (a: status, b: status) => status[],
    apply: (v: vehicle) => vehicle,
    reset: (v: vehicle) => vehicle,
    function: (a?: unknown) => unknown
}

//#region weapon
type baseWeapon = {
    Name: string,
    Watk: number, //Damage
    Whit: number, //Hit Rate modification
    Eran?: number, //Explosive Range
    WRatk: number, //Damage based on range
    Wran: number, //Maximum effective Range
    WMran?: number, //Minimum Range
    Wrot?: number, //Rotation bonds
    Offset?: rotationVector, //Where to base that rotation

    FireRate: number, //Shots per phase
    EnergyCost: number, //Energy cost
    aType: string //Ammo type
}
type heated = {HeatLoad: number}; //Heat generated per shot
type defensive = {Defensive: false} | {
    Defensive: true,
    Wcov: number
};

export type genericWeapon = baseWeapon & heated & defensive & {Type: "Generic"};
export type missileWeapon = baseWeapon & heated & defensive & {Type: "Missile"};
export type rammingWeapon = baseWeapon & heated & {Type: "Ramming"};
export type destructiveWeapon = baseWeapon & {Type: "Destruct"};
export type weapon = genericWeapon | missileWeapon | rammingWeapon | destructiveWeapon;
export type weaponWithCount = weapon & {fireCount: number};
//#endregion

//#region Utility
type baseUtil = {
    Name: string,
    Wrot?: number, //Rotation bounds

    FireRate: number, //Uses per phase
    EnergyCost: number, //Energy cost
    HeatLoad: number //Heat generated per use
    aType: string //Ammo type
}

type ranged = {Wran: number}; //Maximum effective Range

export type healingUtil = baseUtil & ranged & {Type: "Healing", Heal: number};
export type resupplyingUtil = baseUtil & ranged & {Type: "Resupplying", dType: string};
export type energyUtil = baseUtil & ranged & {Type: "Energy"};
export type deployingUtil = baseUtil & {Type: "Deploying", Deploys: number};
export type statusUtil = baseUtil & ranged & {
    Type: "Status", 
    Status: [target: "Self" | "Target", status: status],
    Whit: number
};
export type util = healingUtil | resupplyingUtil | energyUtil | deployingUtil | statusUtil;
export type utilWithCount = util & {fireCount: number};

export type controlList = [
    "Intercept",
    ...[weapon | shield, boolean][],
    "Exit"
];
//#endregion

export type ammo = {
    Name: string,
    sCount?: number, //Amount of ammo when deployed
    MCount: number  //Maximum amount of ammo
};

export type hit = "Miss" | "Intercept" | "Hit";
export const hitOptions: hit[] = ["Miss", "Intercept", "Hit"];
export const hitNumbers: {[a in hit]: number} = {Miss: 0, Intercept: 1, Hit: 2};

type stealth = {Cloak: false} | {Cloak: true, StealthLevel: 0, StealthCost: 0};

export type shield = stealth & {
    Name: string,
    Type: "Default",
    Intercept: number, 
    MaxDamage: number, 
    DamageRegen: number,
    EnergyCost: number, 
    HeatLoad: number,
};

export type player = {
    User: {
        Username: string,
        ID: string,
        exoticFactions: boolean,
        controls: string[],
        colorSet: string[],
        DefaultFaction: string,
    },
    colorSet: [],
    Faction: string,
    Name: string,
    Battles: [],
    Vehicles: {
        InBattle: vehicle[],
        OnBoard: vehicle[],
        Healing: vehicle[],
    },
    Money: number,
};

export type faction = {
    Name: string,
    Color: string,
    Moves: string[],
    Players: string[],
    Leader: number,
    Treasurers: number[],
    Population: number,
    Regions: {
        Earth: string[],
        Cities: string[]
    },
    Economy: {
        Treasury: object,
        LastUpdated: Date,
        Income: object,
        BuildingTypes: object[],
        VehicleTypes: baseVehicle[],
        OwnedBuildings: object[],
        OwnedVehicles: vehicle[],
    },
    Technology: {
        Technologies: object[],
        LastUpdated: Date,
        TechPoints: number,
        TechIncome: number,
        
    },
};

export type singleBattle = {
    Title: string,
    Players: player[],
    Losses: vehicle[],
    Retreated: vehicle[],
    Vehicles: vehicle[],
    Moves: {Data: string[], Turns: number[]} & {[key: string]: string[]},
    Stage: number,
    Map: "Space",
    Type: {Type: "Unique", Discoverable: false, Joinable: false, Online: false},
    PlayerCount: number,
    Display: vehicle[][][],
    Size: {OverallSize: number, StepSizes: number[]},
};

export type display = vehicle[][][];
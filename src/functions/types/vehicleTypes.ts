import { ammo, locationVector, rotationVector, shield, sizeVector, status, util, utilWithCount, velocityVector, weapon, weaponWithCount } from "./types";

export type shape = "Rect" | "Square" | "Octagon" | "Circle";

type Ownership = {
    Player: string
    vID: number
};

type VehicleType = {
    Faction: string, 
    Class: string, 
    Realm: string[]
};

type baseAppearance = {
    Img: false | string, 
    Shape: shape, 
    Size: sizeVector
};

type Appearance = baseAppearance & {
    area: locationVector[], 
    name: string, 
    visible: boolean
};

type State = {
    hp: number,
    energy: number, 
    heat: number,
    intercept: number,
    hasMoved: boolean, 
    hasFired: boolean,
    statuses: status[]
    modifiers: modifiers
};

export type TrueStats = {
    MaxHeat: number, CoolingRate: number, OverHeat: number,
    MaxEnergy: number, GenEnergy: number, MovEnergy: number,
    Mov: number, Mnv: number, FMov?: number,
    StealthLevel?: number, ScannerLevel?: number,
    MaxHP: number, Acc: number, Def: number,
    Communication?: number, 
    Intercept?: number
};

export type modifiers = { [key in keyof TrueStats]: [summand: number, multiplier: number]};

export type Stats = {
    TrueStats: TrueStats,
} & TrueStats;

type group<t> = {
    Data: t[], fireCount: number[],
};

export type baseVehicle = {
    Type: VehicleType,
    Appearance: baseAppearance,
    Stats: TrueStats,
    Weap: weapon[],
    Utils: util[],
    Ammo: ammo[],
    Defenses: {
        Shields: shield[]
    },
}

export type vehicle = {
    Ownership: Ownership,
    Type: VehicleType,
    Appearance: Appearance,
    State: State,
    Stats: Stats,
    Weap: group<weapon> & {Weap (i: number): weaponWithCount},
    Utils: group<util> & {Util (i: number): utilWithCount},
    Ammo: {
        Data: ammo[], count: number[],
        Ammo (i: number): ammo & {count: number},
    },
    Defenses: {
        Weapons: number[], wActive: boolean[],
        Shields: shield[], sDamage: number[], sActive: boolean[],
    },

    Location: {
        nextLocation: locationVector, location: locationVector,
        rotation: rotationVector, parent: string
    },

    Velocity: {
        deltaVelocity: velocityVector, velocity: velocityVector
    }
};

export const isVehicle = (a: unknown): a is vehicle => {
    if (!a || typeof a !== "object") return false;
    return "Ownership" in a && "Weap" in a;
};
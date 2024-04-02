import { locationVector, rotationVector, util, velocityVector, weapon } from "./types";
import { baseVehicle, vehicle } from "./vehicleTypes";

export type region = {
    lx: number, ly: number, 
    hx: number, hy: number, 
    xStep: number, yStep: number
};

export type GridInfo = {
    OverallSize: number, 
    StepSizes: number[]
};

export type cursorModes = "Move" | "Menu" | "Rotate" | "Function";

export type cursorDataFunc = {
    (c: cursor, v: velocityVector, moveTo?: boolean): cursor
    data: unknown
};

export type cursor = {
    loc: locationVector,
    parent: string,
    rot: rotationVector,
    menu: number,
    data: string[] | vehicle[] | baseVehicle[] | weapon[] | util[] | cursorDataFunc | undefined,
    grid: GridInfo,
    region: region,
    mode: cursorModes
};

export type setCursor = (cursor: cursor) => void;

export const isStringArray = (a: cursor["data"]): a is string[] => 
    Array.isArray(a) && typeof a[0] === "string";
export const isVehicleArray = (a: cursor["data"]): a is vehicle[] | baseVehicle[] => 
    Array.isArray(a) && typeof a[0] === "object" && "State" in a[0];
export const isWeaponArray = (a: cursor["data"]): a is weapon[] => 
    Array.isArray(a) && typeof a[0] === "object" && "Watk" in a[0];
export const isUtilArray = (a: cursor["data"]): a is util[] => 
    Array.isArray(a) && typeof a[0] === "object" && !("Watk" in a[0]);
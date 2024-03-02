import { locationVector, rotationVector, utilWithCount, velocityVector, weaponWithCount } from "./types";
import { vehicle } from "./vehicleTypes";

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

export type cursor = {
    loc: locationVector,
    parent: string,
    rot: rotationVector,
    menu: number,
    data: string[] | vehicle[] | weaponWithCount[] | utilWithCount[] | ((c: cursor, v: velocityVector) => cursor) | undefined,
    grid: GridInfo,
    region: region,
    mode: cursorModes
};

export type setCursor = (cursor: cursor) => void;

export const isStringArray = (a: cursor["data"]): a is string[] => 
    Array.isArray(a) && typeof a[0] === "string";
export const isVehicleArray = (a: cursor["data"]): a is vehicle[] => 
    Array.isArray(a) && typeof a[0] === "object" && "State" in a[0];
export const isWeaponArray = (a: cursor["data"]): a is weaponWithCount[] => 
    Array.isArray(a) && typeof a[0] === "object" && "Watk" in a[0];
export const isUtilArray = (a: cursor["data"]): a is utilWithCount[] => 
    Array.isArray(a) && typeof a[0] === "object" && !("Watk" in a[0]);
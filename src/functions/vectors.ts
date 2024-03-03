import { funcOnArrays, map, reduce} from "./functions";
import { velocityVector } from "./types/types";

export const magnitude = (vec: number[]) => Math.sqrt(vec.reduce((a: number, val: number) => a + val**2, 0));

export const addVectors = <T extends {map}>(a: T, b: T): T => a.map((v, i) => v + b[i]);

export const sub = funcOnArrays((a: number, b: number) => a - b);

const mult = funcOnArrays((a: number, b: number) => a*b);

export const unitVec = (vec: number[]): number[] => {
    const mag = magnitude(vec);
    return map((val: number) => (val/mag), vec) as number[];
};

export const trueDist = (v1: number[], v2: number[]) =>  magnitude(sub(v1, v2));

export const distance = (v1: number[], v2: number[]) => Math.round(trueDist(v1, v2));

export const dotProduct = (vec1: number[], vec2: number[]): number => reduce((a, val) => a + val, mult(vec1, vec2), 0) as number;

export const unitDotProduct = (vec1: number[], vec2: number[]): number => dotProduct(unitVec(vec1), unitVec(vec2));

export const shiftVector = (vector: velocityVector, offset: number) => vector.map((v) => v + offset);

export const multiplyVector = <T extends {map}>(vector: T, factor: number) => vector.map((v) => v*factor) as T;

export const divideVector = (vector: velocityVector, factor: number) => vector.map((v) => v/factor);

export const intDivideVector = (vector: velocityVector, factor: number) => map(Math.floor, divideVector(vector, factor));

export const modVector = <T extends {map}>(vector: T, factor: number) => vector.map((v) => v%factor);
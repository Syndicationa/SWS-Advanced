import { compose, funcOnArrays, map, reduce} from "./functions.mjs";

export const magnitude = vec => Math.sqrt(reduce((a, val) => a + val**2, vec, 0));

export const sub = funcOnArrays((a, b) => a - b);

const mult = funcOnArrays((a, b) => a*b);

export const unitVec = (vec) => {
    const mag = magnitude(vec);
    return map((val) => val/mag, vec);
}

export const trueDist = compose(magnitude, sub);

export const distance = compose(Math.round, trueDist);

export const dotProduct = (vec1, vec2) => reduce((a, val) => a + val, mult(vec1, vec2), 0);

export const unitDotProduct = (vec1, vec2) => dotProduct(unitVec(vec1), unitVec(vec2));
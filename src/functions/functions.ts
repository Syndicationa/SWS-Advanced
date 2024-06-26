import { Curry, equalFunc, mergeFunc, f } from "./types/FunctionTypes";
import { locationVector, rotationVector, sizeVector } from "./types/types";

export const clone = (obj: object, asObject = false) => {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    let copy;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = obj.map((value) => clone(value, asObject));
        return copy;
    }

    /*if (obj instanceof Player && !asObject) {
		return new Player(obj, obj.grSize);
	}

	if (obj instanceof Ship && !asObject) {
		return new Ship(obj.player, obj.number, obj, obj.faction, obj.type, [...obj.sector, obj.position], obj.rot, obj.grSize);
	}*/

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (const attr in obj) {
            if (!("prototype" in obj && typeof obj.prototype === "object" && obj.prototype !== null && "hasOwnProperty" in obj.prototype)) throw Error("I hope");
            if (obj.prototype.hasOwnProperty.call(attr)) copy[attr] = clone(obj[attr], asObject);
        }
        return {...obj, ...copy};
    }

    //throw new Error("Unable to copy obj! Its type isn't supported.");
};

export const compareArray = (arr1: Array<unknown>, arr2: Array<unknown>, length?: number): boolean => {
    if (!length) {
        length = arr1.length;
    }
    const array1 = arr1.slice(0,length);
    const array2 = arr2.slice(0,length);
    return JSON.stringify(array1) === JSON.stringify(array2);
};

export const rectangle = (location: locationVector, size: sizeVector, rot: rotationVector): locationVector[] => {
    //if (size.length !== 2) return;
    const {PI: pi, cos, sin, atan2, round, sign} = Math;

    const angle = 4*atan2(-rot[0], rot[1])/pi + 4;
    
    const [width, height] = size;
    const radAngle = pi*((8 - angle) % 8 / 4);

    const widthEven = width % 2 === 0;
    const heightEven = height % 2 === 0;
    const sizeEven = widthEven || heightEven;
    const wE = widthEven ? 1:0;
    const hE = !heightEven ? 1:0;
    const centerAngle = pi*(angle - (wE + hE))/4;
    const centerOffsetX = 0.5 + 0.5*(sizeEven ? (sign(round(sin(centerAngle)*1000))): 0);
    const centerOffsetY = 0.5 + 0.5*(sizeEven ? (sign(round(cos(centerAngle)*1000))): 0);

    const center: locationVector = [location[0] + centerOffsetX, location[1] + centerOffsetY];
    
    const pX = (cX: number, w: number, h: number, rot: number) => cX + 0.5*(w*cos(rot) - h*sin(rot));
    const pY = (cY: number, w: number, h: number, rot: number) => cY + 0.5*(w*sin(rot) + h*cos(rot));

    const point = ([cX, cY]: locationVector, w: number, h: number, rot: number): locationVector => [pX(cX, w, h, rot), pY(cY, w, h, rot)];

    return [point(center, -width, -height, radAngle),
        point(center, width, -height, radAngle),
        point(center, width, height, radAngle),
        point(center, -width, height, radAngle)];
};

export const isInRectangle = (point: locationVector, rectanglePoints: locationVector[]) => {
    return rectanglePoints.every((point1, index, array) => {
        const point2 = array[(index + 1) % 4];
        const d = (point2[0] - point1[0]) * (point[1] - point1[1]) - (point[0] - point1[0]) * (point2[1] - point1[1]);
        return d >= 0;
    });
};

export const absSum = (v1: number = 0, v2: number = 0) => {
    return Math.abs(v1) + Math.abs(v2);
};

//main- Array of Objects
//supplement- Array of Items to add to objects
//name- Name of key of the items
export const composeObjArr = (main: object[], supplement: Array<unknown>, name: string) => {
    return main.map((obj, i) => {return {...obj, [name]: supplement[i]};});
};

export const last = <T>(arr: T[]) => arr.slice(-1);

export const first = <T>(arr: T[]) => arr[0];

export const pop = <T>(arr: T[]) => arr.slice(0,-1);

export const pull = <T>(arr: T[]) => arr.slice(1);

export const split = <T>(arr: T[], position: number) => [arr.slice(0, position), arr.slice(position)];

type ObjectMappingFunction<O, R> = (value: O[keyof O], key?: string, object?: O) => R;
type ret<O, R> = {[key in keyof O]: R};

export const objectMap = <O extends object>(obj: O) => <R>(func: ObjectMappingFunction<O, R>): ret<O, R> => 
    Object.keys(obj).reduce(
        (acc, key) => {return {...acc, [key]: func(obj[key as keyof O], key, obj)};}
        , {} as ret<O, R>);

export const replaceInArray = <T>(arr: T[], index: number, info:T) => 
    (index >= arr.length || index < 0) ? arr:[...arr.slice(0,index), info, ...arr.slice(index + 1)];

export const funcOnArrays = <a, b, c>(func: (a: a, b: b) => c) => (arr1: a[], arr2: b[]):c[] => arr1.map((val, i) => func(val, arr2[i]));

export const sumArrays = funcOnArrays((a: number, b: number) => a+b);

export const maxOnArrays = funcOnArrays(Math.max);

export const minOnArrays = funcOnArrays(Math.min);

export const negateArray = arr => arr.map((val) => -val);

export const compose = (...funcList) => (...i) => funcList.reduceRight((acc, f) => {
    try {
        if (!(acc instanceof Array)) throw Error();
        return f(...acc);
    } catch {
        return f(acc);
    }
}, i);

export const pipe = (...funcList) => (...i) => funcList.reduce((acc, f) => {
    try {
        if (!(acc instanceof Array)) throw Error();
        return f(...acc);
    } catch {
        return f(acc);
    }
}, i);

export const curry = <T extends unknown[], R>(func: (...args: T) => R, length: number = func.length): Curry<T, R> => {
    const curried = (...args: unknown[]): R | Curry<T, R> => {
        if (args.length >= length) return func(...(args as T));
        const nextFunction = (...nextArgs: unknown[]) => curried(...args, ...nextArgs);
        nextFunction.data = [...args];
        return nextFunction as Curry<T, R>;
    };
    return curried as Curry<T, R>;
};

export const map = curry(<T, Y>(func: (item: T, index?: number, arr?: T[]) => Y, arr: T[]): Y[] => arr.map(func));

export const filter = curry(<T>(func: (item: T, index?: number, arr?: T[]) => boolean, arr: T[]): T[] => arr.filter(func));

export const reduce = curry(<T, X>(func: (accumulator: X,item: T, index?: number, arr?: T[]) => X, arr: T[], start: X) => arr.reduce(func, start));

export const indexInArray = <T>(equFunc: equalFunc<T>, arr: T[], val: T): number => arr.findIndex((v) => equFunc(v, val));

export const removeDuplicates = <T>(equFunc: equalFunc<T>, mergeFunc: mergeFunc<T>, arr: T[]) => reduce((acc, v) => {
    const i = indexInArray(equFunc, acc, v);
    if (i === -1) return [...acc, v];
    return replaceInArray(acc, i, mergeFunc(acc[i], v));
},arr,[]);

export const mergeArrays = curry(<T>(equFunc: equalFunc<T>, mergeFunc: mergeFunc<T>, arr1: T[], arr2: T[]) => 
    removeDuplicates(equFunc, mergeFunc, [...arr1, ...arr2]));

export const reverseArray = <t>(arr: t[][]) => arr[0].map((_,i) => arr.map((v) => v[i]));

export const sliceReduce = curry(<T>(fn: f, arr: T[], [ls, hs]: [low: number, high: number]) => 
    arr.slice(ls, hs).reduce(fn, []));

export const minMax = (number: number, lowerBound: number, higherBound: number): number => 
    Math.min(Math.max(number, lowerBound), higherBound);

export const inBounds = (number: number, lowerBound: number, higherBound: number): boolean => 
    (number >= lowerBound) && (number < higherBound);

export const rotate = (rotation: rotationVector, direction: number | rotationVector): rotationVector => {
    const {round, cos, sin, PI: pi, atan2} = Math;
    const [xr,yr] = rotation;
    const trueDirection = Array.isArray(direction) 
        ? ((atan2(-direction[0],direction[1])/pi)*4 + 12) % 8
        : direction % 8;
    const num = ((atan2(-xr,yr)/pi)*4 + 12 + trueDirection) % 8;
    const x = round(sin(num*pi/4));
    const y = -round(cos(num*pi/4));
    return [x,y];
};
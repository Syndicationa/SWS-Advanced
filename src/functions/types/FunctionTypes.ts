import { attack } from "../defs/vehicle/attack";
import { utility } from "../defs/vehicle/utility";

/* eslint @typescript-eslint/no-unused-vars: off */
export type f = (...args: unknown[]) => unknown;
export type equalFunc<T> = (a: T, b: T) => boolean;
export type mergeFunc<T> = (a: T, b: T) => T; 

export type Slice<A extends unknown[], B extends unknown[]> = 
    A extends [infer _, ...rest: infer R] ? 
        B extends [infer _, ...rest: infer BR] ?
            Slice<R, BR>
            :
            A
        : B;

export type Curry<T extends unknown[], R> = {data: unknown[]} &
    (<U extends unknown[]>(...args: U) =>
        U["length"] extends T["length"]
        ? R
        : Curry<Slice<T, U>, R>);

export type PartialArray<T extends unknown[]> = 
    T extends [...start: infer S, last: infer L] ? 
        PartialArray<S> | T
        :
        T

export type PartialArgs<F extends f> = PartialArray<Parameters<F> > | Parameters<F>;

export type currentArgs = PartialArgs<typeof attack> | PartialArgs<typeof utility>;

export const isUtilityArgs = (argArray: currentArgs): argArray is PartialArgs<typeof utility> => argArray.length === 0 || !Array.isArray(argArray[0]);
export const isAttackArgs  = (argArray: currentArgs): argArray is PartialArgs<typeof attack>  => argArray.length === 0 ||  Array.isArray(argArray[0]);

export const hasRequiredArgs = <F extends f>(func: F, argArray: PartialArgs<F>): argArray is Parameters<F> => argArray.length >= func.length;
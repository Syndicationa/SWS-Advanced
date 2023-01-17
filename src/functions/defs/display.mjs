import { compareArray, sliceReduce, map } from "../functions.mjs"

//Creates a display struct
export const createDisplay = (size = [1,1]) => (shipArray) => {
    const arr = map(() => 
                    map(() => [], new Array(size[1]).fill(0)), 
                new Array(size[0]).fill(0));
    return map((yarr, x) => 
                map((p,y) => {
                    return shipArray.filter((ship) => {
                        return inLocation([x, y], ship.Appearance.area);
                    })
                }, 
                yarr), 
            arr)
}

export const getFromDisp = (display = [[[]]], [lx, ly], [hx, hy]) =>
    sliceReduce(
        (acc, yarr) => 
            [...acc, ...sliceReduce((a,v) => [...a, ...v], yarr, [ly, hy])],
        display,
        [lx, hx]
        );

const inLocation = (loc, area) => area.some((aloc) => compareArray(loc, aloc));

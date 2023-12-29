import { compareArray, sliceReduce, map } from "../functions.mjs"

//Creates a display struct
export const createDisplay = (size = 1) => (shipArray = []) => {
    console.log(shipArray)
    const arr = map(() => 
                    map(() => [], new Array(size).fill(0)), 
                new Array(size).fill(0));
    shipArray.forEach((ship) => {
        ship.Appearance.area.forEach(([x,y]) => {try {arr[x][y].push(ship)} catch (e) {}})
    });
    return arr;
}

export const getFromDisp = (display = [[[]]], [lx, ly], [hx, hy]) =>
    sliceReduce(
        (acc, yarr) => 
            [...acc, ...sliceReduce((a,v) => [...a, ...v], yarr, [ly, hy])],
        display,
        [lx, hx]
        );


import { inBounds, map } from "../functions.mjs";

//Creates a display struct
export const createDisplay = (size = 1) => (shipArray = []) => {
    const arr = map(() => 
        map(() => [], new Array(size).fill(0)), 
    new Array(size).fill(0));
    shipArray.forEach((ship) => {
        ship.Appearance.area.forEach(([x,y]) => {
            if (inBounds(x, 0, size) && inBounds(y, 0, size)) arr[x][y].push(ship);
        });
    });
    return arr;
};

export const getFromDisp = (display = [[[]]], [lx, ly], [hx, hy]) =>
    display.slice(lx, hx).map(arr => arr.slice(ly, hy)).flat(2);

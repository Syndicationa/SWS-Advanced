import { inBounds, map } from "../functions";
import { display, locationVector } from "../types/types";
import { vehicle } from "../types/vehicleTypes";

//Creates a display struct
export const createDisplay = (size: number = 1) => (shipArray: vehicle[] = []): display => {
    const arr = map(() => 
        map(() => [], new Array(size).fill(0)), 
    new Array(size).fill(0)) as display;
    shipArray.forEach((ship) => {
        ship.Appearance.area.forEach(([x,y]) => {
            if (inBounds(x, 0, size) && inBounds(y, 0, size)) arr[x][y].push(ship);
        });
    });
    return arr;
};

export const getFromDisp = (display: display, [lx, ly]: locationVector, [hx, hy]: locationVector): vehicle[] =>
    display.slice(lx, hx).map(arr => arr.slice(ly, hy)).flat(2);

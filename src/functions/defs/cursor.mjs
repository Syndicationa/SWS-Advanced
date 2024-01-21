import { first, last, maxOnArrays, minMax, minOnArrays, pop, pull, rotate, sumArrays } from "../functions.mjs";
import { intDivideVector, modVector, multiplyVector } from "../vectors.mjs";
import { vehicleTemplate } from "./templates.mjs";
import { canMove, generateVelocity, movingShip } from "./vehicle/move.mjs";

const defaultRegion = {lx: 0, ly: 0, hx: 64, hy: 64, xStep: 8, yStep: 8};
const defaultGridInfo = {OverallSize: 64, StepSizes: [8, 1]};
const generateRegion = (gridInfo = defaultGridInfo) => {
    const {OverallSize, StepSizes} = gridInfo;
    return {lx: 0, ly: 0, hx: OverallSize - 1, hy: OverallSize -1 , xStep: StepSizes[0], yStep: StepSizes[0]};
};
export const cursorModes = ["Move", "Menu", "Rotate"];

export const cursorGenerator = (gridInfo = defaultGridInfo, parent = "") => {
    return {
        loc: [0,0],
        parent,
        rot: [0,-1],
        menu: 0,
        data: [0,0],
        grid: gridInfo,
        region: generateRegion(gridInfo),
        mode: "Move"
    };
};

const defaultVector = [0,0];

const scaleVector = (region = defaultRegion, vec = defaultVector) => {
    const [x, y] = vec;
    return [x*region.xStep, y*region.yStep];
};

const adjustCursorLocation = (cursor = cursorGenerator()) => {
    const {loc: location, grid:gridInfo, region} = cursor;
    const {lx, hx, ly, hy, yStep} = region;
    const {OverallSize, StepSizes} = gridInfo;
    const grSize = getGridSize(gridInfo)[StepSizes.find((a) => a === yStep)];
    const boxedLocation = minOnArrays(maxOnArrays(location, [0,0]), [OverallSize - 1, OverallSize - 1]);
    let newRegion = region;
    if (boxedLocation[0] < lx) {
        newRegion = {...newRegion, lx: lx - grSize, hx: lx - 1,};
    } else if (boxedLocation[0] > hx) {
        newRegion = {...newRegion, lx: hx + 1, hx: hx + grSize, };
    }

    if (boxedLocation[1] < ly) {
        newRegion = {...newRegion, ly: ly - grSize, hy: ly - 1,};
    } else if (boxedLocation[1] > hy) {
        newRegion = {...newRegion, ly: hy + 1, hy: hy + grSize, };
    }

    return {...cursor, loc: boxedLocation, region: newRegion};
};

export const convertLocation = (gridLocation = [[0,0]], stepSizes = [0,0]) => {
    return gridLocation.reduce((a, vector, i) => sumArrays(a, multiplyVector(vector, stepSizes[i])), [0,0]);
};

export const getGridSize = ({OverallSize, StepSizes}) => pop(StepSizes).reduce((a, v) => [...pop(a),last(a)/v, v],[OverallSize]);

export const zoom = (cursor = cursorGenerator(), direction = 0) => {
    const {loc: location, grid:gridInfo, region} = cursor;
    const {StepSizes} = gridInfo;
    const originalIndex = StepSizes.findIndex((a) => a === region.yStep);
    const index = minMax(originalIndex + direction, 0, StepSizes.length - 1);
    
    if (index === originalIndex) return cursor;

    const grSize = getGridSize(gridInfo);
    const gridLocation = pop(grSize).reduceRight((a, v) => {
        const f = first(a);
        return [intDivideVector(f, v), modVector(f, v), ...pull(a)];
    }, [location]);

    const lowerLocation = gridLocation.map((v, i) => i < index ? v:[0,0]);
    const higherLocation = gridLocation.map((v, i) => i < index ? v:[grSize[i] - 1,grSize[i] - 1]);

    const [lx, ly] = convertLocation(lowerLocation, StepSizes);
    const [hx, hy] = convertLocation(higherLocation, StepSizes);


    return {...cursor, region: {lx, ly, hx, hy, xStep: StepSizes[index], yStep: StepSizes[index]}};
};

const changeSelection = (cursor = cursorGenerator(), vector = defaultVector) => {
    if (vector[0] !== 0 || Math.abs(vector[1]) !== 1) return cursor;
    const nMenu = (cursor.menu + vector[1] + cursor.data.length) % cursor.data.length;
    return {...cursor, menu: nMenu};
};

const rotateCursor = (cursor = cursorGenerator(), vector = defaultVector) => {
    if (vector[1] !== 0 || Math.abs(vector[0]) !== 1) return cursor;
    return {...cursor, rot: rotate(cursor.rot, vector[0])};
};

export const vehicleMovementCursor = 
    (vehicle = vehicleTemplate, setVehicle, moveRatio = 1) => 
        (cursor = cursorGenerator(), vector = defaultVector) => {
            if (!canMove({...vehicle, Stats: {...vehicle.Stats, Mov: Math.round(vehicle.Stats.Mov*moveRatio)}}, vector)) return cursor;
            const v = generateVelocity(vehicle, vector);
            const movedVehicle = movingShip(vehicle, v);
            setVehicle(movedVehicle);

            const [rotation, movY] = vector;
	    const relativeVel = vehicle.Location.rotation.map((v) => v*-movY);
            return {
                ...cursor, 
                loc: sumArrays(cursor.loc, relativeVel), 
                rot: rotate(cursor.rot, rotation),
                data: vehicleMovementCursor(movedVehicle, setVehicle)
            };
        };

export const moveCursor = (cursor = cursorGenerator(), vector = defaultVector) => {
    if (cursor.mode === "Menu") return changeSelection(cursor, vector);
    if (cursor.mode === "Rotate") return rotateCursor(cursor, vector);
    if (cursor.mode === "Function") return cursor.data(cursor, vector);
    const nLoc = sumArrays(cursor.loc, scaleVector(cursor.region, vector));
    return adjustCursorLocation({...cursor, loc: nLoc});
};

export const fixCursorPosition = (cursor = cursorGenerator(), position = defaultVector) => {
    const positionOnSubgrid = cursor.loc.map(a => a % cursor.region.yStep);
    return sumArrays(scaleVector(cursor.region, position), sumArrays(positionOnSubgrid, [cursor.region.lx, cursor.region.ly]));
};

export const moveCursorToPosition = (cursor = cursorGenerator(), position = defaultVector) => {
    if (cursor.mode !== "Move") return cursor;
    return {...cursor, loc: fixCursorPosition(cursor, position)};
};
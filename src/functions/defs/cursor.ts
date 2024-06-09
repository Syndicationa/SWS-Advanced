import { first, last, maxOnArrays, minMax, minOnArrays, pop, pull, rotate, sumArrays } from "../functions";
import { GridInfo, cursor, region } from "../types/cursorTypes";
import { locationVector, velocityVector } from "../types/types";
import { vehicle } from "../types/vehicleTypes";
import { addVectors, intDivideVector, modVector, multiplyVector, subVectors } from "../vectors";
import { canMove, canMoveToLocation, generateVelocity, generateVelocityFromLocation, movingShip } from "./vehicle/move";

const generateRegion = (gridInfo: GridInfo) => {
    const {OverallSize, StepSizes} = gridInfo;
    return {lx: 0, ly: 0, hx: OverallSize - 1, hy: OverallSize -1 , xStep: StepSizes[0], yStep: StepSizes[0]};
};

export const cursorGenerator = (gridInfo: GridInfo, parent: string = ""): cursor => {
    return {
        loc: [0,0],
        parent,
        rot: [0,-1],
        menu: 0,
        data: undefined,
        grid: gridInfo,
        region: generateRegion(gridInfo),
        mode: "Move"
    };
};

const scaleVector = (region: region, vec: locationVector): locationVector => {
    const [x, y] = vec;
    return [x*region.xStep, y*region.yStep];
};

const adjustCursorLocation = (cursor: cursor): cursor => {
    const {loc: location, grid:gridInfo, region} = cursor;
    const {lx, hx, ly, hy, yStep} = region;
    const {OverallSize, StepSizes} = gridInfo;
    const grSize = getGridSize(gridInfo)[StepSizes.find((a) => a === yStep) ?? 0];
    const boxedLocation = minOnArrays(maxOnArrays(location, [0,0]), [OverallSize - 1, OverallSize - 1]) as locationVector;

    // const lowerBound = subVectors(location, [grSize / 2, grSize / 2]);
    // const upperBound = addVectors(location, [grSize / 2, grSize / 2]);

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

export const convertLocation = (gridLocation: locationVector[], stepSizes: number[]) => {
    return gridLocation.reduce((a, vector, i) => sumArrays(a, multiplyVector(vector, stepSizes[i])), [0,0]);
};

export const getGridSize = ({OverallSize, StepSizes}: GridInfo) => pop(StepSizes).reduce((a, v) => [...pop(a),last(a)[0]/v, v],[OverallSize]);

export const zoom = (cursor: cursor, direction: number) => {
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

const changeSelection = (cursor: cursor, vector: velocityVector) => {
    if (vector[0] !== 0 || Math.abs(vector[1]) !== 1) return cursor;
    if (!Array.isArray(cursor.data)) return cursor;
    const nMenu = (cursor.menu + vector[1] + cursor.data.length) % cursor.data.length;
    return {...cursor, menu: nMenu};
};

const rotateCursor = (cursor: cursor, vector: velocityVector) => {
    if (vector[1] !== 0 || Math.abs(vector[0]) !== 1) return cursor;
    return {...cursor, rot: rotate(cursor.rot, vector[0])};
};

export const vehicleMovementCursor = (vehicle: vehicle, setVehicle: (v: vehicle) => void, utility: boolean = false) => {
    const move = (cursor: cursor, vector: velocityVector, moveTo: boolean = false): cursor => {
        
        if (!moveTo && !canMove(vehicle, vector, utility)) return cursor;
        if (moveTo && !canMoveToLocation(vehicle, vector, utility)) return cursor;

        const v = !moveTo 
            ? generateVelocity(vehicle, vector)
            : generateVelocityFromLocation(vehicle, subVectors(vector, [cursor.region.lx,cursor.region.ly]), utility);
        
        const movedVehicle = movingShip(vehicle, v, utility);
        setVehicle(movedVehicle);

        const rotation = !moveTo ? vector[0] : 0;
        return adjustCursorLocation({
            ...cursor, 
            loc: movedVehicle.Location.nextLocation,
            rot: rotate(cursor.rot, rotation),
            data: vehicleMovementCursor(movedVehicle, setVehicle, utility)
        });
    };
    move.data = vehicle;
    return move;
};

export const utilityControlCursor = (vehicle: vehicle, setVehicle: (v: vehicle) => void) => {
    const move = (cursor: cursor, vector: velocityVector): cursor => {
        if (vector[0] === 0 && vector[1] === 0) return cursor;
        if (vector[0] !== 0 && vector[1] === 0) {
            if (cursor.menu === 0) {
                const intercept = minMax(vehicle.State.intercept + vector[0], 0, 10);
                console.log(intercept);
                const newVehicle = {...vehicle, State: {...vehicle.State, intercept}};
                setVehicle(newVehicle);
                return {
                    ...cursor,
                    data: utilityControlCursor(newVehicle, setVehicle)
                };
            }
            return cursor;
        }
        const Def = vehicle.Defenses;
        const length = Def.sActive.length + Def.wActive.length + 2;

        const menu = (cursor.menu + vector[1] + length) % length;
        
        return {...cursor, menu};
    };
    move.data = vehicle;
    return move;
};

export const moveCursor = (cursor: cursor, vector: velocityVector) => {
    if (cursor.mode === "Menu") return changeSelection(cursor, vector);
    if (cursor.mode === "Rotate") return rotateCursor(cursor, vector);
    if (typeof cursor.data === "function") return cursor.data(cursor, vector);
    const nLoc = addVectors(cursor.loc, scaleVector(cursor.region, vector));
    return adjustCursorLocation({...cursor, loc: nLoc});
};

export const fixCursorPosition = (cursor: cursor, position: locationVector): locationVector => {
    const positionOnSubgrid = modVector(cursor.loc, cursor.region.yStep);
    return addVectors(scaleVector(cursor.region, position), addVectors(positionOnSubgrid, [cursor.region.lx, cursor.region.ly]));
};

export const moveCursorToPosition = (cursor: cursor, position: locationVector): cursor => {
    if (typeof cursor.data === "function") return cursor.data(cursor, position, true);
    if (cursor.mode !== "Move") return cursor;
    return {...cursor, loc: fixCursorPosition(cursor, position)};
};
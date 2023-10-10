import { first, last, maxOnArrays, minMax, minOnArrays, pop, pull, sumArrays } from "../functions.mjs";
import { intDivideVector, modVector, multiplyVector } from "../vectors.mjs";

const defaultRegion = {lx: 0, ly: 0, hx: 64, hy: 64, xStep: 8, yStep: 8};
const defaultGridInfo = {OverallSize: 64, StepSizes: [8, 1]}
const generateRegion = (gridInfo = defaultGridInfo) => {
    const {OverallSize, StepSizes} = gridInfo;
    return {lx: 0, ly: 0, hx: OverallSize - 1, hy: OverallSize -1 , xStep: StepSizes[0], yStep: StepSizes[0]}
}
export const cursorModes = ["Move", "Menu"];

export const cursorGenerator = (gridInfo = defaultGridInfo, parent = "") => {
    return {
        loc: [0,0],
        parent,
        rot: -1,
        menu: -1,
        data: [0,0],
        grid: gridInfo,
        region: generateRegion(gridInfo),
        mode: "Move"
    }
}

const defaultVector = [0,0]

const scaleVector = (region = defaultRegion, vec = defaultVector) => {
    const [x, y] = vec;
    return [x*region.xStep, y*region.yStep]
}

const adjustCursorLocation = (cursor = cursorGenerator()) => {
    const {loc: location, grid:gridInfo, region} = cursor;
    const {lx, hx, ly, hy, yStep} = region;
    const {OverallSize, StepSizes} = gridInfo;
    const grSize = getGridSize(gridInfo)[StepSizes.find((a) => a === yStep)];
    const boxedLocation = minOnArrays(maxOnArrays(location, [0,0]), [OverallSize - 1, OverallSize - 1]);
    let newRegion = region;
    if (boxedLocation[0] < lx) {
        newRegion = {...newRegion, lx: lx - grSize, hx: lx - 1,}
    } else if (boxedLocation[0] > hx) {
        newRegion = {...newRegion, lx: hx + 1, hx: hx + grSize, };
    }

    if (boxedLocation[1] < ly) {
        newRegion = {...newRegion, ly: ly - grSize, hy: ly - 1,}
    } else if (boxedLocation[1] > hy) {
        newRegion = {...newRegion, ly: hy + 1, hy: hy + grSize, };
    }

    return {...cursor, loc: boxedLocation, region: newRegion};
}

export const convertLocation = (gridLocation = [[0,0]], stepSizes = [0,0]) => {
    return gridLocation.reduce((a, vector, i) => sumArrays(a, multiplyVector(vector, stepSizes[i])), [0,0])
}

export const getGridSize = ({OverallSize, StepSizes}) => pop(StepSizes).reduce((a, v) => [...pop(a),last(a)/v, v],[OverallSize]);

export const zoom = (cursor = cursorGenerator(), direction = 0) => {
    const {loc: location, grid:gridInfo, region} = cursor;
    const {StepSizes} = gridInfo
    const originalIndex = StepSizes.findIndex((a) => a === region.yStep);
    const index = minMax(originalIndex + direction, 0, StepSizes.length - 1);
    
    if (index === originalIndex) return cursor;

    const grSize = getGridSize(gridInfo)
    const gridLocation = pop(grSize).reduceRight((a, v) => {
        const f = first(a);
        return [intDivideVector(f, v), modVector(f, v), ...pull(a)];
    }, [location])

    const lowerLocation = gridLocation.map((v, i) => i < index ? v:[0,0])
    const higherLocation = gridLocation.map((v, i) => i < index ? v:[grSize[i] - 1,grSize[i] - 1])

    const [lx, ly] = convertLocation(lowerLocation, StepSizes);
    const [hx, hy] = convertLocation(higherLocation, StepSizes);


    return {...cursor, region: {lx, ly, hx, hy, xStep: StepSizes[index], yStep: StepSizes[index]}}
}

export const moveCursor = (cursor = cursorGenerator(), vector = defaultVector) => { 
    const nLoc = sumArrays(cursor.loc, scaleVector(cursor.region, vector))
    return adjustCursorLocation({...cursor, loc: nLoc})
}

export const moveCursorToPosition = (cursor = cursorGenerator(), position = defaultVector) => {
    console.log("Moved")
    if (cursor.mode !== "Move") return cursor;
    const positionOnSubgrid = cursor.loc.map(a => a % cursor.region.yStep);
    const nLoc = sumArrays(scaleVector(cursor.region, position), positionOnSubgrid);
    return {...cursor, loc: nLoc}
}
import { convertLocation, cursorGenerator, zoom } from "../functions/defs/cursor.mjs"

const oldPos = [[0,1],[0,7]]
const stepSize = [8,1]

const convertLoc = convertLocation(oldPos, stepSize);

const cursor = cursorGenerator();

const out = zoom({...cursor, loc: [34,34]}, 1)

console.log(out);
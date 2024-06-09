import { sub } from "./vectors.js";

export const inFire = (fLoc = [0,0], tLoc = [0,0], origRot = [0, 0], wRot = 0, off = [0, 0]) => {
    const [xdist, ydist] = sub(tLoc, fLoc);
    const oRot = 4*Math.atan2(-origRot[0], origRot[1])/Math.PI;
    const offset = 4*Math.atan2(-off[0], off[1])/Math.PI;
    
    let trueORot = (oRot + offset) % 8;
    const atanValue = 4*Math.atan2(-xdist, ydist)/Math.PI;
    const xnegative = (xdist > 0 ? 8: 0);
    //True and False rotations
    let tRot = Math.round(atanValue) + xnegative;
    let fRot = Math.round(atanValue - 1/2) + xnegative;
    let intRotation = tRot + fRot - 2*trueORot;
    intRotation = intRotation + (intRotation < 0 ? 16:0);
    const specificRot = atanValue + xnegative;
    const leftCheck = intRotation >= (16 - wRot);
    const rightCheck = intRotation < wRot;
    //The Right check cannot detect if the location is on the rightmost line of the area created by wRot
    const rightLineCheck = specificRot - oRot === wRot/2;

    return leftCheck || rightCheck || rightLineCheck;
};
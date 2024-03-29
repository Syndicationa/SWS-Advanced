import {curry, rotate} from "../../functions.mjs";
import { compareArray, sumArrays } from "../../functions.mjs";
import { distance, magnitude } from "../../vectors.mjs";
import { vehicleTemplate } from "../templates.mjs";
import {updateArea, reArea} from "./vehicle.mjs";


export const canMove = (ship, addVel, utility = false) => {
    const {energy} = ship.State;
    const {MovEnergy, Mov} = ship.Stats;
    const {vel, prevVel} = ship.Velocity;
    const [, movY] = addVel;

    const moveRatio = utility ? .25:1;

    const relativeVel = ship.Location.rotation.map((v) => v*-movY);
    const calculatedVel = sumArrays(vel, relativeVel);

    const acceleration = utility ? magnitude(calculatedVel):distance(prevVel, calculatedVel);

    const remainingEnergy = calculateMovEnergy(energy, MovEnergy*acceleration);

    return (acceleration <= Math.ceil(Mov*moveRatio) && remainingEnergy >= 0);
};

const calculateMovEnergy = (energy = 0, MovEnergy = 0, add = true) => {
    if (add) return energy + MovEnergy;
    return energy - MovEnergy;
};

export const generateVelocity = (Vehicle = vehicleTemplate, addVel = [0,0]) => {
    const {Velocity, Location} = Vehicle;
    const rot = Location.rotation;
    const vel = Velocity.vel;
    const [rotation, movY] = addVel;

    const relativeVel = rot.map((v) => v*-movY);

    const nVel = sumArrays(vel, relativeVel);
    const nRot = rotate(rot, rotation);

    return {vel: nVel, rot: nRot};
};

const mShip = curry((render, Vehicle, Velocity, utility = false) => {
    const {vel, rot} = Velocity;
    const {Velocity: vVel, Location: vLoc, Appearance: vApp, State: vState, Stats: vStat} = Vehicle;

    //Create new objects
    const cVel = {...vVel, vel};
    const cLoc = {...vLoc, loc: sumArrays(vLoc.prevLoc, vel), rotation: rot};
    const cApp = {...vApp, area: []};
    const acc = utility ? magnitude(vel):distance(vVel.prevVel, vel);
    //const cSteps = moveData.length > 0 ? moveData.length: sumArrays(vel, negateArray(vVel.vel)).reduce(absSum, 0);
    const cEnergy = Math.min(vStat.MaxEnergy, calculateMovEnergy(vState.energy, vStat.MovEnergy*acc, true));
    const cState = {...vState, energy: cEnergy};
    const nVehicle = {
        ...Vehicle,
        Velocity: cVel,
        Location: cLoc,
        Appearance: cApp,
        State: cState
    };
    return render(nVehicle);
});

export const movingShip = mShip(updateArea(reArea(true, true)));
export const moveShip = mShip(updateArea(reArea(false, false)));

export const finalizeMove = V => {
    const {Velocity, Location, State, Appearance} = V;
    const hasMoved = compareArray(Velocity.prevVel, Velocity.vel);
    const cState =  {...State, hasFired: false, hasMoved};
    const cVel = {...Velocity, prevVel: Velocity.vel, vel: [0,0]};
    const cLoc = {...Location, prevLoc: Location.loc, loc: Location.loc};
    const cApp = {...Appearance, area: reArea(true, false, cLoc, Appearance.Size)};
    const cVeh = {
        ...V,
        State: cState,
        Velocity: cVel,
        Location: cLoc,
        Appearance: cApp
    };
    return cVeh;
};
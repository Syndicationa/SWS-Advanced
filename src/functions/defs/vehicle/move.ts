import { rotate } from "../../functions";
import { compareArray, sumArrays } from "../../functions";
import { addVectors, distance, magnitude, multiplyVector } from "../../vectors";
import { bothArea, newArea, oldArea } from "./vehicle";

import { vehicle } from "../../types/vehicleTypes";
import { rotationVector, velocityVector } from "../../types/types";


export const canMove = (ship: vehicle, addVel: velocityVector, utility: boolean = false) => {
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

const calculateMovEnergy = (energy: number, MovEnergy: number, add: boolean = true) => {
    if (add) return energy + MovEnergy;
    return energy - MovEnergy;
};

export const generateVelocity = (Vehicle: vehicle, addVel: velocityVector): {vel: velocityVector, rot: rotationVector} => {
    const {Velocity, Location} = Vehicle;
    const rot = Location.rotation;
    const vel = Velocity.vel;
    const [rotation, movY] = addVel;

    const relativeVel = multiplyVector(rot, -movY);

    const nVel = addVectors(vel, relativeVel);
    const nRot = rotate(rot, rotation);

    return {vel: nVel, rot: nRot};
};

const mShip = (render: (v: vehicle) => vehicle) => (Vehicle: vehicle, Velocity: {vel: velocityVector, rot: rotationVector}, utility: boolean = false) => {
    const {vel, rot} = Velocity;
    const {Velocity: vVel, Location: vLoc, Appearance: vApp, State: vState, Stats: vStat} = Vehicle;

    //Create new objects
    const cVel = {...vVel, vel};
    const cLoc = {...vLoc, loc: addVectors(vLoc.prevLoc, vel), rotation: rot};
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
};

export const movingShip = mShip(bothArea);
export const moveShip = mShip(newArea);

export const finalizeMove = (V: vehicle): vehicle => {
    const {Velocity, Location, State} = V;
    const hasMoved = compareArray(Velocity.prevVel, Velocity.vel);
    const cState =  {...State, hasFired: false, hasMoved};
    const veloctiyForUtil: velocityVector = [0,0];
    const cVel = {...Velocity, prevVel: Velocity.vel, vel: veloctiyForUtil};
    const cLoc = {...Location, prevLoc: Location.loc, loc: Location.loc};
    const cVeh = {
        ...V,
        State: cState,
        Velocity: cVel,
        Location: cLoc,
    };
    return oldArea(cVeh);
};
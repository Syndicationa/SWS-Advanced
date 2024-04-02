import { rotate } from "../../functions";
import { addVectors, magnitude, multiplyVector, roundMagnitude, subVectors } from "../../vectors";
import { bothArea, newArea, oldArea } from "./vehicle";

import { vehicle } from "../../types/vehicleTypes";
import { locationVector, rotationVector, velocityVector } from "../../types/types";

export const canMoveWithVelocity = (ship: vehicle, velocity: velocityVector, utility: boolean = false) => {
    const {energy} = ship.State;
    const {MovEnergy, Mov} = ship.Stats;

    const moveRatio = utility ? .25:1;
    
    const acceleration = roundMagnitude(velocity);

    const remainingEnergy = calculateMovEnergy(energy, MovEnergy*acceleration);

    return (acceleration <= Math.ceil(Mov*moveRatio) && remainingEnergy >= 0);
};

export const canMoveToLocation = (ship: vehicle, location: locationVector, utility: boolean = false) => {
    const {location: loc} = ship.Location;
    const {velocity} = ship.Velocity;

    const momentumLocation = !utility ? addVectors(loc, velocity): loc;
    const calculatedVel = subVectors(location, momentumLocation);

    return canMoveWithVelocity(ship, calculatedVel, utility);
};

export const canMove = (ship: vehicle, addVel: velocityVector, utility: boolean = false) => {
    const {deltaVelocity} = ship.Velocity;
    const [, movY] = addVel;

    const relativeVel = multiplyVector(ship.Location.rotation, -movY);
    const calculatedVel = addVectors(deltaVelocity, relativeVel);

    return canMoveWithVelocity(ship, calculatedVel, utility);
};

const calculateMovEnergy = (energy: number, MovEnergy: number, add: boolean = true) => {
    if (add) return energy + MovEnergy;
    return energy - MovEnergy;
};

type velocity = {
    vel: velocityVector,
    rot: rotationVector
}

export const generateVelocityFromLocation = (Vehicle: vehicle, location: locationVector, utility): velocity => {
    const {Velocity: {velocity},Location: {location: loc, rotation}} = Vehicle;

    const momentumLocation = !utility ? addVectors(loc, velocity): loc;

    const nVel = subVectors(location, momentumLocation);

    return {vel: nVel, rot: rotation};
};

export const generateVelocity = (Vehicle: vehicle, addVel: velocityVector): velocity => {
    const {Velocity: {deltaVelocity}, Location: {rotation}} = Vehicle;
    const [dr, dv] = addVel;

    const relativeVel = multiplyVector(rotation, -dv);

    const nVel = addVectors(deltaVelocity, relativeVel);
    const nRot = rotate(rotation, dr);

    return {vel: nVel, rot: nRot};
};

const mShip = (render: (v: vehicle) => vehicle) => (Vehicle: vehicle, Velocity: velocity, utility: boolean = false): vehicle => {
    const {vel, rot} = Velocity;
    const {Velocity: vVel, Location: vLoc, Appearance: vApp, State: vState, Stats: vStat} = Vehicle;

    const {location} = Vehicle.Location;
    const {velocity} = Vehicle.Velocity;
    const momentumLocation = !utility ? addVectors(location, velocity): location;

    //Create new objects
    const cVel = {...vVel, deltaVelocity: vel};
    const cLoc = {...vLoc, nextLocation: addVectors(momentumLocation, vel), rotation: rot};
    const cApp = {...vApp, area: []};
    const acc = roundMagnitude(vel);
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
    const hasMoved = magnitude(Velocity.deltaVelocity) !== 0;
    const finalVelocity = addVectors(Velocity.velocity, Velocity.deltaVelocity);

    const cState =  {...State, hasFired: false, hasMoved};
    const cVel = {velocity: finalVelocity, deltaVelocity: [0,0] as velocityVector};
    const cLoc = {...Location, location: Location.nextLocation};
    const cVeh = {
        ...V,
        State: cState,
        Velocity: cVel,
        Location: cLoc,
    };
    return oldArea(cVeh);
};
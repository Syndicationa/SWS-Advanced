import {curry} from '../../functions.mjs';
import { compareArray, sumArrays } from '../../functions.mjs';
import { distance } from '../../vectors.mjs';
import {updateArea, reArea} from './vehicle.mjs'


export const canMove = (ship, addVel, movType) => {
    const {energy, mov} = ship.State;
    const {MovEnergy} = ship.Stats;
    const {vel, prevVel} = ship.Velocity;
    const [, movY] = addVel;

	let calculatedVel = sumArrays(vel, addVel);
	if (movType === 0) {
		const relativeVel = ship.Location.rotation.map((v) => v*movY);
		calculatedVel = sumArrays(vel, relativeVel);
	}

	const acceleration = distance(prevVel, calculatedVel)

	const remainingEnergy = calculateMovEnergy(energy, MovEnergy*acceleration);

	return (acceleration <= mov && remainingEnergy >= 0);

    // if (movType === 0) {
    //     if (movX !== 0 && movY !== 0) return false;
    //     const tempMovStr = generateMovData(sVel.moveData, movX, movY);
    //     const dist = Math.ceil((tempMovStr.replace(/[+-]/g,"||||").length)/4);
    //     const undo = sVel.moveData.length > tempMovStr.length;
    //     const tEnergy = calculateMovEnergy(Energy, MovEnergy, !undo);
    //     return (dist <= Mov) && (tEnergy > 0);
    // } else {
    //     const [dx, dy] = sVel.vel;
    //     const dist = absSum(dx + movX, dy + movY);
    //     const undo = absSum(dx, dy) > dist;
    //     return (dist <= Mov) && (tEnergy > 0);
    // }
}

const calculateMovEnergy = (energy = 0, MovEnergy = 0, add = true) => {
    if (add) return energy + MovEnergy;
    return energy - MovEnergy;
}

const mShip = curry((render, Vehicle, Velocity) => {
	const {vel, rot, moveData} = Velocity;
	const {Velocity: vVel, Location: vLoc, Appearance: vApp, State: vState, Stats: vStat} = Vehicle;

	//Create new objects
	const cVel = {...vVel, vel, moveData};
	const cLoc = {...vLoc, loc: sumArrays(vLoc.prevLoc, vel), rotation: rot};
	const cApp = {...vApp, area: []};
	const acc = distance(vVel.prevVel, vel);
    //const cSteps = moveData.length > 0 ? moveData.length: sumArrays(vel, negateArray(vVel.vel)).reduce(absSum, 0);
    const cEnergy = Math.min(vStat.MaxEnergy, calculateMovEnergy(vState.energy, vStat.MovEnergy*acc, true));
    const cState = {...vState, energy: cEnergy}
	const nVehicle = {
		...Vehicle,
		Velocity: cVel,
		Location: cLoc,
		Appearance: cApp,
		State: cState
	}
	return render(nVehicle);
})

export const moveShip = mShip(updateArea(reArea(false, false)))

export const finalizeMove = V => {
	const {Velocity, Location, State, Appearance} = V;
	const hasMoved = compareArray(Velocity.prevVel, Velocity.vel);
	const cState =  {...State, hasFired: false, hasMoved};
	const cVel = {...Velocity, prevVel: Velocity.vel};
	const cLoc = {...Location, prevLoc: Location.loc, loc: sumArrays(Velocity.vel, Location.loc)};
	const cApp = {...Appearance, area: reArea(true, false, cLoc, Appearance.Size)};
	const cVeh = {
		...V,
		State: cState,
		Velocity: cVel,
		Location: cLoc,
		Appearance: cApp
	}
	return cVeh;
}
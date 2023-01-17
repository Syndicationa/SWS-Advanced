import {absSum, curry} from '../../functions.mjs';
import { compareArray, sumArrays, negateArray } from '../../functions.mjs';
import {updateArea, reArea} from './vehicle.mjs'


export const canMove = (ship, vel, movType) => {
    const Energy = ship.State.energy;
    const {MovEnergy, Mov} = ship.Stats;
    const sVel = ship.Velocity;
    const [movX, movY] = vel;
    if (movType === 0) {
        if (movX !== 0 && movY !== 0) return false;
        const tempMovStr = generateMovData(sVel.moveData, movX, movY);
        const dist = Math.ceil((tempMovStr.replace(/[+-]/g,"||||").length)/4);
        const undo = sVel.moveData.length > tempMovStr.length;
        const tEnergy = calculateMovEnergy(Energy, MovEnergy, !undo);
        return (dist <= Mov) && (tEnergy > 0);
    } else {
        const [dx, dy] = sVel.vel;
        const dist = absSum(dx + movX, dy + movY);
        const undo = absSum(dx, dy) > dist;
        const tEnergy = calculateMovEnergy(Energy, MovEnergy, !undo);
        return (dist <= Mov) && (tEnergy > 0);
    }
}

const generateMovData = (movStr, dx, dy) => {
    const val = ((dy + 3)/2)*(dx === 0) + (((dx + 3)/2) + 2)*(dy === 0) - 1;
		const movChars = ["+","-","L","R"];
		const revMovChars = ["-","+","R","L"];
		if (movChars.endsWith(revMovChars[val])) {
			return movStr.slice(0,-1);
		} else {
			return movStr + movChars[val];
		}
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
    const cSteps = moveData.length > 0 ? moveData.length: sumArrays(vel, negateArray(vVel.vel)).reduce(absSum, 0);
    const cEnergy = Math.min(vStat.MaxEnergy, calculateMovEnergy(vState.energy, vStat.MovEnergy*cSteps, true));
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
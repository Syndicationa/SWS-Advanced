import { makeVehicle } from "../vehicle/vehicle.mjs";
import { finalizeMove, moveShip } from "../vehicle/move.mjs";
import { gShipFromID, mergeShipArrays } from "../vehicle/retrieve.mjs";
import { runApply } from "../vehicle/attack.mjs";
import { filter, last, map, objectMap, pipe } from "../../functions.mjs";

export const runTurn = Data => (State, Moves) => {
    const keys = Object.keys(Moves);

    let str = "";

    const nState = keys.reduce((a, key) => {
        if (key === "Data" || key === "Turns" || key === "Phase") return a;
        const move = Moves[key][Moves[key].length - 1];
        const type = move.slice(0,2);
        const dataStrs = move.slice(2).split(";");
        return dataStrs.reduce((acc, m) => {
            const State = runMove(Data)(acc, m, {type, id: key, str})
            if (State.str === undefined) str = State.str;
            return State;
        }, a)
    }, State)

    return [nState, str];
}

export const runMove = Data => (State, Move, {type, id, str}) => {
    const substrs = Move.split(".")
    if (Move === "") return State;
    const vehicleArr = State.Vehicles;
    if (type === "P-") { //Place
        //Only for Single Battles
        const [faction, tStr, posStr, rotStr] = substrs;
        const type = Number(tStr);
        const pos = JSON.parse(posStr);
        const rot = JSON.parse(rotStr);
        const source = Data.Vehicles[faction][type];
        const vehicle = makeVehicle(source, id, vehicleArr.length, pos, rot);
        return {
            ...State, 
            Vehicles: [...vehicleArr, vehicle]
        }
    }
    if (type === "M-") { //Move
        const [vID, velStr, rotStr] = substrs;
        
        const vehicle = gShipFromID(id ,Number(vID), vehicleArr);
        const vel = JSON.parse(velStr);
        const rot = JSON.parse(rotStr);

        console.log(vehicle);

        const nVehicle = moveShip(vehicle, {vel, rot, moveData: ""});

        return {
            ...State,
            Vehicles: mergeShipArrays(vehicleArr, [nVehicle])
        }
    }
    if (type === "U-") return State;//Utility
    if (type === "A-") { //Attack
        const [fID, weapStr, tPlay, tID, hitStr] = substrs;
        const firing = gShipFromID(id, Number(fID), vehicleArr);
        const target = gShipFromID(tPlay, Number(tID), vehicleArr);
        const weapID = Number(weapStr);
        const hit = Number(hitStr);


        const [nVehs,, info] = runApply(firing, target, vehicleArr, firing.Weap.Weap(weapID), hit);
        return {
            ...State,
            Vehicles: nVehs,
            str: str + `${info}\n`
        }
    }
    if (type === "D-") return State;//Data
    return State;
}

export const updateShips = pipe(map(ship => {
    
}), filter(ship => ship.State.hp));

export const nextPhase = (State) => {
    console.log(State);
    const stage = State.Stage;
    const moves = State.Moves;
    if (stage === 0) {
        const nMoves = objectMap(moves)((move, key) => {
            if (key === "Phase") return [...move, last(move)];
            return [...move, ""]});
        return {
            ...State,
            Stage: 1,
            Moves: nMoves
        }
    } else if (stage === 1) {
        const nMoves = objectMap(moves)((move, key) => {
            if (key === "Phase") return [...move, last(move)];
            return [...move, ""]});
        const Vehicles = map(finalizeMove, State.Vehicles);
        return {
            ...State,
            Stage: 3,
            Vehicles,
            Moves: nMoves
        }
    }
}
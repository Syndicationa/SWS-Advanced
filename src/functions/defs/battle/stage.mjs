import { applyStatuses, makeVehicle } from "../vehicle/vehicle.mjs";
import { finalizeMove, moveShip } from "../vehicle/move.mjs";
import { gShipFromID, mergeShipArrays } from "../vehicle/retrieve.mjs";
import { applyAttack } from "../vehicle/attack.mjs";
import { filter, last, map, objectMap, pipe, pop, split } from "../../functions.mjs";
import { applyUtility } from "../vehicle/utility.mjs";

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
        const source = Data.shipTypes[faction][type];
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

        const nVehicle = moveShip(vehicle, {vel, rot});

        return {
            ...State,
            Vehicles: mergeShipArrays(vehicleArr, [nVehicle])
        }
    }
    if (type === "U-") { //Utility
        const [vehicleID, utilMovement, utilApplication, updates] = substrs;
        const vehicle = gShipFromID(id, vehicleID, vehicleArr);
        let nVehicle = vehicle;
        let info = '';

        if (utilMovement !== "") {
            const [vel, rot] = utilMovement.split(":").map(JSON.parse);
            nVehicle = moveShip(nVehicle, {vel, rot});
        }
        if (updates !== "") {
            const [defenseWeapons, shields] = updates.split(":");
            const wActive = defenseWeapons.split(",").map(JSON.parse);
            const sActive = shields.split(",").map(JSON.parse);

            nVehicle = {
                ...nVehicle,
                Defenses: {
                    ...nVehicle.Defenses,
                    wActive,
                    sActive
                }
            }
        }

        let nVehicles = mergeShipArrays(vehicleArr, [nVehicle])

        if (utilApplication !== "") {
            const [utilityID, targetPlayerIDs, targetVehicleIDs, hit] = utilApplication.split(":").map(JSON.parse);
            const targets = targetPlayerIDs.map((playerID, i) => {
                return gShipFromID(playerID, Number(targetVehicleIDs[i]), vehicleArr)
             });
            [nVehicles, info] = applyUtility(Data, nVehicles, nVehicle, targets[0], nVehicle.Utils.Util(utilityID), hit);
        }

        return {
            ...State,
            Vehicles: nVehicles,
            str: str + `${info + info.length === 0 ? '':'\n'}`
        };
    }
    if (type === "A-") { //Attack
        const [attackerID, weapStr, targetPlayers, targetIDs, hitStr] = substrs;
        const attacker = gShipFromID(id, Number(attackerID), vehicleArr);
        const targetPlayerIDs = JSON.parse(targetPlayers);
        const targetVehicleIDs = JSON.parse(targetIDs);
        const targets = targetPlayerIDs.map((playerID, i) => {
            return gShipFromID(playerID, Number(targetVehicleIDs[i]), vehicleArr)
        });
        const weapID = Number(weapStr);
        const hit = JSON.parse(hitStr);


        const [nVehs, info] = applyAttack(vehicleArr, attacker, targets, attacker.Weap.Weap(weapID), hit);
        return {
            ...State,
            Vehicles: nVehs,
            str: str + `${info}\n`
        }
    }
    if (type === "D-") return State;//Data
    return State;
}

export const addMove = (moves = {}, ID = "", move = "") => {
    const [previousMoves, lastMove] = split(moves[ID], -1);
    return {...moves, [ID]: [...previousMoves, `${lastMove[0]}${move};`]}
};

export const setMove = (moves = {}, ID = "", move = "") => {
    const previousMoves = pop(moves[ID]);
    return {...moves, [ID]: [...previousMoves, move]}
}

export const updateShips = pipe(map(ship => applyStatuses(ship)), filter(ship => ship.State.hp));

const eF = (s) => {
    const {
        cursor, setCursor,
        selectedVehicle, setSelectedVehicle,
        currentFunction, setCurrentFunction,
        activeVehicles, setActiveVehicles,
        player, players,
        stage, active,
        step, setStep,
        setList, setSelection,
        attackList, setAttackList
    } = s;
}

export const nextPhase = (State) => {
    const stageNext =  ["M-", "U-", "A-", "M-"];
    const stage = State.Stage;
    const moves = State.Moves;
    const nMoves = objectMap(moves)((move, key) => {
        if (key === "Phase") return [...move, "Next"];
        return [...move, stageNext[stage]]});
    const Vehicles = updateShips(State.Vehicles);

    if (stage === 0) {
        return {
            ...State,
            Stage: 1,
            Vehicles,
            Moves: nMoves
        }
    } else if (stage === 1) {
        const newVehicles = map(finalizeMove, Vehicles);
        return {
            ...State,
            Stage: 2,
            Vehicles: newVehicles,
            Moves: nMoves
        }
    } else if (stage === 2) {

    }
}
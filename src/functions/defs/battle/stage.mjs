import { applyStatuses, makeVehicle, updateArea, reArea } from "../vehicle/vehicle.mjs";
import { finalizeMove, moveShip } from "../vehicle/move.mjs";
import { gShipFromID, mergeShipArrays } from "../vehicle/retrieve.mjs";
import { applyAttack } from "../vehicle/attack.mjs";
import { filter, map, objectMap, pipe, pop, split } from "../../functions.mjs";
import { applyUtility, finalizeUtility } from "../vehicle/utility.mjs";

export const runGame = Data => State => {
    const {Turns, ...rest} = State.Moves;
    const run = runTurn(Data);
    const moves = Turns.map((_,i) => {
        _;
        return objectMap(rest)((arr) => [arr[i]]);
    });
    return moves.reduce(([state], move, i) => {
        const [nState, str] = run(state, move);
        return [{...nState, Vehicles: finalizeStage(nState.Vehicles, Turns[i])}, str];
    }, [State]);
};

export const runTurn = Data => (State, Moves) => {
    const keys = Object.keys(Moves);

    let str = "";

    const nState = keys.reduce((a, key) => {
        if (key === "Data" || key === "Turns" || key === "Phase") return a;
        const move = Moves[key][Moves[key].length - 1];
        const type = move.slice(0,2);
        const dataStrs = move.slice(2).split(";");
        return dataStrs.reduce((acc, m) => {
            const State = runMove(Data)(acc, m, {type, id: key, str});
            if (State.str === undefined) str = State.str;
            return State;
        }, a);
    }, State);

    return [nState, str];
};

export const runMove = Data => (State, Move, {type, id, str}) => {
    const substrs = Move.split(".");
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
        };
    }
    if (type === "M-") { //Move
        const [vID, velStr, rotStr] = substrs;
        
        const vehicle = gShipFromID(id ,Number(vID), vehicleArr);
        const vel = JSON.parse(velStr);
        const rot = JSON.parse(rotStr);

        const nVehicle = moveShip(vehicle, {vel, rot}, false);

        return {
            ...State,
            Vehicles: mergeShipArrays(vehicleArr, [nVehicle])
        };
    }
    if (type === "U-") { //Utility
        const [vehicleID, utilMovement, utilApplication, updates] = substrs;
        const vehicle = gShipFromID(id, Number(vehicleID), vehicleArr);
        let nVehicle = updateArea(reArea(false, false), vehicle);
        let info = "";

        if (utilMovement !== "") {
            const [vel, rot] = utilMovement.split(":").map(JSON.parse);
            nVehicle = moveShip(nVehicle, {vel, rot}, true);
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
            };
        }

        let nVehicles = mergeShipArrays(vehicleArr, [nVehicle]);

        if (utilApplication !== "") {
            utilApplication.split(":").forEach((str) => {
                const [utilityID, targetPlayerIDs, targetVehicleIDs, hit] = JSON.parse(str);
                const targets = targetPlayerIDs.map((playerID, i) => {
                    return gShipFromID(playerID, Number(targetVehicleIDs[i]), nVehicles);
                });
                [nVehicles, info] = applyUtility(Data, nVehicles, nVehicle, targets[0], nVehicle.Utils.Util(utilityID), hit);
            });
        }

        return {
            ...State,
            Vehicles: nVehicles,
            str: str + `${info + info.length === 0 ? "":"\n"}`
        };
    }
    if (type === "A-") { //Attack
        const [attackerID, weapStr, targetPlayers, targetIDs, hitStr] = substrs;
        const attacker = gShipFromID(id, Number(attackerID), vehicleArr);
        const targetPlayerIDs = JSON.parse(targetPlayers);
        const targetVehicleIDs = JSON.parse(targetIDs);
        const targets = targetPlayerIDs.map((playerID, i) => {
            return gShipFromID(playerID, Number(targetVehicleIDs[i]), vehicleArr);
        });
        const weapID = Number(weapStr);
        const hit = JSON.parse(hitStr);


        const [nVehs, info] = applyAttack(vehicleArr, attacker, targets, attacker.Weap.Weap(weapID), hit);
        console.log(info);
        return {
            ...State,
            Vehicles: nVehs,
            str: str + `${info}\n`
        };
    }
    if (type === "D-") return State;//Data
    return State;
};

export const addMove = (moves = {}, ID = "", move = "") => {
    const [previousMoves, lastMove] = split(moves[ID], -1);
    return {...moves, [ID]: [...previousMoves, `${lastMove[0]}${move};`]};
};

export const setMove = (moves = {}, ID = "", move = "") => {
    const previousMoves = pop(moves[ID]);
    return {...moves, [ID]: [...previousMoves, move]};
};

export const updateShips = pipe(map(ship => applyStatuses(ship)), filter(ship => ship.State.hp));
export const finalizeStage = (Vehicles, stage) => {
    console.log(Vehicles);
    const updatedVehicles = updateShips(Vehicles);
    switch (stage) {
        case 0:
            return updatedVehicles;
        case 1:
            return map(finalizeMove, updatedVehicles);
        case 2:
            return map(finalizeUtility, updatedVehicles);
        case 3:
            return updatedVehicles;
        default:
            throw Error("Unknown Stage");
    }
};

export const nextPhase = (State) => {
    const stageNext =  ["M-", "U-", "A-", "M-"];
    const stage = State.Stage;
    const nextStage = (stage % 3) + 1;
    const moves = State.Moves;
    const nMoves = objectMap(moves)((move, key) => {
        if (key === "Turns") return [...move, nextStage];
        if (key === "Data") return [...move, ""];
        return [...move, stageNext[stage]];});
    const Vehicles = finalizeStage(State.Vehicles, stage);

    return {
        ...State,
        Stage: nextStage,
        Vehicles,
        Moves: nMoves
    };
};
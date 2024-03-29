import { applyStatuses, makeVehicle, determineStealth, oldArea } from "../vehicle/vehicle";
import { finalizeMove, moveShip } from "../vehicle/move";
import { gVehicleFromID, mergeVehicleArrays } from "../vehicle/retrieve";
import { applyAttack, finalizeAttack } from "../vehicle/attack";
import { objectMap, pop, split } from "../../functions";
import { applyUtility, finalizeUtility } from "../vehicle/utility";
import { player, singleBattle } from "../../types/types";
import { vehicle } from "../../types/vehicleTypes";
import { Data } from "../../types/data";

type runReturn = [State: singleBattle, str: string];

export const runGame = (Data: Data) => (State: singleBattle): runReturn => {
    const {Turns} = State.Moves;
    const run = runTurn(Data);
    const moves = Turns.map((_,i) => {
        _;
        return objectMap(State.Moves)((arr: string[]) => [arr[i]]) as singleBattle["Moves"];
    });
    return moves.reduce(([state, oldString]: [state: singleBattle, str: string], move, i) => {
        const [nState, str] = run(state, move);
        if (i === moves.length - 1) return [state, oldString];
        return [{...nState, Vehicles: finalizeStage(nState.Vehicles, Turns[i])}, str];
    }, [State, ""]);
};

export const runTurn = (Data: Data) => (State: singleBattle, Moves: singleBattle["Moves"]): runReturn => {
    const keys = Object.keys(Moves);

    let str = "";

    const nState = keys.reduce((a, key) => {
        if (key === "Data" || key === "Turns" || key === "Phase") return a;
        const move = Moves[key][Moves[key].length - 1];
        const type = move.slice(0,2);
        const dataStrs = move.slice(2).split(";");
        return dataStrs.reduce((acc: singleBattle, m: string) => {
            const [State, resultString] = runMove(Data)(acc, m, {type, id: key, str});
            str = resultString;
            return State;
        }, a);
    }, State);

    return [nState, str];
};

export const runMove = (Data: Data) => (State: singleBattle, Move: string, {type, id, str}: {type: string, id: string, str: string}): runReturn => {
    const substrs = Move.split(".");
    if (Move === "") return [State, ""];
    const vehicleArr = State.Vehicles;
    if (type === "P-") { //Place
        //Only for Single Battles
        const [faction, tStr, posStr, rotStr] = substrs;
        const type = Number(tStr);
        const pos = JSON.parse(posStr);
        const rot = JSON.parse(rotStr);
        const source = Data.shipTypes[faction][type];
        const vehicle = makeVehicle(source, id, vehicleArr.length, pos, rot);
        return [{
            ...State, 
            Vehicles: [...vehicleArr, vehicle]
        }, ""];
    }
    if (type === "M-") { //Move
        const [vID, velStr, rotStr] = substrs;
        
        const vehicle = gVehicleFromID(id ,Number(vID), vehicleArr);
        const vel = JSON.parse(velStr);
        const rot = JSON.parse(rotStr);

        const nVehicle = moveShip(vehicle, {vel, rot}, false);

        return [{
            ...State,
            Vehicles: mergeVehicleArrays(vehicleArr, [nVehicle])
        }, ""];
    }
    if (type === "U-") { //Utility
        const [vehicleID, utilMovement, utilApplication, updates] = substrs;
        const vehicle = gVehicleFromID(id, Number(vehicleID), vehicleArr);
        let nVehicle = oldArea(vehicle);
        let info = "";

        if (utilMovement !== "") {
            const [vel, rot] = utilMovement.split(":").map(a => JSON.parse(a));
            nVehicle = moveShip(nVehicle, {vel, rot}, true);
        }
        if (updates !== "") {
            const [intercept, shields, defenseWeapons] = updates.split(":");
            const wActive = defenseWeapons === "" ? [] : defenseWeapons.split(",").map(a => JSON.parse(a));
            const sActive = shields === "" ? [] : shields.split(",").map(a => JSON.parse(a));

            nVehicle = {
                ...nVehicle,
                State: {
                    ...nVehicle.State,
                    intercept: Number(intercept)
                },
                Defenses: {
                    ...nVehicle.Defenses,
                    wActive,
                    sActive
                }
            };
        }

        let nVehicles = mergeVehicleArrays(vehicleArr, [nVehicle]);

        if (utilApplication !== "") {
            utilApplication.split(":").forEach((str) => {
                const [utilityID, targetPlayerID, targetVehicleID, hit] = JSON.parse(str);
                const target = gVehicleFromID(targetPlayerID, Number(targetVehicleID), vehicleArr);
                [nVehicles, info] = applyUtility(Data, nVehicles, nVehicle, target, nVehicle.Utils.Util(utilityID), hit);
            });
        }

        return [{
            ...State,
            Vehicles: nVehicles,
        }, str + `${info}${info.length === 0 ? "":"\n"}`];
    }
    if (type === "A-") { //Attack
        const [attackerID, weapStr, targetPlayers, targetIDs, hitStr] = substrs;
        const attacker = gVehicleFromID(id, Number(attackerID), vehicleArr);
        const targetPlayerIDs = JSON.parse(targetPlayers);
        const targetVehicleIDs = JSON.parse(targetIDs);
        const targets = targetPlayerIDs.map((playerID, i) => {
            return gVehicleFromID(playerID, Number(targetVehicleIDs[i]), vehicleArr);
        });
        const weapID = Number(weapStr);
        const hit = JSON.parse(hitStr);


        const [nVehs, info] = applyAttack(vehicleArr, attacker, targets, attacker.Weap.Weap(weapID), hit);
        return [{
            ...State,
            Vehicles: nVehs
        }, str + `${info}\n`];
    }
    if (type === "D-") return [State, ""];//Data
    return [State, ""];
};

export const addMove = (moves: singleBattle["Moves"], ID: string, move: string) => {
    const [previousMoves, lastMove] = split(moves[ID], -1);
    return {...moves, [ID]: [...previousMoves, `${lastMove[0]}${move};`]};
};

export const setMove = (moves: singleBattle["Moves"], ID: string, move: string) => {
    const previousMoves = pop(moves[ID]);
    return {...moves, [ID]: [...previousMoves, move]};
};

export const updateVehicles = (Vehicles: vehicle[], player?: player): vehicle[] => 
    Vehicles
        .map(applyStatuses)
        .map((vehicle,i, arr) => player ? determineStealth(arr, vehicle, player): vehicle)
        .filter((ship: vehicle) => ship.State.hp);

export const finalizeStage = (Vehicles: vehicle[], stage: number, player?: player) => {
    const updatedVehicles = updateVehicles(Vehicles, player);
    switch (stage) {
        case 0:
            return updatedVehicles;
        case 1:
            return updatedVehicles.map(finalizeMove);
        case 2:
            return updatedVehicles.map(finalizeUtility);
        case 3:
            return updatedVehicles.map(finalizeAttack);
        default:
            throw Error("Unknown Stage");
    }
};

export const nextPhase = (State: singleBattle, player?: player): singleBattle => {
    const stageNext =  ["M-", "U-", "A-", "M-"];
    const stage = State.Stage;
    const nextStage = (stage % 3) + 1;
    const moves = State.Moves;
    const nMoves = objectMap(moves)((move: singleBattle["Moves"][string], key: string) => {
        if (key === "Turns") return [...move, nextStage];
        if (key === "Data") return [...move, ""];
        return [...move, stageNext[stage]];
    }) as singleBattle["Moves"];
    const Vehicles = finalizeStage(State.Vehicles, stage, player);

    return {
        ...State,
        Stage: nextStage,
        Vehicles,
        Moves: nMoves
    };
};
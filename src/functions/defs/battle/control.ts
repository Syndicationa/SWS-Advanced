import { last, replaceInArray } from "../../functions";
import { cursor } from "../../types/cursorTypes";
import { player, singleBattle } from "../../types/types";
import { vehicle } from "../../types/vehicleTypes";
import { vehicleMovementCursor, zoom } from "../cursor";
import { attack } from "../vehicle/attack";
import { gVehicleFromID, getPlayVehicles } from "../vehicle/retrieve";
import { utility } from "../vehicle/utility";
import { addMove, runMove, setMove } from "./stage";

type setFunction<T> = ((t: T | ((previous: T) => T)) => void);

type State = {
    playerGame: singleBattle, 
    setPlayerGame: setFunction<singleBattle>,
    moves: singleBattle["Moves"],
    setMoves: setFunction<singleBattle["Moves"]>,
    cursor: cursor,
    setCursor: setFunction<cursor>,
    run: ReturnType<typeof runMove>,
    stage: number,
    impulse: number,
    setImpulse: setFunction<number>,
    activeVehicles: vehicle[],
    display: vehicle[][][],
    selectedVehicle: vehicle | undefined,
    setSelectedVehicle: setFunction<vehicle | undefined>,
    currentFunction: typeof attack | typeof utility | undefined,
    setCurrentFunction: setFunction<typeof attack | typeof utility | undefined>,
    player: player,
    setSelection: setFunction<number>,
    setAttackList: setFunction<string[]>
}

export const pressFunction = Data => (State: State): void => {
    const {stage, cursor, setCursor} = State;

    if (cursor.region.xStep > 1) {
        setCursor(zoom(cursor, 1));
        return;
    }

    switch (stage) {
        case 0:
            placementPress(Data, State);
            break;
        case 1:
            movementPress(State);
            break;
        case 2:
            utilityPress(Data, State);
            break;
        case 3:
            attackPress(State);
            break;
        default:
            throw Error("Invalid Stage");
    }
};

const placementPress = (Data, State: State): void => {
    const {
        setPlayerGame,
        moves, setMoves,
        cursor, setCursor,
        run,
        impulse, setImpulse,
        player,
        setSelection
    } = State;
    const vehicleOptions = Data.shipTypes[player.Faction];
    switch (impulse) {
        case 0: {
            setSelection(1);
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.min(cursor.menu, vehicleOptions.length - 1)});
            setImpulse(1);
            break;
        }
        case 1: {
            setCursor({...cursor, mode:"Rotate"});
            setImpulse(2);
            break;
        }
        case 2: {
            setCursor({...cursor, mode: "Move"});
            const move = `${player.Faction}.${cursor.menu}.${JSON.stringify(cursor.loc)}.${JSON.stringify(cursor.rot)}`;

            const ID = player.User.ID;

            setPlayerGame(playerGame => run(playerGame, move, {type: "P-", str: "", id: ID})[0]);
            
            setMoves(addMove(moves, ID, move));

            setImpulse(0);
            break;
        }
        default:
            throw Error("Unexpected Outcome");
    }
};

const movementPress = (State: State): void => {
    const {
        setPlayerGame,
        moves, setMoves,
        cursor, setCursor,
        run,
        impulse, setImpulse,
        display,
        selectedVehicle, setSelectedVehicle,
        player,
        setSelection,
    } = State;
    const ID = player.User.ID;
    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayVehicles(ID, display[x][y]);
    const vehicle = vehicleOptions[cursor.menu] ?? false;
    switch (impulse) {
        case 0: {
            if (vehicleOptions.length === 0) return;
            setSelection(1);
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.min(cursor.menu, vehicleOptions.length - 1)});
            setImpulse(1);
            break;
        }
        case 1: {
            setSelectedVehicle(vehicle);
            setCursor({...cursor, mode:"Function", data: vehicleMovementCursor(vehicle, setSelectedVehicle)});
            setImpulse(2);
            break;
        }
        case 2: {
            if (selectedVehicle === undefined) throw Error("Vehicle was lost");
            setCursor({...cursor, mode: "Move", data: []});
            const velocity = selectedVehicle.Velocity.vel; 
            const rotation = selectedVehicle.Location.rotation;

            const lastMove = last(moves[ID])[0];
            const splitMove = lastMove.slice(2).split(";");
            const vehicleIndex = splitMove.length === 1 ? -1:splitMove.findIndex(move => Number(move.split(".")[0]) === selectedVehicle.Ownership.vID);
            const move = `${selectedVehicle.Ownership.vID}.${JSON.stringify(velocity)}.${JSON.stringify(rotation)}`;

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, move));
            else setMoves(setMove(moves, ID, `M-${replaceInArray(splitMove, vehicleIndex, move).join(";")}`));

            setPlayerGame(playerGame => run(playerGame, move, {type: "M-", str: "", id: ID})[0]);

            setSelectedVehicle(undefined);

            setImpulse(0);
            break;
        }
        default:
            throw Error(`Unexpected Outcome: ${impulse}`);
    }
};

const setupUtilityModes = (Data, State: State): void => {
    const {cursor, setCursor, activeVehicles, setSelectedVehicle, selectedVehicle, setCurrentFunction, setImpulse} = State;
    if (selectedVehicle === undefined) throw Error("Vehicle was lost");
    const selected = gVehicleFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, activeVehicles);
    setSelectedVehicle(selected);
    switch (cursor.menu) {
        case 0: {//Move
            setCursor({...cursor, mode:"Function", data: vehicleMovementCursor(selected, setSelectedVehicle, true)});
            break;
        }
        case 1: {//Attack
            setCurrentFunction(() => utility(selectedVehicle));
            setCursor({...cursor, mode: "Move", data: []});
            break;
        }
        case 2: {//Utility
            break;
        }
        case 3: {
            setImpulse(0);
            setCursor({...cursor, mode: "Move", data: []});
            setSelectedVehicle(undefined);
            break;
        }
        default:
            throw Error("Unexpected Utility");
    }
};

const resetUtility = (State): void => {
    const {modes, setSelection, setCursor, cursor, setImpulse} = State;
    setSelection(0);
    setCursor({...cursor, mode: "Menu", data: modes, menu: 0});
    setImpulse(2);
};

const utilityPress = (Data, State: State): void => {
    const modes = ["Move", "Attack", "Utility", "Exit"];
    const impulses = [3, 4, 7, 0];
    const {
        setPlayerGame,
        moves, setMoves,
        cursor, setCursor,
        run,
        impulse, setImpulse,
        display,
        selectedVehicle, setSelectedVehicle,
        currentFunction, setCurrentFunction,
        player,
        setSelection,
        setAttackList
    } = State;
    const ID = player.User.ID;
    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayVehicles(player.User.ID, display[x][y]);
    const allVehicles = display[x][y];
    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const utils = selectedVehicle ? selectedVehicle.Utils.Data:undefined;

    const lastMove = last(moves[ID])[0];
    const splitMove = lastMove.slice(2).split(";").slice(0, -1);
    console.log(lastMove);
    const vehicleIndex = 
        splitMove.length === 1 || selectedVehicle === undefined ? 
            -1:
            splitMove.findIndex(move => Number(move.split(".")[0]) === selectedVehicle.Ownership.vID);

    switch (impulse) {
        case 0: {
            if (vehicleOptions.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.min(cursor.menu, vehicleOptions.length - 1)});
            setImpulse(1);
            break;
        }
        case 1: {
            setSelectedVehicle(vehicle);
            resetUtility({...State, modes});
            break;
        }
        case 2: {
            setupUtilityModes(Data, State);
            setImpulse(impulses[cursor.menu]);
            break;
        }
        //#region Movement
        case 3: {
            //Wrap Up Movement
            if (selectedVehicle === undefined) throw Error("Vehicle was lost");
            const velocity = selectedVehicle.Velocity.vel; 
            const rotation = selectedVehicle.Location.rotation;
            const velRotMove = `${JSON.stringify(velocity)}:${JSON.stringify(rotation)}`;
            const playedGenerateMove = `${selectedVehicle.Ownership.vID}.${velRotMove}..`;
            const generatedMovementMove = vehicleIndex === -1 ? playedGenerateMove:
                replaceInArray(splitMove[vehicleIndex].split("."), 1, velRotMove).join(".");
            console.log(splitMove);

            console.log(selectedVehicle, generatedMovementMove);

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, generatedMovementMove));
            else setMoves(setMove(moves, ID, `U-${replaceInArray(splitMove, vehicleIndex, generatedMovementMove).join(";")}`));

            setPlayerGame(playerGame => run(playerGame, playedGenerateMove, {type: "U-", str: "", id: ID})[0]);

            resetUtility({...State, modes});
            break;
        }
        //#endregion
        //#region Attack
        case 4: {//Select Target Part 1
            if (allVehicles.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:allVehicles, mode:"Menu", menu: Math.min(cursor.menu, allVehicles.length - 1)});
            setImpulse(5);
            break;
        }
        case 5: {//Select Target Part 2
            if (utils === undefined) throw Error("Vehicle was lost");
            setCurrentFunction(currentFunction => currentFunction(allVehicles[cursor.menu]));//Add target
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.min(cursor.menu, utils.length - 1)});
            setImpulse(6);
            break;
        }
        case 6: {
            if (utils === undefined || currentFunction === undefined || selectedVehicle === undefined) throw Error("Vehicle was lost");
            const utilityMove = currentFunction(utils[cursor.menu]);
            const playedGeneratedUtility = `${selectedVehicle.Ownership.vID}..${utilityMove}.`;
            const generatedUtilityMove = vehicleIndex === -1 ? playedGeneratedUtility:
                replaceInArray(splitMove[vehicleIndex].split("."), 2, utilityMove).join(".");

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, generatedUtilityMove));
            else setMoves(setMove(moves, ID, `U-${replaceInArray(splitMove, vehicleIndex, generatedUtilityMove).join(";")}`));

            setPlayerGame(playerGame => {
                const [state, str] = run(playerGame, playedGeneratedUtility, {type: "U-", str: "", id: ID});
                setAttackList(attackList => [...attackList, str]);
                return state;
            });
            resetUtility({...State, modes});
            break;
        }
        //#endregion
        //#region Util
        case 7: {
            resetUtility({...State, modes});
            break;
        }
        //#endregion
        default:
            throw Error(`Unexpected Outcome: ${impulse}`);
    }
};

const attackPress = (State: State): void => {
    const {
        setPlayerGame,
        moves, setMoves,
        cursor, setCursor,
        run,
        impulse, setImpulse,
        activeVehicles, display,
        selectedVehicle, setSelectedVehicle,
        currentFunction, setCurrentFunction,
        player,
        setSelection,
        setAttackList
    } = State;

    const ID = player.User.ID;

    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayVehicles(player.User.ID, display[x][y]);
    const allVehicles = display[x][y];

    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const weapons = selectedVehicle?.Weap?.Data;

    switch (impulse) {
        case 0: {
            if (vehicleOptions.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.min(cursor.menu, vehicleOptions.length - 1)});
            setImpulse(1);
            break;
        }
        case 1: {
            setSelectedVehicle(vehicle);
            setCurrentFunction(() => attack(activeVehicles, vehicle));
            setCursor({...cursor, mode: "Move", data: []});
            setImpulse(2);
            break;
        }
        case 2: {//Select Target Part 1
            if (allVehicles.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:allVehicles, mode:"Menu", menu: Math.min(cursor.menu, allVehicles.length - 1)});
            setImpulse(3);
            break;
        }
        case 3: {//Select Target Part 2
            if (weapons === undefined) throw Error("Vehicle was lost");
            setCurrentFunction(currentFunction => currentFunction(allVehicles[cursor.menu]));//Add target
            setCursor({...cursor, data: weapons, mode:"Menu", menu: Math.min(cursor.menu, weapons.length - 1)});
            setImpulse(4);
            break;
        }
        case 4: {
            if (selectedVehicle === undefined || weapons === undefined || currentFunction === undefined) throw Error("Vehicle was lost");
            const attackMove = currentFunction(weapons[cursor.menu]);
            setCursor({...cursor, mode: "Move", data: []});

            console.log(attackMove);

            setMoves(addMove(moves, ID, attackMove));

            setPlayerGame(playerGame => {
                const [state, str] = run(playerGame, attackMove, {type: "A-", str: "", id: ID});
                setAttackList(attackList => [...attackList, str]);
                return state;
            });

            setSelectedVehicle(undefined);

            setImpulse(0);
            setAttackList(attackList => [...attackList, ""]);
            break;
        }
        default:
            throw Error("Unexpected Outcome");
    }
};
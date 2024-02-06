import { last, replaceInArray } from "../../functions.mjs";
import { vehicleMovementCursor, zoom } from "../cursor.mjs";
import { attack } from "../vehicle/attack.mjs";
import { gShipFromID, getPlayShips } from "../vehicle/retrieve.mjs";
import { utility } from "../vehicle/utility.mjs";
import { addMove, setMove } from "./stage.mjs";

export const pressFunction = Data => State => {
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

const placementPress = (Data, State) => {
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

            setPlayerGame(playerGame => run(playerGame, move, {type: "P-", str: "", id: ID}));
            
            setMoves(addMove(moves, ID, move));

            setImpulse(0);
            break;
        }
        default:
            throw Error("Unexpected Outcome");
    }
};

const movementPress = (State) => {
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
    const vehicleOptions = getPlayShips(ID, display[x][y]);
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
            setCursor({...cursor, mode: "Move", data: []});
            const velocity = selectedVehicle.Velocity.vel; 
            const rotation = selectedVehicle.Location.rotation;

            const lastMove = last(moves[ID], -1)[0];
            const splitMove = lastMove.slice(2).split(";");
            const vehicleIndex = splitMove.length === 1 ? -1:splitMove.findIndex(move => Number(move.split(".")[0]) === selectedVehicle.Ownership.vID);
            const move = `${selectedVehicle.Ownership.vID}.${JSON.stringify(velocity)}.${JSON.stringify(rotation)}`;

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, move));
            else setMoves(setMove(moves, ID, `M-${replaceInArray(splitMove, vehicleIndex, move).join(";")}`));

            setPlayerGame(playerGame => run(playerGame, move, {type: "M-", str: "", id: ID}));

            setSelectedVehicle(undefined);

            setImpulse(0);
            break;
        }
        default:
            throw Error("Unexpected Outcome");
    }
};

const setupUtilityModes = (Data, State) => {
    const {cursor, setCursor, activeVehicles, setSelectedVehicle, selectedVehicle, setCurrentFunction, setListType, setImpulse} = State;
    const selected = gShipFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, activeVehicles);
    setSelectedVehicle(selected);
    setListType("Vehicle");
    switch (cursor.menu) {
        case 0: {//Move
            setCursor({...cursor, mode:"Function", data: vehicleMovementCursor(selected, setSelectedVehicle, true)});
            break;
        }
        case 1: {//Attack
            setCurrentFunction(() => utility(Data, activeVehicles, selectedVehicle));
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

const resetUtility = (State) => {
    const {modes, setSelection, setCursor, cursor, setImpulse, setListType} = State;
    setSelection(0);
    setListType("Message");
    setCursor({...cursor, mode: "Menu", data: modes, menu: 0});
    setImpulse(2);
};

const utilityPress = (Data, State) => {
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
    const vehicleOptions = getPlayShips(player.User.ID, display[x][y]);
    const allVehicles = display[x][y];
    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const utils = selectedVehicle ? selectedVehicle.Utils.Data:undefined;

    const lastMove = last(moves[ID], -1)[0];
    const splitMove = lastMove.slice(2).split(";");
    const vehicleIndex = 
        splitMove.length === 1 || !selectedVehicle ? 
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
            const velocity = selectedVehicle.Velocity.vel; 
            const rotation = selectedVehicle.Location.rotation;
            const velRotMove = `${JSON.stringify(velocity)}:${JSON.stringify(rotation)}`;
            const playedGenerateMove = `${selectedVehicle.Ownership.vID}.${velRotMove}..`;
            const generatedMovementMove = vehicleIndex === -1 ? playedGenerateMove:
                replaceInArray(splitMove[vehicleIndex].split("."), 1, velRotMove).join(".");

            console.log(generatedMovementMove);

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, generatedMovementMove));
            else setMoves(setMove(moves, ID, `U-${replaceInArray(splitMove, vehicleIndex, generatedMovementMove).join(";")}`));

            setPlayerGame(playerGame => run(playerGame, playedGenerateMove, {type: "U-", str: "", id: ID}));

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
            setCurrentFunction(currentFunction => currentFunction(allVehicles[cursor.menu]));//Add target
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.min(cursor.menu, utils.length - 1)});
            setImpulse(6);
            break;
        }
        case 6: {
            const [, utilityMove, string] = currentFunction(utils[cursor.menu]);
            const playedGeneratedUtility = `${selectedVehicle.Ownership.vID}..${utilityMove}.`;
            const generatedUtilityMove = vehicleIndex === -1 ? playedGeneratedUtility:
                replaceInArray(splitMove[vehicleIndex].split("."), 2, utilityMove).join(".");

            if (vehicleIndex === -1) setMoves(addMove(moves, ID, generatedUtilityMove));
            else setMoves(setMove(moves, ID, `U-${replaceInArray(splitMove, vehicleIndex, generatedUtilityMove).join(";")}`));

            setPlayerGame(playerGame => run(playerGame, playedGeneratedUtility, {type: "U-", str: "", id: ID}));
            setAttackList(attackList => [...attackList, string]);
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
            throw Error("Unexpected Outcome");
    }
};

const attackPress = (State) => {
    const {
        player, 
        impulse, setImpulse, 
        cursor, setCursor, 
        setSelection, 
        activeVehicles, setActiveVehicles, 
        display, 
        currentFunction, setCurrentFunction,
        selectedVehicle, setSelectedVehicle,
        attackList, setAttackList
    } = State;

    console.log(cursor);
    console.log(State);

    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayShips(player.User.ID, display[x][y]);
    const allVehicles = display[x][y];

    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const utils = selectedVehicle.Utils.Data;

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
            setCurrentFunction(currentFunction => currentFunction(allVehicles[cursor.menu]));//Add target
            setSelectedVehicle([selectedVehicle, allVehicles[cursor.menu]]);
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.min(cursor.menu, utils.length - 1)});
            setImpulse(4);
            break;
        }
        case 4: {
            const [newVehicleArray, , string] = currentFunction(utils[cursor.menu]);
            setActiveVehicles(newVehicleArray);
            setSelectedVehicle(gShipFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, newVehicleArray));
            setAttackList([...attackList, string]);
            break;
        }
        default:
            throw Error("Unexpected Outcome");
    }
};
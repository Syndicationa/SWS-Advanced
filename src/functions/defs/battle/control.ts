import { last, replaceInArray } from "../../functions";
import { currentArgs, hasRequiredArgs, isAttackArgs, isUtilityArgs } from "../../types/FunctionTypes";
import { cursor } from "../../types/cursorTypes";
import { Data } from "../../types/data";
import { player, singleBattle } from "../../types/types";
import { isVehicle, vehicle } from "../../types/vehicleTypes";
import { moveCursor, utilityControlCursor, vehicleMovementCursor, zoom } from "../cursor";
import { attack, canFire } from "../vehicle/attack";
import { gVehicleFromID, getPlayVehicles, retrieveDefenseList, sameVehicle } from "../vehicle/retrieve";
import { utility } from "../vehicle/utility";
import { addMove, runMove, setMove } from "./stage";

type setFunction<T> = React.Dispatch< React.SetStateAction<T> >;

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
    currentArgs: currentArgs,
    setCurrentArgs: setFunction<currentArgs>,
    player: player,
    setSelection: setFunction<number>,
    setAttackList: setFunction<string[]>
}

export const pressFunction = (Data: Data) => (State: State): void => {
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
            utilityPress(State);
            break;
        case 3:
            attackPress(State);
            break;
        default:
            throw Error("Invalid Stage");
    }
};

const placementPress = (Data: Data, State: State): void => {
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
            setCursor(moveCursor({...cursor, mode:"Function", data: vehicleMovementCursor(vehicle, setSelectedVehicle)}, [0,0]));
            setImpulse(2);
            break;
        }
        case 2: {
            if (selectedVehicle === undefined) throw Error("Vehicle was lost");
            setCursor({...cursor, mode: "Move", data: []});
            const velocity = selectedVehicle.Velocity.deltaVelocity; 
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

const setupUtilityModes = (State: State): void => {
    const {cursor, setCursor, activeVehicles, setSelectedVehicle, selectedVehicle, setCurrentArgs, setImpulse, setSelection} = State;
    if (selectedVehicle === undefined) throw Error("Vehicle was lost");
    const selected = gVehicleFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, activeVehicles);
    setSelectedVehicle(selected);
    switch (cursor.menu) {
        case 0: {//Move
            setCursor(moveCursor({...cursor, mode:"Function", data: vehicleMovementCursor(selected, setSelectedVehicle, true)}, [0,0]));
            break;
        }
        case 1: {//Attack
            setCurrentArgs([selectedVehicle]);
            setCursor({...cursor, mode: "Move", data: []});
            break;
        }
        case 2: {//Utility
            setSelection(0);
            setCursor({...cursor, mode: "Function", data: utilityControlCursor(selected, setSelectedVehicle), menu: 0});
            setImpulse(7);
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

const resetUtility = (State: State & {modes: string[]}): void => {
    const {modes, setSelection, setCursor, cursor, setImpulse} = State;
    setSelection(0);
    setCursor({...cursor, mode: "Menu", data: modes, menu: 0});
    setImpulse(2);
};

const utilityPress = (State: State): void => {
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
        currentArgs, setCurrentArgs,
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
            setupUtilityModes(State);
            setImpulse(impulses[cursor.menu]);
            break;
        }
        //#region Movement
        case 3: {
            //Wrap Up Movement
            if (selectedVehicle === undefined) throw Error("Vehicle was lost");
            const velocity = selectedVehicle.Velocity.deltaVelocity; 
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
            if (utils === undefined || currentArgs.length !== 1) throw Error("Vehicle was lost");
            setCurrentArgs([...currentArgs, allVehicles[cursor.menu]]);//Add target
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.min(cursor.menu, utils.length - 1)});
            setImpulse(6);
            break;
        }
        case 6: {
            if (utils === undefined || selectedVehicle === undefined) throw Error("Vehicle was lost");
            const finalArgs = [...currentArgs, utils[cursor.menu]] as currentArgs;
            if (!isUtilityArgs(finalArgs) || !hasRequiredArgs(utility, finalArgs)) throw Error("Args for utility failed to materialize");
            const utilityMove = utility(...finalArgs) as unknown as string;
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
            if (typeof cursor.data !== "function" || !isVehicle(cursor.data.data)) throw Error("Vehicle was lost");
            const copyVehicle = cursor.data.data;
            const menu = cursor.menu;
            const defenses = retrieveDefenseList(copyVehicle);

            const {sActive, wActive} = copyVehicle.Defenses;

            if (menu === 0) return;
            if (defenses[menu] === "Exit") {
                const intercept = copyVehicle.State.intercept;

                const controlMove = `${intercept}:${sActive}:${wActive}`;
                
                const playedGenerateMove = `${copyVehicle.Ownership.vID}...${controlMove}`;
                const generatedControlMove = vehicleIndex === -1 ? playedGenerateMove:
                    replaceInArray(splitMove[vehicleIndex].split("."), 1, controlMove).join(".");
                console.log(splitMove);

                console.log(generatedControlMove);

                if (vehicleIndex === -1) setMoves(addMove(moves, ID, generatedControlMove));
                else setMoves(setMove(moves, ID, `U-${replaceInArray(splitMove, vehicleIndex, generatedControlMove).join(";")}`));

                setPlayerGame(playerGame => run(playerGame, playedGenerateMove, {type: "U-", str: "", id: ID})[0]);

                resetUtility({...State, modes});
                return;
            }

            const weaponMenu = menu - copyVehicle.Defenses.sActive.length;

            const modifiedVehicle: vehicle = {
                ...copyVehicle,
                Defenses: {
                    ...copyVehicle.Defenses,
                    sActive: replaceInArray(sActive, menu - 1, !(defenses[menu][1])),
                    wActive: replaceInArray(wActive, weaponMenu - 1, !(defenses[menu][1]))
                }
            };
            
            setSelectedVehicle(modifiedVehicle);
            setCursor({...cursor, mode: "Function", data: utilityControlCursor(modifiedVehicle, setSelectedVehicle), menu: 0});

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
        currentArgs, setCurrentArgs,
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

    console.log(impulse);

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
            setCurrentArgs([activeVehicles, vehicle]);
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
            if (weapons === undefined || currentArgs.length !== 2 || !isAttackArgs(currentArgs)) throw Error("Vehicle was lost");
            setCurrentArgs([...currentArgs, allVehicles[cursor.menu]]);//Add target
            setCursor({...cursor, data: weapons, mode:"Menu", menu: Math.min(cursor.menu, weapons.length - 1)});
            setImpulse(4);
            break;
        }
        case 4: {
            if (selectedVehicle === undefined || weapons === undefined) throw Error("Vehicle was lost");
            const finalArgs = [...currentArgs, weapons[cursor.menu]] as currentArgs;
            if (!isAttackArgs(finalArgs) || !hasRequiredArgs(attack, finalArgs)) throw Error("Args for utility failed to materialize");
            if (!canFire(finalArgs[1], finalArgs[2], finalArgs[3])) return;
            const attackMove = attack(...finalArgs);
            setCursor({...cursor, mode: "Move", data: []});
            
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

export const back = (State: State): void => {
    const {
        cursor,
        setCursor,
        stage,
        impulse,
        setImpulse,
        setSelectedVehicle,
        setSelection,
    } = State;

    console.log(impulse);

    if (impulse === 0) return;
    setImpulse(impulse - 1);
    if (impulse === 1) {
        setSelection(0);
        setSelection(1);
        setCursor({...cursor, mode: "Move", data: []});
        setSelectedVehicle(undefined);
        return;
    }
    switch(stage) {
        case 0: {
            setSelection(1);
            setSelection(0);
            setCursor({...cursor, mode:"Menu"});
            break;
        }
        case 2: {
            if (impulse === 4) {
                resetUtility({...State, modes: ["Move", "Attack", "Utility", "Exit"]});
                break;
            } else if (impulse === 5 || impulse === 6) {
                backAttack(State, impulse - 4);
            }
            break;
        }
        case 3: {
            backAttack(State, impulse - 2);
            break;
        }

    }
};

const backAttack = (State: State, adjustedImpulse: number) => {
    const {
        cursor,
        setCursor,
        display,
        currentArgs,
        setCurrentArgs,
        player,
        setSelection,
    } = State;

    const [x,y] = cursor.loc;
    const vehiclesAtCursor = display[x][y];
    if (adjustedImpulse === 0) {
        setSelection(0);
        let target: vehicle | undefined = undefined;

        if (isAttackArgs(currentArgs)) {
            const [a, b] = currentArgs;
            if (a === undefined) throw Error("Corruption of Args");
            setCurrentArgs([a]);
            target = b;
        } else {
            const [a] = currentArgs;
            setCurrentArgs([]);
            target = a;
        }

        if (target === undefined) throw Error("Vehicle was lost");

        const [tx, ty] = target.Location.location;
        const vehicles = getPlayVehicles(player.User.ID, display[tx][ty]);
        const menu = vehicles.findIndex((vehicle) => target === undefined || sameVehicle(vehicle, target));

        setCursor({...cursor, data:vehicles, mode:"Menu",
            menu: Math.max(menu, 0)});
    }
    if (adjustedImpulse === 1) {
        setCursor({...cursor, mode: "Move", data: []});
        return;
    }
    if (adjustedImpulse === 2) {
        setSelection(0);
        let target: vehicle | undefined = undefined;

        if (isAttackArgs(currentArgs)) {
            const [a, b, c] = currentArgs;
            if (a === undefined || b === undefined) throw Error("Corruption of Args");
            setCurrentArgs([a, b]);
            target = c;
        } else {
            const [a, b] = currentArgs;
            setCurrentArgs([a]);
            target = b;
        }

        const menu = vehiclesAtCursor.findIndex(v => target === undefined || sameVehicle(v, target));

        setCursor({...cursor, data:vehiclesAtCursor, mode:"Menu", 
            menu: Math.max(menu, 0)});
    }
};
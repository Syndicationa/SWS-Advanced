import { cursorGenerator, vehicleMovementCursor } from "../cursor.mjs";
import { playerTemplate, vehicleTemplate } from "../templates.mjs";
import { attack } from "../vehicle/attack.mjs";
import { moveShip } from "../vehicle/move.mjs";
import { gShipFromID, getPlayShips, mergeShipArrays } from "../vehicle/retrieve.mjs";
import { utility } from "../vehicle/utility.mjs";
import { makeVehicle } from "../vehicle/vehicle.mjs";

export const pressFunction = Data => State => {
    const {stage} = State;

    console.log(Data)

    switch (stage) {
        case 0:
            placementPress(Data, State);
            break;
        case 1:
            movementPress(Data, State);
            break;
        case 2:
            utilityPress(Data, State);
            break;
        case 3:
            attackPress(Data, State);
            break;
        default:
            throw Error("Invalid Stage")
    }
}

const placementPress = (Data, State) => {
    const {player, step, setStep, cursor, setCursor, setSelection, activeVehicles, setActiveVehicles} = State;
    const vehicleOptions = Data.shipTypes[player.Faction];
    switch (step) {
        case 0:
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.max(cursor.menu, vehicleOptions.length - 1)});
            setStep(1);
            break;
        case 1:
            setCursor({...cursor, mode:"Rotate"});
            setStep(2);
            break;
        case 2:
            setCursor({...cursor, mode: "Move"});
            const shipCount = getPlayShips(player.User.ID, activeVehicles).length;
            const newVehicle = makeVehicle(vehicleOptions[cursor.menu],player.User.ID, shipCount, cursor.loc, cursor.rot);
            setActiveVehicles([...activeVehicles, newVehicle]);
            setStep(0);
            break;
        default:
            throw Error("Unexpected Outcome")
    }
}

const movementPress = (State) => {
    const {player, step, setStep, cursor, setCursor, setSelection, activeVehicles, setActiveVehicles, Display} = State;
    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayShips(player.User.ID, Display[x][y]);
    const vehicle = vehicleOptions[cursor.menu] ?? false;
    switch (step) {
        case 0:
            if (vehicleOptions.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.max(cursor.menu, vehicleOptions.length - 1)});
            setStep(1);
            break;
        case 1:
            setCursor({...cursor, mode:"Function", data: vehicleMovementCursor(vehicle, activeVehicles, setActiveVehicles)});
            setStep(2);
            break;
        case 2:
            setCursor({...cursor, mode: "Move", data: []});
            const velocity = {vel: vehicle.Velocity.vel, rot: vehicle.Location.rotation}
            const movedVehicle = moveShip(vehicle, velocity);
            setActiveVehicles(mergeShipArrays(activeVehicles, [movedVehicle]))
            setStep(0);
            break;
        default:
            throw Error("Unexpected Outcome")
    }
}

const setupUtilityModes = (Data, State) => {
    const {cursor, setCursor, activeVehicles, setActiveVehicles, selectedVehicle, setCurrentFunction} = State;
    switch (cursor.menu) {
        case 0: //Move
            setCursor({...cursor, mode:"Function", data: vehicleMovementCursor(selectedVehicle, activeVehicles, setActiveVehicles, .25)});
            break;
        case 1: //Attack
            setCurrentFunction(utility(Data, activeVehicles, selectedVehicle));
            setCursor({...cursor, mode: "Move", data: []});
            break;
        case 2: //Utility
            break;
        case 3:
            setCursor({...cursor, mode: "Move", data: []});
            break;
        default:
            throw Error("Unexpected Utility");
    }
}

const resetUtility = (State) => {
    const {modes, setSelection, setCursor, cursor, setStep} = State;
    setSelection(0);
    setCursor({...cursor, mode: "Menu", data: modes, menu: 0});
    setStep(2);
}

const utilityPress = (Data, State) => {
    const modes = ["Move", "Attack", "Utility", "Exit"];
    const steps = [3, 4, 7, 0];
    const {
        player, 
        step, setStep, 
        cursor, setCursor, 
        setSelection, 
        activeVehicles, setActiveVehicles, 
        Display, 
        currentFunction, setCurrentFunction,
        selectedVehicle, setSelectedVehicle,
        attackList, setAttackList
    } = State;
    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayShips(player.User.ID, Display[x][y]);
    const allVehicles = Display[x][y];
    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const utils = selectedVehicle.Utils.Data;
    switch (step) {
        case 0:
            if (vehicleOptions.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.max(cursor.menu, vehicleOptions.length - 1)});
            setStep(1);
            break;
        case 1:
            setSelectedVehicle(vehicle);
            resetUtility({...State, modes});
            break;
        case 2:
            setupUtilityModes(Data, State);
            setStep(steps[cursor.menu]);
            break;
        //#region Movement
        case 3:
            //Wrap Up Movement
            const velocity = {vel: vehicle.Velocity.vel, rot: vehicle.Location.rotation}
            const movedVehicle = moveShip(selectedVehicle, velocity);
            setActiveVehicles(mergeShipArrays(activeVehicles, [movedVehicle]));
            resetUtility({...State, modes});
            break;
        //#endregion
        //#region Attack
        case 4: //Select Target Part 1
            if (allVehicles.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:allVehicles, mode:"Menu", menu: Math.max(cursor.menu, allVehicles.length - 1)});
            setStep(5);
            break;
        case 5: //Select Target Part 2
            setCurrentFunction(currentFunction(allVehicles[cursor.menu]))//Add target
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.max(cursor.menu, utils.length - 1)});
            setStep(6);
            break;
        case 6:
            const [newVehicleArray, move, string] = currentFunction(utils[cursor.menu]);
            setActiveVehicles(newVehicleArray);
            setSelectedVehicle(gShipFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, newVehicleArray));
            setAttackList([...attackList, string]);
            resetUtility({...State, modes});
            break;
        //#endregion
        //#region Util
        case 7:
            resetUtility({...State, modes});
            break;
        //#endregion
        default:
            throw Error("Unexpected Outcome")
    }
}

const attackPress = (State) => {
    const {
        player, 
        step, setStep, 
        cursor, setCursor, 
        setSelection, 
        activeVehicles, setActiveVehicles, 
        Display, 
        currentFunction, setCurrentFunction,
        selectedVehicle, setSelectedVehicle,
        attackList, setAttackList
    } = State;

    const [x,y] = cursor.loc;
    const vehicleOptions = getPlayShips(player.User.ID, Display[x][y]);
    const allVehicles = Display[x][y];

    const vehicle = vehicleOptions[cursor.menu] ?? selectedVehicle;
    const utils = selectedVehicle.Utils.Data;

    switch (step) {
        case 0:
            if (vehicleOptions.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:vehicleOptions, mode:"Menu", menu: Math.max(cursor.menu, vehicleOptions.length - 1)});
            setStep(1);
            break;
        case 1:
            setSelectedVehicle(vehicle);
            setCurrentFunction(attack(activeVehicles, vehicle));
            setCursor({...cursor, mode: "Move", data: []});
            setStep(2);
            break;
        case 2: //Select Target Part 1
            if (allVehicles.length === 0) return;
            setSelection(0);
            setCursor({...cursor, data:allVehicles, mode:"Menu", menu: Math.max(cursor.menu, allVehicles.length - 1)});
            setStep(3);
            break;
        case 3: //Select Target Part 2
            setCurrentFunction(currentFunction(allVehicles[cursor.menu]))//Add target
            setSelectedVehicle([selectedVehicle, allVehicles[cursor.menu]]);
            setCursor({...cursor, data: utils, mode:"Menu", menu: Math.max(cursor.menu, utils.length - 1)});
            setStep(4);
            break;
        case 4:
            const [newVehicleArray, move, string] = currentFunction(utils[cursor.menu]);
            setActiveVehicles(newVehicleArray);
            setSelectedVehicle(gShipFromID(selectedVehicle.Ownership.Player,selectedVehicle.Ownership.vID, newVehicleArray));
            setAttackList([...attackList, string]);
            break;
        default:
            throw Error("Unexpected Outcome")
    }
}
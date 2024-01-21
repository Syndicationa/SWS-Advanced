// import {clone, updateSector, compareArray, rectangle, isInRectangle, distance} from './functions.mjs';
// import {attackShip, calcLocDiff, inFiringRot} from "./game";

export const playerMaker = User => nInfo => {
    const {Faction, Name, Admin} = nInfo;
    return {
        User,
        Admin,
        colorSet: User.colorSet,
        Controls: User.Controls,
        movType: User.movType,
        Faction,
        Name,
        Battles: [],
        Vehicles: {
            inBattle: {},
            onBoard: [],
            healing: []
        },
    };
};

export const gPlayerMaker = Player => Name => {
    return {
        User: Player.User,
        colorSet: Player.colorSet,
        Controls: Player.Controls,
        movType: Player.movType,
        Faction: Player.Faction,
        Name,
        Vehicles: [],
        Loses: [],
        hasMoved: false,
    };
};
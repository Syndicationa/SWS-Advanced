// import {clone, updateSector, compareArray, rectangle, isInRectangle, distance} from './functions.mjs';
// import {attackShip, calcLocDiff, inFiringRot} from "./game";

import { player, systemPlayer, user } from "../../types/types";

type newInfo = {
    Faction: string
    Name: string,
}

export const systemPlayerMaker = (User: user) => (nInfo: newInfo): systemPlayer => {
    const {Faction, Name} = nInfo;
    return {
        User,
        colorSet: User.colorSet,
        Faction,
        Name,
        Battles: [],
        Vehicles: {
            InBattle: [],
            OnBoard: [],
            Healing: []
        },
    };
};

export const playerMaker = (User: user) => (newInfo: newInfo): player => {
    const {Faction, Name} = newInfo;
    return {
        User: User,
        colorSet: User.colorSet,
        Controls: User.Controls,
        Faction: Faction,
        Name,
        Vehicles: [],
        Loses: [],
        hasMoved: false,
    };
};

export const playerFromSystemPlayer = (Player: systemPlayer) => (Name: string): player => {
    const user = Player.User;
    return {
        User: user,
        colorSet: Player.colorSet,
        Controls: user.Controls,
        Faction: Player.Faction,
        Name,
        Vehicles: [],
        Loses: [],
        hasMoved: false,
    };
};
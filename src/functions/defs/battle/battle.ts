import { last, pop } from "../../functions";
import { player, singleBattle } from "../../types/types";

export const battleTemplate = {
    Players: [],
    Vehicles: [],
    Losses: [],
    Retreated: [],
    Stage: 0,
    Moves: {},

    //This is for inside the battle
    Map: {Space: [], Ground: [], Domains: []},

    //This is for the Sector Map
    Locations: [],

    Type: "",

    PlayerCount: 0
};

export const createBattle = loc => player => {
    const ID = player.User.ID;
    return {
        Players: [player],
        Losses: [],
        Retreated: [],
        Vehicles: [],
        Moves: {
            Data: [""],
            Phase: [loc.Turn],
            Turns: [""],
            [ID]: [""]
        },
        Stage: 0,
        Map: loc.Map,
        Locations: [loc.Loc],
        Type: "Game",
        Display: []
    };
};

export type battleData = {
    Map: "Space",
    PlayerCount: number, 
    Size: singleBattle["Size"],
    Title: string, 
    Discoverable: boolean, 
    Online: boolean,
    
    id: string
}

export const createSingleBattle = (player: player, data: battleData): singleBattle => {
    const ID = player.User.ID;
    const {Map, PlayerCount, Size, Title, Discoverable, Online, id} = data;
    return {
        Title,
        Players: colorPlayers([], player),
        Losses: [],
        Retreated: [],
        Vehicles: [],
        Moves: {
            Data: [""],
            Turns: ["P-"],
            [ID]: ["P-"]
        },
        Stage: 0,
        Map,
        Type: {Type: "Unique", Discoverable, Joinable: PlayerCount > 1 && Online, Online },
        PlayerCount,
        Size,
        
        
        id,
        version: "5.0"
    };
};

const colorPlayers = (players: player[], addedPlayer: player) => {
    const addedPlayerColors = {};
    players.forEach(player => addedPlayerColors[player.User.ID] = addedPlayer.colorSet[player.Faction]);
    const modAddedPlayer = {
        ...addedPlayer, 
        colorSet: {...addedPlayer.colorSet,
            ...addedPlayerColors
        }};
    return [...players, modAddedPlayer].map(player => {
        return {...player, colorSet:{...player.colorSet, [addedPlayer.User.ID]: player.colorSet[addedPlayer.Faction]}};
    });
};

export const addPlayer = game => player => {
    const ID = player.User.ID;
    const {Type, Players, PlayerCount, Stage} = game;
    const isUnique = Type === "Unique";

    if (isUnique && Players.length >= PlayerCount) return game;
    if (Stage !== 2 && Stage !== 0) return game;
    if (Players.some(play => play.User.ID === ID)) return game;

    const Moves = game.Moves;
    const pMoves = Moves.Turns.map(() => "N-Skip");
    const moveType = Stage === 0 ? "P-":"U-";
    const playerMoves = [...pop(pMoves), moveType];
    const nDataMoves = [...pop(Moves.Data), last(Moves.Data) + `A.${ID};`];
    const nMoves = {...Moves, Data: nDataMoves, [ID]: playerMoves};
    return {
        ...game,
        Moves: nMoves,
        Players: colorPlayers(Players, player)
    };
};
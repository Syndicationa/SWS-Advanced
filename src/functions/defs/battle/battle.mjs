import { last, pop } from "../../functions.mjs";

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
}

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
    }
}

export const singleBattle = player => data => {
    const ID = player.User.ID;
    const {Map, PlayerCount, } = data;
    return {
        Players: [player],
        Losses: [],
        Retreated: [],
        Vehicles: [],
        Moves: {
            Data: [""],
            Turns: [""],
            [ID]: [""]
        },
        Stage: 0,
        Map,
        Type: "Unique",
        PlayerCount,
        Display: [],
    }
}

export const addPlayer = game => player => {
    const ID = player.User.ID;
    const {Type, Players, PlayerCount, Stage} = game;
    const isUnique = Type === "Unique";

    if (isUnique && Players.length >= PlayerCount) return game;
    if (Stage !== 2 && Stage !== 0) return game;
    if (Players.some(play => play.User.ID === ID)) return game;

    return {
        ...game,
        Players: [...Players, player],
    }

}

const addPlayerMove = game => player => {
    const ID = player.User.ID;
    const Moves = game.Moves;
    const pMoves = Moves.Turns.map(() => 'N-Skip');
    const playerMoves = [...pop(pMoves), ""];
    const nDataMoves = [...pop(Moves.Data), last(Moves.Data) + `A.${ID};`];
    const nMoves = {...Moves, Data: nDataMoves, [ID]: playerMoves};
    return {
        ...game,
        Moves: nMoves
    }
}

export const addPlayMove = game => player => addPlayerMove(addPlayer(game)(player))(player);
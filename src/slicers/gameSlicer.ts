import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
//import { Player } from "../functions/defs";
// import { clone } from "../functions/functions";
import { collection, doc, query, getDoc, getDocs, where } from "firebase/firestore";
import { database } from "../firebase";
import { isSingleBattle, singleBattle } from "../functions/types/types";
//import { updatePlayer } from "./playerActions";

type games = {allGames: singleBattle[], playerGames: singleBattle[]}
const initialState: games = {allGames: [], playerGames: []};

const gameRef = collection(database, "games");

const getGame = async (gameName: string) => {
    const game = await getDoc(doc(gameRef, gameName));
    if (game.exists()) {
        return game.data();
    }
};

const getGames = async (gameList: string[]) => {
    const games: singleBattle[] = [];
    for (let x = 0; x < gameList.length; x++) {
        const game = await getGame(gameList[x]);
        if (!isSingleBattle(game)) continue;
        games.push(game);
    }
    return games;
};

export const fetchPlayerGames = createAsyncThunk(
    "game/fetchPlayerGames",
    async (gameList: string[]) => {
        const games = await getGames(gameList);
        return games;
    }
);

export const fetchAvailableGames = createAsyncThunk(
    "game/fetchAvailableGames",
    async () => {
        const gList = query(gameRef, where("discoverable", "==", true), where("joinable", "==", true));
        // const gList = query(gameRef);
        const games = await getDocs(gList);
        if (games.empty) return [];
        const gameData: singleBattle[] = [];
        games.forEach((gameContainer) => {
            const game = gameContainer.data();
            if (isSingleBattle(game)) 
                gameData.push(game);
        });
        return gameData;
    }
);

const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        newGame (state) {
            return state;
        },

        updateGame (state, update) {
            state.playerGames = state.playerGames.map((val) => val.id === update.payload.id ? update.payload: val);
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchPlayerGames.fulfilled, (state, action) => {
            const games = action.payload;
            state.playerGames = games;
        });
        builder.addCase(fetchAvailableGames.fulfilled, (state, action) => {
            const games = action.payload;
            state.allGames = games;
        });
    }
});

export const {newGame, updateGame} = gameSlice.actions;
export default gameSlice.reducer;
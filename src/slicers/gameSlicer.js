import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
//import { Player } from "../functions/defs";
// import { clone } from "../functions/functions";
import { collection, doc, query, getDoc, getDocs } from "firebase/firestore";
import { database } from "../firebase";
//import { updatePlayer } from "./playerActions";

const initialState = {allGames: [], playerGames: []};

const gameRef = collection(database, "games");

const getGame = async (gameName) => {
    const game = await getDoc(doc(gameRef, gameName));
    if (game.exists()) {
        return game.data();
    }
};

const getGames = async (gameList) => {
    let games = [];
    for (let x = 0; x < gameList.length; x++) {
        const game = await getGame(gameList[x]);
        games.push(game);
    }
    return games;
};

export const fetchPlayerGames = createAsyncThunk(
    "game/fetchPlayerGames",
    async (gameList) => {
        const games = await getGames(gameList);
        return games;
    }
);

export const fetchAvailableGames = createAsyncThunk(
    "game/fetchAvailableGames",
    async () => {
        //const gList = query(gameRef, where("discoverable", "==", true), where("joinable", "==", true));
        const gList = query(gameRef);
        const games = await getDocs(gList);
        if (games.empty) return;
        let gameData = [];
        games.forEach((game) => {
            gameData.push(game.data());
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
            state.playerGames = state.playerGames.map((val) => val.id === update.id ? update: val);
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
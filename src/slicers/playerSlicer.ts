import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAuth, signInWithPopup } from "@firebase/auth";
import {collection, doc, setDoc, getDoc} from "firebase/firestore";
import { gProvider, database } from "../firebase";
// import { fetchGames } from "./gameSlicer";
// import { clone } from '../functions/functions'

const userRef = collection(database, "users");

const initialState = {
    user: {
        Username: "",
        //Letters for Up, Down, Left, Right, Action, Back, Info, End Turn, Zoom In, Zoom Out
        Controls: ["w","s","a","d","e","q","f","r","Alt"," "],
        DefaultFaction: "Astute",
        exoticFactions: false,
        WinLoss: [0,0,0],
        RuleSet: {
            hPlayerCount: 1,
            cPlayerCount: 0,
            layerCount: 2,
            layers: [8,16],
            gameType: "Deathmatch",
            joinability: "Public"
        },
        colorSet: {
            Astute: "#0000ff",
            Blade: "#ff0000"
        },
        games: [],
        unsubGames: [],
        ID: "A"
    },
    loggedIn: false
};

const getUserID = async () => {
    console.log("Getting ID");
    const auth = getAuth();
    const result = await signInWithPopup(auth, gProvider);
    if (!result) return false;
    const user = result.user;
    const userID = user.reloadUserInfo.localId;
    if (!userID) {
        alert("Failed to retrieve your User ID, please try again later");
        return;
    }
    return userID;
};

export const fetchPlayer = createAsyncThunk(
    "player/fetchPlayer",
    async (data) => {
        const userID = await getUserID();
        if (!userID) return;

        const playerData = await getDoc(doc(userRef,userID));
        const player = playerData.data();
        if (!playerData) return;
    
        player.factionList = player.exoticFaction ? data.exoticFactions: data.factionNames;
        player.colorSet = {...data.factionColors, ...player.colorSet};
    
        return player;
    }
);

export const createPlayer = createAsyncThunk(
    "player/createPlayer",
    async (data) => {
        const userID = await getUserID();
        if (!userID) return;
        const playerData = {...data, userID: userID};
        await setDoc(doc(userRef,userID),playerData);

        return playerData;
    }
);

const playerSlice = createSlice({
    name: "player",
    initialState,
    reducers: {
        updatePlayer: (state, action) => {
            const player = action.payload;
            setDoc(doc(userRef, player.userID), player);
            state.player = player;
        },

        logOutPlayer: (state) => {
            state.player = initialState.player;
            state.loggedIn = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchPlayer.fulfilled, (state, action) => {
            const player = action.payload;
            if (!player) return;
            state.player = player;
            state.loggedIn = true;
        });
        builder.addCase(createPlayer.fulfilled, (state, action) => {
            const player = action.payload;
            if (!player) return;
            state.player = player;
            state.loggedIn = true;
        });
    }
});

export const { updatePlayer, logOutPlayer} = playerSlice.actions;

export default playerSlice.reducer;

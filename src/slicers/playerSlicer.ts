import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAuth, signInWithPopup } from "@firebase/auth";
import {collection, doc, setDoc, getDoc} from "firebase/firestore";
import { gProvider, database } from "../firebase";
import { isUser, user } from "../functions/types/types";
import { Data } from "../functions/types/data";
// import { fetchGames } from "./gameSlicer";
// import { clone } from '../functions/functions'

const userRef = collection(database, "users");

const initialState: {user: user, loggedIn: boolean} = {
    user: {
        Username: "",
        //Letters for Up, Down, Left, Right, Action, Back, Info, End Turn, Zoom In, Zoom Out
        Controls: ["w","s","a","d","e","q","f","r","Alt"," "],
        DefaultFaction: "Astute",
        exoticFactions: false,
        WinLoss: [0,0,0],
        RuleSet: {
            HumanPlayerCount: 2,
            ComputerPlayerCount: 0,
            Size: {OverallSize: 128, StepSizes: [16,1]},
            Type: {Type: "Unique", Discoverable: false, Online: true},
            Map: "Space",
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
    console.log(user);
    const userID = user.uid;
    if (!userID) {
        alert("Failed to retrieve your User ID, please try again later");
        return;
    }
    return userID;
};

export const fetchPlayer = createAsyncThunk(
    "player/fetchPlayer",
    async (data: Data) => {
        const userID = await getUserID();
        if (!userID) return;

        const playerData = await getDoc(doc(userRef,userID));
        const player = playerData.data();
        if (player === undefined) return;
        if (!isUser(player)) return;
        //player.factionList = player.exoticFaction ? data.exoticFactions: data.factionNames;
        player.colorSet = {...data.factionColors, ...player.colorSet};
    
        return player;
    }
);

export const createPlayer = createAsyncThunk(
    "player/createPlayer",
    async (data: user) => {
        const userID = await getUserID();
        if (!userID) return;
        const playerData = {...data, ID: userID};
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
            if (!isUser(player)) return;
            setDoc(doc(userRef, player.ID), player);
            state.user = player;
        },

        logOutPlayer: (state) => {
            state.user = initialState.user;
            state.loggedIn = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchPlayer.fulfilled, (state, action) => {
            const player = action.payload;
            if (!isUser(player)) return;
            state.user = player;
            state.loggedIn = true;
        });
        builder.addCase(createPlayer.fulfilled, (state, action) => {
            const player = action.payload;
            if (!isUser(player)) return;
            state.user = player;
            state.loggedIn = true;
        });
    }
});

export const { updatePlayer, logOutPlayer} = playerSlice.actions;

export default playerSlice.reducer;

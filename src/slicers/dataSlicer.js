import { createSlice } from "@reduxjs/toolkit";
import {doc, getDoc} from "firebase/firestore";
import { database } from '../firebase';
import { data } from "./dataInit";

const initialState = data;

const dataRef = doc(database, "Data","data");

const dataSlice = createSlice({
    name: "data",
    initialState,
    reducers: {
        fetchData: async (state) => {
            const fData = await getDoc(dataRef);
            const factionData = fData.data();
            if (!factionData) return;
            state = factionData;
        },
        setData (state, data) {
            if (!data) return;
            state = data;
        }
    }
})

export const {fetchData, setData} = dataSlice.actions;
export default dataSlice.reducer;
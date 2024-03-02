import {configureStore} from "@reduxjs/toolkit";
import gameReducer from "./slicers/gameSlicer";
import playerReducer from "./slicers/playerSlicer";
import dataReducer from "./slicers/dataSlicer";

const reducer = {
    game:gameReducer,
    player:playerReducer,
    data: dataReducer
};

export const store = configureStore({reducer});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
import {configureStore} from '@reduxjs/toolkit'
import gameReducer from './slicers/gameSlicer';
import playerReducer from './slicers/playerSlicer';
import dataReducer from './slicers/dataSlicer';

const reducer = {
    game:gameReducer,
    player:playerReducer,
    data: dataReducer
};

export const store = configureStore({reducer});
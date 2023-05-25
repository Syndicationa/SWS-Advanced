import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GameUI } from './GameUI'
import { clone } from '../../../functions/functions'
import { cursorGenerator } from '../../../functions/defs/cursor.mjs'

export const SkirmishController = ({game, close}) => {
    //Getting Info from Store
    const playerAcc = useSelector((state) => state.player.player);

    const dispatch = useDispatch();
    //Firebase snapshot
    const [snapShot, setSnapShot] = useState(null);

    const [gameData, setGData] = useState(game);
    const local = gameData.local;

    const [players, setPlayers] = useState(() => clone(gameData.players));
    const [currentPlayer, setCPlayer] = useState(() => {
        if (local) return 0;
        return players.findIndex((player) => player.ID === player.userID);
    });

    const updatePlayer = useCallback((playerData, playerNum, replace = false) => {
        let playerList = clone(players);
        if (replace) playerList[playerNum] = playerData;
        else {
            for (let key in playerData) {
                playerList[playerNum][key] = playerData[key];
            }
        }
        setPlayers(playerList);
        return
    }, [players]);

    //#region Stages and Impulses
    const [active, setActive] = useState(!players[currentPlayer].hasMoved);
    const [stage, setStage] = useState(gameData.Stage);
    const [attackList, setAttackList] = useState([]);
    //#endregion

    //#region Grid and Cursors
    const [grid, setGrid] = useState(gameData.Size);
    const [cursor, setCursor] = useState(cursorGenerator());
    //#endregion



    const closeFunction = () => {
        //SaveGame
        close();
    }

    return (
        <GameUI game={gameData} input={cursor} close={closeFunction} />
    )
}

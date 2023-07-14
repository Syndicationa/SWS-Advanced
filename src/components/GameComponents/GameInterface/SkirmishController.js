import React, { /*useCallback,*/ useState } from 'react'
//import { useDispatch, useSelector } from 'react-redux'
import { GameUI } from './GameUI'
//import { clone } from '../../../functions/functions'
import { cursorGenerator, moveCursor, moveCursorToPosition, zoom } from '../../../functions/defs/cursor.mjs'
import { sumArrays } from '../../../functions/functions.mjs'

const game = {
    title: "Test Game",
    gameMode: "Space",
    sDataType: "",
    sData: [],
    list: [],
    dispFunc: () => {},
    players: [],
    cPlayer: 0,
    updatePlayer: () => {},
    local: true,
    active: true,
    stage: 0
}

export const SkirmishController = ({g, close}) => {
    /*
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
    */
    const [cursor, setCursor] = useState(cursorGenerator());
    //#endregion
    const input = {
        system: {
            zoomOut: () => setCursor(zoom(cursor,-1)),
            zoomIn: () => setCursor(zoom(cursor, 1)),
        },
        cursor,
        moveCursor: (vec) => setCursor(moveCursor(cursor, vec)),
        moveCursorTo: (pos) => setCursor(moveCursorToPosition(cursor, pos))
    }

    const sData = [`Position: ${cursor.loc}\nRegion Data: ${cursor.region.xStep}`]
    //console.log(cursor.region); console.log(cursor.loc);

    const closeFunction = () => {
        //SaveGame
        close();
    }

    return (
        <GameUI game={{...game, sData}} input={input} close={closeFunction} />
    )
}
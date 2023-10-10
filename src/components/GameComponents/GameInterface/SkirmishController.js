import React, { /*useCallback,*/ useCallback, useState } from 'react'
//import { useDispatch, useSelector } from 'react-redux'
import { GameUI } from './GameUI'
//import { clone } from '../../../functions/functions'
import { cursorGenerator, moveCursor, moveCursorToPosition, zoom } from '../../../functions/defs/cursor.mjs'
import { replaceInArray } from '../../../functions/functions.mjs'
import { playerTemplate, singleBattleTemplate } from '../../../functions/defs/templates'
import { useDispatch, useSelector } from 'react-redux'

const game = {
    title: "Test Game",
    gameMode: "Space",
    sDataType: "",
    shipData: [],
    list: [],
    dispFunc: () => {},
    players: [playerTemplate],
    cPlayer: 0,
    updatePlayer: () => {},
    local: true,
    active: true,
    stage: 0
}

export const SkirmishController = ({g = singleBattleTemplate, Data, close}) => {
    const user = useSelector(state => state.player);

    const [local] = useState(!g.Type.Online);
    const [active, setActive] = useState(true);
    const [stage, setStage] = useState(g.Stage);
    const [attackList, setAttackList] = useState([]);

    const [players, setPlayers] = useState(() => g.Players);
    const [currentPlayer, setCurrentPlayer] = useState(() => {
        if (local) return 0;
        return players.findIndex(play => user.ID === play.User.ID);
    });
    const [player, setPlayer] = useState(players[currentPlayer]);

    const dispatch = useDispatch();
    //Firebase snapshot
    const [snapShot, setSnapShot] = useState(null);

    const updatePlayer = useCallback((playerData) => {
        const playerIndex = players.findIndex((play) => play.User.ID === playerData.User.ID);
        setPlayers(replaceInArray(players, playerIndex, playerData));
    }, [players]);

    const [cursor, setCursor] = useState(cursorGenerator(g.Size));

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
        <GameUI game={{...g, sData}} input={input} close={closeFunction} />
    )
}

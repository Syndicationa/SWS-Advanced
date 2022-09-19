import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GameUI } from './GameUI'
import { clone } from '../../../functions/functions'

export const SkirmishController = ({game, close}) => {
    //Getting Info from Store
    const playerAcc = useSelector((state) => state.player.player);

    const dispatch = useDispatch();
    //Firebase snapshot
    const [snapShot, setSnapShot] = useState(null);

    const [gameData, setGData] = useState();
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
    const [stage, setStage] = useState(mainGame.stage);
    const [attackList, setAttackList] = useState([]);
    //#endregion

    //#region Grid and Cursors
    const grSize = mainGame.grSize;
    const [cLoc, setCursorLoc] = useState(() => {
        return grSize.map(() => [0,0])});
    const [cRot, setCursorRot] = useState(-1);
    const [cMenu, setCursorMenu] = useState(-1);
    const [cData, setCursorData] = useState([0,0]);
    const [cLevel, setLevel] = useState(0);
    const [info, setInfo] = useState(false);
    //#endregion



    const closeFunction = () => {
        //SaveGame
        close();
    }

    return (
        <GameUI game={0} input={0} close={closeFunction} />
    )
}

import React, { /*useCallback,*/ useCallback, useEffect, useMemo, useState } from 'react'
//import { useDispatch, useSelector } from 'react-redux'
import { GameUI } from './GameUI'
//import { clone } from '../../../functions/functions'
import { cursorGenerator, moveCursor, moveCursorToPosition, zoom } from '../../../functions/defs/cursor.mjs'
import { replaceInArray } from '../../../functions/functions.mjs'
import { singleBattleTemplate, vehicleTemplate } from '../../../functions/defs/templates'
import { useDispatch, useSelector } from 'react-redux'
import { pressFunction } from '../../../functions/defs/battle/control.mjs'
import { magnitude, sub } from '../../../functions/vectors.mjs'
import { createDisplay } from '../../../functions/defs/display.mjs'

const generateVehicleList = (vehicles = [vehicleTemplate], cursor = cursorGenerator(), setCursor = () => {}) => {
    const options = vehicles.map((vehicle, i) => {
        const name = vehicle.Appearance.name ?? vehicle.Type.Class;
        const currentHP = vehicle.State ? vehicle.State.hp:vehicle.Stats.MaxHP;
        const maxHP = vehicle.State ? vehicle.State.hp:vehicle.Stats.MaxHP;
        return <div className={`Option ${cursor.menu === i ? 'Selected':''}`}>
            {name}
            <br />
            HP: {currentHP}/{maxHP}
            <br />
            <button onClick={setCursor({...cursor, menu: i})}>Select</button>
        </div>
    })
    return options
}

export const SkirmishController = ({g = singleBattleTemplate, Data, close}) => {
    const user = useSelector(state => state.player);

    const [game, setGame] = useState(g);

    //#region Game Info
    const [local] = useState(!game.Type.Online);
    const [active, setActive] = useState(true);
    const [stage, setStage] = useState(game.Stage);
    const [step, setStep] = useState(0);
    const [attackList, setAttackList] = useState([]);
    //#endregion

    //#region Players
    const [players, setPlayers] = useState(() => game.Players);
    const [currentPlayer, setCurrentPlayer] = useState(() => {
        if (local) return 0;
        return players.findIndex(play => user.ID === play.User.ID);
    });
    const [player, setPlayer] = useState(players[currentPlayer]);

    const updatePlayer = useCallback((playerData) => {
        const playerIndex = players.findIndex((play) => play.User.ID === playerData.User.ID);
        setPlayers(replaceInArray(players, playerIndex, playerData));
    }, [players]);
    //#endregion

    //#region Database
    const dispatch = useDispatch();
    //Firebase snapshot
    const [snapShot, setSnapShot] = useState(null);
    //#endregion

    const [cursor, setCursor] = useState(cursorGenerator(game.Size));

    //#region Game Systems
    const [press] = useState(pressFunction(Data));
    const [selectedVehicle, setSelectedVehicle] = useState();
    const [currentFunction, setCurrentFunction] = useState();
    const [activeVehicles, setActiveVehicles] = useState(game.Vehicles);
    const [Display, setDisplay] = useState(() => createDisplay(game.Size.OverallSize)());
    const [selection, setSelection] = useState(1);
    const [list, setList] = useState([]);
    const data = [`Position: ${cursor.loc}\nRegion Data: ${cursor.region.xStep}`]

    useEffect(() => {
        setDisplay(createDisplay(game.Size.OverallSize));
    }, [activeVehicles, game.Size.OverallSize]);

    useEffect(() => {
        if (cursor.mode === "Move") return;
        setList(generateVehicleList(cursor.data, cursor, setCursor))
    }, [cursor])
    //#endregion

    const State = useMemo(() => {
        return {
            cursor, setCursor,
            selectedVehicle, setSelectedVehicle,
            currentFunction, setCurrentFunction,
            activeVehicles, setActiveVehicles,
            player, players,
            stage, active,
            step, setStep,
            setList, setSelection,
            attackList, setAttackList
        }
    }, [cursor, selectedVehicle, currentFunction, activeVehicles, player, players, stage, active, step, attackList])

    const input = useMemo(() => {
        return {
            system: {
                zoomOut: () => setCursor(zoom(cursor,-1)),
                zoomIn: () => setCursor(zoom(cursor, 1)),
            },
            cursor,
            moveCursor: 
                (vec) => magnitude(vec) === 0 ? 
                    press(State):
                    setCursor(moveCursor(cursor, vec)),
            moveCursorTo: 
                (pos) => magnitude(sub(cursor.loc,pos)) === 0 ? 
                    press(State): 
                    setCursor(moveCursorToPosition(cursor, pos))
        }
    }, [cursor, State, press])

    const closeFunction = () => {
        //SaveGame
        close();
    }

    return (
        <GameUI game={{...g, data, list, selection, Display}} input={input} close={closeFunction} />
    )
}

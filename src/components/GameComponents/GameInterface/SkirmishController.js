import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PropTypes } from "prop-types";
import { GameUI } from "./GameUI";

import { replaceInArray } from "../../../functions/functions.mjs";
import { magnitude, sub } from "../../../functions/vectors.mjs";

import { singleBattleTemplate } from "../../../functions/defs/templates.mjs";
import { cursorGenerator, fixCursorPosition, moveCursor, moveCursorToPosition, zoom } from "../../../functions/defs/cursor.mjs";
import { createDisplay, getFromDisp } from "../../../functions/defs/display.mjs";

import { pressFunction } from "../../../functions/defs/battle/control.mjs";
import { nextPhase, runMove, runTurn } from "../../../functions/defs/battle/stage.mjs";
import { mergeShipArrays } from "../../../functions/defs/vehicle/retrieve.mjs";

import { generateButtonedVehicles, generateStringList, generateVehicleList } from "../../../functions/listGenerator.mjs";

const SkirmishController = ({g = singleBattleTemplate, Data, close}) => {
    const user = useSelector(state => state.player);

    const [game, setGame] = useState(g); //Core game that playerGames are built on
    const [playerGame, setPlayerGame] = useState(g); //Game used for the player's turns
    const [moves, setMoves] = useState(g.Moves);
    const [cursor, setCursor] = useState(cursorGenerator(game.Size));

    //#region Constant Data
    const [press] = useState(() => pressFunction(Data));
    const [run] = useState(() => runMove(Data));
    const [turn] = useState(() => runTurn(Data));
    const [local] = useState(!game.Type.Online);
    //#endregion

    //#region Game Data
    const stage = useMemo(() => game.Stage, [game.Stage]);
    const [impulse, setImpulse] = useState(0);
    const [active, setActive] = useState(true);

    const [selectedVehicle, setSelectedVehicle] = useState();
    const [currentFunction, setCurrentFunction] = useState();

    const activeVehicles = useMemo(() => playerGame.Vehicles, [playerGame.Vehicles]);
    const display = useMemo(() => createDisplay(game.Size.OverallSize)(selectedVehicle ? mergeShipArrays(activeVehicles, [selectedVehicle]): activeVehicles), 
        [activeVehicles, selectedVehicle, game.Size.OverallSize]);
    //#endregion

    //#region Players
    const players = useMemo(() => game.Players, [game]);
    const [currentPlayer, setCurrentPlayer] = useState(() => {
        if (local) return 0;
        return players.findIndex(play => user.ID === play.User.ID);
    });
    const player = useMemo(() => players[currentPlayer], [players, currentPlayer]);

    const updatePlayer = useCallback((playerData) => {
        const playerIndex = players.findIndex((play) => play.User.ID === playerData.User.ID);
        const newPlayers = replaceInArray(players, playerIndex, playerData);
        setGame(previousGame => {return {...previousGame, Players: newPlayers};});
        return newPlayers;
    }, [players]);

    const updateHasMoves = useCallback(() => {
        setGame(previousGame => {
            return {
                ...previousGame, 
                Players: previousGame.Players.map(
                    playerData => {
                        return {...playerData, hasMoved: false};
                    })
            };
        });
    }, [players]);
    //#endregion

    //#region Database
    // const dispatch = useDispatch();
    //Firebase snapshot
    // const [snapShot, setSnapShot] = useState(null);
    //#endregion

    //#region UI
    const [selection, setSelection] = useState(1);
    const [listType, setListType] = useState("Vehicle");
    const list = useMemo(() => {
        if (listType === "Message") return generateStringList(cursor.data, cursor, setCursor);
        else if (cursor.mode === "Menu") return generateButtonedVehicles(cursor.data, cursor, setCursor);
        else if (cursor.mode === "Move") return generateVehicleList(getFromDisp(display, cursor.loc, cursor.loc));
    }, [cursor]);
    const data = [`Position: ${cursor.loc} Region Data: ${cursor.region.xStep}`];
    const [attackList, setAttackList] = useState([]);
    //#endregion

    const State = useMemo(() => {
        return {
            playerGame, setPlayerGame,
            moves, setMoves,
            cursor, setCursor,
            run,
            stage, impulse, setImpulse,
            activeVehicles, display,
            selectedVehicle, setSelectedVehicle,
            currentFunction, setCurrentFunction,
            player,
            setListType,
            setSelection,
            setAttackList
        };
    }, [playerGame, moves, cursor, stage, impulse, activeVehicles, selectedVehicle, currentFunction, player]);

    const nextPlayer = useCallback(() => {
        if (local) {
            setGame(previousGame => {
                setCurrentPlayer(currentPlayer + 1);
                const newGame = {...previousGame, Moves: moves};
                setPlayerGame(newGame);
                return newGame;
            });    
        } else {
            setActive(false);
            //Do Database stuff
        }
    }, [currentPlayer]);

    const endTurn = useCallback(() => {
        const newPlayers = updatePlayer({...player, hasMoved: true});
        const allMoved = newPlayers.every((playerObject) => playerObject.hasMoved);

        if (!allMoved) {
            nextPlayer();
            return;
        }
        setGame(previousGame => {
            const [changedGame] = turn({...previousGame, Moves: moves}, moves);
            const game = nextPhase(changedGame);
            setPlayerGame(game);
            setMoves(game.Moves);
            return game;
        });

        updateHasMoves();

        if (local) {
            setCurrentPlayer(0);
            return;
        }
        //Database stuff
    }, [player, moves, updatePlayer, nextPlayer]);

    const input = useMemo(() => {
        return {
            system: {
                zoomOut: () => setCursor(zoom(cursor,-1)), 
                zoomIn: () => setCursor(zoom(cursor, 1)),
                endTurn: () => endTurn(),
                group: () => console.log(currentPlayer, players),
                ungroup: () => console.log(game),
                info: () => console.log(playerGame),
                back: () => console.log(moves),
            },
            cursor,
            moveCursor: 
                (vec) => magnitude(vec) === 0 ? 
                    press(State):
                    setCursor(moveCursor(cursor, vec)),
            moveCursorTo: 
                (pos) => magnitude(sub(cursor.loc,fixCursorPosition(cursor, pos))) === 0 ? 
                    press(State): 
                    setCursor(moveCursorToPosition(cursor, pos))
        };
    }, [cursor, State, press]);

    const uiGame = useMemo(() => {
        return {
            ...game,
            data,
            active,
            stage,
            impulse,
            players, updatePlayer, currentPlayer,
            display,
            list,
            selection,
            attackList
        };
    }, [display, active, data, list, players, selection, stage, impulse, game, updatePlayer]);

    const closeFunction = () => {
        //SaveGame
        close();
    };

    return (
        <GameUI game={uiGame} input={input} close={closeFunction} />
    );
};

SkirmishController.propTypes = {
    g: PropTypes.object,
    Data: PropTypes.object,
    close: PropTypes.func,
};

export {SkirmishController};
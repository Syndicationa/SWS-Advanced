import { useCallback, useMemo, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { GameUI } from "./GameUI";

import { replaceInArray } from "../../../functions/functions";
import { magnitude, sub } from "../../../functions/vectors";

import { cursorGenerator, fixCursorPosition, moveCursor, moveCursorToPosition, zoom } from "../../../functions/defs/cursor";
import { createDisplay, getFromDisp } from "../../../functions/defs/display";

import { pressFunction } from "../../../functions/defs/battle/control";
import { nextPhase, runGame, runMove, runTurn } from "../../../functions/defs/battle/stage";
import { mergeVehicleArrays } from "../../../functions/defs/vehicle/retrieve";

import { generateButtonedControl, generateButtonedVehicles, generateButtonedWeapons, generateStringList, generateVehicleList } from "../../../functions/listGenerator";
import { locationVector, singleBattle, velocityVector } from "../../../functions/types/types";
import { isStringArray, isVehicleArray, isWeaponArray } from "../../../functions/types/cursorTypes";
import { isVehicle, vehicle } from "../../../functions/types/vehicleTypes";
import { currentArgs } from "../../../functions/types/FunctionTypes";
import { Data } from "../../../functions/types/data";
import { determineStealth, oldArea } from "../../../functions/defs/vehicle/vehicle";

type props = {
    g: singleBattle,
    Data: Data,
    close: () => void,
};

export const SkirmishController = ({g, Data, close}: props) => {
    const user = useAppSelector(state => state.player);

    const [game, setGame] = useState(() => runGame(Data)(g)[0]); //Core game that playerGames are built on
    const [playerGame, setPlayerGame] = useState(game); //Game used for the player's turns
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

    const [selectedVehicle, setSelectedVehicle] = useState<vehicle | undefined>();
    const [currentArgs, setCurrentArgs] = useState<currentArgs>([]);

    const activeVehicles = useMemo(() => playerGame.Vehicles, [playerGame.Vehicles]);
    const display = useMemo(() => createDisplay(game.Size.OverallSize)(selectedVehicle ? mergeVehicleArrays(activeVehicles, [selectedVehicle]): activeVehicles), 
        [activeVehicles, selectedVehicle, game.Size.OverallSize, playerGame]);
    //#endregion

    //#region Players
    const players = useMemo(() => game.Players, [game]);
    const [currentPlayer, setCurrentPlayer] = useState(() => {
        if (local) return 0;
        return players.findIndex(play => user.user.ID === play.User.ID);
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
    const list = useMemo(() => {
        if (isStringArray(cursor.data)) return generateStringList(cursor.data, cursor, setCursor);
        if (isVehicleArray(cursor.data)) return generateButtonedVehicles(cursor.data, cursor, setCursor);
        if (isWeaponArray(cursor.data)) return generateButtonedWeapons(cursor.data, cursor, setCursor, currentArgs);
        return generateVehicleList(getFromDisp(display, cursor.loc, cursor.loc));
        if (typeof cursor.data === "function" && isVehicle(cursor.data.data)) return generateButtonedControl([cursor.data.data], cursor, setCursor);
    }, [cursor]);
    const data = [`Position: ${cursor.loc} Region Data: ${cursor.region.xStep}`];
    const [attackList, setAttackList] = useState<string[]>([]);
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
            currentArgs, setCurrentArgs,
            player,
            setSelection,
            setAttackList
        };
    }, [playerGame, moves, cursor, stage, impulse, activeVehicles, selectedVehicle, currentArgs, player]);

    const nextPlayer = useCallback(() => {
        if (local) {
            setGame(previousGame => { 
                setCurrentPlayer(currentPlayer + 1);
                const visibleVehicles = previousGame.Vehicles.map((vehicle, i, vehicleArray) => 
                    determineStealth(vehicleArray, vehicle, players[currentPlayer + 1]));
                const newGame = {
                    ...previousGame, 
                    Moves: moves, 
                    Vehicles: visibleVehicles.map((vehicle) => oldArea(vehicle))
                };
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
            const game = nextPhase(changedGame, players[0]);
            console.log(game.Moves);
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
                (vec: velocityVector) => magnitude(vec) === 0 ? 
                    press(State):
                    setCursor(moveCursor(cursor, vec)),
            moveCursorTo: 
                (pos: locationVector) => magnitude(sub(cursor.loc,fixCursorPosition(cursor, pos))) === 0 ? 
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
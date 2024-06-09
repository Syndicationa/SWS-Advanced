import { useState, useEffect, useMemo } from "react";
import { replaceInArray } from "../../functions/functions";
import { Section } from "../Sections/Section";
// import { newGame } from '../../slicers/gameSlicer';
// import { initialState } from '../../slicers/playerSlicer';
import { PlayerEditor } from "../Player/PlayerEditor";
import { useAppSelector } from "../../hooks";
import { player, singleBattle, user } from "../../functions/types/types";
import { playerMaker } from "../../functions/defs/player/player";
import "./GameManagers.css";
import { addPlayer, battleData, createSingleBattle } from "../../functions/defs/battle/battle";

const create = (players: player[], data: battleData) => {
    const battle: singleBattle = players.reduce(
        (battle, player, id) => {
            if (id === 0) return createSingleBattle(player, data);
            return addPlayer(battle)(player);
        }, {});

    console.log(battle);
};

type returnLayers = [number[], (val: number) => void, (layer: number, value: number) => void];
const useLayers = (initialLayers: number[]): returnLayers => {
    const [layers, setLayers] = useState(initialLayers);

    const changeLayerCount = (val: number) => {
        const difference = val - layers.length;
        if (difference > 0) {
            const nLayers = new Array(difference).fill(8);
            setLayers((previous) => [...previous, ...nLayers]);
        } else if (difference < 0) {
            setLayers((previous) => previous.slice(0, val));
        }
    };

    const changeLayer = (layer: number, value: number) => {
        setLayers(replaceInArray(layers, layer, value));
    };

    return [layers, changeLayerCount, changeLayer];
};

type returnPlayer = [number, React.Dispatch<React.SetStateAction<number>>, player[], (index: number, player: player) => void];
const usePlayers = (user: user): returnPlayer => {
    const convertedPlayer: player = playerMaker(user)({Faction: user.DefaultFaction, Name: user.Username});

    const [playerCount, setPlayerCount] = useState(1);
    const [playerList, setPlayer] = useState([convertedPlayer]);

    const updatePlayer = (index: number, player: player) => {
        setPlayer(replaceInArray(playerList, index, player));
    };

    useEffect(() => {
        const difference = playerCount - playerList.length;
        if (difference <= 0) return;
        const nPlayers: player[] = 
            new Array(difference)
                .fill(playerMaker(user)({Faction: user.DefaultFaction, Name: "New Player"}));
        setPlayer([...playerList, ...nPlayers]);
    }, [playerCount]);

    return [playerCount, setPlayerCount, playerList.slice(0, playerCount), updatePlayer];
};

export const CreateGame = () => {
    // const dispatch = useDispatch();
    const {user, loggedIn} = useAppSelector((state) => state.player);

    // const data = useSelector((state) => state.data);
    const gameModes = ["Skirmish", "System"];
    const maps = {Skirmish: ["Space", "Air", "Land", "Sea"], System: ["Sol"]};

    const [title, setTitle] = useState("New Game");

    const [layers, changeLayerCount, changeLayer] = useLayers([16]);
    const [playerCount, setPlayerCount, playerList, updatePlayer] = usePlayers(user);

    const [gameMode, setGameMode] = useState(gameModes[0]);
    const [gameMap, setGameMap] = useState(maps[gameMode][0]);

    const [discoverability, setDiscover] = useState(false);

    const [local, setLocal] = useState(!loggedIn);

    const size: singleBattle["Size"] = useMemo(() => {
        const total = layers.reduce((acc, v) => acc*v);
        let temp = total;
        const steps = layers.map((v) => temp /= v);

        return {OverallSize: total, StepSizes: steps};
    }, [layers]);

    const data: battleData = useMemo(() => {
        return  {
            Map: "Space",
            PlayerCount: playerCount,
            Size: size,
            Title: title,
            Discoverable: discoverability,
            Online: !local,
            id: "Default"
        };
    }, [size, playerCount, title, discoverability, local]);

    return (
        <Section title="Create Game" className="CreateGame" close={false}>
            <div className="TitleAndType">
                <label htmlFor="GTitle"><h4>Name: </h4></label>
                <input id="GTitle" value = {title} onChange={(e) => setTitle(e.target.value)} />
                <div>
                    <label htmlFor="gMode">Game Mode: </label>
                    <select id="gMode" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                        {gameModes.map((val, index) => {
                            return <option key={index} value={val}>{val}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label htmlFor="gMap">Map: </label>
                    <select id="gMap" value={gameMap} onChange={(e) => setGameMap(e.target.value)}>
                        {maps[gameMode].map((val: string, index: number) => {
                            return <option key={index} value={val}>{val}</option>;
                        })}
                    </select>
                </div>
            </div>
            <div className="PlayersAndLayers">
                <div className="Players">
                    <label htmlFor="HumanPlayers">Human Player Count:</label>
                    <input id="HumanPlayers" value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} 
                        className="numbox" type="number" min="1" />
                    <br />
                    <br />
                    <div className="PlayerList">
                        {playerList.map((player, index) => {
                            if (!local && index !== 0) return <></>;
                            if (index >= playerCount) return <></>;
                            return <PlayerEditor player={player} update={(play) => updatePlayer(index, play)} key={index} />;
                        })}
                    </div>
                </div>
                { gameMode === "Skirmish" ?
                    (<div className="Layers" >
                        <label htmlFor="lCount">Number of Layers:</label>
                        <input id="lCount" value={layers.length} onChange={(e) => changeLayerCount(Number(e.target.value))}
                            type="number" min="1" />
                        <br />
                        <br />
                        <div className="LayerList">
                            {layers.map((layer, index) => {
                                return (<>
                                    {index !== 0 ? <br />:<></>}
                                    <label htmlFor={`L${index}`}>Layer {index +1}: </label>
                                    <input id={`L${index}`} value={layer} onChange={(e) => changeLayer(index, Number(e.target.value))}
                                        type="number" min="1" />
                                </>);
                            })}
                        </div>
                    </div>): <></>}
            </div>
            <div className="LocalDiscoverable">
                <div className="Local">
                    <label htmlFor="Local">Local Game: </label>
                    <input id="Local" checked={local} onChange={() => setLocal(!local)} type="checkbox" />
                </div>
                {!local ? 
                    (<div className="Discoverable">
                        <label htmlFor="Discoverable">Discoverable:</label>
                        <input id="Discoverale" checked={discoverability}
                            onChange={() => setDiscover(!discoverability)} type="checkbox" />
                        <br />
                    </div>):
                    <></>
                }
            </div>
            {(gameMode === "Skirmish" && gameMap === "Space") ?
                <button className="Create" onClick={() => create(playerList, data)}>Create Game</button>:
                "We are sad to inform you that only Space-Skirmishes are currently playable"
            }
        </Section>
    );
};
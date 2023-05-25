import React from 'react'
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clone } from '../../functions/functions';
import { Section } from '../Sections/Section';
import { newGame } from '../../slicers/gameSlicer';
import { initialState } from '../../slicers/playerSlicer';
import { PlayerEditor } from '../Player/PlayerEditor';

export const CreateGame = () => {
    const dispatch = useDispatch();
    const {player: user, loggedIn} = useSelector((state) => state.player);
    const convertedPlayer = {
        colorSet: user.colorSet,
        Controls: user.Controls, 
        movType: 0,
        Name: user.Username,
        Faction: user.DefaultFaction,
        exoticFactions: user.exoticFactions};
    console.log(user, convertedPlayer);
    const data = useSelector((state) => state.data);
    const gameModes = ["Skirmish", "System"];
    const maps = {Skirmish: ["Space", "Air", "Land", "Sea"], System: ["Sol"]}

    const [title, setTitle] = useState("");
    //Human and Computer counts
    const [hPlayerCount, setHCount] = useState(1);
    const [cPlayerCount, setCCount] = useState(0);

    const [hPlayerList, setHumans] = useState([convertedPlayer]);
    const [cPlayerList, setComps] = useState([]);

    const [layers, setLayers] = useState([8, 16]);

    const [gameMode, setGameMode] = useState(gameModes[0]);
    const [gameMap, setGameMap] = useState(maps[gameMode][0]);

    const [discoverability, setDiscover] = useState(false);

    const [local, setLocal] = useState(!loggedIn);

    const changeLayerCount = val => {
        const difference = val - layers.length;
        if (difference > 0) {
            const nLayers = new Array(difference).fill(8);
            const combinedLayers = layers.concat(nLayers);
            setLayers(combinedLayers);
        } else if (difference < 0) {
            const nLayers = layers.slice(0,val);
            setLayers(nLayers);
        }
    }

    const changeLayer = (layer, value) => {
        let nLayers = clone(layers);
        nLayers[layer] = value;
        setLayers(nLayers);
    }

    const updatePlayer = (index, player) => {
        let nPlayerList = clone(hPlayerList);
        nPlayerList[index] = player;
        setHumans(nPlayerList);
    }

    useEffect(() => {
        console.log(hPlayerList);
        const difference = hPlayerCount - hPlayerList.length;
        if (difference <= 0) return;
        let nPlayers = [];
        for (let x = 0; x < difference; x++) {
            nPlayers.push(clone
                ({colorSet: user.colorSet,
                Controls: user.Controls,
                movType: 0,
                Name: "",
                Faction: "Astute",
                exoticFactions: user.exoticFactions
                }
            ));
        }
        setHumans([...hPlayerList, ...nPlayers]);
    }, [hPlayerCount, cPlayerCount])

    return (
        <Section title="Create Game" close={false}>
            <label htmlFor="GTitle">Title of Game: </label>
			<input id="GTitle" value = {title} onChange={(e) => setTitle(e.target.value)} />
            <br />
            <label htmlFor="gMode">Game Mode: </label>
			<select id="gMode" value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                {gameModes.map((val, index) => {
                    return <option key={index} value={val}>{val}</option>
                })}
            </select>
            <br />
            <label htmlFor="gMap">Map: </label>
			<select id="gMap" value={gameMap} onChange={(e) => setGameMap(e.target.value)}>
                {maps[gameMode].map((val, index) => {
                    return <option key={index} value={val}>{val}</option>
                })}
            </select>
            <br />
            { gameMode === "Skirmish" ?
                (<Section title="Layers" close={false}>
                    <label htmlFor="lCount">Number of Layers:</label>
                    <input id="lCount" value={layers.length} onChange={(e) => changeLayerCount(e.target.value)}
                    type="number" min="1" />
                    <br />
                    {layers.map((layer, index) => {
                        return (<>
                            <br />
                            <label htmlFor={`L${index}`}>Layer {index +1}:</label>
                            <input id={`L${index}`} value={layer} onChange={(e) => changeLayer(index, e.target.value)}
                            type="number" min="1" />
                        </>)
                    })}
                </Section>): <></>}
            <Section title="Players">
                <label htmlFor="HumanPlayers">Human Player Count:</label>
			    <input id="HumanPlayers" value={hPlayerCount} onChange={(e) => setHCount(e.target.value)} 
                className="numbox" type="number" min="1" />
                <br />
                <br />
                {hPlayerList.map((player, index) => {
                    if (index >= hPlayerCount) return <></>
                    return <PlayerEditor player={player} update={(play) => updatePlayer(index, play)} />
                })}
            </Section>
            <br />
            <label htmlFor="Local">Local Game:</label>
            <input id="Local" checked={local} onChange={() => setLocal(!local)} type="checkbox" />
            <br />
            {
                !local ? 
                (<>
                    <label htmlFor="Discoverable">Discoverable:</label>
                    <input id="Discoverale" checked={discoverability} 
                        onChange={() => setDiscover(!discoverability)} type="checkbox" />
                    <br />
                </>):
                <></>
            }
            {(gameMode === "Skirmish" && gameMap === "Space") ?
                <button>Create Game</button>:
                "We are sad to inform you that only Space-Skirmishes are currently playable"
            }
        </Section>
    )
}
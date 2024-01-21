import { PropTypes } from "prop-types";
import { useState } from "react";
import { Section } from "../Sections/Section";
import { useSelector } from "react-redux";
import { clone } from "../../functions/functions";

const PlayerEditor = ({player, update, inGame}) => {
    if (!inGame) inGame = [];
    const controlTypes = ["Up","Down","Left","Right","Action","Back","Info","End Turn","Zoom In","Zoom Out", "Group", "Ungroup"];
    const data = useSelector(state => state.data);

    const [colors, setColors] = useState(player.colorSet);
    const [controls, setControls] = useState(player.Controls);
    const [movement, setMovement] = useState(player.movType);
    const [name, setName] = useState(player.Name);
    const [faction, setFaction] = useState(player.Faction);

    const changeColor = (value, item) => {
        let nColors = clone(colors);
        nColors[item] = value;
        setColors(nColors);
    };

    const changeControl = (e, item, number) => {
        let nControls = clone(player.Controls);
        nControls[number] = e.key;
        setControls(nControls);
        item.onkeydown = () => {};
    };

    const activateListener = (item, number) => {
        item.onkeydown = (e) => {
            changeControl(e, item, number);
        };
    };

    const updatePlayer = () => {
        const play = {
            ...player,
            colorSet: colors,
            Controls: controls, 
            movType: Number(movement),
            Name: name,
            Faction: faction};
        update(play);
    };

    return (
        <Section title={"Player"} close={false} >
            <label htmlFor="Name">Name: </label>
            <input id="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <br />
            <label htmlFor="Faction">Faction: </label>
            <select id="Faction" type="" value={faction} onChange={(e) => setFaction(e.target.value)}>
                {(!player.exoticFactions ? data.factionNames: data.exoticFactions).map((item,ind) => {
                    return (
                        <option key={ind} value={item}>{item}</option>
                    );
                })
                }
            </select>
            <br />
            <label htmlFor="MovType">Movement Style: </label>
            <select id="MovType" type="" value={movement} onChange={(e) => setMovement(e.target.value)}>
                <option value={0}>Momentum</option>
                <option value={1}>Naval</option>
            </select>
            <Section title="Controls" close={false}>
                {controlTypes.map((item, index) => {return (
                    <div id={index} key={index}>{item}:
                        <button id={`KC${index}`} onClick={(e) => {
                            activateListener(e.target,index);
                        }}>{controls[index]}</button>
                    </div>);
                })}
            </Section>
            <Section title="Faction Colors" close={false}>
                {inGame.find((play) => player.playerNum === play.playerNum) ? 
                    Object.keys(colors).map((playerNum, ind) => {
                        return (
                            <div key={ind}>
                                <label htmlFor={playerNum}>{inGame.find((play) => {
                                    return play.playerNum === playerNum;
                                }).Name}:</label>
                                <input type="color" onChange={(e) => {changeColor(e.target.value, playerNum);}} 
                                    value={colors[playerNum]} id={playerNum} />
                            </div>
                        );
                    })
                    :
                    (!player.exoticFactions ? data.factionNames:data.exoticFactions).map((item,ind) => {
                        return (
                            <div key={ind}>
                                <label htmlFor={item}>{item}:</label>
                                <input type="color" onChange={(e) => {changeColor(e.target.value,item);}} 
                                    value={colors[item]} id={item} />
                            </div>
                        );
                    })}
            </Section>
            <button onClick={updatePlayer}>Update</button>
        </Section>
    );
};

PlayerEditor.propTypes = {
    player: PropTypes.object,
    update: PropTypes.func,
    inGame: PropTypes.bool
};

export { PlayerEditor };
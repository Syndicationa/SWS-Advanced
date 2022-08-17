import React from 'react'
import { useSelector } from 'react-redux';
import { clone } from '../../functions/functions';
import { Section } from '../Sections/Section'

export const PlayerEditor = ({player, modifyPlayer}) => {
    const controls = ["Up","Down","Left","Right","Action","Back","Info","End Turn","Zoom In","Zoom Out"];
    const data = useSelector((state) => state.data)
    
    const changeLayers = (e) => {
        let num = Number(e.target.value);
        let layers = new Array(num).fill(8)
        modifyPlayer("RuleSet",{...player.RuleSet, layerCount: num, layers: layers});
    } 

    const changeLayerValue = (value, index) => {
        let newLayers = player.RuleSet.layers;
        newLayers[index] = Number(value);
        modifyPlayer("RuleSet", {...player.RuleSet, layers: newLayers});
    }

    const changeColor = (value, item) => {
        let colors = clone(player.colorSet);
        colors[item] = value;
        modifyPlayer("colorSet",colors);
    }

    const changeControl = (e, item, number) => {
        let nControls = clone(player.Controls);
        nControls[number] = e.key;
        modifyPlayer("Controls",nControls);
        item.onkeydown = () => {};
    }

    const activateListener = (item, number) => {
        item.onkeydown = (e) => {
            changeControl(e, item, number)
        }
    }

    return (
    <>
    <label htmlFor="Name">Name: </label>
    <input id="Name" value={player.Username} onChange={(e) => modifyPlayer("Username",e.target.value)} />
    <br />
    <label htmlFor="Faction">Default Faction: </label>
    <select id="Faction" type="" value={player.DefaultFaction} onChange={(e) => modifyPlayer("DefaultFaction",e.target.value)}>
        {!player.exoticFactions ? data.factionNames.map((item,ind) => {
                return (
                    <option key={ind} value={item}>{item}</option>
                )
            })
            :
            data.exoticFactions.map((item,ind) => {
                return (
                    <option key={ind} value={item}>{item}</option>
                )
            })
        }
    </select>
    <br />
    <label htmlFor="MovType">Movement Style: </label>
    <select id="MovType" type="" value={player.movType} onChange={(e) => modifyPlayer("movType",Number(e.target.value))}>
        <option value={0}>Momentum</option>
        <option value={1}>Naval</option>
    </select> 
    <Section title="Controls" close={false}>
        {controls.map((item, index) => {
            let controlSymbol = player.Controls[index];
            if (controlSymbol === " ") controlSymbol = "Space"
            return (
            <div id={index} key={index}>{item}:
                <button id={`KC${index}`} onClick={(e) => {
                    activateListener(e.target,index);
                }}>{controlSymbol}</button>
            </div>)
        })}
    </Section>
    <Section title="Preferred Rules" close={false}>
        <label htmlFor="LayerCount">Number of Layers: </label>
        <input id="LayerCount" value = {player.RuleSet.layerCount} onChange={changeLayers} 
            className="numbox" type="number" min="1" max="256" />
        {player.RuleSet.layers.map((val, index) => (
            <div key={index}>
                <label htmlFor={`L${index}Size`}>Size of Layer {index}(Val x Val): </label>
                <input id={`L${index}Size`} 
                    value = {val} 
                    onChange={(e) => changeLayerValue(e.target.value,index)} 
                    className="numbox" type="number" min="1" max="256"></input>
            </div>))}
        <label htmlFor="HumanPlayers">Human Player Count:</label>
        <input id="HumanPlayers" value={player.RuleSet.hPlayerCount} 
        onChange={(e) => modifyPlayer("RuleSet", {...player.RuleSet, hPlayerCount: e.target.value})} 
        className="numbox" type="number" min="0" max="12" />
        <br />
    </Section>
    <Section title="Faction Colors" close={false}>
        {!player.exoticFactions ? data.factionNames.map((item,ind) => {
                return (
                    <div key={ind}>
                        <label htmlFor={item}>{item}:</label>
                        <input type="color" onChange={(e) => {changeColor(e.target.value,item)}} 
                            value={player.colorSet[item] || data.factionColors[item]} id={item} />
                    </div>
                )
            }):
            data.exoticFactions.map((item,ind) => {
                return (
                    <div key={ind}>
                        <label htmlFor={item}>{item}:</label>
                        <input type="color" onChange={(e) => {changeColor(e.target.value,item)}} 
                            value={player.colorSet[item] || data.factionColors[item]} id={item} />
                    </div>
                )
            })}
    </Section>
    </>
    )
}

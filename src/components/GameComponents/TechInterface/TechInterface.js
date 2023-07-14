import React, { useEffect, useState } from 'react'
import { Tabs } from '../GameInterface/Tabs';
import { ReadNode } from '../../TechNetwork/ReadNode';
import "./TechInterface.css";
import { updateDate } from '../../../functions/defs/faction/faction.mjs';

export const TechInterface = ({factionList, faction, techInfo, updateFaction}) => {
    const playerFaction = factionList.find((f) => f.Name === faction);
    const [nameArr] = useState(["World", "Tech Tree"]);
    const [children] = useState([
        (<ol>{factionList.map((faction) => {
            return (
            <li>
                {faction.Name}: Technologies: {faction.Technology.Technologies.length}
            </li>)
        })}</ol>),
        (<div className='TechTreeInterface'>
          <div>
            {faction} 
            <br />
            Research Points: {playerFaction.Technology.TechPoints + " | "}  
            Research Income: {playerFaction.Technology.TechIncome}</div>
            <ReadNode head={techInfo.head} playerFaction={playerFaction} uFaction={updateFaction} />
        </div>),
        (<div>

        </div>)
    ])

    useEffect(() => {
        const timeData = updateDate(playerFaction.Technology.LastUpdated)
        if (timeData.weeks !== 0) {
            const Tech = playerFaction.Technology;
            const nTech = {
                ...Tech,
                TechPoints: Tech.TechPoints + Tech.TechIncome*timeData.weeks,
                LastUpdated: timeData.date
            }
            updateFaction({...playerFaction, Technology: nTech});
        }
    }, [playerFaction, updateFaction])
    

    return (
      <Tabs nameArr={nameArr} childArr={children} />
    )
}

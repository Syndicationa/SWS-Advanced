import React, { useEffect, useState } from 'react'
import { Tabs } from '../GameInterface/Tabs'
import { updateDate } from '../../../functions/defs/faction/faction.mjs';
import { Section } from '../../Sections/Section';
import { buyBuilding } from '../../../functions/defs/economy.mjs';
import { HexagonMapReader } from '../Hexagon Map Reader/HexagonMapReader';
import { data } from '../../../tests/Mercury_Hex_Map.mjs';


export const EconInterface = ({factionList, faction, updateFaction}) => {
    const playerFaction = factionList.find((f) => f.Name === faction);
    const [nameArr] = useState(["World", "Nation", "Creation", "Trade"])
    const [children] = useState([
        (<ol>{factionList.map((faction) => {
            return (
            <li>
                {faction.Name}: Treasury: ${faction.Economy.Treasury} Income: ${faction.Economy.Income}
            </li>)
        })}</ol>),
        (<>
            {playerFaction.Name}: Treasury: ${playerFaction.Economy.Treasury}
            <Section title="Buildings">
                <ol>{playerFaction.Economy.BuildingTypes.map((building) => {
                    return (
                        <li className='Building'>
                            {building.Name}: {building.Cost}
                            <button onClick={buyBuilding}>Buy</button>
                        </li>)
                    })}
                </ol>
            </Section>
            <hr />
            <Section title="Vehicles">

            </Section>
        </>),
        (<HexagonMapReader hexagonMapFile={data} />),
        (<>Skill</>)
    ])

    useEffect(() => {
        const timeData = updateDate(playerFaction.Economy.LastUpdated)
        if (timeData.weeks !== 0) {
          const Econ = playerFaction.Economy;
          const nEcon = {
                ...Econ,
                Treasury: Econ.Treasury + Econ.Income*timeData.weeks,
                LastUpdated: timeData.date
            }
            updateFaction({...playerFaction, Economy: nEcon});
        }
    }, [playerFaction, updateFaction])

    return (
        <Tabs nameArr={nameArr} childArr={children} />
    )
}
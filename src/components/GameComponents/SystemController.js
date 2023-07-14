import React from 'react'
import { Section } from '../Sections/Section'
import { AdminConsole } from './AdminConsole'
import { useSelector } from 'react-redux'
import { GameDisplay } from '../GameList/GameDisplay'
import { EconInterface } from './EconInterface/EconInterface'
import { TechInterface } from './TechInterface/TechInterface'

export const SystemController = ({system}) => {
  const user = useSelector((state) => state.player.user);
  const player = system.Players.find((player) => player.User.ID === user.ID);
  const isAdmin = player.Admin;

  console.log(player);
  
  return (
    <Section title={system.Name} minimizable={false} close={() => 0} style={{width: "100%", height: "100%"}}>
        <Section title="System Map" />
        <Section title="Active Battles">
          {system.Battles
            .filter((battle) => battle.Players.some((player) => player.User.ID === user.ID))
            .map((battle) => <GameDisplay game={battle}></GameDisplay>)}
        </Section>
        <Section title="Economy">
            <EconInterface factionList={system.Factions} faction={player.Faction}
                updateFaction={(d) => console.log(d)} />
        </Section>
        <Section title="Technology">
            <TechInterface factionList={system.Factions} techInfo={system.TechTree} 
                faction={player.Faction} updateFaction={(d) => console.log(d)}/>
        </Section>
        <Section title="Planet Maps" />
        {isAdmin ? <AdminConsole />: <></>}
    </Section>
    )
}

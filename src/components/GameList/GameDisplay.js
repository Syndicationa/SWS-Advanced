import React from 'react'
import { Section } from '../Sections/Section';

export const GameDisplay = ({game}) => {
    console.log(game);
  return (
    <Section title={game.title} close={false} >
        Number of Players: {`[${game.Players.length}/${game.playerCount}]`}
        <br />
        Game Mode: {game.gameMode || "Skirmish"}
        <br />
        <button>Join Game</button>
    </Section>
  )
}

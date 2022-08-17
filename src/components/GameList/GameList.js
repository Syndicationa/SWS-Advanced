import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlayerGames } from '../../slicers/gameSlicer';
import { AvailableGames } from './AvailableGames';
import { CreateGame } from "./CreateGame";
import { GameDisplay } from './GameDisplay';
import { Section } from '../Sections/Section';

export const GameList = () => {
  const dispatch = useDispatch();
  const playerGames = useSelector(state => state.game.playerGames);
  const gameList = useSelector(state => state.player.player.games);

  const refresh = () => {
    dispatch(fetchPlayerGames(gameList));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <CreateGame />
      <AvailableGames />
      <Section title="Your Games" close={false} >
        {playerGames.map((game, index) => {
          return <GameDisplay game={game} key={index} />
        })}
        <button onClick={refresh}>Refresh</button>
      </Section>
    </>
  )
}

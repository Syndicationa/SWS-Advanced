import React from 'react'
import { Header } from './Header/Header'
import { Board } from './Board'
import { ButtonGrid } from './ButtonGrid/ButtonGrid'
import { InfoDisplay } from './InfoDisplay'
import { PlayerList } from './PlayerList'
import { Tabs } from './Tabs'

export const GameUI = ({game, input, close}) => {
    const title = game.Title;
    const mode = game.gameMode;

    const sListName = game.sDataType
    const data = game.data;
    const list = game.list;
    const display = game.display;
    const defaultSelection = game.selection;

    const players = game.players;
    const currentPlayer = game.currentPlayer;
    const updatePlayer = game.updatePlayer;

    const local = game.local;
    const active = game.active;
    const stage = game.stage;

    const systemFunctions = input.system;
    const movCurs = input.moveCursor;
    const movCursTo = input.moveCursorTo;
    const cursor = input.cursor;

    return (
        <div className="game">
        <Header name={`${mode}: ${title}`} className="gameTitle" stage={stage} close={close} />
        <Board move={movCursTo} display={display} cursor={cursor} colors={players[currentPlayer].colorSet}/>
        <Tabs className="IO"
        selection={defaultSelection}
        childArr={[
            (<InfoDisplay title={sListName} className="List" information={list} 
                selected={0} displayFunction={a => a} />),
            (<InfoDisplay title="Information" className="Info" information={data} />),
            (<PlayerList players={players} cPlayer={currentPlayer} local={local} 
                updatePlayer={updatePlayer} game={game} />)]}
        nameArr={["Ships", "Info", "Players"]}/>
        { active ? <ButtonGrid system={systemFunctions} move={movCurs} stage={stage} />:<></>}
    </div>
    )
}

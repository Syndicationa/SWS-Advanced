import React from 'react'
import { Header } from './Header/Header'
import { Board } from './Board'
import { ButtonGrid } from './ButtonGrid/ButtonGrid'
import { InfoDisplay } from './InfoDisplay'
import { PlayerList } from './PlayerList'
import { Tabs } from './Tabs'

export const GameUI = ({game, input, close}) => {
    const title = game.title;
    const mode = game.gameMode;

    const sListName = game.sDataType
    const sData = game.shipData;
    const list = game.listItems;
    const display = game.display;

    const players = game.Players;
    const cPlayer = game.cPlayer;
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
        <Header name={`${mode}: ${title}`} className="gameTitle" stage={stage} minimizable={false} close={close} />
        <Board move={movCursTo} display={display} cursor={cursor} />
        <Tabs className="IO"
        childArr={[
            (<InfoDisplay title={sListName} className="ShipList" information={list} 
                selected={0} displayFunction={() => {}} />),
            (<InfoDisplay title="Information" className="Info" information={sData} />),
            (<PlayerList players={players} cPlayer={cPlayer} local={local} 
                updatePlayer={updatePlayer} />)]}
        nameArr={["Ships", "Info", "Players"]}/>
        { active ? <ButtonGrid system={systemFunctions} move={movCurs} stage={stage} />:<></>}
    </div>
    )
}

import React from 'react'
import { SectionTitle } from '../../Sections/SectionTitle'
import { Board } from './Board'
import { ButtonGrid } from './ButtonGrid'
import { InfoDisplay } from './InfoDisplay'
import { PlayerList } from './PlayerList'
import { Tabs } from './Tabs'

export const GameUI = ({game, input, close}) => {
    const title = game.title;
    const mode = game.gameMode;

    const sListName = game.sDataType
    const sData = game.shipData;
    const list = game.listItems;
    const dispFunc = game.listDisplay;

    const players = game.Players;
    const cPlayer = game.cPlayer;
    const updatePlayer = game.updatePlayer;

    const local = game.local;
    const active = game.active;
    const stage = game.stage;
    const impulse = game.impulse;
    const iCount = game.impulseCount;

    const systemFunctions = input.system;
    const movCurs = input.moveCursor;
    const movCursTo = input.moveCursorTo;

    const tabs = (<Tabs 
        childArr={[
            (<InfoDisplay title={sListName} className="ShipList" information={list} 
                selected={0} displayFunction={dispFunc} />),
            (<InfoDisplay title="Information" className="Info" information={sData} />),
            (<PlayerList players={players} cPlayer={cPlayer} local={local} 
                updatePlayer={updatePlayer} />)]}
        nameArr={["Ships, Info, Players"]}></Tabs>)

    return (
        <div className="game">
        <SectionTitle title={`${mode}: ${title}`} className="gameTitle" minimizable={false} close={close} />
        <Board press={movCursTo} />
        {tabs}
        { active ? <ButtonGrid system={systemFunctions} move={movCurs} stage={stage} />:<></>}
        <Footer stage={stage} impulse={impulse} impulseCount={iCount} />
    </div>
    )
}

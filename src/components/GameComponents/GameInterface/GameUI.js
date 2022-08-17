import React from 'react'
import { SectionTitle } from '../../Sections/SectionTitle'
import { Board } from './Board'
import { InfoDisplay } from './InforDisplay'

export const GameUI = () => {
    return (
        <div className="game">
        <SectionTitle title={`Game`} className="gameTitle" minimizable={false} close={() => console.log("Leave")} />
        <Board grid={estGrid} main={estMain} press={movCursTo} />
        <InfoDisplay title="Information" className="Info" information={sData} />
        <InfoDisplay title="ShipList" className="ShipList" information={list} selected={cMenu} displayFunction={shipList} />
        <div className="Players">
            {mainGame.local ? players.map((player, index) => {
                return <EditablePlayer inGame={players} player={player} key={player.playerNum} 
                active={index === cPlayer} updatePlayer={playerInfo => updateplayer(playerInfo, index)}/>
            }):(<><EditablePlayer inGame={players} player={players[cPlayer]} 
                updatePlayer={(playerInfo => updateplayer(playerInfo, cPlayer))} />
            {mainGame.Players.map((player, index) => {
                console.log(player);
                if (index === cPlayer) return <></>;
                return <Section title={player.Name} close={false}>Has Moved: {player.hasMoved ? "True":"False"}</Section>
            })}</>)}
        </div>
        { active ? <ButtonGrid system={systemFunctions} move={movCurs} stage={stage} />:
        <InfoDisplay title="Players" className="IO" information={
            players.map((player) => `${player.Name}: ${player.hasMoved ? `Ready`: `Not Ready`}`)} />}
        <Footer stage={stage} impulse={impulse} impulseCount={iCount} />
    </div>
    )
}

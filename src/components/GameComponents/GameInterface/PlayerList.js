import React from 'react'

export const PlayerList = ({players, cPlayer, local, updatePlayer, ...rest}) => {
  return (
    <div className="Players" props={rest}>
        <EditablePlayer inGame={players} player={players[cPlayer]} 
        updatePlayer={(playerInfo => updatePlayer(playerInfo, cPlayer))} />
        {players.map((player, index) => {
            if (index === cPlayer) return <></>;
            if (local) return <EditablePlayer inGame={players} player={player} key={player.playerNum} 
                active={index === cPlayer} updatePlayer={playerInfo => updatePlayer(playerInfo, index)}/>
            return <Section title={player.Name} close={false}>Has Moved: {player.hasMoved ? "True":"False"}</Section>
        })}
    </div>
  )
}

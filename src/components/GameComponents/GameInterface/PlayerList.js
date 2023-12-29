import React from 'react'
import { PlayerEditor } from '../../Player/PlayerEditor'

export const PlayerList = ({players, cPlayer, local, updatePlayer, ...rest}) => {
  return (
    <div className="Players" props={rest}>
        {local ?
            players.map(player => {
                return <PlayerEditor player={player} update={updatePlayer} inGame={true}/>
            })
            :
            (<></>)
        }
    </div>
  )
}

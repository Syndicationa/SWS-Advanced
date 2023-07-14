import React, { useState } from 'react'
import { GameUI } from './GameUI'
import { cursorGenerator, moveCursor, moveCursorToPosition } from '../../../functions/defs/cursor.mjs';
import { systemTemplate, systemToGame } from '../../../functions/defs/system/system.mjs';


export const SystemMap = ({system = systemTemplate, changeInterface = () => {}}) => {
    const [cursor, setCursor] = useState(cursorGenerator({OverallSize: system.Maps.System.Grid.size, StepSizes: [1]}));
    const input = {
        system: {
            
        },
        cursor,
        moveCursor: (vec) => setCursor(moveCursor(cursor, vec)),
        moveCursorTo: (pos) => setCursor(moveCursorToPosition(cursor, pos))
    }
  return (
    <GameUI game={systemToGame(system)} input={input} close={(e) => console.log(e)}/>
  ) 
}

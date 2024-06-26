import { useState } from "react";
import { PropTypes } from "prop-types";
import { GameUI } from "./GameUI";
import { cursorGenerator, moveCursor, moveCursorToPosition } from "../../../functions/defs/cursor.js";
import { systemTemplate, systemToGame } from "../../../functions/defs/system/system.mjs";


export const SystemMap = ({system = systemTemplate}) => {
    const [gameRep] = useState(() => systemToGame(system));
    const [cursor, setCursor] = useState(cursorGenerator({OverallSize: system.Maps.System.Grid.size, StepSizes: [1]}));
    const input = {
        system: {
            
        },
        cursor,
        moveCursor: (vec) => setCursor(moveCursor(cursor, vec)),
        moveCursorTo: (pos) => setCursor(moveCursorToPosition(cursor, pos))
    };
    return (
        <GameUI game={gameRep} input={input} close={(e) => console.log(e)}/>
    ); 
};

SystemMap.propTypes = {
    system: PropTypes.object,
    changeInterface: PropTypes.func
};
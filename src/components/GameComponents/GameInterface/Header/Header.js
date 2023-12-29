import React from 'react'
import { Phase } from './Phase';

export const Header = props => {
    const {stage, name, version, close, ...rest} = props;

    const stageNames = ["Place Ships","Movement Phase", "Utility Phase", "Attack Phase", "Recovery Phase"];

    const incrementStage = (stage) => (stage) % 4 + 1;

    return (
        <header {...rest}>
            <div className='PhaseChart'>
                <Phase name={stageNames[stage]} active={true} /> {">"}
                <Phase name={stageNames[incrementStage(stage)]} active={false} /> {">"}
                <Phase name={stageNames[incrementStage(incrementStage(stage))]} active={false} />
            </div>
            <h3>{name}</h3>
        </header>
    )
}

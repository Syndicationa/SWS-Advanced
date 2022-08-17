import React, { useState } from 'react';
import { PlayerEditor } from './AccountEditor';
import { Section } from '../Sections/Section';
import { clone } from '../../functions/functions';
import { useDispatch, useSelector } from 'react-redux';
import { createPlayer, updatePlayer } from  '../../slicers/playerSlicer';

export const SignUp = ({setPage}) => {
    const dispatch = useDispatch();
    const basePlayer = useSelector((state) => state.player.player)
    const [player, modPlayer] = useState(basePlayer);

    const modifyPlayer = (item, data) => {
        let nPlayer = clone(player);
        nPlayer[item] = data;
        modPlayer(nPlayer); 
    }

    const signingUp = () => {
        dispatch(createPlayer(player));
        setPage("Home");
    }

    return (<>
        <Section title="Sign Up" minimizable={false} close={false}>
            <PlayerEditor player={player} modifyPlayer={modifyPlayer} />
        </Section>
        <hr />
        <button className='DoubleSize' onClick={signingUp}>Sign Up</button>
    </>
    )
}

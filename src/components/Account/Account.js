import { useState } from "react";
import { PlayerEditor } from "./AccountEditor";
import { Section } from "../Sections/Section";
import { clone } from "../../functions/functions";
import { useDispatch, useSelector } from "react-redux";
import { updatePlayer } from  "../../slicers/playerSlicer";

export const Account = () => {
    const dispatch = useDispatch();
    const basePlayer = useSelector((state) => state.player.player);
    const [player, modPlayer] = useState(basePlayer);

    const modifyPlayer = (item, data) => {
        let nPlayer = clone(player);
        nPlayer[item] = data;
        modPlayer(nPlayer); 
    };

    const updateGame = () => {
        dispatch(updatePlayer(player));
    };

    return (<>
        <Section title="Account" minimizable={false} close={false}>
            <PlayerEditor player={player} modifyPlayer={modifyPlayer} />
            <br />
            <button onClick={updateGame}>Update</button>
        </Section>
    </>
    );
};

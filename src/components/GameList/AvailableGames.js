import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlayerGames } from "../../slicers/gameSlicer";
import { Section } from "../Sections/Section";
import { GameDisplay } from "./GameDisplay";

export const AvailableGames = () => {
    const dispatch = useDispatch();
    const available = useSelector(state => state.game.allGames);

    const refresh = () => {
        dispatch(fetchPlayerGames());
    };

    useEffect(() => {
        refresh();
    }, []);
    

    return (
        <Section title="Available Games" close={false}>
            <button onClick={refresh}>Refresh List</button>
            {available.map((game) => {
                <GameDisplay game={game} />;
            })}
        </Section>
    );
};

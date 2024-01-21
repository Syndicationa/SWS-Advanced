import { PropTypes } from "prop-types";
import { Section } from "../Sections/Section";

const GameDisplay = ({game}) => {
    console.log(game);
    return (
        <Section title={game.title} close={false} >
        Number of Players: {`[${game.Players.length}/${game.playerCount}]`}
            <br />
        Game Mode: {game.gameMode || "Skirmish"}
            <br />
            <button>Join Game</button>
        </Section>
    );
};

GameDisplay.propTypes = {
    game: PropTypes.object,
};

export { GameDisplay };
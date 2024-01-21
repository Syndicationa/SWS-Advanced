import { PropTypes } from "prop-types";
import { PlayerEditor } from "../../Player/PlayerEditor";

const PlayerList = ({players, local, updatePlayer, ...rest}) => {
    return (
        <div className="Players" {...rest}>
            {local ?
                players.map((player, index) => {
                    return <PlayerEditor player={player} update={updatePlayer} inGame={true} key={index}/>;
                })
                :
                (<></>)
            }
        </div>
    );
};

PlayerList.propTypes = {
    players: PropTypes.array,
    cPlayer: PropTypes.number,
    local: PropTypes.bool,
    updatePlayer: PropTypes.func
};

export { PlayerList };
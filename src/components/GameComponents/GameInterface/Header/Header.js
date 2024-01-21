import { PropTypes } from "prop-types";
import { Phase } from "./Phase";

const Header = props => {
    const {stage, name, ...rest} = props;

    const stageNames = ["Place Ships","Movement Phase", "Utility Phase", "Attack Phase"];

    const incrementStage = (stage) => (stage) % 3 + 1;

    return (
        <header {...rest}>
            <div className='PhaseChart'>
                <Phase name={stageNames[stage]} active={true} /> {">"}
                <Phase name={stageNames[incrementStage(stage)]} active={false} /> {">"}
                <Phase name={stageNames[incrementStage(incrementStage(stage))]} active={false} />
            </div>
            <h3>{name}</h3>
        </header>
    );
};

Header.propTypes = {
    stage: PropTypes.number,
    name: PropTypes.string
};

export { Header };
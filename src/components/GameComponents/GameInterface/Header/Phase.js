import { PropTypes } from "prop-types";

const Phase = ({name, active}) => {
    return (
        <div className='stageItem'>
            {name}
            <div className={active ? "active":""}></div>
        </div>
    );
};

Phase.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool
};

export { Phase };
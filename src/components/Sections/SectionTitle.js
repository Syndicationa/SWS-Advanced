import { PropTypes } from "prop-types";

const SectionTitle = ({title, minimizable, minimization, minimized, close, ...rest}) => {
    return (
        <div className="SectionTitle" {...rest}>
            <h3>{title}</h3>
            {minimizable ? <button className="Minimize" onClick={minimization}>{minimized ? "+":" -"}</button>:<></>}
            {close ? (<button onClick={close} className="Close"><strong>X</strong></button>):<></>}
        </div>
    );
};

SectionTitle.propTypes = {
    title: PropTypes.string,
    minimizable: PropTypes.bool,
    minimization: PropTypes.func,
    minimized: PropTypes.bool,
    close: PropTypes.func
};

export { SectionTitle };
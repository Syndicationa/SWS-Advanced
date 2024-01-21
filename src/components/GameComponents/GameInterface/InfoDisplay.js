import { PropTypes } from "prop-types";

const InfoDisplay = props => {
    const {title, information, displayFunction, ...rest} = props;
    let info = information.map((item) => displayFunction(item));
    if (info instanceof Array && info.length === 1 && info[0] instanceof Array) {
        info = info[0];
    }

    return (
        <div {...rest}>
            <h3>{title}</h3>
            <ul>
                {info.map((value, index) => {
                    return (<li key={index}>{value}</li>);
                })}
            </ul>
        </div>
    );
};

InfoDisplay.propTypes = {
    title: PropTypes.string,
    information: PropTypes.array,
    selected: PropTypes.number,
    displayFunction: PropTypes.func
};

InfoDisplay.defaultProps = {
    information: [],
    selected: -1,
    displayFunction: item => item,
};

export { InfoDisplay };
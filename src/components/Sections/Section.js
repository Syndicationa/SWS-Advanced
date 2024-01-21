import { PropTypes } from "prop-types";
import { useState } from "react";
import { SectionTitle } from "./SectionTitle";

const Section = ({title, minimizable, close, children, style, titleStyle}) => {
    const mini = minimizable === undefined ? true: minimizable;
    const [minimized, setMinimized] = useState(mini);

    const invertMinimized = () => {
        setMinimized(!minimized);
    };

    return (
        <div className="Section" style={style}>
            <SectionTitle title={title} minimizable={mini}
                minimized={minimized} close={close} 
                minimization={invertMinimized} {...titleStyle} />
            {minimized ? <></>:children}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string,
    minimizable: PropTypes.bool,
    close: PropTypes.func,
    children: PropTypes.arrayOf(PropTypes.element),
    style: PropTypes.object,
    titleStyle: PropTypes.object
};

export { Section };

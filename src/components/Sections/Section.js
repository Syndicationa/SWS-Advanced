import { PropTypes } from "prop-types";
import { useState } from "react";
import { SectionTitle } from "./SectionTitle";

const Section = ({title, minimizable, close, children, style, titleStyle, className}) => {
    const [minimized, setMinimized] = useState(minimizable ?? true);

    const invertMinimized = () => {
        setMinimized(!minimized);
    };

    return (
        <div className={"Section" + className} style={style}>
            <SectionTitle title={title} minimizable={minimizable ?? true}
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
    titleStyle: PropTypes.object,
    className: PropTypes.string
};

export { Section };

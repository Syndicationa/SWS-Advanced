import React from "react";

export const InfoDisplay = props => {
    const {title, information, selected, displayFunction, ...rest} = props;
    let info = information.map((item) => displayFunction(item));
    if (info instanceof Array && info.length === 1 && info[0] instanceof Array) {
        info = info[0];
    }

    return (
        <div {...rest}>
            <h3>{title}</h3>
            <ul>
                {info.map((value, index) => {
                    return (<><li>{(index === selected) ? ">":""}{value}</li></>)
                })}
            </ul>
        </div>
    )
}

InfoDisplay.defaultProps = {
    information: [],
    selected: -1,
    displayFunction: item => item,
}
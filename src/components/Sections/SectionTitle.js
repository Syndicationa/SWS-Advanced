import React from 'react'

export const SectionTitle = ({title, minimizable, minimization, minimized, close, ...rest}) => {
    return (
        <div className="SectionTitle" {...rest}>
            <h3>{title}</h3>
            {minimizable ? <button className="Minimize" onClick={minimization}>{minimized ? "+":" -"}</button>:<></>}
            {close ? (<button onClick={close} className="Close"><strong>X</strong></button>):<></>}
        </div>
    )
}
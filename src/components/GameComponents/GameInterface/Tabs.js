import React, { useEffect, useState } from 'react'
import { minMax } from '../../../functions/functions.mjs';

export const Tabs = ({childArr, nameArr, selection = 0}) => {
    const [selected, setSelected] = useState(selection);

    useEffect(() => {
        const select = minMax(selection, 0, nameArr.length - 1);
        setSelected(select);
    }, [selection, nameArr.length]);

    return (
        <div className='Tabs'>
            <div className='TabList'>
                {nameArr.map((name, i) => {
                    return (<button onClick={() => setSelected(i)} key={i}>{name}</button>)
                })}
            </div>
            {childArr[selected]}
        </div>
    )
}
import React, { useState } from 'react'

export const Tabs = ({childArr, nameArr}) => {
    const [selected, setSelected] = useState(0);
  return (
    <div className='Tabs'>
        <div className='TabList'>
            {nameArr.map((name, i) => {
                return (<button onClick={setSelected(i)}>{name}</button>)
            })}
        </div>
        {childArr[selected]}
    </div>
  )
}
import React from 'react'

export const Phase = ({name, active}) => {
  return (
    <div className='stageItem'>
        {name}
        <div className={active ? 'active':''}></div>
    </div>
  )
}

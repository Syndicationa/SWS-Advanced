import React from 'react'

export const NodePreview = ({node, switchNode, remove}) => {
  return (
    <div className='Preview'>
        {node.data.name}
        <button onClick={switchNode}>Switch</button>
        <button onClick={remove}>Disconnect</button>
    </div>
  )
}

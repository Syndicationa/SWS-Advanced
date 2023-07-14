import React, { useState } from 'react'
import { NodePreview } from './NodePreview';
import { buyNode } from '../../functions/defs/techNetwork.mjs';

export const ReadNode = ({playerFaction, uFaction, head}) => {
    const [cNode, setCurrentNode] = useState(head);

  return (
    <div className='TechNode'>
        <div className='Name'> {cNode.data.name}</div>
        <div className='Desc'>{cNode.data.description}</div>
        <label htmlFor='Cost'>Cost: </label>
        <button id='Cost' onClick={() => uFaction(buyNode(playerFaction, cNode))}>
            {`${cNode.data.cost}TP`}
        </button>

        {cNode.parentNodes.length === 0 ? <></>:(
        <>
            <br />
            Parents
            <div className='ParentList'>
                <div>
                    {cNode.parentNodes.map((node) => <NodePreview node={node} 
                        switchNode={() => setCurrentNode(node)} />)}
                </div>
            </div>
        </>
        )}
        {cNode.childNodes.length === 0 ? <></>:(
        <>
            <br />
            Children
            <div className='ChildList'>
                <div>
                    {cNode.childNodes.map((node) => <NodePreview node={node} 
                        switchNode={() => setCurrentNode(node)} />)}
                </div>
            </div>
        </>
        )}
    </div>
  )
}

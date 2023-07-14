import React, { useState } from 'react'
import { NodePreview } from './NodePreview';
import { connectNodes, createNode, removeConnection, removeNode } from '../../functions/defs/techNetwork.mjs';

export const EditNode = ({head}) => {
    const [cNode, setCurrentNode] = useState(head);
    const [sNode, setStoredNode] = useState(null);


    const updateNode = (element) => (e) => {
        const nNode = {...cNode, data: {...cNode.data, [element]: e.target.value}};
        cNode.parentNodes.forEach((node) => {
            node.childNodes.splice(node.childNodes.indexOf(cNode), 1, nNode);
        })
        cNode.childNodes.forEach((node) => {
            node.parentNodes.splice(node.parentNodes.indexOf(cNode), 1, nNode);
        })
        setCurrentNode(nNode);
    }

    const remove = (node, type) => () => {
        let [success] = false;
        if (type === 'Parent') {
            success = removeConnection(node, cNode);
        } else {
            success = removeConnection(cNode, node);
        }
        if (!success) alert("Failed to remove node")
    }

    const newNode = () => {
        const node = createNode(0, cNode, "", 0, "");
        setCurrentNode(node);
    }

    const connect = () => {
        const complete = connectNodes(cNode, sNode);
        if (complete || cNode === sNode) {
            setStoredNode(null);
        } else {
            alert("Failed to connect");
        }
    }

    const del = () => {
        const complete = removeNode(cNode);
        if (complete) {
            setCurrentNode(head);
        } else {
            alert("Failed to delete")
        }
    }

  return (
    <div>
        <header>Technology</header>
        <label htmlFor='Name'>Name: </label>
        <input id='Name' onChange={updateNode('name')} value={cNode.data.name}/>
        <label htmlFor='Desc'>Desc: </label>
        <textarea id='Desc' onChange={updateNode('description')} value={cNode.data.description}></textarea>
        <label htmlFor='Cost'>Cost: </label>
        <input id='Cost' onChange={updateNode('cost')} type='number' value={cNode.data.cost}/>

        <button onClick={() => setStoredNode(cNode)}>Create Connection</button>
        <button onClick={del}>Delete Node</button>

        <br />
        Parents
        <div className='ParentList'>
            <div>
                {cNode.parentNodes.map((node) => <NodePreview node={node} 
                    switchNode={() => setCurrentNode(node)} remove={remove(node)} />)}
            </div>
        </div>

        <br />
        Children
        <div className='ChildList'>
            <div>
                {cNode.childNodes.map((node) => <NodePreview node={node} 
                    switchNode={() => setCurrentNode(node)} remove={remove(node)} />)}
            </div>
            {sNode === null ? 
                <button onClick={newNode}>Create New Child</button>:
                <button onClick={connect}>Connect Nodes</button>}
        </div>
    </div>
  )
}

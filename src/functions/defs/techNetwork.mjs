const exampleNode = {
    parentNodes: [],
    requirement: [],
    childNodes: [],
    data: {
        ID: "",
        cost: 0,
        name: "Generic Tech",
        description: "Generic level of technology"
    }
};

export const exampleNetwork = {
    head: exampleNode,
};

export const createNode = (ID, parent, name, cost, description) => {
    const nNode = {
        parentNodes: [parent],
        requirements: [true],
        childNodes: [],
        data: {
            ID,
            cost,
            name,
            description
        }
    }
    parent.childNodes.push(nNode);
    return nNode;
}

export const createNetwork = head => {
    return {head};
}

export const distanceToHead = (head, source) => {
    if (source.parentNodes.includes(head)) return 1;
    const len = source.parentNodes.map((node) => distanceToHead(head, node));
    return len.reduce((a, v) => v < a ? v:a);
}

export const connectNodes = (parent, child, requirement) => {
    if (child.parentNodes.includes(parent) || child === parent) 
        return false;

    const parentSet = new Set();
    parents(parent, parentSet);
    if (parentSet.has(child)) return false;

    child.parentNodes.push(parent);
    child.requirements.push(requirement);
    parent.childNodes.push(child);
    return true;
}

export const removeConnection = (parent, child) => {
    if (!parent.childNodes.includes(child) || child.parentNodes.length < 2) 
        return false;

    parent.childNodes.splice(parent.childNodes.indexOf(child), 1);
    child.parentNodes.splice(parent.parentNodes.indexOf(parent), 1);
    return true;
}

const parents = (node, set) => {
    const parentList = node.parentNodes;
    parentList.forEach((item) => {
        if (set.has(item)) return;
        set.add(item);
        parents(item, set);
    });
}

export const removeNode = (node) => {
    const parents = node.parentNodes;
    const children = node.childNodes;

    if (children.length !== 0) return;

    parents.forEach((parent) => {
        const children = parent.childNodes;
        children.splice(children.indexOf(node), 1);
    });
}

export const buyNode = (faction, node) => {
    const {Technologies, TechPoints} = faction.Technology;
    if (node.data.cost > TechPoints && 
        Technologies.some((tech) => tech.ID === node.data.ID)) return faction;
    return {
        ...faction,
        Technology: {
            ...faction.Technology,
            Technologies: [...Technologies, node.data],
            TechPoints: TechPoints - node.data.cost
        }
    }
}

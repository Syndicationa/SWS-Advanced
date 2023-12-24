import { objectMap } from "../functions.mjs"

const hmgFactionTemplate = {
    fill: "#FFFFFF",
    stroke: "#FFFFFF",
    hexCount: 9,
    id: 1,
    name: "Astute",
    abb: "ast"
}

export const saveFileTemplate = {
    name: "grid",
    width: 100,
    height: 100,
    hexOpacity: 1,
    stroke: {r: 255, g: 255, b: 255, a:1},
    factions: [hmgFactionTemplate],
    hexes: [[null, "ast", null, "ast", null]],
    image: {},
    imageData: ""
}

const resourceTemplate = {
    BuildingMaterials: 1,
    OtherMaterial: 0
}

export const calculateResources = (maps = [saveFileTemplate], resources = {grid: resourceTemplate}) => {
    maps.reduce((acc, map) => {
        const resourcesOnMap = calculateResourcesOnMap(map, resources[map.name])
        if (acc === undefined) return resourcesOnMap;
        const factionData = {...acc, ...resourcesOnMap};
        return objectMap(factionData)((data, factionName) => {
            if(resourcesOnMap[factionName] === undefined) return data;

            const resources = {...data, ...acc[factionName]};
            return objectMap(resources)((_, resourceName) => {
                const existingCount = acc[factionName][resourceName] ?? 0;
                const newCount = data[resourceName] ?? 0;
                return existingCount + newCount;
            })
        })
    }, undefined)
}

export const calculateResourcesOnMap = (map = saveFileTemplate, resource) => {
    if (resource === undefined) return {};
    const hexCounts = calculateHexCount(map);
    const resourcesPerFaction = objectMap(hexCounts)((count) => {
        return objectMap(resource)((resource) => resource*count);
    });
    return resourcesPerFaction;
}

export const calculateHexCount = (map = saveFileTemplate) => {
    const obj = {};
    map.factions.sort((f1, f2) => f1.id - f2.id);
    let s = "";
    let v = 0;
    const isEdge = (farSide = 0) => (value) => value === 0 || value === farSide;
    const isBottomOrTop = isEdge(map.height - 1);
    const isLeftOrRight = isEdge(map.width -1 );
    const isEven = v => v % 2 === 0
    for (let r = 0; r < map.width; r++) {
        for (let c = 0;  c < map.height; c++) {
            s = map.factions[map.hexes[r][c] - 1].name;
            if (s === null) continue;
            if (obj[s] === undefined) obj[s] = 0;
            if (isLeftOrRight(r) && isBottomOrTop(c)) v = 0.25;
            else if (
                (isLeftOrRight(r) && isEven(c)) ||
                (isBottomOrTop(c) && isEven(r))) v = 0.5;
            else v = 1
            obj[s] += v;
        }
    }
    return obj;
}
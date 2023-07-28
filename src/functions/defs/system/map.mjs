import { map, sumArrays } from "../../functions.mjs";
import { distance } from "../../vectors.mjs";
//import { hexArea } from "../hexArea.mjs";

export const exampleMapElement = {
    Appearance: {
        area: [[]], name: "", visible: true,
        Img: false, Shape: "Circle", SystemSize: [1,1], TrueSize: [3,0,6,5],
        Color: "#ffffff"
    },
    Movement: {
        pos: [],
        vel: [],
        movFunc: () => {}
    },
    Grid: {
        size: 32,
        defaultSubGridSize: 0,
        orbiters: []
    }
}

export const createMapElement = (infoPacket) => {
    return {
        Appearance: {
            area: [[]], name: "", visible: true,
            Img: false, Shape: "Circle", SystemSize: [1,1], TrueSize: [2,0],
            Color: "#ffffff",
            ...infoPacket.Appearance
        },
        Movement: {
            pos: [],
            vel: [],
            movFunc: () => {},
            ...infoPacket.Movement
        },
        Grid: {
            size: 64,
            defaultSubGridSize: {OverallSize: 64, StepSizes: [8,1]},
            orbiters: [],
            ...infoPacket.Grid
        }
    }
}

export const createMapElementList = (mapElement = exampleMapElement) => {
    return [trueMapElementArea(mapElement), ...map(falseMapElementArea, mapElement.Grid.orbiters)];
}

export const trueMapElementArea = (mapElement = exampleMapElement) => {
    //return hexArea(mapElement)
    const size = mapElement.Grid.size;
    const l = Math.ceil(size/2);
    const loc = [l,l];

    let area = [];
    let d = -Infinity;

    const trueSize = mapElement.Appearance.TrueSize
    for (let i = 0; i < trueSize.length; i += 2) {
        const outerBound = trueSize[i];
        const innerBound = trueSize[i + 1];
        for (let x = l - outerBound; x <= l + outerBound; x++) {
            for (let y = l - outerBound; y <= l + outerBound; y++) {
                d = distance([x, y], loc);
                if (d <= outerBound && d >= innerBound) area = [...area, [x, y]];
            }
        }
    }

    return {...mapElement, Appearance: {...mapElement.Appearance, area}};
}

export const falseMapElementArea = (mapElement = exampleMapElement) => {
    const loc = mapElement.Movement.pos;
    const area = loc;

    return {...mapElement, Appearance: {...mapElement.Appearance, area}};
}


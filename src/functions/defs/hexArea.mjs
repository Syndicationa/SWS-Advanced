import { map, sumArrays } from "../functions.mjs";
import { exampleMapElement } from "./system/map.mjs";

const rad = (ang) => {
    return ang * (Math.PI / 180);
  }
  
const getHexPoints = (hw) => {
    let points = [];

    for (let i = 0; i < 6; i++) {
        points.push([hw * Math.cos(rad(i * 60)), hw * Math.sin(rad(i * 60))]);
    }

    points = map(map(Math.round), points);

    return points;
}

export const isInPolygon = (point, polyPoints) => {
    return polyPoints.every((point1, index, array) => {
        const point2 = array[(index + 1) % array.length];
        const d = (point2[0] - point1[0]) * (point[1] - point1[1]) - (point[0] - point1[0]) * (point2[1] - point1[1])
        return d >= 0;
    })
}

export const hexArea = (mapElement = exampleMapElement) => {
    const size = mapElement.Grid.size;
    const l = Math.ceil(size/2);
    const loc = [l,l];

    const outerBound = mapElement.Appearance.TrueSize[0];

    let area = [];
    let hex = getHexPoints(outerBound)

    for (let x = -outerBound; x <= outerBound; x++) {
        for (let y = -outerBound; y <= outerBound; y++) {
            if (isInPolygon([x,y],hex)) area = [...area, [x,y]]
        }
    }
    area = area.map((p) => sumArrays(p, loc));
    console.log(area)

    return {...mapElement, Appearance: {...mapElement.Appearance, area}};
}

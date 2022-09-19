//import { Player, Ship } from "./defs";

export const clone = (obj, asObject = false) => {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    let copy;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = obj.map((value) => clone(value, asObject));
        return copy;
    }

	/*if (obj instanceof Player && !asObject) {
		return new Player(obj, obj.grSize);
	}

	if (obj instanceof Ship && !asObject) {
		return new Ship(obj.player, obj.number, obj, obj.faction, obj.type, [...obj.sector, obj.position], obj.rot, obj.grSize);
	}*/

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr], asObject);
        }
        return copy;
    }

    //throw new Error("Unable to copy obj! Its type isn't supported.");
}

const updateSector = (LocArray, grSize) => {
	let position = LocArray[LocArray.length - 1];
	let sector = LocArray.slice(0,-1);
	let [x,y] = position;
	let [secX,secY] = [0,0];
	if (x >= 0 && x < grSize[sector.length] && y >= 0 && y < grSize[sector.length]) {
		return [...sector,position];
	}
	if (sector.length === 0) return [];
	[secX,secY] = sector[sector.length - 1];
	const xOffset = Math.floor(x/grSize[sector.length]);
	secX += xOffset;
	x = x - grSize[sector.length]*xOffset;
	const yOffset = Math.floor(y/grSize[sector.length]);
	secY += yOffset;
	y = y - grSize[sector.length]*yOffset;
	if (sector.length === 0) {
		return [];
	} else
	sector[sector.length - 1] = [secX,secY];
	let nSector = updateSector(sector, grSize);
	if (nSector.length === 0) {
		return [];
	}
	return [...nSector,[x,y]];
}

export const compareArray = (arr1 = [], arr2 = [], length = 0) => {
	if (!length) {
		length = arr1.length;
	}
	let array1 = arr1.slice(0,length);
	let array2 = arr2.slice(0,length);
	return JSON.stringify(array1) === JSON.stringify(array2);
}

export const rectangle = (location = [], size = [], angle) => {
	if (size.length !== 2) return;
	const width = size[0];
	const height = size[1];
	const widthEven = width % 2 === 0;
	const heightEven = height % 2 === 0;
	const sizeEven = widthEven || heightEven;
	const cornerOffset = Math.atan2(height, width);
	const radAngle = Math.PI*(angle)/4;
	const centerAngle = Math.PI*(angle - (widthEven + !heightEven))/4;
	const centerOffsetX = 0.5 + sizeEven ? (Math.sign(Math.round(Math.sin(centerAngle)))): 0;
	const centerOffsetY = 0.5 + sizeEven ? (Math.sign(Math.round(Math.cos(centerAngle)))): 0;
	const centerX = location[0] + centerOffsetX;
	const centerY = location[1] + centerOffsetY;
	const cenCornerLength = (Math.sqrt(width**2 + height**2))/2;

	const calculatePoint = (offSet, cornerOff, angle) => [
		centerX + cenCornerLength*Math.cos(offSet + angle + cornerOff),
		centerY + cenCornerLength*Math.sin(offSet + angle + cornerOff)
	]

	return [
		calculatePoint(Math.PI, -cornerOffset, radAngle),
		calculatePoint(0, cornerOffset, radAngle),
		calculatePoint(0, -cornerOffset, radAngle),
		calculatePoint(Math.PI, cornerOffset, radAngle)
	];
}

export const isInRectangle = (point, rectanglePoints) => {
	return rectanglePoints.every((point1, index, array) => {
		const point2 = array[index % 4];
		const d = (point2[0] - point1[0]) * (point[1] - point1[1]) - (point[0] - point1[0]) * (point2[1] - point1[1])
		return d >= 0;
	})
}

export const distance = (loc, pos) => {
	return Math.ceil(Math.sqrt((loc[0] - pos[0])**2 + (loc[1] - pos[1])**2));
}

export const absSum = (v1 = 0, v2 = 0) => {
    return Math.abs(v1) + Math.abs(v2);
}

export const sumArrays = funcOnArrays((a, b) => a+b);

export const funcOnArrays = (func) => (arr1, arr2) => arr1.map((val, i) => func(val, arr2[i]));

export const negateArray = arr => arr.map((val) => -val);
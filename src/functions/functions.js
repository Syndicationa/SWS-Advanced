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

export const updateSector = (LocArray, grSize) => {
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
import { Vehicle } from "./defs/vehicle";
import { clone, updateSector, compareArray } from "./functions";

export const moveCursor = (dx, dy, data, rules = true) => {
    const {grSize, cursorLoc, cLevel} = data;
	let cLoc = clone(cursorLoc);
    let [x,y] = cLoc[cLevel];

	cLoc[cLevel] = [x + dx, y + dy];
    let NewCurLoc = updateSector(cLoc.slice(0,cLevel + 1), grSize);
    if (NewCurLoc.length === 0 && rules) {
        if (x < 0 || x >= grSize[cLevel]) {
            x -= dx;
        }
        if (y < 0 || y >= grSize[cLevel]) {
            y -= dy;
        }
        cLoc[cLevel] = [x,y];	
    } else if (NewCurLoc.length !== 0) {
        cLoc = [...NewCurLoc,...cLoc.slice(cLevel + 1,cursorLoc.length)];
    }
    return cLoc;
}

export const updateImpulse = (players) => {
	return [players.map(plyr => plyr.AP), 1];
	const impulseAP = [];

	const impulseArr = players.map((val) => {
		let tImpulseAP = 2*Math.ceil(val.AP/16);
		impulseAP.push(tImpulseAP);
		return Math.ceil(val.AP/tImpulseAP);
	});
	impulseArr.sort((a, b) => a-b);

	if (impulseArr[0] !== impulseArr[impulseArr.length -1]) {
		impulseArr[0]++;
	}

	const impulseCount = impulseArr[0];
    return [impulseAP, impulseCount];
}

export const calculateDist = (LocArr1 = [], LocArr2 = [], grSize) => {
	const [xdist, ydist] = calcLocDiff(LocArr1, LocArr2, grSize)
	return Math.abs(xdist) + Math.abs(ydist);
}

export const calcLocDiff = (LocArr1 = [], LocArr2 = [], grSize) => {
	const location1 = LocArr1.reduce((pre ,loc,index) => {
		return pre.map((num, i) => num*grSize[index] + loc[i]);
	}, [0,0]);
	const location2 = LocArr2.reduce((pre ,loc,index) => {
		return pre.map((num, i) => num*grSize[index] + loc[i]);
	}, [0,0]);
	let xdist = location1[0] - location2[0];
	let ydist = location1[1] - location2[1];
	return [xdist, ydist];
}

//Takes in a set of coordinates and a rotation value and calculates if the point is more than second rotation value

export const inFiringRot = (xdist, ydist, oRot, wRot, offset) => {
	let trueORot = (oRot + (offset || 0)) % 8;
	const atanValue = 4*Math.atan2(xdist,ydist)/Math.PI
	const xnegative = (xdist < 0 ? 8: 0);
	let tRot = Math.round(atanValue) + xnegative;
	let fRot = Math.round(atanValue - 1/2) + xnegative;
	let intRotation = tRot + fRot - 2*trueORot;
	intRotation = intRotation + (intRotation < 0 ? 16:0);
	const specificRot = atanValue + xnegative;
	
	const leftCheck = intRotation >= (16 - wRot);
	const rightCheck = intRotation < wRot;
	//The Right check cannot detect if the location is on the rightmost line of the area created by wRot
	const rightLineCheck = specificRot - oRot === wRot/2;

	/*console.log(`xDist: ${xdist}\n
yDist: ${ydist}\n
Original Rotation: ${oRot}\n
Weapon Rotation: ${wRot}\n
True Rotation: ${tRot}\n
False Rotation: ${fRot}\n
Integer Rotaion: ${intRotation}\n
Specific Rotation: ${specificRot}\n
Left Check: ${leftCheck}\n
Right Check: ${rightCheck}\n
Right Line Check: ${rightLineCheck}`)*/

	return leftCheck || rightCheck || rightLineCheck;
}//*

const calcDefVehicle = (players, defVehicle, grSize) => {
	const defPlayer = players.find((player) => player.playerNum === defVehicle.player);
	const defVehicles = defPlayer.defensesInArea(defVehicle.location, grSize);
	return defVehicles.reduce((total, Vehicle) => {
		const dWeap = Vehicle.Weap[Vehicle.defensive];
		const dist = calculateDist(defVehicle.location, Vehicle.location, grSize);
		const wCov  = dWeap.Wcov;
		const dHit = dWeap.Whit;
		return total + ((dHit*wCov)/20)/(dist + 1);
	}, 0)
}

export const hitData = (atkVehicle = Vehicle, defVehicle = Vehicle, aWeap = Object, datum) => {
	const {grSize, players} = datum;
	console.log(grSize);
	let wHit = aWeap.Whit;
	let wRan = aWeap.Wran; // + factionTraits[atkVehicle.player.Faction][5] + factionTraits[atkVehicle.player.Faction][5];
	let acc = atkVehicle.Acc; // + factionTraits[atkVehicle.player.Faction][2]*(factionTraits[atkVehicle.player.Faction][10]) + factionTraits[atkVehicle.player.Faction][2];
	let defdata = defVehicle.getDefenses();
	let mov = defdata[1];
	let dist = calculateDist(atkVehicle.location,defVehicle.location, grSize);
	let hitchance = wHit + acc - 5*(3^(mov/5));
	hitchance /= (dist - wRan - 1)*(dist - wRan > 0) + 1;
	let hitDchance = hitchance;
	if (aWeap.Type === "Missile") {
		//const defPlayer = players.find((player) => player.playerNum === defVehicle.player)
		const hitDifference = calcDefVehicle(players, defVehicle, grSize)
		hitDchance -= hitDifference; //+  factionTraits[atkVehicle.player.Faction][3];
	}
	return [hitchance, hitDchance];
}

const calculateHit = (atkVehicle = Vehicle, defVehicle = Vehicle, weap = Number, datum) => {
    const {grSize, cLoc, players} = datum;
	let aWeap = atkVehicle.getWeapon(weap);

	let defPlayerNum;
	if (aWeap.Type === "Destruct") {
		//defPlayerNum = defVehicle.map((dVehicle) => players.findIndex((player) => player.playerNum === dVehicle.player));
	} else {
		defPlayerNum = players.findIndex((player) => player.playerNum === defVehicle.player)
	}

	let data = [];

	if (aWeap.Type === "Deploying") {
		const hit = atkVehicle.rot;
		let loc = 0;
		atkVehicle.Area.forEach((val, index) => {
			if (compareArray(val,cLoc)) {
				loc = index;
			}
		});
		data = [atkVehicle.number,weap,0,loc,hit];
	} else if (aWeap.Type === "Healing" || aWeap.Type === "Resupplying") {
		let dist = calculateDist(atkVehicle.location,defVehicle.location, grSize);
		const hit = 2*(dist <= 1);
		data = [atkVehicle.number,weap,defPlayerNum,defVehicle.number,hit];
	} else if (aWeap.Type === "Energy") {
		let dist = calculateDist(atkVehicle.location,defVehicle.location, grSize);
		const hit = 2*(dist <= 5);
		data = [atkVehicle.number,weap,defPlayerNum,defVehicle.number,hit];
	} else if (aWeap.Type === "Destruct") {
		let DataList = [[],[],[]]; //PlayerNum, Vehicle, hit
		const location = aWeap.Type === "Destruct" ? atkVehicle.location: defVehicle.location;
		let wRan = aWeap.Type === "Destruct" ? aWeap.Wran: aWeap.Eran;
		let dVehicles = players.reduce((arr, player) => [...arr, ...player.VehiclesInRadius(location, wRan, grSize)], []);
		dVehicles.forEach((defVehicle) => {
			const hitchance = hitData(atkVehicle,defVehicle, aWeap, {grSize, players})[0];
			let rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
			const hit = 2*(hitchance > rand);
			const defPlayerNum = players.findIndex((player) => player.playerNum === defVehicle.player);
			DataList[0].push(defPlayerNum);
			DataList[1].push(defVehicle.number);
			DataList[2].push(hit);
		});
		data = [atkVehicle.number,weap, ...DataList];
	} else if (aWeap.Eran !== undefined) {
		const location = defVehicle.location;
		let eRan = aWeap.Eran;
		let dVehicles = players.reduce((arr, player) => [...arr, ...player.VehiclesInRadius(location, eRan, grSize)], []);
		const [hitchance, hitDchance] = hitData(atkVehicle, defVehicle, aWeap, {grSize, players});
		const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
		const hitMain = (hitchance > rand) + (hitDchance > rand);
		const hitArray = dVehicles.map((defVehicle) => {
			if (hitMain < 2) return hitMain;
			const [hitchance, hitDchance] = hitData(atkVehicle, defVehicle, aWeap, {grSize, players});
			const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
			const hit = (hitchance > rand)*2;
			console.log(`Hit: ${hitchance}, Def Hit: ${hitDchance}, Rand: ${rand}`);
			return hit;
		});
		data = [atkVehicle.number,weap, defPlayerNum, defVehicle.number, hitArray];
	} else if (aWeap.Type === "Wait") {
		data = [atkVehicle.number,weap,defPlayerNum,defVehicle.number,0];
	} else {
		const [hitchance, hitDchance] = hitData(atkVehicle, defVehicle, aWeap, {grSize, players});
		const rand = Math.floor(Math.random()*100 + Math.random()*100)/2;
		const hit = (hitchance > rand) + (hitDchance > rand);
		console.log(`Hit: ${hitchance}, Def Hit: ${hitDchance}, Rand: ${rand}`);
		data = [atkVehicle.number,weap,defPlayerNum,defVehicle.number,hit];
	}

	return data;
}

export const calculateDamage = (aWeap, atkVehicle, defVehicle, grSize) => {
	const wAtk = aWeap.Watk;
	const wRan = aWeap.Wran;
	const wMran = aWeap.WMran || 0;
	const wRAtk = aWeap.WRatk;
	const def = defVehicle.Def;
	const dist = calculateDist(atkVehicle.location, defVehicle.location, grSize);
	let damage = wAtk - def + wRAtk*(dist - wMran + (wRan - dist)*(wRAtk >= 0 && dist >= wRan));
	damage = Math.round(damage);
	damage = damage*(damage > 0);
	return damage;
}

const runNormAttack = (aWeap, atkVehicle, defVehicle, attackPlayer, defPlayer, hit, data) => {
	const {grSize, players} = data;
	let damage = calculateDamage(aWeap, atkVehicle, defVehicle, grSize);
	defVehicle.defend(damage*(hit === 2), aWeap.Type);
	if (aWeap.Type === "Missile" && hit > 0) {
		const defVehicles = players.reduce((arr, player) => [...arr, ...player.defensesInArea(defVehicle.location, grSize)], [])
		defVehicles.forEach(Vehicle => Vehicle.useDefenses());
	}
		if (hit === 2) {
			return `${attackPlayer.Name}'s ${atkVehicle.Name} hits ${defPlayer.Name}'s ${defVehicle.Name} for ${damage} HP.\n`;
		} else if (hit === 1) {
			return `${attackPlayer.Name}'s ${atkVehicle.Name}'s fire is intercepted before hitting ${defPlayer.Name}'s ${defVehicle.Name}\n`;
		} else {
			return `${attackPlayer.Name}'s ${atkVehicle.Name} misses ${defPlayer.Name}'s ${defVehicle.Name}.\n`;
		}
}

export const attackVehicle = (atkVehicle = Vehicle,dVehicle,weap = Number,hit = Number, undo = false, datum) => {
    const {grSize, players, cPlayer, attackList, setAttackList, data} = datum;
	let defVehicle = dVehicle;
	
	if (weap === -1) return;

	let aWeap = atkVehicle.getWeapon(weap);

	const atkPlayerNum = players.findIndex((player) => player.playerNum === atkVehicle.player);
	const attackPlayer = players[atkPlayerNum]
	let defPlayerNum;
	let defPlayer;

	//if (atkPlayerNum === cPlayer) setCurrentAP(curAP + aWeap.APCost*(2*undo - 1));

	if (hit < 0) {
		const results = calculateHit(atkVehicle, defVehicle, weap, datum);
		if (aWeap.Type === "Deploying") defVehicle = results[3];
		if (aWeap.Type === "Destruct") {
			defVehicle = results[2].map((player, i) => {
				return players[player].VehicleList[results[3][i]];
			})
		}
		hit = results[4];

		setAttackList([...attackList, results]);
	}

	if (aWeap.Type === "Destruct") {
		defPlayerNum = defVehicle.map((dVehicle) => players.findIndex((player) => player.playerNum === dVehicle.player));
		defPlayer = defPlayerNum.map((num) => players[num]);
	} else {
		defPlayerNum = players.findIndex((player) => player.playerNum === defVehicle.player)
		defPlayer = players[defPlayerNum];
	}

	let str = "";
	let damage = 0;
	//let cDefW = 0;

	atkVehicle.attack(weap,undo);

	const type = aWeap.Type;

	if (type !== "Deploying" && (hit === 3 || hit === 4)) {
		defPlayerNum = players.findIndex((player) => player.playerNum === defVehicle.player);
		if (hit === 4) setAttackList([...attackList, [atkVehicle.number, weap, defPlayerNum, defVehicle.number, 3]])
		return "No target was hit";
	}

	if ((type === "Generic" || type === "Missile" || type === "Ramming")) {
		if (aWeap.Eran === undefined) return runNormAttack(aWeap, atkVehicle, defVehicle, attackPlayer, defPlayer, hit, {players, grSize});
		const defenders = players.reduce((arr, player) => [...arr, ...player.VehiclesInRadius(defVehicle.location, aWeap.Eran, grSize)], []);
		if (aWeap.Type === "Missile" && hit[0] > 0) {
			const defVehicles = players.reduce((arr, player) => [...arr, ...player.defensesInArea(dVehicle.location, grSize)], [])
			defVehicles.forEach(Vehicle => Vehicle.useDefenses());
		}
		console.log(defenders);
		defenders.forEach((defVehicle, i) => {
			const hi = hit[i];
			const wAtk = aWeap.Watk;
			const wRan = aWeap.Wran;
			const wMran = aWeap.WMran || 0;
			const wRAtk = aWeap.WRatk;
			const def = defVehicle.Def;
			const dist = calculateDist(atkVehicle.location, defVehicle.location, grSize);
			const dist2 = calculateDist(dVehicle.location, defVehicle.location, grSize);
			let damage = wAtk - def + wRAtk*(dist - wMran + (wRan - dist)*(wRAtk >= 0 && dist >= wRan));
			damage /= (2*dist2 + 1);
			damage = Math.round(damage);
			damage = damage*(damage > 0);
			defVehicle.defend(damage*(hi === 2), aWeap.Type);
			if (hi === 2) {
				str += `${attackPlayer.Name}'s ${atkVehicle.Name} hits ${defPlayer.Name}'s ${defVehicle.Name} for ${damage} HP.\n`;
			} else if (hi === 1) {
				str += `${attackPlayer.Name}'s ${atkVehicle.Name}'s fire is intercepted before hitting ${defPlayer.Name}'s ${defVehicle.Name}\n`;
			} else {
				str += `${attackPlayer.Name}'s ${atkVehicle.Name} misses ${defPlayer.Name}'s ${defVehicle.Name}.\n`;
			}
			})
		return str;
	} else if (type === "Destruct") {
		defVehicle.forEach((defVehicle,i) => {
			str += runNormAttack(aWeap, atkVehicle, defVehicle, attackPlayer, defPlayer, hit[i], {players, grSize});
		});
		return str;
	} else if (type === "Deploying") {
		const Vehicle = data.VehicleTypes[atkVehicle.faction][aWeap.dType];
		const nVehicle = new Vehicle(attackPlayer.playerNum, attackPlayer.VehicleList.length, Vehicle, attackPlayer.Faction, aWeap.dType, atkVehicle.Area[defVehicle], atkVehicle.rot, grSize);
		attackPlayer.VehicleList.push(nVehicle);
		return `${attackPlayer.Name}'s ${atkVehicle.Name} deploys a ${nVehicle.Name}.\n`
	} else if (type === "Healing") {
		damage = aWeap.Watk;
		damage = damage*(damage > 0);
		defVehicle.defend(damage*(hit === 2),aWeap.Type,undo);
		return `${attackPlayer.Name}'s ${atkVehicle.Name} heals ${defPlayer.Name}'s ${defVehicle.Name} for ${damage} HP.\n`;
	} else if (type === "Resupplying") {
		const aAmmo = atkVehicle.Ammo.find(type => type.Name === aWeap.aType);
		const dAmmo = defVehicle.Ammo.find((type) => type.Name === aWeap.dType);
		if (!dAmmo) {return}
		const tCount = dAmmo.Count + aAmmo.Count;
		if (tCount < dAmmo.MCount) {
			dAmmo.Count = tCount
			aAmmo.Count = 0;
		} else {
			dAmmo.Count = dAmmo.MCount;
			aAmmo.Count = tCount - dAmmo.MCount;
		}

		return `${attackPlayer.Name}'s ${atkVehicle.Name} resupplies ${defPlayer.Name}'s ${defVehicle.Name}'s ${dAmmo.Name} Round supply.\n`;
	} else if (type === "Energy") {
		atkVehicle.Energy = defVehicle.addEnergy(atkVehicle.Energy);
		return `${attackPlayer.Name}'s ${atkVehicle.Name} sends Energy to ${defPlayer.Name}'s ${defVehicle.Name}.\n`
	}
	
	return "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
}

export const updateDataString = (stage, players, player, attackList) => {
	let dString = "";
	if (stage === 0) {
		dString = `S-`;
        player.VehicleList.forEach((Vehicle, i, arr) => {
            const faction = Vehicle.faction;
			const type =  Vehicle.type;
			const position = JSON.stringify(Vehicle.position);
			const sector = JSON.stringify(Vehicle.sector);
			const rot = Vehicle.rot;
			dString += `${faction}.${type}.${position}.${sector}.${rot}`;
			if(i + 1 !== arr.length) {
				dString += ";"
			}
        });
	} else if (stage === 10) {
		dString += "M-" + player.movType + ";";
		player.VehicleList.forEach((val,ind,arr) => {
			dString += `${ind}.${val.dX}.${val.dY}.${val.rot}`;
			if (ind + 1 !== arr.length){
				dString += ";";
			}
		});
	} else if (stage === 20) {
		dString = "";
		dString += "A-"
		attackList.forEach((atk,ind,arr) => {
			let defPlayers = "";
			if (Array.isArray(atk[2])) {
				let dPlayers = [];
				atk[2].forEach((val) => dPlayers.push(players[val].playerNum));
				defPlayers = JSON.stringify(dPlayers);
			} else {
				defPlayers = JSON.stringify(players[atk[2]].playerNum);
			}
			const defVehicles = JSON.stringify(atk[3]);
			const hits = JSON.stringify(atk[4]);
			//VehicleNum, Weapon, Defending Player, def Vehicle Num, Hit
			dString += `${atk[0]}.${atk[1]}.${defPlayers}.${defVehicles}.${hits}`;
			if (ind !== arr.length - 1){
				dString += ";";
			}
		});
		if (dString === "A-") {
			dString = "Skip";
		}
	}
    return dString;
}
import {clone, updateSector, compareArray, rectangle, isInRectangle, distance} from './functions.js';
import {attackShip, calcLocDiff, inFiringRot} from "./game";

export class Faction {
	constructor() {
		this.Name = "";
		this.Color = "";

		this.Moves = [];

		this.Players = [];
		//Add get Leader and set Leader
		this.LeaderIndex = 0;
		//List of those who can use econ controls
		this.Treasurers = [this.LeaderIndex];

		this.Regions = {Earth: [], Cities: []}
		this.Treasury = 0;
		this.LastUpdated = 0;
		this.BuildingTypes = [];
		this.VehicleTypes = [];
		this.OwnedBuildings = [];
		this.OwnedShips = {unclaimed: [], unclaimedRepair: [], claimed: []};
	}

	get Leader() {
		return this.Players[this.LeaderIndex];
	}

	get Income() {
		return this.OwnedBuildings.reduce((previous, building) => {
			return previous + building.producedValue;
		}, 0)
	}

	collectIncome() {
		if (!LastUpdated) return;
		this.Treasury += this.Income;
	}

	buyItem (cost) {
		this.Treasury -= cost;
	}

	sellItem (cost) {
		this.Treasury += cost;
	}

	addBuilding (building, location) {
		this.OwnedBuildings.push({...building, ...location});
	}

	removeBuilding (index) {
		this.OwnedBuildings.splice(index, 1)[0];
	}

	addNewShip (ship) {
		this.OwnedShips.unclaimed.push(ship);
	}

	addRepairShip (ship) {
		this.OwnedShips.unclaimedRepair.push(ship);
	}

	removeShip (index, group) {
		this.OwnedShips[group].splice(index, 1)
	}

	sendVehicle(vehicle, destination) {
	}
}

export class CelestialBody {
	constructor() {
		this.Terrain = [[]];
		this.FactionsPresent = [];
		this.Cities = [];
		this.Size = [];
		this.representaion = {};//Vehicle
	}
}

export class Player {
	constructor(player, playerList) {
		this.Name = player.Name || player.Username || "";
		this.Faction = player.Faction || player.DefaultFaction;
		this.ID = player.ID || 0;
		this.exoticFactions = player.exoticFactions || false;
		this.Controls = player.Controls;

		//Colors
		this.colorSet = player.colorSet;
		if (this.colorSet[this.playerNum] === undefined && playerList) {
			let tColor = {};
			for (const play of playerList) {
				const playNum = play.ID || play.userID || play.playerNum || 0;
				const playFact = play.Faction || play.DefaultFaction;
				tColor[playNum] = this.colorSet[playFact];
			}
			this.colorSet = tColor;
		}

		this.movType = player.movType || 0;

		this.Vehicles = [];
		if (player.Vehicles) this.Vehicles = clone(player.Vehicles);
		this.hasMoved = player.hasMoved || false;
		this.moves = player.moves || [];
        this.trueMoves = player.trueMoves || player.moves || [];
	}

	runMove(str, players, data, grSize, addattackdata) {
		console.log(`Running: ${str}`);
		if (!str) return;
		this.moves.push(str);
		this.hasMoved = true;
		if (str.startsWith("S-")) {
			const dString = str.substr(2).split(";");
			for (let val of dString) {
				const substrs = val.split(".");
				const position = JSON.parse(substrs[2]);
				const sector = JSON.parse(substrs[3]);
				const loc = [...sector,position];
				const ship = data.shipTypes[substrs[0]][Number(substrs[1])];
           		const nShip = new Ship(this.playerNum, this.ShipList.length, ship, substrs[0], Number(substrs[1]), loc, Number(substrs[4]), grSize);
				this.ShipList.push(nShip);
			}
		} else if (str.startsWith("M-")) {
			const dString = str.substr(4).split(";");
			for (let val of dString) {
				let substrs = val.split(".");
				let mShip = this.ShipList[Number(substrs[0])];
				mShip.dX = Number(substrs[1]);
				mShip.dY = Number(substrs[2]);
				mShip.rot = Number(substrs[3]);
				mShip.finalizeMove(this.movType);
			}
		} else if (str.startsWith("A-")) {
			this.ShipList.forEach((ship) => ship.hasMoved = false);
			const dString = str.substr(2).split(";");
			if (dString.length === 0) return;
			let returnData = [];
			for (let val of dString) {
				const substrs = val.split(".");
				const atkShip = this.ShipList[Number(substrs[0])];
				const dPlayerNames = JSON.parse(substrs[2]);
				const dShips = JSON.parse(substrs[3]);
				const hits = JSON.parse(substrs[4]);
				const aWeap = atkShip.Weap[Number(substrs[1])];
				let defShip;
				if (aWeap.Type === "Destruct") {
					const dPlayers = dPlayerNames.map((val) => players.find((player) => player.playerNum === val));
					defShip = dPlayers.map((val,index) => val.ShipList[dShips[index]]);
				} else if (aWeap.Type === "Deploying") {
					defShip = dShips;
				} else {
					const dPlayers = players.find((player) => (player.playerNum === dPlayerNames));
					defShip = dPlayers.ShipList[dShips];
				}
				const str = attackShip(atkShip,defShip,Number(substrs[1]),hits, false, {grSize, data, players, cPlayer: -1});
				//console.log(str);
				returnData.push(str);
			}
			addattackdata(returnData);
		} else if (str === "Skip") {
			this.ShipList.forEach((ship) => ship.hasMoved = false);
		} else {
			this.hasMoved = false;
			this.moves.pop();
		}
		this.ShipList.forEach((ship) =>  ship.addEnergy())
		/*storedPlayer[factionIn] = 1;
		storedData[storeNum][factionIn] = str;
		if(storedPlayer.reduce(sum) == playerCount) {
			storeNum++;
			storedPlayer = [0,0,0,0];
			storedData.push([]);
			destroyShips();
			setOlHP();
		}*/
	}

	controlSquare (pos, onlyVisible = false) {
		let type = -1;
		let shape = "";
		let rotaion = -1;
		for (let ship of this.ShipList) {
			if (ship.isInLocation(pos) && (ship.visible || !onlyVisible) && type < ship.type) {
				type = ship.type;
				shape = ship.shape;
				rotaion = ship.rot;
			}
		}
		if (type === -1) {
			return null;
		} else {
			return [shape,rotaion];
		}
	}

	vehicleInPos (pos, onlyVisible = false) {
		return this.ShipList.filter((ship) => ship.isInLocation(pos) && (ship.visible || !onlyVisible))
	}
	
	vehicleInRadius (pos, r) {
		return this.ShipList.filter((ship) => distance(ship.location, pos) <= r);
	}

	defensesInArea (pos, grSize) {
		console.log(grSize);
		return this.ShipList.filter((ship) => {
			if (ship.defensive === -1) return false;
			const dWeap = ship.Weap[ship.defensive];
			return  calculateDist(pos, ship.location, grSize) <= dWeap.Wran;
		})
	}
}

// export class Vehicle {
// 	constructor (player, vNum, vehicle, faction, loc, r) {

// 		//Vehicle Info
// 		this.Player = player;
// 		this.Number = vNum;

// 		this.Faction = faction;
// 		this.Class = vehicle.Class || vehicle.Name;

// 		this.Realm = vehicle.Realm || ["Space"];

// 		this.img = vehicle.img || false;

// 		//Name
// 		this.Name = vehicle.Name;

// 		//Health
// 		this.HP = vehicle.HP;
// 		this.prevHP = vehicle.prevHP || vehicle.HP;
// 		this.maxHP = vehicle.maxHP || vehicle.HP;

// 		//Energy
// 		this.Energy = vehicle.Energy;
// 		this.MaxEnergy = vehicle.maxEnergy || vehicle.Energy;
// 		this.EnergyGenerated = vehicle.EnergyGenerated;
// 		this.MovEnergy = vehicle.MovEnergy;

// 		//Stats
// 		this.Acc = vehicle.Acc;
// 		this.Def = vehicle.Def;
// 		this.Mov = vehicle.Mov;
// 		this.FMov = vehicle.FMov;
// 		this.Size = vehicle.Size || [
// 			vehicle.SizeX || vehicle.sX,
// 			vehicle.SizeY || vehicle.sY];

// 		//Weapons
// 		this.Weap = clone(vehicle.Weap);
// 		this.Ammo = clone(vehicle.Ammo);
// 		this.Weap.forEach((each) => {if (!each.FireCount) each.FireCount = 0});
// 		this.Ammo.forEach((type) => {if (type.Count === null) type.Count = Infinity});
// 		const [hasEnergy, hasExplode] = this.Weap.reduce((previous, type) => {
// 			let hasEnergy = type.Type === "Energy" || previous[0];
// 			let hasExplode = type.Type === "Destruct" || previous[1];
// 			return [hasEnergy, hasExplode];
// 		}, [false, false]);
// 		if (!hasEnergy) {
// 			this.Weap.push({Name: "Energy Transfer", Type:"Energy", aType:"Energy", EnergyCost: 0, FireCount: 0, FireRate: Infinity});
// 			this.Ammo.push({Name: "Energy", Count: Infinity, MCount: Infinity});
// 		}
// 		if (!hasExplode) {
// 			const Watk = Math.round(20*Math.log10(this.HP)) + 20;
// 			const Wran = Math.round((8/3)*Math.log10(this.HP));
// 			const WRatk = Math.floor(-Watk/(Wran + 1));
// 			this.Weap.push({Name: "Self Destruct", Type:"Destruct", aType:"Explodium", 
//                 Watk: Watk, Whit: 75, Wran: Wran, WRatk: WRatk, 
// 				EnergyCost: 0, FireCount: 0, FireRate: 1});
// 			this.Ammo.push({Name: "Explodium", Count: Infinity, MCount: Infinity});
// 		}

// 		//Defenses Need to add more
// 		this.defensive = -1;
// 		this.checkDefenses();

// 		//Position
// 		this.location = clone(loc);
// 		this.prevLocation = clone(loc);
// 		this.rotation = r;
// 		this.Area = [];
// 		this.reArea();
// 		this.Shape = ship.Shape;

// 		//Velocity
//         this.prevVelocity = ship.prevVelocity || [0,0];
//         this.velocity = ship.velocity || [0,0];
// 		this.moveData = "";
// 		this.moved = false;

// 		//Stealth
// 		this.StealthLevel = ship.StealthLevel || ship.Stealth || -1;
// 		const vis = ship.visible === undefined;
// 		this.visible = ship.visible || vis;
// 		this.oDX = ship.oDX || 0;
// 		this.oDY = ship.oDY || 0;
// 		this.hasMoved = ship.hasMoved || false;
// 		this.hasFired = ship.hasFired || false;
// 	}

// 	//#region Move Commands
// 	canMove(movX, movY, movType) {
// 		let val = false;
// 		if (movType === 0) {
// 			if (movX !== 0 && movY !== 0) return false;
// 			this.addMovData(movX, movY);
// 			let tMData = this.moveData.replace(/[+-]/g,"||||").length;
// 			const dist = Math.ceil(tMData/4);
// 			val = dist <= this.Mov && (this.Energy > 0 || this.MovEnergy >= 0);
// 			this.addMovData(-movX, -movY)
// 		} else {
// 			val = (Math.abs(this.dX + movX) + Math.abs(this.dY + movY)) <= this.Mov;
//             val = val && (this.Energy > 0 || this.MovEnergy >= 0);
// 		}
// 		return val;
// 	}
	
// 	addMovData(movX, movY) {
// 		const val = ((movY + 3)/2)*(movX === 0) + (((movX + 3)/2) + 2)*(movY === 0) - 1;
// 		const movStr = ["+","-","L","R"];
// 		const revMovStrs = ["-","+","R","L"];
// 		if (this.moveData.endsWith(revMovStrs[val])) {
// 			this.moveData = this.moveData.slice(0,-1);
// 			this.Energy -= val < 2 ? this.MovEnergy: this.MovEnergy/4;
// 		} else {
// 			this.moveData += movStr[val];
// 			this.Energy += val < 2 ? this.MovEnergy: this.MovEnergy/4;
// 		}
// 		//if (preMoveInst ==  + )
// 	}

//     setVelocity (dX, dY) {
//         this.velocity = [dX, dY];
//     }

//     addVelocity (dX, dY) {
//         this.velocity[0] += dX;
//         this.velocity[1] += dY;
//     }

// 	moveShip () {	
//         this.moved = true;
//         this.position[0] = this.originalPos[0] + this.velocity[0];
//         this.position[1] = this.originalPos[1] + this.velocity[1];
//         let newPosition = updateSector([...this.sector, this.position], this.grSize);
//         if (newPosition.length !== 0) {
//             this.position = newPosition.pop();
//             this.sector = newPosition;
//         }
//         this.reArea();
// 	}

// 	finalizeMove(movType) {
// 		if (!this.moved) this.moveShip();
// 		this.hasMoved = !(compareArray(this.originalVelocity, this.velocity));

// 		this.hasFired = false;

// 		if (movType === 0) {
// 			this.originalVelocity = clone(this.velocity);
// 		} else {
// 			this.velocity = [0, 0];
// 		}
// 		this.originalPos = clone(this.Position);
// 		this.originalSector = clone(this.Sector);
// 		this.moveData = "";
// 		this.moved = false;
// 		this.reArea();
// 	}
//     //#endregion

// 	//#region Attack Commands
// 	canFire(weapon, enemyLoc){
// 		const [xdif, ydif] = calcLocDiff(this.location, enemyLoc, this.grSize);
// 		const weap = this.Weap[weapon];
// 		const ammoCount = this.getAmmo(weap).Count;
// 		const ammo = (ammoCount > 0);
// 		const energy = this.Energy >= weap.EnergyCost;
// 		const fireRate = weap.FireCount < weap.FireRate;
// 		const ran = weap.WMran === undefined ? true: weap.WMran <= (Math.abs(xdif) + Math.abs(ydif));
// 		const loc = weap.Wrot === undefined ? true: inFiringRot(-xdif, ydif, this.rot, weap.Wrot + Math.round(this.Mov/6), weap.Offset);
// 		return ammo && energy && fireRate && ran && loc;
// 	}

// 	getWeapon(weapon) {
// 		return this.Weap[weapon];
// 	}

//     getAmmo(weapon) {
//         const ammoType = weapon.aType;
// 		return this.Ammo.find((type) => type.Name === ammoType);
//     }

// 	attack(weapon) {
// 		this.hasFired = true;
// 		let aWeap = this.Weap[weapon];
// 		aWeap.FireCount++;
// 		this.Energy -= aWeap.EnergyCost;
// 		const ammo = this.getAmmo(aWeap);
// 		switch (aWeap.Type) {
// 			case "Generic":
// 				ammo.Count -= 1;
// 			break;
			
// 			case "Missile":
// 				ammo.Count -= 1;
// 			break;
			
// 			case "Defensive":
// 				ammo.Count -= 1;
// 			break;
			
// 			case "Deploying":
// 				ammo.Count -= 1;
// 			break;
			
// 			case "Healing":
// 				ammo.Count -= 1;
// 			break;
			
// 			case "Ramming":
				
// 			break;
			
// 			case "Destruct":
// 				ammo.Count = this.HP;
// 				this.HP = -Infinity;
// 			break;

// 			case "Resupplying":
// 			break;

// 			case "Energy":
// 			break;

// 			default:
// 				return;
// 		}
// 		this.reArea(true);
// 	}

// 	useDefensiveWeapon() {
// 		if (this.defensive < 0) return;
// 		const ammo = this.getAmmo(this.Weap[this.defensive]);
// 		ammo.Count--;
// 		this.checkDefenses();
// 	}

// 	defend(damage, wType) {
// 		if (wType === 'Healing') {
// 			damage = -damage;
// 		}
// 		this.HP -= damage;
// 		if (damage > 0) this.maxHP -= Math.floor(damage/5);
// 		this.reArea(true);
// 	}

// 	//return Ship defenses, so [Def, Mov, defensive]
// 	getDefenseData() {
// 		return [this.Def, this.Mov, this.defensive];
// 	}

// 	//Check if any defensive weapons are fully loaded
// 	setDefensiveWeapon() {
//         if (this.defensive >= 0 && this.getAmmo(this.Weap[this.defensive])) return this.Weap[this.defensive];
// 		this.defensive = -1;
// 		this.Weap.forEach((weapon, index) => {
// 			const ammo = this.getAmmo(weapon);
// 			if (weapon.Defensive && ammo.Count > 0) {
// 				this.defensive = index;
// 			}
// 		});
// 		return this.Weap[this.defensive];
// 	}

//     finalizeAttack () {
// 		this.hasMoved = false;
// 		this.Weap.forEach((each) => each.FireCount = 0);
//     }
//     //#endregion

// 	//Energy
// 	addEnergy (amount = 0) {
// 		if (!amount) this.Energy += this.EnergyGenerated;
// 		this.Energy += amount;
// 		const energy = this.Energy - this.maxEnergy;
// 		if (this.Energy > this.maxEnergy) this.Energy = this.maxEnergy;
// 		else return 0;
// 		return energy
// 	}

// 	//Ship placement
// 	reArea(old = true, both = false) {
// 		this.Area = [];
// 		const location = old ? this.prevLocation: this.location;
// 		if (both) {
// 			this.reArea(!old);
// 		}

// 		if (this.HP <= 0) {
// 			//destroy.play();
// 			return;
// 		}
		
// 		//if a ship is a 1x1 then all Area needs to be is itself
// 		if (this.sX*this.sY === 1) {
// 			this.Area = [...this.Area, location];
// 			return;
// 		}
		
//         const rect = rectangle(position, [this.sX, this.sY], this.rot);
//         const extremes = rect.reduce((previous, current) => {
//             if (previous.length === 0) return [current[0], current[1], current[0], current[1]];
//             let nVal = clone(previous);
//             nVal[0] = nVal[0] < current[0] ? nVal[0]: current[0]; //minX
//             nVal[2] = nVal[2] > current[0] ? nVal[2]: current[0]; //maxX

//             nVal[1] = nVal[1] < current[1] ? nVal[1]: current[1]; //minY
//             nVal[3] = nVal[3] > current[1] ? nVal[3]: current[1]; //maxY
//             return nVal;
//         }, [])

//         for (let x = extremes[0]; x <= extremes[2]; x++) {
//             for (let y = extremes[1]; y <= extremes[3]; y++) {
//                 if (!isInRectangle([x + 0.5,y + 0.5], rect)) {
// 					const alreadyIn = this.Area.some((loc) => {
// 						return compareArray(loc, [x,y])
// 					})
//                     if (!alreadyIn) {
//                         this.Area.push([x,y]);
//                     }
//                 }
//             }
//         }
// 	}

// 		//Needs Work
// 	isInLocation (loc) {
// 		//this.Area.forEach((val) => console.log([this.Area,val, loc, compareArray(val,loc,loc.length)]));
// 		return this.Area.some((val) => compareArray(val,loc,loc.length));
// 	}
// }

export class Cursor {
    constructor () {
        this.location = [0,0]
        this.archivedLoc = clone(this.location);
        this.level = 0;
        this.rotation = -1;
        this.archivedRot = -1;
        this.menu = -1;
        this.archivedMenu = -1;
    }

    changeLevel(amount) {
        let newLevel = this.level + amount;
        if (this.newLevel < 0 || 
            this.newLevel >= this.location.length) newLevel -= amount;
        this.level = newLevel;
    }

    setLevel(level) {
        this.level = level;
    }

    changeRotation (rot) {
        let newRot = this.rotation + rot;
        if (newRot >= 8) newRot = newRot % 8;
        if (newRot < 0) newRot = newRot % 8 + 8;
        this.rotation = newRot;
    }

    setRotation (rot) {
        this.rotation = rot;
    }

    archiveRotation() {
        this.archivedRot = this.rotation;
    }

    restoreMenu() {
        this.rotation = this.archivedRot;
    }

    changeMenu(amount, max) {
        let nMenu = this.menu + amount;
        if (nMenu === max) nMenu = 0;
        if (nMenu < 0) nMenu = max -1;
        this.menu = nMenu;
    }

    setMenu(val) {
        this.menu = amount;
    }

    archiveMenu() {
        this.archivedMenu = this.menu;
    }

    restoreMenu(max = Infinity) {
        if (this.archivedMenu > max) this.archivedMenu = max;
        this.menu = this.archivedMenu;
    }

    move(x,y) {
        let newPosition = clone(this.position);
        newPosition[this.level][0] += x;
        let updatedPosX = updateSector(newPosition.slice(0, this.level + 1), this.grSize);
        if (updatedPosX.length === 0) newPosition[this.level][0] -= x;
        else newPosition = updatedPosX;

        newPosition[this.level][1] += y;
        let updatedPosY = updateSector(newPosition.slice(0, this.level + 1), this.grSize);
        if (updatedPosY.length === 0) newPosition[this.level][0] -= y;
        else newPosition = updatedPosY;

        this.location = newPosition;
    }

    moveTo (x, y) {
        this.position[this.level] = [x, y];
    }

    archiveLocation() {
        this.archivedLoc = clone(this.location);
    }

    restoreLocation() {
        this.location = this.archivedLoc;
    }

}

export class Battle {
	constructor() {
		this.Players = [];
		this.Loses = [];
		this.Retreated = [];
		this.Stage = 0;
		this.Moves = [];

		//This is for inside the battle
		this.Map = {Space: [], Ground: [], Domains: []};

		//This is for the Sector Map
		this.Locations = [];
	}
}
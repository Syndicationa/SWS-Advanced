import {clone, compareArray, rectangle, isInRectangle, distance, absSum, sumArrays} from './functions';
import {inFiringRot} from "./game";

export class Vehicle {
	constructor (vehicle, player, vNum, faction, loc, r) {

		//Vehicle Info
        this.Ownership = {Player: player, Number: vNum} || vehicle.Ownership;
		this.Type = {Faction: faction, Class: "", Realm: [Space], Img: false} || vehicle.Type;

		//Appearance
        this.Appearance = {name: "", Size: [], area: [], Shape: ""};

        //State
        this.State = {
            hp: 0,
            maxHP: 0,
            
            energy: 0,

            hasMoved: false,
            hasFired: false,
            visible: true
        }

		//Stats
        this.Stats = {
            MaxHP: 0,

            MaxEnergy: 0,
            GenEnergy: 0,
            MovEnergy: 0,
            
            Acc: 0,
            Def: 0,
            Mov: 0,
            FMov: 0,

            StealthLevel: 0,

        }

		//Weapons
        this.Weap = {
            Data: [],
            fireCount: []
        }
        this.Ammo = {
            Data: [],
            count: []
        }
		this.Weap.fireCount.fill(0);
		this.Ammo.count.fill(0);
		const [hasEnergy, hasExplode] = this.Weap.reduceRight((previous, type) => {
			let hasEnergy = type.Type === "Energy" || previous[0];
			let hasExplode = type.Type === "Destruct" || previous[1];
			return [hasEnergy, hasExplode];
		}, [false, false]);
		if (!hasEnergy) {
			this.Weap.Data.push(
                {Name: "Energy Transfer", Type:"Energy", aType:"Energy", EnergyCost: 0, FireRate: Infinity});
            this.Weap.fireCount.push(0);
			this.Ammo.Data.push({Name: "Energy", MCount: Infinity});
            this.Ammo.count.push(Infinity);
		}
		if (!hasExplode) {
			const Watk = Math.round(20*Math.log10(this.HP)) + 20;
			const Wran = Math.round((8/3)*Math.log10(this.HP));
			const WRatk = Math.floor(-Watk/(Wran + 1));
			this.Weap.Data.push({Name: "Self Destruct", Type:"Destruct", aType:"Explodium", 
                Watk: Watk, Whit: 75, Wran: Wran, WRatk: WRatk, 
				EnergyCost: 0, FireRate: 1});
            this.Weap.fireCount.push(0);
			this.Ammo.Data.push({Name: "Explodium", MCount: Infinity});
            this.Ammo.count.push(Infinity);
		}

		//Defenses Need to add more
        this.Defenses = {
            Weapons: [],
            wActive: [],
            Shields: [],
            sActive: []
        }
		this.checkDefenses();

		//Position
        this.Location = {
            loc: [0,0],
            prevLoc: [0, 0],
            rotation: 0
        }
		this.updateArea(reArea());

		//Velocity
        this.Velocity = {
            prevVel: [0,0],
            vel: [0,0],
            moveData: "",
            moved: false
        }
	}

	//#region Move Commands
	canMove(movX, movY, movType) {
        const Energy = this.State.energy;
        const MovEnergy = this.Stats.MovEnergy;
        const Mov = this.Stats.Mov;
		if (movType === 0) {
			if (movX !== 0 && movY !== 0) return false;
            const tempMovStr = generateMovData(this.Velocity.moveData, movX, movY);
			const dist = Math.ceil((this.moveData.replace(/[+-]/g,"||||").length)/4);
            const undo = this.Velocity.moveData.length > tempMovStr.length;
            const tEnergy = calculateMovEnergy(Energy, MovEnergy, !undo);
			return (dist <= Mov) && (tEnergy > 0);
		} else {
            const [dx, dy] = this.Velocity.vel;
			const dist = absSum(dx + movX, dy + movY);
            const undo = absSum(dx, dy) > val;
            const tEnergy = calculateMovEnergy(Energy, MovEnergy, !undo);
            return (dist <= Mov) && (tEnergy > 0);
		}
	}
	
	updateMovInfo(movX, movY, movType) {
        let undo = false;
        if (movType === 0) {
            const tMovStr = generateMovData(this.Velocity.moveData, movX, movY);
            undo = this.Velocity.moveData.length > tMovStr.length;
            this.Velocity.moveData = tMovStr;
        } else {
            const [dx, dy] = this.Velocity.vel;
			const dist = absSum(dx + movX, dy + movY);
            undo = absSum(dx, dy) > val;
        }
		this.State.energy = calculateMovEnergy(this.State.energy, this.Stats.MovEnergy, undo);
	}

    setVelocity (dX, dY) {
        this.Velocity.vel = [dX, dY];
    }

    addVelocity (dX, dY) {
        this.Velocity.vel[0] += dX;
        this.Velocity.vel[1] += dY;
    }

	moveShip () {
        const vel = this.Velocity;
        let loc = this.Location;
        vel.moved = true;
        loc.loc = sumArrays(loc.prevLoc, vel.vel);
        updateArea(reArea(false, true));
	}

	finalizeMove(movType) {
        let vel = this.Velocity;
        let loc = this.Location;
        let state = this.State;
        //Will need to check the importance of moved
		if (!vel.moved) this.moveShip();
		state.hasMoved = !(compareArray(vel.prevVel, vel.vel));

		state.hasFired = false;

		if (movType === 0) {
			vel.prevVel = clone(vel.vel);
		} else {
			vel.vel = [0, 0];
		}
		loc.prevLoc = clone(loc.loc);
		vel.moveData = "";
		vel.moved = false;
		updateArea(reArea());
	}
    //#endregion

	//#region Attack Commands
	canFire(weapon, enemyLoc){
		const dist = distance(this.Location.loc, enemyLoc);
		const weap = this.Weap[weapon];
		const ammoCount = this.getAmmo(weap).Count;
		const ammo = (ammoCount > 0);
		const energy = this.Energy >= weap.EnergyCost;
		const fireRate = weap.FireCount < weap.FireRate;
		const ran = weap.WMran === undefined || weap.WMran <= dist;
		const loc = weap.Wrot === undefined || inFiringRot(-xdif, ydif, this.rot, weap.Wrot + Math.round(this.Mov/6), weap.Offset);
		return ammo && energy && fireRate && ran && loc;
	}

	getWeapon(weapon) {
		return this.Weap[weapon];
	}

    getAmmo(weapon) {
        const ammoType = weapon.aType;
		return this.Ammo.find((type) => type.Name === ammoType);
    }

	attack(weapon) {
		this.hasFired = true;
		let aWeap = this.Weap[weapon];
		aWeap.FireCount++;
		this.Energy -= aWeap.EnergyCost;
		const ammo = this.getAmmo(aWeap);
		switch (aWeap.Type) {
			case "Generic":
				ammo.Count -= 1;
			break;
			
			case "Missile":
				ammo.Count -= 1;
			break;
			
			case "Defensive":
				ammo.Count -= 1;
			break;
			
			case "Deploying":
				ammo.Count -= 1;
			break;
			
			case "Healing":
				ammo.Count -= 1;
			break;
			
			case "Ramming":
				
			break;
			
			case "Destruct":
				ammo.Count = this.HP;
				this.HP = -Infinity;
			break;

			case "Resupplying":
			break;

			case "Energy":
			break;

			default:
				return;
		}
		this.reArea(true);
	}

	useDefensiveWeapon() {
		if (this.defensive < 0) return;
		const ammo = this.getAmmo(this.Weap[this.defensive]);
		ammo.Count--;
		this.checkDefenses();
	}

	defend(damage, wType) {
		if (wType === 'Healing') {
			damage = -damage;
		}
		this.HP -= damage;
		if (damage > 0) this.maxHP -= Math.floor(damage/5);
		this.reArea(true);
	}

	//return Ship defenses, so [Def, Mov, defensive]
	getDefenseData() {
		return [this.Def, this.Mov, this.defensive];
	}

	//Check if any defensive weapons are fully loaded
	setDefensiveWeapon() {
        if (this.defensive >= 0 && this.getAmmo(this.Weap[this.defensive])) return this.Weap[this.defensive];
		this.defensive = -1;
		this.Weap.forEach((weapon, index) => {
			const ammo = this.getAmmo(weapon);
			if (weapon.Defensive && ammo.Count > 0) {
				this.defensive = index;
			}
		});
		return this.Weap[this.defensive];
	}

    finalizeAttack () {
		this.hasMoved = false;
		this.Weap.forEach((each) => each.FireCount = 0);
    }
    //#endregion

	//Energy
	addEnergy (amount = 0) {
		if (!amount) this.Energy += this.EnergyGenerated;
		this.Energy += amount;
		const energy = this.Energy - this.maxEnergy;
		if (this.Energy > this.maxEnergy) this.Energy = this.maxEnergy;
		else return 0;
		return energy
	}
	//Ship placement
	updateArea (func) {
        if (this.State.hp <= 0) {
            this.Appearance.area = [];
            return;
        };
        this.Appearance.area = func(this.Location, this.Appearance.Size, this.Appearance.area);
    }
		//Needs Work
	isInLocation (loc) {
		//this.Area.forEach((val) => console.log([this.Area,val, loc, compareArray(val,loc,loc.length)]));
		return this.Area.some((val) => compareArray(val,loc,loc.length));
	}
}

const generateMovData = (movStr, dx, dy) => {
    let nMovStr = "";
    const val = ((dy + 3)/2)*(dx === 0) + (((dx + 3)/2) + 2)*(dy === 0) - 1;
		const movChars = ["+","-","L","R"];
		const revMovChars = ["-","+","R","L"];
		if (movChars.endsWith(revMovChars[val])) {
			return movStr.slice(0,-1);
		} else {
			return movStr + movChars[val];
		}
}

const calculateMovEnergy = (energy = 0, MovEnergy = 0, add = true) => {
    if (add) return energy + MovEnergy;
    return energy - MovEnergy;
}



locInfoTemplate = {prevLoc: [0,0], loc: [0,0], rotation: 0};
areaTemplate = [[0,0]];

const reArea = (old = true, both = false) => (locInfo= locInfoTemplate, size = [1,1], area = areaTemplate) => {
    const [prevLoc, loc, rotation] = location;
    let Area = [];
    const location = old ? prevLoc : loc;

    if (both) {
        Area = reArea(locInfo, size, !old);
    }

    //if a ship is a 1x1 then all Area needs to be is itself
    if (size.reduce((cumulative,val) => cumulative*val, 1) === 1) {
        return [...Area, location];
    }
    
    const rect = rectangle(location, size, rotation);
    const extremes = rect.reduce((previous, current) => {
        if (previous.length === 0) return [current[0], current[1], current[0], current[1]];
        let nVal = clone(previous);
        nVal[0] = nVal[0] < current[0] ? nVal[0]: current[0]; //minX
        nVal[2] = nVal[2] > current[0] ? nVal[2]: current[0]; //maxX

        nVal[1] = nVal[1] < current[1] ? nVal[1]: current[1]; //minY
        nVal[3] = nVal[3] > current[1] ? nVal[3]: current[1]; //maxY
        return nVal;
    }, [])

    for (let x = extremes[0]; x <= extremes[2]; x++) {
        for (let y = extremes[1]; y <= extremes[3]; y++) {
            if (!isInRectangle([x + 0.5,y + 0.5], rect)) {
                const alreadyIn = Area.some((loc) => {
                    return compareArray(loc, [x,y])
                })
                if (!alreadyIn) {
                    Area.push([x,y]);
                }
            }
        }
    }
    return Area;
}

const shiftArea = (dx, dy) => (locInfo= locInfoTemplate, size = [1,1], area = areaTemplate) => {
    let areaLen = reArea()(locInfo, size, area).length;
    return area.map((each, index) => index < areaLen ? each: [each[0] + dx, each[1] + dy]);
}

let vehicle =  {
    Ownership: {
        Player: 0,
        Number: 0,
    },
    Constants: {
        Class: "",
        TrueMaxHP: 0,
        MaxEnergy: 0,
        MovEnergy: 0,
        EnergyGenerated: 0,
        img: "",
    },
    Current: {
        Name: "",
        HP: 0,
        maxHP: 0,
    }
}
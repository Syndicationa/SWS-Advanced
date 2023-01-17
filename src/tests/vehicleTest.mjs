import { militaVessels, mcrnVessels } from "./convertShips.mjs";
import { makeVehicle } from "../functions/defs/vehicle/vehicle.mjs";
import { createDisplay, getFromDisp } from "../functions/defs/display.mjs";
import { absSum, map, negateArray, reduce, sumArrays } from "../functions/functions.mjs";
import { attackShip, calcHitChance, canFire, cleanAttackInput } from "../functions/defs/vehicle/attack.mjs";
import { moveShip } from "../functions/defs/vehicle/move.mjs";
import { getAmmoOfWeap } from "../functions/defs/vehicle/retrieve.mjs";
import { trueDist } from "../functions/vectors.mjs";

const locInfo = {
    prevLoc: [0,0],
    loc: [4,4],
    rotation: 0
}

const createWeapData = (weapon, AmmoArr) => {return {weapon, ammoCount: AmmoArr.count[getAmmoOfWeap(weapon, AmmoArr)]}};

const createCFDisp = ([sX, sY]) => (ship, weapon) => {
    const arr = map(() => map(() => false, new Array(sY).fill(0)), new Array(sX).fill(0));
    return map((yarr, x) => 
                map((_,y) => canFire(ship, [x, y], createWeapData(weapon, ship.Ammo)), 
                yarr), 
            arr)
}

const testCanFire = () => {
    let fShip = makeVehicle(militaVessels[8], "Player", 0, [4,4], [0,-1]);
    let weapon = createWeapData(fShip.Weap.Weap(1), fShip.Ammo);
    const tLoc = [4,-6]; 

    //Fire Rate Check
    weapon.weapon.FireRate = 4;
    weapon.weapon.fireCount = 3;
    const FRCT = canFire(fShip, tLoc, weapon);
    weapon.weapon.fireCount = 4;
    const FRCF = canFire(fShip, tLoc, weapon);
    weapon.weapon.FireRate = 1;
    weapon.weapon.fireCount = 0;

    console.log("Fire Rate Checks: (True, False)",FRCT, FRCF);
    if (!FRCT || FRCF) return;

    //Ammo Count Check
    const ACT = canFire(fShip, tLoc, weapon);
    weapon.ammoCount = 0;
    const ACF = canFire(fShip, tLoc, weapon);
    weapon.ammoCount = 1;

    console.log("Ammo Count Check: (True, False)", ACT, ACF);
    if (!ACT || ACF) return;

    //Energy Check
    weapon.weapon.EnergyCost = 1;
    const ET = canFire(fShip, tLoc, weapon);
    fShip.State.energy = 0;
    const EF = canFire(fShip, tLoc, weapon);
    weapon.weapon.EnergyCost = 0;
    fShip.State.energy = 1;

    console.log("Energy Check: (True, False)", ET, EF);
    if (!ET || EF) return;

    fShip.Location.prevLoc = [4,4];
    fShip.Stats.Mov = 0;
    weapon.weapon.WMran = 0;
    //Weapon Rotation checks
    //Ship Rotation
    for (let r = 0; r < 1; r++) {
        console.log("Rotation: " + r);
        fShip.Location.rotation = [0, -1];
        //Wrot Value
        for (let wr = 0; wr < 8; wr++) {
            console.log("WeapRot: " + wr);
            weapon.weapon.Wrot = wr;
            //Grid Display uses targetLoc
            const disp = createCFDisp([9, 9])(fShip, weapon.weapon)
            let str = dispFire(disp);
            str += "\n"
            str += `Rotation: ${r}, Weapon Rot: ${wr}`;
            console.log(str);
        }
    }

    return {FRCT, FRCF, ACT, ACF, ET, EF};
}

const createSym = (vArr) => [...vArr, 0].reduce((a, v, i) => {
    if (vArr.length === 0) return " ";
    else if (a === "") return v.Type.Faction;
    else if (i === vArr.length) {
        if (typeof a === "string") return `\x1b[${34 - vArr[i - 1].Ownership.vID*3}m${("" + a).slice(0, 1)}\x1b[0m`
        return ("" + a).slice(0, 1)
    } else if (a === v.Type.Faction) return a;
    else if (a !== v.Type.Faction && typeof a === "string") return 2;
    else if (v.Type.Faction !== vArr[i - 1].Type.Faction) return a + 1;
    return a;
}, "")

// const dispFire = (disp) => console.log(stringify(
//     ([x, y]) => x === y && y === 4 ?  
//         '\x1b[31mX\x1b[0m'
//         :disp[x][y] ? "*":" "));

// const dispDist = () => console.log(stringify(([x, y]) => {
//     const d = distance([4, 4], [x, y])
//     return `\x1b[3${d}m*\x1b[0m`
//     }));

// const dispODist = () => console.log(stringify(([x, y]) => {
//         const d = absSum(x - 4, y - 4);
//         return `\x1b[3${d % 8}m*\x1b[0m`
//         }));

// const dispPy = (func) => console.log(stringify((p1) => {
//     const d = func(trueDist([4,4], p1));
//     return `\x1b[3${d}m*\x1b[0m`
// }))

const dispShip = (disp) => console.log(stringify(([x, y]) => createSym(getFromDisp(disp, [x, y], [x + 1, y + 1]))));
const dispShipInfo = shipArr => shipArr.forEach((ship) => {
    const {Ownership: own, Appearance: app, State: s} = ship
    let text = `${app.name} HP: ${s.hp}/${s.maxHP}`;
    console.log(`\x1b[${34 - own.vID*3}m${text}\x1b[0m`);
})

const dispAttackRes = (moveStr) => console.log(moveStr.replace("~F", "Syn's").replace("~T","Bob's"));

//#region Output

console.clear();

const shipArr = [militaVessels[8],mcrnVessels[6]].map((ship, i) => 
    makeVehicle(ship, `Player ${i}`, i, [(i*4) + 2,(i*4) + 2], (i*4) + 3));

const display = createDisplay([9,9])(shipArr);

//const [nShipArr, movData, moveStr] = attackShip([shipArr[0], shipArr[1], shipArr, shipArr[0].Weap.Weap(1)]);

//const nnArray = nShipArr.map((ship, i) => moveShip(ship, 
//    {vel: [(2*i)-1, (2*i)-1], rot: ship.Location.rotation, moveData:""}))

// const CFdisp = createCFDisp([9,9])(nnArray[0], {...nnArray[0].Weap.Weap(1), WMran: 0});

// dispFire(CFdisp);

//const [nnShipArr, nMovData, nMoveStr] = attackShip([nnArray[0], nnArray[1], nnArray, nnArray[0].Weap.Weap(1)]);

//dispPy(Math.floor);
//dispPy(Math.round);
//dispPy(Math.ceil);

//testCanFire();

[
    [0,-1],
    [1,-1],
    [1,0],
    [1,1],
    [0,1],
    [-1,1],
    [-1,0],
    [-1,-1]
].forEach((rot) => console.log(4*Math.atan2(-rot[0], rot[1])/Math.PI + 4))

console.log(mcrnVessels[1]);
console.log(militaVessels[3])

setTimeout(() => {}, 5000)
//#endregion
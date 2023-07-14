import { addPlayMove, singleBattle } from "../functions/defs/battle/battle.mjs";
import { nextPhase, runMove, runTurn } from "../functions/defs/battle/control.mjs";
import { gPlayerMaker, playerMaker } from "../functions/defs/player/player.mjs";
import { militaVessels, mcrnVessels } from "./convertShips.mjs";
import readline from "readline";
import { clone, compareArray, last, objectMap, sumArrays, pop } from "../functions/functions.mjs";
import { stringify } from "./disp.mjs";
import { createDisplay } from "../functions/defs/display.mjs";
import { getAmmoOfWeap, getPlayShips, shipsInPosition } from "../functions/defs/vehicle/retrieve.mjs";
import { canMove } from "../functions/defs/vehicle/move.mjs";
import { sub } from "../functions/vectors.mjs";
import { canFire, attackShip } from "../functions/defs/vehicle/attack.mjs";

const gPSIP = (shipArr, pID, loc) => shipsInPosition(getPlayShips(pID, shipArr),loc);

const Data = {
    Vehicles: {
        Milita: militaVessels,
        MCRN: mcrnVessels
        },
    Faction: ["Milita", "MCRN"]
}

const setupMoves = {
    Data: [ 'A.Thouself;' ],
    Turns: [ '' ],
    Thyself: [ 'P-Milita.10.[0,0].[0,-1];Milita.0.[0,0].[0,-1];'],
    Thouself: [ 'P-MCRN.13.[8,0].[0,1];']
  };

const runs = runTurn(Data);
const run = runMove(Data);

const user = {
    Username: "Syndicationa",
    ID: "Thyself",
    exoticFactions: true,
    controls: [],
    colorSet: {
        Milita: "#3264c8",
        MCRN: "RED",
        DefaultFaction: "Milita"
    }
}

const user2 = {
    Username: "Syndicationa",
    ID: "Thouself",
    exoticFactions: true,
    controls: [],
    colorSet: {
        Milita: "#3264c8",
        MCRN: "RED",
        DefaultFaction: "Milita"
    }
}

const play = playerMaker(user)({Faction: "Milita", Name: "Syn of Life"});
const play2 = playerMaker(user2)({Faction: "MCRN", Name: "Bob"});

const player = gPlayerMaker(play)("Syndica");
const player2 = gPlayerMaker(play2)("Bobeth");

const battle = singleBattle(player)({Map: [], PlayerCount: 2});
let tBattle = addPlayMove(battle)(player2);

let currState = tBattle;

tBattle = nextPhase({...runs(tBattle, objectMap(setupMoves)(v => [v[0]]))[0], Moves: setupMoves})
currState = tBattle;

let tempState = {cursor: {pos: [0,0], rot: [0,0], menuPos: -1}, cPlayer: 0, impulse: 0, data: {}, Menu: []};

const handleE = () => {
    const stage = currState.Stage;
    const impulse = tempState.impulse;
    if (stage === 0) {
        if (impulse === 0) {
            tempState.data.pos = clone(tempState.cursor.pos);
            tempState.cursor.menuPos = 0;
            tempState.Menu = Data.Faction;
            tempState.impulse = 1;
        } else if (impulse === 1) {
            tempState.data.faction = tempState.Menu[tempState.cursor.menuPos];
            tempState.Menu = Data.Vehicles[tempState.data.faction].map((veh) => veh.Type.Class);
            tempState.cursor.menuPos = 0;
            tempState.impulse = 2;
        } else if (impulse === 2) {
            tempState.data.type = tempState.cursor.menuPos;
            tempState.cursor.menuPos = -1;
            tempState.cursor.rot = [0, -1];
            tempState.impulse = 3;
        } else if (impulse === 3) {
            if (compareArray(tempState.cursor.rot, [0,0])) return;
            const {faction, type, pos} = tempState.data;
            const move = `${faction}.${type}.${JSON.stringify(pos)}.${JSON.stringify(tempState.cursor.rot)};`;

            const ID = currState.Players[tempState.cPlayer].User.ID;

            const moves = currState.Moves[ID];
            const movStr = last(moves).slice(2);
            const nMove = `P-${movStr}${move}`;
            currState = run(currState, pop(move), {type: "P-", str: "", id: ID});
            currState.Moves[ID][moves.length - 1] = nMove;
            console.log(currState.Moves);
            tempState.impulse = 0;
            currState.Display = createDisplay([9,9])(currState.Vehicles);
        }
    } else if (stage === 1) {
        if (impulse === 0) {
            const ID = currState.Players[tempState.cPlayer].User.ID;
            tempState.data.pos = clone(tempState.cursor.pos);
            tempState.data.vehs = gPSIP(currState.Vehicles, ID, tempState.cursor.pos)
            if (tempState.data.vehs.length === 0) return;
            tempState.cursor.menuPos = 0;
            tempState.Menu = tempState.data.vehs.map((veh) => veh.Appearance.name);
            tempState.impulse = 1;
            if (tempState.Menu.length === 1) {
                tempState.impulse = 2;
            }
        } else if (impulse === 1) {
            tempState.data.vehicle = tempState.cursor.menuPos;
            tempState.Menu = [];
            tempState.cursor.menuPos = -1;
            tempState.impulse = 2;
        } else if (impulse === 2) {
            const {vehs, vehicle, pos} = tempState.data;
            const cPos = tempState.cursor.pos;
            const vel = sub(cPos, pos);
            tempState.data.vel = vel;
            if (canMove(vehs[vehicle],vel,1)) {
                tempState.impulse = 3;
                tempState.cursor.rot = [0, -1];
            } else {
                console.log("Failed");
            }
        } else if (impulse === 3) {
            if (compareArray(tempState.cursor.rot, [0,0])) return;
            const {vel, vehs, vehicle, pos} = tempState.data;
            const vID = vehs[vehicle].Ownership.vID;
            console.log(vID);
            const move = `${vID}.${JSON.stringify(vel)}.${JSON.stringify(tempState.cursor.rot)};`;

            const ID = currState.Players[tempState.cPlayer].User.ID;

            const moves = currState.Moves[ID];
            const movStr = last(moves).slice(2);
            const nMove = `M-${movStr}${move}`;
            currState = run(currState, pop(move), {type: "M-", str: "", id: ID});
            currState.Moves[ID][moves.length - 1] = nMove;
            tempState.impulse = 0;
            tempState.cursor.pos = pos;
            currState.Display = createDisplay([9,9])(currState.Vehicles);
        }
    } else if (stage === 3) {
        if (impulse === 0) {
            const ID = currState.Players[tempState.cPlayer].User.ID;
            tempState.data.pos = clone(tempState.cursor.pos);
            tempState.data.vehs = gPSIP(currState.Vehicles, ID, tempState.cursor.pos);
            if (tempState.data.vehs.length === 0) return;
            tempState.cursor.menuPos = 0;
            tempState.Menu = tempState.data.vehs.map((veh) => veh.Appearance.name);
            tempState.impulse = 1;
        } else if (impulse === 1) {
            tempState.data.fir = tempState.data.vehs[tempState.cursor.menuPos];
            tempState.Menu = [];
            tempState.cursor.menuPos = -1;
            tempState.impulse = 2;
        } else if (impulse === 2) {
            tempState.data.vehs = shipsInPosition(currState.Vehicles, tempState.cursor.pos);
            if (tempState.data.vehs.length === 0) return;
            tempState.cursor.menuPos = 0;
            tempState.Menu = tempState.data.vehs.map((veh) => veh.Appearance.name);
            tempState.impulse = 3;
        } else if (impulse === 3) {
            tempState.data.tar = tempState.data.vehs[tempState.cursor.menuPos];
            console.log(tempState.data.fir);
            tempState.Menu = tempState.data.fir.Weap.Data.map((w) => w.Name);
            tempState.cursor.menuPos = 0;
            tempState.impulse = 4;
        } else if (impulse === 4) {
            const {fir, tar, pos} = tempState.data;
            const weap = fir.Weap.Weap(tempState.cursor.menuPos);
            const aInd = getAmmoOfWeap(weap, fir.Ammo);
            const aC = fir.Ammo.count[aInd];
            if (!canFire(fir, tar.Location.prevLoc, {weapon: weap, ammoCount: aC})) {
                console.log("Failed to fire");
                return;
            }

            const [, mov, dataStr] = attackShip([fir, tar, currState.Vehicles, weap]);

            const [fID, w, tPlay, tID, hit] = mov;

            console.log(dataStr);
            const move = `${fID}.${w}.${tPlay}.${tID}.${hit};`;

            const ID = currState.Players[tempState.cPlayer].User.ID;

            const moves = currState.Moves[ID];
            const movStr = last(moves).slice(2);
            const nMove = `M-${movStr}${move}`;
            currState = run(currState, pop(move), {type: "A-", str: "", id: ID});
            currState.Moves[ID][moves.length - 1] = nMove;
            tempState.impulse = 0;
            tempState.cursor.pos = pos;
            currState.Display = createDisplay([9,9])(currState.Vehicles);
        }
    }
}

const handleInput = (char) => {
    const movCursor = vel => tempState.cursor.pos = sumArrays(tempState.cursor.pos, vel); 
    switch (char) {
        case "w":
            movCursor([0, -1]);
            break;
        case "s":
            movCursor([0,1]);
            break;
        case "a":
            movCursor([-1,0]);
            break;
        case "d":
            movCursor([1,0]);
            break;
        case "e":
            handleE();
            break;
        case "r":
            tempState.cPlayer = (tempState.cPlayer + 1) % currState.Players.length;
            if (tempState.cPlayer === 0) {
                const moves = objectMap(currState.Moves)(last);
                tBattle = nextPhase(runs(tBattle, moves)[0]);
                currState = tBattle;
                currState.Display = createDisplay([9,9])(currState.Vehicles);
            }
            break;
        case "i":
            tempState.cursor.menuPos = (tempState.cursor.menuPos + tempState.Menu.length - 1) % tempState.Menu.length;
            break;
        case "k":
            tempState.cursor.menuPos = (tempState.cursor.menuPos + 1) % tempState.Menu.length;
            break;
        default:
            break;
    }
    const num = Number(char);
    if (num >= 0 && num < 8) {
        const {round, cos, sin, PI: pi} = Math;
        const x = round(sin(num*pi/4));
        const y = -round(cos(num*pi/4));
        tempState.cursor.rot = [x, y];
        console.log(tempState.cursor.rot);
    } else if (num === 9) {
        tempState.cursor.rot = [0,0];
    }
}

const disp = (cState, tState) => console.log(stringify((pos) => {
    if (compareArray(tState.cursor.pos, pos)) {
        const rot = tState.cursor.rot;
        if (compareArray(rot, [0,0])) return "X";
        return 4*Math.atan2(-rot[0], rot[1])/Math.PI + 4
    }
    const vehs = cState.Display[pos[0]][pos[1]];
    if (vehs.length > 1) return vehs.length;
    if (vehs.length === 1) {
        const faction = vehs[0].Type.Faction;
        if (faction === "Milita") return `\x1b[${34}m${faction.slice(0,1)}\x1b[0m`
        if (faction === "MCRN") return `\x1b[${31}m${faction.slice(0,1)}\x1b[0m`
    }
    return " ";
}))

const logMenu = () => {
    if (tempState.cursor.menuPos !== -1) tempState.Menu.forEach((item, i) => {
        const str = i === tempState.cursor.menuPos ? ">":" ";
        console.log(str + item);
    });
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// Usage inside aync function do not need closure demo only*
(async() => {
  try {
    let char = " ";
    currState.Display = createDisplay([9,9])(currState.Vehicles);
    disp(currState, tempState);
    while ( char !== "q") {
        const val = await prompt("> ");
        char = val.toLowerCase().charAt(0);
        handleInput(char);
        console.log("\n");
        disp(currState, tempState);
        logMenu();
    }
    rl.close();
  } catch (e) {
    console.error("Unable to prompt", e);
  }
})();

// When done reading prompt, exit program 
rl.on('close', () => process.exit(0));
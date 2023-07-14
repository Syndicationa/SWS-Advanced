// import {clone, updateSector, compareArray, rectangle, isInRectangle, distance} from './functions.mjs';
// import {attackShip, calcLocDiff, inFiringRot} from "./game";

export const playerMaker = User => nInfo => {
    const {Faction, Name, Admin} = nInfo;
    return {
        User,
        Admin,
        colorSet: User.colorSet,
        Controls: User.Controls,
        movType: User.movType,
        Faction,
        Name,
        Battles: [],
        Vehicles: {
            inBattle: {},
            onBoard: [],
            healing: []
        },
    }
}

export const gPlayerMaker = Player => Name => {
    return {
        User: Player.User,
        colorSet: Player.colorSet,
        Controls: Player.Controls,
        movType: Player.movType,
        Faction: Player.Faction,
        Name,
        Moves: [],
        Vehicles: [],
        Loses: []
    }
}

const runMoves = (Data) => (State, Moves) => {

    // if (str.startsWith("S-")) {
    //     const dString = str.substr(2).split(";");
    //     for (let val of dString) {
    //         const substrs = val.split(".");
    //         const position = JSON.parse(substrs[2]);
    //         const sector = JSON.parse(substrs[3]);
    //         const loc = [...sector,position];
    //         const ship = data.shipTypes[substrs[0]][Number(substrs[1])];
    //            const nShip = new Ship(this.playerNum, this.ShipList.length, ship, substrs[0], Number(substrs[1]), loc, Number(substrs[4]), grSize);
    //         this.ShipList.push(nShip);
    //     }
    // } else if (str.startsWith("M-")) {
    //     const dString = str.substr(4).split(";");
    //     for (let val of dString) {
    //         let substrs = val.split(".");
    //         let mShip = this.ShipList[Number(substrs[0])];
    //         mShip.dX = Number(substrs[1]);
    //         mShip.dY = Number(substrs[2]);
    //         mShip.rot = Number(substrs[3]);
    //         mShip.finalizeMove(this.movType);
    //     }
    // } else if (str.startsWith("A-")) {
    //     this.ShipList.forEach((ship) => ship.hasMoved = false);
    //     const dString = str.substr(2).split(";");
    //     if (dString.length === 0) return;
    //     let returnData = [];
    //     for (let val of dString) {
    //         const substrs = val.split(".");
    //         const atkShip = this.ShipList[Number(substrs[0])];
    //         const dPlayerNames = JSON.parse(substrs[2]);
    //         const dShips = JSON.parse(substrs[3]);
    //         const hits = JSON.parse(substrs[4]);
    //         const aWeap = atkShip.Weap[Number(substrs[1])];
    //         let defShip;
    //         if (aWeap.Type === "Destruct") {
    //             const dPlayers = dPlayerNames.map((val) => players.find((player) => player.playerNum === val));
    //             defShip = dPlayers.map((val,index) => val.ShipList[dShips[index]]);
    //         } else if (aWeap.Type === "Deploying") {
    //             defShip = dShips;
    //         } else {
    //             const dPlayers = players.find((player) => (player.playerNum === dPlayerNames));
    //             defShip = dPlayers.ShipList[dShips];
    //         }
    //         const str = attackShip(atkShip,defShip,Number(substrs[1]),hits, false, {grSize, data, players, cPlayer: -1});
    //         //console.log(str);
    //         returnData.push(str);
    //     }
    //     addattackdata(returnData);
    // } else if (str === "Skip") {
    //     this.ShipList.forEach((ship) => ship.hasMoved = false);
    // } else {
    //     this.hasMoved = false;
    //     this.moves.pop();
    // }
    // this.ShipList.forEach((ship) =>  ship.addEnergy())
    // /*storedPlayer[factionIn] = 1;
    // storedData[storeNum][factionIn] = str;
    // if(storedPlayer.reduce(sum) == playerCount) {
    //     storeNum++;
    //     storedPlayer = [0,0,0,0];
    //     storedData.push([]);
    //     destroyShips();
    //     setOlHP();
    // }*/
}

runMoves();
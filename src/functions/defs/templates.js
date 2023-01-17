export const vehicleTemplate = {
    Ownership: {
        Player: "", vID: 0 
    },

    Type: {
        Faction: "", Class: "", Realm: [""]
    },

    Appearance: {
        area: [[]], name: "", visible: true,
        Img: false, Shape: "", Size: [1,1]
    },

    State: {
        hp: 0, maxHP: 0, energy: 0,
        hasMoved: false, hasFired: false
    },

    Stats: {
        MaxHP: 0,
        MaxEnergy: 0, GenEnergy: 0, MovEnergy: 0,
        Acc: 0, Def: 0, Mov: 0, FMov: 0,
        StealthLevel: 0
    },

    Weap: {
        Data: [{}], fireCount: [0],
        Weap (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    },

    Ammo: {
        Data: [{}], count: [0],
        Ammo (i) {
            return {...this.Data[i], count: this.count[i]};
        }
    },

    Defenses: {
        Weapons: [], wActive: [],
        Shields: [], sActive: [],
    },

    Location: {
        loc: [0,0], prevLoc: [0,0],
        rotation: [0,1],
    },

    Velocity: {
        vel: [0,0], prevVel: [0,0],
        moveData: ""
    }
}

export const playerTemplate = {
    User: {
        Username: "Syndicationa",
        ID: "Lzl something",
        exoticFactions: true,
        controls: [],
        colorSet: [],
        DefaultFaction: "",
    },
    colorSet: [],
    Faction: "Milita",
    Name: "Char name",
    Battles: [],
    Vehicles: {
        InBattle: [],
        OnBoard: [],
        Healing: [],
    },
    Money: 0,
}
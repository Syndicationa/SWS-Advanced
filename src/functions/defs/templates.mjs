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
        hp: 0, maxHP: 0, 
        energy: 0, heat: 0,
        hasMoved: false, hasFired: false,
        statuses: []
    },

    Stats: {
        MaxHP: 0,
        MaxHeat: 0, CoolingRate: 0, OverHeat: 0,
        MaxEnergy: 0, GenEnergy: 0, MovEnergy: 0,
        Acc: 0, Def: 0, Mov: 0, FMov: 0,
        StealthLevel: 0, Communication: 0
    },

    Weap: {
        Data: [{}], fireCount: [0],
        Weap (i) {
            return {...this.Data[i], fireCount: this.fireCount[i]};
        }
    },

    Utils: {
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
        rotation: [0,1]
    },

    Velocity: {
        vel: [0,0], prevVel: [0,0]
    }
}

export const statusTemplate = {
    time: 0,
    data: undefined,
    Type: "Generic/Movement/Accuracy/Damage/True Hit/Countermeasures/Other Ideas",
    combine: (utilA, utilB) => [utilA, utilB],
    apply: (ship) => ship,
    reset: (ship) => ship,
    function: () => {},
}

export const weaponTemplate = {
    Name: "Default", Type: "Generic",
    Watk: 0, Whit: 0, Eran: 0, WRatk: 0,
    Defensive: false, Wcov: 0,
    Wran: 0, WMran: 0, Wrot: 0,
    FireRate: 0, EnergyCost: 0, HeatLoad: 0,
    aType: "Default"
}

export const utilityTemplate = {
    Name: "Default", Type: "Healing/Resupplying/Energy/Deploying/Status",
    Heal: 0, Wran: 10,
    aType: "Default", dType: "Default",
    Deploys: 0,
    Status: ["Self/Target", statusTemplate], Whit: 0,
    FireRate: 0, EnergyCost: 0, HeatLoad: 0,
}

export const ammoTemplate = {
    Name: "Default",
    sCount: 0, MCount: 0
}

export const shieldTemplate = {
    Name: "Default",
    Type: "Default/Others Maybe",
    Cloak: false, StealthLevel: 0, StealthCost: 0,
    Intercept: 1.0, MaxDamage: 0, DamageRegen: 0,
    EnergyCost: 0, HeatLoad: 0,
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

export const factionTemplate = {
    Name: "",
    Color: "",
    Moves: [],
    Players: [],
    Leader: -1,
    Treasurers: [-1],
    Population: 0,
    Regions: {
        Earth: [],
        Cities: []
    },
    Economy: {
        Treasury: {},
        LastUpdated: new Date(),
        Income: {},
        BuildingTypes: [],
        VehicleTypes: [],
        OwnedBuildings: [],
        OwnedVehicles: {},
    },
    Technology: {
        Technologies: [],
        LastUpdated: new Date(),
        TechPoints: 0,
        TechIncome: 0,
        
    },
}

export const singleBattleTemplate = {
    Title: "Name",
    Players: [playerTemplate],
    Losses: [vehicleTemplate],
    Retreated: [vehicleTemplate],
    Vehicles: [vehicleTemplate],
    Moves: {
        Data: [""],
        Turns: [""]
    },
    Stage: 0,
    Map: "Space",
    Type: {Type: "Unique", Discoverable: false, Joinable: false, Online: false},
    PlayerCount: 0,
    Display: [[]],
    Size: {OverallSize: 64, StepSizes: [8, 1]},
}
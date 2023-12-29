const factions = ["Astute", "Blade"];
const factionColors = {Astute: "#0000ff", Blade: "#FF0000"};
const shipAAAA = {
    Type: {
        Faction: "Astute", Class: "AAAA", Realm: ["Space"]
    },

    Appearance: {
        Img: false, Shape: "Square", Size: [1,1]
    },

    Stats: {
        MaxHP: 100,
        MaxHeat: 100, CoolingRate: 20, OverHeat: 200,
        MaxEnergy: 100, GenEnergy: 20, MovEnergy: 0,
        Acc: 90, Def: 10, Mov: 15, FMov: 0,
        StealthLevel: -1, Communication: 10
    },

    Weap: [
        {
            Name: "Pew Pew", Type: "Generic",
            Watk: 100, Whit: 0, Eran: 1, WRatk: -1,
            Defensive: false, Wcov: 0,
            Wran: 100, WMran: 0, Wrot: 2,
            FireRate: 10, EnergyCost: 5, HeatLoad: 5,
            aType: "Default"
        }
    ],

    Utils: [
        {
            Name: "Esttay", Type: "Healing",
            Heal: 10, Wran: 10,
            aType: "Default",
            FireRate: 10, EnergyCost: 5, HeatLoad: 5,
        }
    ],

    Ammo: [
        {
            Name: "Default",
            sCount: 200, MCount: 200
        }
    ],

    Defenses: {
        Shields: [
            {
                Name: "Default",
                Type: "Default",
                Cloak: false, StealthLevel: 0, StealthCost: 0,
                Intercept: .84, MaxDamage: 69, DamageRegen: 42,
                EnergyCost: 42, HeatLoad: 4,
            }
        ]
    }
}

const shipBBBB = {
    Type: {
        Faction: "Blade", Class: "BBBB", Realm: ["Space"]
    },

    Appearance: {
        Img: false, Shape: "Square", Size: [1,1]
    },

    Stats: {
        MaxHP: 70,
        MaxHeat: 70, CoolingRate: 14, OverHeat: 140,
        MaxEnergy: 80, GenEnergy: 16, MovEnergy: 0,
        Acc: 110, Def: 10, Mov: 18, FMov: 0,
        StealthLevel: 1, Communication: 10
    },

    Weap: [
        {
            Name: "Big Bad Boom Boom", Type: "Generic",
            Watk: 300, Whit: -30, Eran: 2, WRatk: -1,
            Wran: 12, WMran: 0, Wrot: 4,
            FireRate: 80, EnergyCost: 12, HeatLoad: 12,
            aType: "Default"
        }
    ],

    Utils: [
        {
            Name: "Our Boom Boom", Type: "Resupplying",
            Wran: 6,
            aType: "Default", dType: "Default",
            FireRate: 10, EnergyCost: 2, HeatLoad: 2,
        }
    ],

    Ammo: [
        {
            Name: "Default",
            sCount: 150, MCount: 150
        }
    ],

    Defenses: {
        Shields: [
            {
                Name: "Default",
                Type: "Default",
                Cloak: false, StealthLevel: 0, StealthCost: 0,
                Intercept: 1.0, MaxDamage: 69, DamageRegen: 30,
                EnergyCost: 24, HeatLoad: 8,
            }
        ]
    }
}

export const tempData = {
    factionNames: factions,
    exoticFactions: factions,
    factionColors,
    shipTypes: {
        Astute: [shipAAAA],
        Blade: [shipBBBB]
    }
}
import { ballin, deactivator, targeting } from "../functions/defs/status";
import { Data } from "../functions/types/data";
import { baseVehicle } from "../functions/types/vehicleTypes";

const factions = ["Astute", "Blade"];
const factionColors = {Astute: "#0000ff", Blade: "#FF0000"};
const shipAAAA: baseVehicle = {
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
        Acc: 90, Def: 10, Mov: 20, Mnv: 20, FMov: 0,
        StealthLevel: -1, Communication: 10
    },

    Weap: [
        {
            Name: "Pew Pew", Type: "Generic",
            Watk: 100, Whit: 0, WRatk: 0,
            Defensive: false,
            Wran: 20, WMran: 0, Wrot: 0,
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
        },
        deactivator,
        targeting
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
                Cloak: false,
                Intercept: .84, MaxDamage: 69, DamageRegen: 42,
                EnergyCost: 42, HeatLoad: 4,
            }
        ]
    }
};

const shipBBBB: baseVehicle = {
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
        Acc: 110, Def: 10, Mov: 18, Mnv: 20, FMov: 0,
        StealthLevel: 1, Communication: 10
    },

    Weap: [
        {
            Name: "Big Bad Boom Boom", Type: "Generic",
            Watk: 300, Whit: -30, Eran: 2, WRatk: -1,
            Wran: 12, WMran: 0, Wrot: 4,
            FireRate: 80, EnergyCost: 12, HeatLoad: 12,
            aType: "Default", Defensive: false
        }
    ],

    Utils: [
        {
            Name: "Our Boom Boom", Type: "Resupplying",
            Wran: 6,
            aType: "Default", dType: "Default",
            FireRate: 10, EnergyCost: 2, HeatLoad: 2,
        },
        ballin,
        targeting
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
                Cloak: false,
                Intercept: 1.0, MaxDamage: 69, DamageRegen: 30,
                EnergyCost: 24, HeatLoad: 8,
            }
        ]
    }
};

export const tempData: Data = {
    factionNames: factions,
    exoticFactions: factions,
    factionColors,
    shipTypes: {
        Astute: [shipAAAA],
        Blade: [shipBBBB]
    }
};
import { data } from "../slicers/dataInit.mjs";

const convertShip = (o, faction) => {
    const Type = {
        Faction: faction,
        Class: o.Name,
        Realm: ["Space"]
    }
    const Appearance = {
        Shape: o.Shape,
        Size: [o.SizeX, o.SizeY],
        Img: o.img
    }
    const Stats = {
        MaxHP: o.HP,
        MaxEnergy: o.Energy,
        GenEnergy: o.EnergyGenerated,
        MovEnergy: o.MovEnergy ?? 0,
        Acc: o.Acc,
        Def: o.Def,
        Mov: o.Mov,
        StealthLevel: o.Stealth
    }

    const Weap = o.Weap;

    const Ammo = o.Ammo.map((ammo) => {
        return {
            Name: ammo.Name,
            sCount: ammo.Count,
            MCount: ammo.MCount,
        }
    });

    return {Type, Appearance, Stats, Weap, Ammo}
}

const convertArray = (shipArr) => (faction) => shipArr[faction].map((shipData) => convertShip(shipData, faction))

const convertData = convertArray(data.shipTypes);

export const militaVessels = convertData("Milita");

const astuteVessels = convertData("Astute");

export const mcrnVessels = convertData("MCRN");
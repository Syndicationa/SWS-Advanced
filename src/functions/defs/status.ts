import { status, statusUtil } from "../types/types";
import { vehicle } from "../types/vehicleTypes";

const deactivateWeapons: status = {
    time: 20,
    data: undefined,
    Type: "Generic",
    combine: (a: status, b: status) => a.time > b.time ? [a]:[b],
    apply: (v: vehicle) => {
        return {
            ...v,
            Weap: {
                ...v.Weap,
                fireCount: v.Weap.Data.map((weapon) => weapon.FireRate),
            }
        };
    },
    reset: (v: vehicle) => v,
    function: () => {},
};

export const deactivator: statusUtil = {
    Name: "Deactivator",
    FireRate: 2,
    EnergyCost: 20,
    HeatLoad: 300,
    aType: "Default",
    Wran: 5,
    Whit: 80,
    Type: "Status",
    Status: ["Target", deactivateWeapons],
};

const ball: status = {
    time: 20,
    data: undefined,
    Type: "Generic",
    combine: (a: status, b: status) => [a, b],
    apply (v: vehicle) {
        if (v.Appearance.Shape === "Circle") return v;
        this.data = v.Appearance.Shape;
        return {
            ...v,
            Appearance: {
                ...v.Appearance,
                Shape: "Circle",
            }
        };
    },
    reset (v: vehicle) {
        return {
            ...v,
            Appearance: {
                ...v.Appearance,
                Shape: this.data
            }
        };
    },
    function: () => {},
};

export const ballin: statusUtil = {
    Name: "Ballinator",
    FireRate: 2,
    EnergyCost: 20,
    HeatLoad: 300,
    aType: "Default",
    Wran: 5,
    Whit: 80,
    Type: "Status",
    Status: ["Target", ball],
};

export const accBoot: status = {
    time: 20,
    data: {
        buff: 20,
        Acc: NaN
    },
    Type: "Accuracy",
    combine: (a: status, b: status) => {
        if (a.data === undefined || b.data === undefined) throw Error("These aren't Acc Boosting");
        if (
            !("Acc" in a.data) || !("Acc" in b.data) ||
            !("buff" in a.data) || !("buff" in b.data)
        ) throw Error("Definitely aren't Acc Boosting");
        
        const {Acc: aAcc, buff: aBuff} = a.data;
        const {Acc: bAcc, buff: bBuff} = b.data;
        if (isNaN(aAcc) && isNaN(bAcc)) 
    },
    apply (v: vehicle) {
        if (!isNaN(this.data.Acc)) return v;
        this.Acc = v.Stats.Acc;
        return {
            ...v,
            Stats: {
                ...v.Stats,
                Acc: v.Stats.Acc + this.data.buff                
            }
        };
    },
    reset (v: vehicle) {
        return {
            ...v,
            Appearance: {
                ...v.Appearance,
                Shape: this.data
            }
        };
    },
    function: () => {},
}
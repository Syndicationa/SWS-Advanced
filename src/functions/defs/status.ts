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
    function: () => true,
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
    data: [10, 1],
    Type: "Accuracy",
    combine: (a: status, b: status) => {
        if (a.Type !== "Accuracy" || b.Type !== "Accuracy" || a.data === undefined || b.data === undefined || a.data === null || b.data === null) return [a, b];
        if (a.time !== b.time) return [a, b];
        return [{
            ...a,
            data: [a.data[0] + b.data[0], a.data[1] * b.data[1]]
        }];
    },
    apply (v: vehicle) {
        const [summand, multiplier] = v.State.modifiers.Acc;
        const [thisSummand, thisMultiplier] = this.data as [number, number];
        console.log(v.State.modifiers.Acc, this.data);
        return {
            ...v,
            State: {
                ...v.State,
                modifiers: {
                    ...v.State.modifiers,
                    Acc: [summand + thisSummand, multiplier*thisMultiplier] as [number, number]
                }
            }
        };
    },
    reset (v: vehicle) {
        return v;
    },
    function: () => {},
};

export const targeting: statusUtil = {
    Name: "Targeting",
    FireRate: 2,
    EnergyCost: 20,
    HeatLoad: 70,
    aType: "Default",
    Wran: 5,
    Whit: 80,
    Type: "Status",
    Status: ["Target", accBoot],
};

export const heater: status = {
    time: 2,
    data: 20,
    Type: "Generic",
    combine: (a: status, b: status) => {
        return [a,b];
    },
    apply (v: vehicle) {
        return {
            ...v,
            State: {
                ...v.State,
                heat: v.State.heat + this.state
            }
        };
    },
    reset: (v: vehicle) => v,
    function: (a?: unknown) => {
        if (!Array.isArray(a) || a.length < 2) return false;
        return a[0] !== 0;
    },
    modify (damage: [number, number]) {
        return {
            ...this,
            data: damage[0]*3
        };
    }
};
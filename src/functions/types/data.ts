import { baseVehicle } from "./vehicleTypes";

export type Data = {
    factionNames: string[],
    exoticFactions: string[],
    factionColors: {[key: string]: string},
    shipTypes: {
        [key: string]: baseVehicle[]
    }
};
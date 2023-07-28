import { calculateHexCount, calculateResources, calculateResourcesOnMap } from "../functions/defs/planets.mjs";
import {data as mercury} from "./Mercury_Hex_Map.mjs";


const mercuryResources = {
    ConstructionMaterials: 1,
    NuclearMaterials: 1,
    ElectronicMaterials: 1,
    PreciousMaterials: 1
}

const data = calculateHexCount(mercury);

const resourceData = calculateResourcesOnMap(mercury, mercuryResources);

console.log(resourceData);
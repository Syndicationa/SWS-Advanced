import { cursor, setCursor } from "./types/cursorTypes";
import { ReactNode } from "react";
import { vehicle } from "./types/vehicleTypes";
import { weapon } from "./types/types";

const generateButtonedItem = (innerJSX: ReactNode, index: number, selected: boolean, cursor: cursor, setCursor: setCursor) => 
    (<div className={`Option ${selected ? "Selected":""}`} key={index}>
        {innerJSX}
        <button className='SelectButton' onClick={() => setCursor({...cursor, menu: index})}>Select</button>
    </div>);

export const generateStringList = (strings: string[], cursor: cursor, setCursor: setCursor) => {
    const options = strings.map((string, index) => {
        return generateButtonedItem((<>{string}</>), index, cursor.menu === index, cursor, setCursor);
    });

    return options;
};

export const generateVehicleList = (vehicles: vehicle[]) => {
    const options = vehicles.map((vehicle) => {
        const name = vehicle.Appearance?.name ?? vehicle.Type.Class;
        const currentHP = vehicle?.State?.hp ??vehicle.Stats.MaxHP;
        return <>{name}<div className='Health'>HP: {currentHP}/{vehicle.Stats.MaxHP}</div></>;
    });
    return options.filter(Boolean);
};

export const generateWeaponList = (weapons:weapon[]) => {
    const options = weapons.map((weapon) => {
        const name = weapon.Name;
        
        return <>{name}<div className='Health'>HP: {currentHP}/{vehicle.Stats.MaxHP}</div></>;
    });
    return options.filter(Boolean);
};

export const generateButtonedVehicles = (vehicles: vehicle[], cursor: cursor, setCursor: setCursor) => 
    generateVehicleList(vehicles).map((jsx, i) => generateButtonedItem(jsx, i, i === cursor.menu, cursor, setCursor));
import { vehicleTemplate } from "./defs/templates.mjs";
import { cursorGenerator } from "./defs/cursor.mjs";

const generateButtonedItem = (innerJSX, index, selected, cursor, setCursor) => 
    (<div className={`Option ${selected ? "Selected":""}`} key={index}>
        {innerJSX}
        <button className='SelectButton' onClick={() => setCursor({...cursor, menu: index})}>Select</button>
    </div>);

export const generateStringList = (strings = [String], cursor = cursorGenerator(), setCursor = () => {}) => {
    const options = strings.map((string, index) => {
        return generateButtonedItem((<>{string}</>), index, cursor.menu === index, cursor, setCursor);
    });

    return options;
};

export const generateVehicleList = (vehicles = [vehicleTemplate]) => {
    const options = vehicles.map((vehicle) => {
        if (vehicle.Name || !vehicle) return null;
        const name = vehicle.Appearance?.name ?? vehicle.Type.Class;
        const currentHP = vehicle?.State?.hp ??vehicle.Stats.MaxHP;
        return <>{name}<div className='Health'>HP: {currentHP}/{vehicle.Stats.MaxHP}</div></>;
    });
    return options.filter(Boolean);
};

export const generateButtonedVehicles = (vehicles = [vehicleTemplate], cursor = cursorGenerator(), setCursor = () => {}) => 
    generateVehicleList(vehicles).map((jsx, i) => generateButtonedItem(jsx, i, i === cursor.menu, cursor, setCursor));
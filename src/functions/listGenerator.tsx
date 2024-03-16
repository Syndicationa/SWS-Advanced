import { cursor, setCursor } from "./types/cursorTypes";
import { vehicle } from "./types/vehicleTypes";
import { weapon } from "./types/types";
import { currentArgs, isAttackArgs } from "./types/FunctionTypes";
import { calcDefHitChance, calcGenHitChance, calcRangeHC, calculateDamage, canFire } from "./defs/vehicle/attack";
import { InfoDisplay } from "../components/GameComponents/GameInterface/InfoDisplay";

const generateButtonedItem = (innerJSX: JSX.Element, index: number, selected: boolean, cursor: cursor, setCursor: setCursor) => 
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

type listGenerator<T, Other> = (a: T[], other?: Other, menu?: number) => JSX.Element[];

export const generateVehicleList = (vehicles: vehicle[]) => {
    const options = vehicles.map((vehicle) => {
        const name = vehicle.Appearance?.name ?? vehicle.Type.Class;
        const currentHP = vehicle?.State?.hp ??vehicle.Stats.MaxHP;
        return <>{name}<div className='Health'>HP: {currentHP}/{vehicle.Stats.MaxHP}</div></>;
    });
    return options.filter(Boolean);
};

export const generateWeaponList = (weapons:weapon[], args: currentArgs) => {
    if (!isAttackArgs(args) || args.length !== 3) throw Error("Weapons shouldn't be selected now");
    const [vehicleList, attacker, target] = args;
    const options = weapons.map((weapon) => {
        const name = weapon.Name;
        let hitChance: number = 0;
        if (weapon.Type === "Destruct" || weapon.Type === "Ramming") 
            hitChance = calcRangeHC(attacker, target, weapon.Wran) === "Hit" ? 100:0;
        else if (weapon.Type === "Generic") 
            hitChance = calcGenHitChance(attacker, target, weapon)[0];
        else
            hitChance = calcDefHitChance(attacker, target, weapon, vehicleList)[1];
        const [hullDamage, shieldDamage] = calculateDamage(attacker, [target], weapon)[0];
        const weaponHeat = "HeatLoad" in weapon ? weapon.HeatLoad:0;

        const damage = `Damage: ${hullDamage}`;
        const shield = shieldDamage > 0 ? `Shield Damage: ${shieldDamage}`: "";
        const hit = `Hit Chance: ${Math.round(hitChance)}`;
        const heat = `Heat: ${attacker.State.heat}/${attacker.Stats.OverHeat} + ${weaponHeat}`;
        const can = `Can Fire: ${canFire(attacker, target, weapon)}`;

        const info = [damage, shield, hit, heat, can].filter(item => item !== "") as string[];

        return (
            <>
                {name}
                <InfoDisplay information={info} className="Weapon" />
            </>
        );
    });
    return options.filter(Boolean);
};

const generateButtonedVersion = 
    <T,Other>(func: listGenerator<T, Other>) => 
        (list: T[], cursor: cursor, setCursor: setCursor, other?: Other) => 
            func(list, other, cursor.menu).map((jsx, i) => generateButtonedItem(jsx, i, i === cursor.menu, cursor, setCursor));

export const generateButtonedVehicles = generateButtonedVersion(generateVehicleList);
export const generateButtonedWeapons = generateButtonedVersion(generateWeaponList);
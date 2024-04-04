import { cursor, setCursor } from "./types/cursorTypes";
import { baseVehicle, vehicle } from "./types/vehicleTypes";
import { util, weapon } from "./types/types";
import { currentArgs, isAttackArgs, isUtilityArgs } from "./types/FunctionTypes";
import { calcDefHitChance, calcGenHitChance, calcRangeHC, calculateDamage, canFire } from "./defs/vehicle/attack";
import { InfoDisplay } from "../components/GameComponents/GameInterface/InfoDisplay";
import { retrieveDefenseList } from "./defs/vehicle/retrieve";

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
type sortOfVehicle = vehicle[] | baseVehicle[];

export const generateVehicleList = (vehicles: sortOfVehicle) => {
    const options = vehicles.map((vehicle) => {
        const name = vehicle.Appearance?.name ?? vehicle.Type.Class;
        const currentHP = vehicle?.State?.hp ??vehicle.Stats.MaxHP;
        return <>{name}<div className='Health'>HP: {currentHP}/{vehicle.Stats.MaxHP}</div></>;
    });
    return options.filter(Boolean);
};

export const generateUtilList = (utils: util[], args: currentArgs) => {
    if (!isUtilityArgs(args) || args.length !== 2) throw Error("Utility shouldn't be selected now");
    const [attacker, target] = args;
    const options = utils.map((util) => {
        const name = util.Name;
        let hitChance: number = 0;
        if (util.Type === "Deploying") 
            hitChance = 100;
        else if (util.Type !== "Status") 
            hitChance = calcRangeHC(attacker, target, util.Wran) === "Hit" ? 100:0;
        else if (util.Type === "Status") 
            hitChance = calcGenHitChance(attacker, target, util)[0];

        const utilHeat = "HeatLoad" in util ? util.HeatLoad:0;

        const type = `Type: ${util.Type}`;
        const hit = `Hit Chance: ${Math.round(hitChance)}`;
        const heat = `Heat: ${attacker.State.heat}/${attacker.Stats.OverHeat} + ${utilHeat}`;

        const info = [type, hit, heat].filter(item => item !== "") as string[];

        return (
            <>
                {name}
                <InfoDisplay information={info} className="Util" />
            </>
        );
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

export const generateDefenseList = ([vehicle]: vehicle[]) => {
    const list = retrieveDefenseList(vehicle);
    return list.map((item) => {
        if (item === "Exit") return <>{item}</>;
        if (item === "Intercept") {
            const min = vehicle.Stats.Intercept ?? 0;
            const max = min + 10;
            const current = vehicle.State.intercept;
            const string = `${min} <${"-".repeat(current)}|${"-".repeat(10 - current)}> ${max}`;
            return <>{item}<div>{string}</div></>;
        }
        const name = item[0].Name;
        const type = "Watk" in item[0] ? "Weapon":"Shield";
        return <>{`${type}: ${name}`}<div>{`${item[1]}`}</div></>;
    });
};

const generateButtonedVersion = 
    <T,Other>(func: listGenerator<T, Other>) => 
        (list: T[], cursor: cursor, setCursor: setCursor, other?: Other) => 
            func(list, other, cursor.menu).map((jsx, i) => generateButtonedItem(jsx, i, i === cursor.menu, cursor, setCursor));

export const generateButtonedVehicles: 
    (list: vehicle[] | baseVehicle[], cursor: cursor, other: unknown) => JSX.Element[] 
    = generateButtonedVersion(generateVehicleList);
export const generateButtonedWeapons = generateButtonedVersion(generateWeaponList);
export const generateButtonedUtils = generateButtonedVersion(generateUtilList);
export const generateButtonedControl = generateButtonedVersion(generateDefenseList);
import React from 'react'

export const Header = props => {
    const {stage, name, version, ...rest} = props;

    //const [length, setLength] = useState(0);
    let items = [];
    let stge = 0;
    if (stage) stge = Math.floor(stage/10);
    const stages = ["Place Ships","Movement Phase", "Utility Phase", "Attack Phase"];
    for (let x = 0; x < 18; x += 2) {
        let clasName = "stageItem"
        if (x === 0) clasName += " active";
        let info = stages[stge];
        items = [...items, {info, clasName, id: x}, {id:x+1}];
        stge++;
        if (stge === 3) stge = 1;
    }

    return (
        <header {...rest}>
            {items.map((item) => {
                if (item.id % 2 === 1) return ">>"
                return <div className={item.clasName} key={item.id}>{item.info}</div>
            })}
        </header>
    )
}

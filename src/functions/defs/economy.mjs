const exampleBuilding = {
    Name: "Generic",
    Cost: 0,
    Income: 0,
    TechIncome: 0,
}

export const buyBuilding = (faction, building = exampleBuilding) => {
    const Econ = faction.Economy;
    if (Econ.Treasury < building.Cost) return faction;
    const nEcon = {
        ...Econ,
        Treasury: Econ.Treasury - building.Cost,
        OwnedBuildings: [...Econ.OwnedBuildings, building]
    }
    return updateIncome({...faction, Economy: nEcon});
}

export const updateIncome = (faction) => {
    const Econ = faction.Economy;
    const Tech = faction.Technology;
    const nEcon = {
        ...Econ,
        Income: Econ.OwnedBuildings.reduce((sum, b) => sum + b.Income,0)
    }
    const nTech = {
        ...Tech,
        Income: Econ.OwnedBuildings.reduce((sum, b) => sum + b.TechIncome, 0)
    }

    return {...faction, Economy: nEcon, Technology: nTech};
}


export const createFaction = (info) => {
    return {
        Name: info.Name ?? "",
        Color: info.Color ?? "",
        Moves: info.Moves ?? [],
        Players: info.Players ?? [],
        Leader: info.Leader ?? -1,
        Treasurers: info.Treasurers ?? [-1],
        Regions: info.Regions ?? {
			Earth: [],
			Cities: []
		},
		Economy: info.Economy ?? {
			Treasury: 0,
			LastUpdated: new Date(),
			Income: 0,
			BuildingTypes: [],
			VehicleTypes: [],
			OwnedBuildings: [],
			OwnedVehicles: {},
		},
		Technology: info.Technology ?? {
			Technologies: [],
			LastUpdated: new Date(),
			TechPoints: 0,
			TechIncome: 0,
			
		},
    }
}

export const createCoalition = (info) => {
    return {
        Name: info.Name ?? "",
        Color: info.Color ?? "",
        Moves: info.Moves ?? [],
        Players: info.Players ?? [],
        Leader: info.Leader ?? -1,
        Treasurers: info.Treasurers ?? [-1],
        Regions: info.Regions ?? {
			Earth: [],
			Cities: []
		},
		Economy: info.Economy ?? {
			Treasury: 0,
			OwnedBuildings: [],
			OwnedVehicles: {},
		},
		Technology: info.Technology ?? {
			Technologies: [],
		},
    }
}

const week = (7 * 24 * 60 * 60 * 1000);

export const updateDate = (LastUpdated) => {
	const today = new Date();
	const weeks = Math.floor((today - LastUpdated) / week);
	const updateDay = new Date(LastUpdated + weeks*week);

	return {weeks, date: updateDay};
}
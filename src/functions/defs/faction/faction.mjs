export const createFaction = () => {
    return {
        Name: "",
        Color: "",
        Moves: [],
        Players: [],
        Leader: -1,
        Treasurers: [-1],
        Regions: {
			Earth: [],
			Cities: []
		},
		Treasury: 0,
		LastUpdated: new Date(),
		BuildingTypes: [],
		VehicleTypes: [],
		OwnedBuildings: [],
		OwnedVehicles: {},
    }
}

class Faction {
	constructor() {
		this.Name = "";
		this.Color = "";

		this.Moves = [];

		this.Players = [];
		//Add get Leader and set Leader
		this.LeaderIndex = 0;
		//List of those who can use econ controls
		this.Treasurers = [this.LeaderIndex];

		this.Regions = {Earth: [], Cities: []}
		this.Treasury = 0;
		this.LastUpdated = 0;
		this.BuildingTypes = [];
		this.VehicleTypes = [];
		this.OwnedBuildings = [];
		this.OwnedShips = {unclaimed: [], unclaimedRepair: [], claimed: []};
	}

	get Leader() {
		return this.Players[this.LeaderIndex];
	}

	get Income() {
		return this.OwnedBuildings.reduce((previous, building) => {
			return previous + building.producedValue;
		}, 0)
	}

	collectIncome() {
		if (!LastUpdated) return;
		this.Treasury += this.Income;
	}

	buyItem (cost) {
		this.Treasury -= cost;
	}

	sellItem (cost) {
		this.Treasury += cost;
	}

	addBuilding (building, location) {
		this.OwnedBuildings.push({...building, ...location});
	}

	removeBuilding (index) {
		this.OwnedBuildings.splice(index, 1)[0];
	}

	addNewShip (ship) {
		this.OwnedShips.unclaimed.push(ship);
	}

	addRepairShip (ship) {
		this.OwnedShips.unclaimedRepair.push(ship);
	}

	removeShip (index, group) {
		this.OwnedShips[group].splice(index, 1)
	}

	sendVehicle(vehicle, destination) {
	}
}
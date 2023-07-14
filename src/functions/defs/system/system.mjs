import { createDisplay } from "../display.mjs"
import { exampleMapElement, falseMapElementArea, trueMapElementArea } from "./map.mjs"

export const systemTemplate = {
    Name: "Test",

    Factions: [],
    Players: [],
    TechTree: {},
    Maps: {
        System: exampleMapElement,
        Planets: []
    },
    Battles: [],
    Time: new Date(),
    Moves: {},
    State: {},

    Type: "System",

    PlayerCount: 0,
    MaxCount: 0
}

export const createSystem = (Name, Maps, Faction, TechTree, Player, MaxCount) => {
    return {
        Name,
        Factions: [Faction],
        Players: [Player],
        TechTree,

        Maps,
        Battles: [],
        Time: new Date(),
        Moves: {},
        State: {},
    
        Type: "System",
    
        PlayerCount: 1,
        MaxCount
    }
}

const getBodiesInSystem = (mapElement = exampleMapElement) => {
    return [mapElement, ...mapElement.Grid.orbiters.reduce((a, map) => [...a, ...getBodiesInSystem(map)], [])]
}

const updateSystemDisplay = (game = systemToGame(), parent) => {
    const systemMap = game.Map;
    const map = getBodiesInSystem(systemMap).find((map) => parent === map.Appearance.name);
    const maps = [trueMapElementArea(map), ...map.Grid.orbiters.map((m) => falseMapElementArea(m))];

    return {...game, display: createDisplay([map.Grid.size, map.Grid.size])(maps)}
}

export const systemToGame = (system = systemTemplate, player = {User: {ID: 0}}) => {
    const game = {
        title: system.Name,
        gameMode: "System",
        display: [],
        Map: system.Maps.System,
        players: system.Players,
        cPlayer: system.Players.find((p) => p.User.ID === player.User.ID),
        updatePlayer: () => {},
        local: false,
        active: true,
        stage: -1
      }
    return updateSystemDisplay(game, system.Maps.System.Appearance.name);
}
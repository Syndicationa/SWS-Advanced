import { useState } from "react";
import { useSelector } from "react-redux";
import "./App.css";
import { Header } from "./components/MainPage/Header";
import { SignUp } from "./components/Account/SignUp";
import { Account } from "./components/Account/Account";
import { GameList } from "./components/GameList/GameList";
import { SkirmishController } from "./components/GameComponents/GameInterface/SkirmishController";
// import { createSystem, systemTemplate } from "./functions/defs/system/system.mjs";
// import { createFaction } from "./functions/defs/faction/faction.mjs";
import { gPlayerMaker, playerMaker } from "./functions/defs/player/player.mjs";
// import { exampleNetwork } from "./functions/defs/techNetwork.mjs";
import { getSolarDate } from "./functions/date.mjs";
import { tempData } from "./tests/temporaryData.mjs";
import { addPlayer, singleBattle } from "./functions/defs/battle/battle.mjs";

// const systemMake = (user) => {
//     const player = playerMaker(user)({Faction: "Astute", Name: "Synism", Admin: true})
//     const faction = createFaction({
//         Name: "Astute",
//         Color: {Astute: "#0000ff"},
//         Players: [player],
//         Leader: 0,
//         Treasurers: [0],
//     });
//     return createSystem("The Solar Wars", systemTemplate.Maps, faction, exampleNetwork, player, Infinity);
// }

const battleMake = user => {
    const user2 = {...user, ID: "B"};
    const player = playerMaker(user)({Faction: "Astute", Name: "Synism", Admin: true});
    const player2 = playerMaker(user2)({Faction: "Blade", Name: "Bobism", Admin: true});
    const gplayer = gPlayerMaker(player)("Synism");
    const gplayer2 = gPlayerMaker(player2)("Bobism");

    const battle = singleBattle(gplayer)({Map: "", PlayerCount: 2, Size:  {OverallSize: 16, StepSizes: [1]}, Title: "Test Game", Discoverable: false, Online: false});
    return {
        ...addPlayer(battle)(gplayer2),
        Stage: 3,
        Moves: {
            "Data": [
                "A.B;",
                "",
                "",
                ""
            ],
            Turns: [
                0,
                1,
                2,
                3
            ],
            A: [
                "P-Astute.0.[2,2].[1,0];Astute.0.[3,2].[1,0];",
                "M-0.[2,2].[1,1];1.[2,2].[1,1];",
                "U-0.[1,1]:[1,1]..;1.[1,1]:[1,1]..;",
                "A-"
            ],
            B: [
                "P-Blade.0.[13,2].[-1,0];Blade.0.[12,2].[-1,0];",
                "M-3.[-2,2].[-1,1];2.[-2,2].[-1,1];",
                "U-3.[-1,1]:[-1,1]..;2.[-1,1]:[-1,1]..;",
                "A-"
            ]
        }
    };
};


// const input = {
//     system: {},
//     movCurs: () => {},
//     movCursTo: () => {}
// };

function App() {
    const loggedIn = useSelector((state) => state.player.loggedIn);
    const user = useSelector((state) => state.player.user);
    const [page, setPage] = useState("Home");

    const homePage = (<>
        <div style={{width: "50%", fontSize: "2em", background: "none"}}>
        It is the year <b>{getSolarDate()[0]}</b>, and the Sol System is becoming too small for the factions vying for control. 
        Some will die, others will find a new hope in the Proxima System and beyond. 
        In the background, shadowy organizations manipulate the great powers and their policies for mysterious ends. 
        Around many of the nearby star systems are odd fields that limit FTL travel, their cause is unknown, but may predate us all.
        </div>
        <hr />
        <br />
        {!loggedIn ?
            <>
                <button style={{fontSize: "2em"}}>Play System Locally</button>
                <hr />
                <button style={{fontSize: "2em"}}>Play Skirmish Locally</button>
                <hr />
                <button>What is the difference?</button>
                <hr />
                <button>I want to play online!</button>
            </>:
            <button style={{fontSize: "2em"}} onClick={() => setPage("Games")}>Play Game</button>
        }
    </>);

    const renderMain = () => {
        switch (page) {
            case "Home":
                return homePage;
            case "Sign Up":
                return <SignUp setPage={setPage}  />; 
            case "Account":
                return <Account />;
            case "Game":
                return <GameList />;
            default:
                return homePage;
        }
    };

    const [v] = useState(true);

    return (
        <div className="App">
            {v ? <SkirmishController g={battleMake(user)} Data={tempData} />:
                <>
                    <Header page={page} setPage={setPage} />
                    <main>
                        {renderMain()}
                    </main>
                </>}
        </div>
    );
}

export default App;

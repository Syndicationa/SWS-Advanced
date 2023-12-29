import { useState } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { Header } from './components/MainPage/Header';
import { SignUp } from './components/Account/SignUp';
import { Account } from './components/Account/Account';
import { GameList } from './components/GameList/GameList';
import { SkirmishController } from './components/GameComponents/GameInterface/SkirmishController'
import { createSystem, systemTemplate } from './functions/defs/system/system.mjs';
import { createFaction } from './functions/defs/faction/faction.mjs';
import { gPlayerMaker, playerMaker } from './functions/defs/player/player.mjs';
import { exampleNetwork } from './functions/defs/techNetwork.mjs';
import { SystemMap } from './components/GameComponents/GameInterface/SystemMap';
import { getSolarDate } from './functions/date.mjs';
import { tempData } from './tests/temporaryData.mjs';
import { addPlayer, singleBattle } from './functions/defs/battle/battle.mjs';

const systemMake = (user) => {
    const player = playerMaker(user)({Faction: "Astute", Name: "Synism", Admin: true})
    const faction = createFaction({
        Name: "Astute",
        Color: {Astute: "#0000ff"},
        Players: [player],
        Leader: 0,
        Treasurers: [0],
    });
    return createSystem("The Solar Wars", systemTemplate.Maps, faction, exampleNetwork, player, Infinity);
}

const battleMake = user => {
    const player = playerMaker(user)({Faction: "Astute", Name: "Synism", Admin: true});
    const player2 = playerMaker(user)({Faction: "Blade", Name: "Bobism", Admin: true});
    const gplayer = gPlayerMaker(player)("Synism");
    const gplayer2 = gPlayerMaker(player2)("Bobism");

    const battle = singleBattle(gplayer)({Map: "", PlayerCount: 2, Size:  {OverallSize: 64, StepSizes: [8, 1]}, Title: "Test Game", Discoverable: false, Online: false});
    return addPlayer(battle)(gplayer2);
}


const input = {
    system: {},
    movCurs: () => {},
    movCursTo: () => {}
}

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
                return <Account />
            case "Game":
                return <GameList />
            default:
                return homePage;
        }
    }

    return (
        <div className="App">
            {true ? <SkirmishController g={battleMake(user)} Data={tempData} />:
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

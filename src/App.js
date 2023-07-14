import { useState } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { Header } from './components/MainPage/Header';
import { SignUp } from './components/Account/SignUp';
import { Account } from './components/Account/Account';
import { GameList } from './components/GameList/GameList';
import { SystemController } from './components/GameComponents/SystemController';
import { createSystem, systemTemplate } from './functions/defs/system/system.mjs';
import { createFaction } from './functions/defs/faction/faction.mjs';
import { playerMaker } from './functions/defs/player/player.mjs';
import { exampleNetwork } from './functions/defs/techNetwork.mjs';
import { SystemMap } from './components/GameComponents/GameInterface/SystemMap';

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
    It is the year <b>2122</b>, and the Sol System is becoming too small for the factions vying for control. 
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
      {true ? <SystemMap system={systemMake(user)} />:
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

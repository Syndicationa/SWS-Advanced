import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { Header } from './components/MainPage/Header';
import { SignUp } from './components/Account/SignUp';
import { Account } from './components/Account/Account';
import { GameList } from './components/GameList/GameList';
import { SystemController } from './components/GameComponents/SystemController';

function App() {
  const loggedIn = useSelector((state) => state.player.loggedIn);
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
    }
  }

  return (
    <div className="App">
      {true ? <SystemController />:
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

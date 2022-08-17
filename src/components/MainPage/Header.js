import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPlayer } from '../../slicers/playerSlicer';

export const Header = ({page, setPage}) => {
    const {player, game, data} = useSelector((state) => state);
    const loggedIn = player.loggedIn;
    const playerGames = game.playerGames;
    const dispatch = useDispatch();

    const togglePage = (pageName) => {
        const isPage = page === pageName;
        const nPage = isPage ?  "Home":pageName;
        setPage(nPage)
    }

    const logIn = () => {
        console.log("Log In")
        dispatch(fetchPlayer(data));
        setPage("Home");
    }

    return (
        <div className='Title'>
            Solar Wars Strategy: Advanced
        <div className='LogIn'>
        <button onClick={() => setPage("Home")}>How to Play</button>

        {playerGames.length > 0 || loggedIn ? <button onClick={() => togglePage("Game")}>My Games</button>:<></>}

        {!loggedIn ? 
            <>
                <button onClick={() => togglePage("Sign Up")}>Sign Up</button>
                <button onClick={logIn}>Log In</button>
            </>:
            <button onClick={() => togglePage("Account")}>My Account</button>
        }
        </div>
        </div>
    )
}

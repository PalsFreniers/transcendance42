import { getUsernameFromToken } from "./loginClient";

export function init(){
  const createGameButton = document.getElementById('game-button') as HTMLButtonElement | null;
  const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
  if (createGameButton)
    createGameButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = getUsernameFromToken();
      if (username)
        console.log('Welcome', username);
      try {
        const res = await fetch('http://localhost:3002/api/game/create-game', {
          method: "POST",
          headers: {'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({lobbyName: lobbyName.value, oppenentId: null})
        });
        if (res.ok)
            console.log()
      }
      catch (err){
        console.error('create game error', err);
      }
    });
};

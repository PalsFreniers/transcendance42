export function init(){
  const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
  const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
  const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
  if (createGameButton)
    createGameButton.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('http://localhost:3002/api/game/create-game', {
          method: "POST",
          headers: {'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ lobbyName: lobbyName.value, oppenentId: null })
        });
        if (res.ok){
            const data = await res.json();
            console.log("Game created:", data);
        }
      }
      catch (err){
        console.error('create game error', err);
      }
  });
  if (joinGameButton)
    joinGameButton.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const findLobbiesRes = await fetch('http://localhost:3002/api/game/find-lobbies', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });
      const { lobbies } = await findLobbiesRes.json();
      if (!lobbies || lobbies.length === 0) {
        console.log("No open lobbies found.");
        return;
      }
      const lobby = lobbies[0];
      const joinRes = await fetch('http://localhost:3002/api/game/join-lobby', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ gameId: lobby.id })
      });
      const data = await joinRes.json();
      if (joinRes.ok) {
        console.log("Successfully joined lobby:", data);
      } else {
        console.error("Failed to join lobby:", data);
      }
    } catch (err) {
      console.error("Error joining game:", err);
    }
  });
};

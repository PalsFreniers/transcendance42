import { getUsernameFromToken } from "./loginClient.js";

export function init(){
  const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
  const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
  const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
  const token = localStorage.getItem('token') as string;
  if (createGameButton)
    createGameButton.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('http://localhost:3002/api/game/create-game', {
          method: "POST",
          headers: {'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ lobbyName: lobbyName.value, oppenentId: null })
        });
        if (res.ok){
            const data = await res.json();
            console.log("Game created:", data);
            const lobbyGame = document.getElementById('game-salon') as HTMLDivElement;
            lobbyGame.innerHTML = `
            <p><strong>Lobby name:</strong> ${data.lobbyName}</p>
            <p><strong>Player 1:</strong> ${data.playerOne}</p>
            <p><strong>Player 2:</strong> ${data.playerTwo}</p>
            <p><strong>Status:</strong> ${data.status}</p>`;
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
          'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
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

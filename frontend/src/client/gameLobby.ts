import { getSocket } from "./socketClient.js";

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
    const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
    const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
    const startBtn = document.getElementById("start-game-btn") as HTMLButtonElement;

    if (createGameButton) {
        createGameButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const res = await fetch("http://localhost:3002/api/game/create-game", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ lobbyName: lobbyName.value }),
                });
                const data = await res.json();
                if (!data.success) {
                    console.error("Failed to create game:", data.error);
                    return;
                }
                const socket = getSocket(1);
                socket!.emit("create-room", {
                    gameId: data.gameId,
                    lobbyName: data.lobbyName,
                });
            } catch (err) {
                console.error("Create game error", err);
            }
        });
    }
    if (joinGameButton) {
        joinGameButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const findLobbiesRes = await fetch("http://localhost:3002/api/game/find-lobbies", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                });
                const { lobbies } = await findLobbiesRes.json();
                if (!lobbies || lobbies.length === 0) {
                    console.log("No open lobbies found.");
                    return;
                }
                const lobby = lobbies[0];
                const res = await fetch("http://localhost:3002/api/game/join-lobby", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ gameId: lobby.id }),
                });
                const data = await res.json();
                if (!data.success) {
                    console.error("Failed to Join game:", data.error);
                    return;
                }
                const socket = getSocket(1);
                socket!.emit("join-room", { gameId: lobby.id });
            } catch (err) {
                console.error("Error joining game:", err);
            }
        });
    }
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const socket = getSocket(1);
            socket!.emit("start-game");
            startBtn.style.display = "none";
        });
    }
}

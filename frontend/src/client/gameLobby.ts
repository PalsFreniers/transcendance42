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
    const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    const specBtn = document.getElementById('spectator-btn') as HTMLButtonElement;
    const listGame = document.getElementById('game-list') as HTMLElement;

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
        });
    }
    if (specBtn) {
        specBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const findLobbiesRes = await fetch("http://localhost:3002/api/game/spec-lobbies", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                });
                const { lobbies } = await findLobbiesRes.json();
                if (!lobbies || lobbies.length === 0) {
                    console.log("No game running.");
                    return;
                }
                listGame.innerHTML = lobbies.map(l => `<p class="lobby-item" data-name="${l.lobby_name}">${l.lobby_name} - ${l.status}</p>`).join("");
                document.querySelectorAll(".lobby-item").forEach(el => {
                    el.addEventListener("click", (e) => {
                        const target = e.currentTarget as HTMLElement;
                        const lobbyName = target.dataset.name;
                        console.log("Clicked lobby:", lobbyName);
                        const socket = getSocket(1);
                        if (lobbyName)
                            socket.emit("spec-game", { lobbyname : lobbyName });
                    });
                });

            }
            catch (err) {
                console.error("Error spec game:", err)
            }
        });
    }
}

import { backToPreviousPage, navigateTo } from "./navClient.js";
import { notify } from "./notify.js";
import { getSocket } from "./socketClient.js";

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const socket = getSocket(1);
    const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
    const iaBtn = document.getElementById('game-vs-ia') as HTMLElement;
    const localGameBtn = document.getElementById('game-local') as HTMLElement;
    const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
    const lobbyName = document.getElementById('lobby-name') as HTMLInputElement;
    const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    const specBtn = document.getElementById('spectator-btn') as HTMLButtonElement;
    const listGame = document.getElementById('game-list') as HTMLElement;
    const lobbyInfo = document.getElementById('game-salon') as HTMLElement;
    const quitBtn = document.getElementById('quit-game-button') as HTMLButtonElement;
    const customBtn = document.getElementById('custom-button') as HTMLButtonElement;
    const tournamentBtn = document.getElementById('tournament-button') as HTMLButtonElement;
    const startTournament = document.getElementById('tournament-start') as HTMLButtonElement;

    startBtn.style.display = 'none';
    listGame.style.display = 'none';
    lobbyInfo.style.display = 'none';
    quitBtn.style.display = 'none';
    startTournament.style.display = "none";
    backToPreviousPage();
    if (createGameButton) {
        createGameButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/game/create-game`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ lobbyName: lobbyName.value }),
                });
                const data = await res.json();
                if (!data.success) {
                    notify(`Game not created, Error: ${data.error}`);
                    console.error("Failed to create game:", data.error);
                    return;
                }
                socket!.emit("create-room", {
                    gameId: data.gameId,
                    lobbyName: data.lobbyName,
                    ia: false,
                });
                lobbyInfo.style.display = 'block';
                iaBtn.style.display = 'none';
                localGameBtn.style.display = 'none';
                tournamentBtn.style.display = "none";
                startTournament.style.display = "none";
                createGameButton.style.display = "none";
                joinGameButton.style.display = "none";
                specBtn.style.display = "none";
                customBtn.style.display = "none"
                startBtn.style.display = "block";
                quitBtn.style.display = 'block';
            } catch (err) {
                console.error("Create game error", err);
            }
        });
    }
    if (iaBtn) {
        iaBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/game/create-game`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ lobbyName: lobbyName.value }),
                });
                const data = await res.json();
                if (!data.success) {
                    notify(`Game not created, Error: ${data.error}`);
                    console.error("Failed to create game:", data.error);
                    return;
                }
                socket!.emit("create-room", {
                    gameId: data.gameId,
                    lobbyName: data.lobbyName,
                    ia: true,
                });
                lobbyInfo.style.display = 'block';
                tournamentBtn.style.display = "none";
                startTournament.style.display = "none";
                iaBtn.style.display = 'none';
                localGameBtn.style.display = 'none';
                createGameButton.style.display = "none";
                joinGameButton.style.display = "none";
                specBtn.style.display = "none";
                customBtn.style.display = "none"
                startBtn.style.display = "block";
                quitBtn.style.display = 'block';
            } catch (err) {
                console.error("Create game error", err);
            }
        });
    }
    if (localGameBtn) {
        localGameBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/game/create-game`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ lobbyName: lobbyName.value }),
                });
                const data = await res.json();
                if (!data.success) {
                    notify(`Game not created, Error: ${data.error}`);
                    console.error("Failed to create game:", data.error);
                    return;
                }
                const secondPlayer = prompt("Select the second player's name");
                if (!secondPlayer)
                    throw new Error("Invalid name for the second player");
                socket!.emit("create-room", {
                    gameId: data.gameId,
                    lobbyName: data.lobbyName,
                    local: secondPlayer,
                });
                lobbyInfo.style.display = 'block';
                tournamentBtn.style.display = "none";
                startTournament.style.display = "none";
                iaBtn.style.display = 'none';
                localGameBtn.style.display = 'none';
                createGameButton.style.display = "none";
                joinGameButton.style.display = "none";
                specBtn.style.display = "none";
                customBtn.style.display = "none"
                startBtn.style.display = "block";
                quitBtn.style.display = 'block';
            } catch (err) {
                console.error("Create game error", err);
            }
        });
    }
    if (tournamentBtn) {
        tournamentBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                if (!lobbyName.value)
                    return;
                socket!.emit("create-tournament", {
                    lobbyName: lobbyName.value
                });
                createGameButton.style.display = "none";
                joinGameButton.style.display = "none";
                tournamentBtn.style.display = "none";
                iaBtn.style.display = 'none';
                localGameBtn.style.display = 'none';
                specBtn.style.display = "none";
                customBtn.style.display = "none"
                startBtn.style.display = "none";
                startTournament.style.display = "block";
                quitBtn.style.display = 'block';
            }
            catch (err) {
                console.error("Create tournament error", err);
            }
        });
    }
    if (startTournament) {
        startTournament.addEventListener('click', async (e) => {
            e.preventDefault();
            socket!.emit('tournament-start')
        }
        );
    }
    if (joinGameButton) {
        joinGameButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const findLobbiesRes = await fetch(`/api/game/find-lobbies`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                });
                const { lobbies } = await findLobbiesRes.json();
                if (!lobbies || lobbies.length === 0) {
                    notify(`Error: No open lobbies found for joinning`);
                    console.log("No open lobbies found.");
                    return;
                }
                const lobby = lobbies[0];
                const res = await fetch(`/api/game/join-lobby`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ gameId: lobby.id }),
                });
                const data = await res.json();
                if (!data.success) {
                    notify(`Failed to join game, Error: ${data.error}`);
                    console.error("Failed to Join game:", data.error);
                    return;
                }
                socket!.emit("join-room", { gameId: lobby.id });
                lobbyInfo.style.display = 'block';
                quitBtn.style.display = 'block';
                iaBtn.style.display = 'none';
                localGameBtn.style.display = 'none';
                specBtn.style.display = "none";
                customBtn.style.display = "none"
                createGameButton.style.display = "none";
                joinGameButton.style.display = "none";
                specBtn.style.display = "none";
                tournamentBtn.style.display = "none";
                startTournament.style.display = "none";
            } catch (err) {
                console.error("Error joining game:", err);
            }
        });
    }
    if (quitBtn) {
        quitBtn.addEventListener("click", () => {
            const lobbyElem = document.getElementById('lobbyname') as HTMLParagraphElement;
            if (!lobbyElem)
                return;
            const lobbyText = lobbyElem.textContent || "";
            const nameOnly = lobbyText.replace("Lobby name:", "").trim();
            console.log('press Quit');
            notify(`Quit lobby: ${nameOnly}`);
            socket!.emit("left-game", { lobbyname: nameOnly });
            navigateTo('/pong');
        });
    }
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            socket!.emit("start-game");
        });
    }
    if (specBtn) {
        specBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const findLobbiesRes = await fetch(`/api/game/spec-lobbies`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                });
                const { lobbies } = await findLobbiesRes.json();
                if (!lobbies || lobbies.length === 0) {
                    notify("No game actually running");
                    return;
                }
                listGame.style.display = 'block';
                listGame.innerHTML = lobbies.map(l => `<p class="lobby-item" data-name="${l.lobby_name}"> ${l.lobby_name} - ${l.playerOne} vs ${l.playerTwo} - ${l.status}</p>`).join("");
                document.querySelectorAll(".lobby-item").forEach(el => {
                    el.addEventListener("click", (e) => {
                        const target = e.currentTarget as HTMLElement;
                        const lobbyName = target.dataset.name;
                        createGameButton.style.display = "none";
                        tournamentBtn.style.display = "none";
                        joinGameButton.style.display = "none";
                        specBtn.style.display = "none";
                        specBtn.style.display = "none";
                        startTournament.style.display = "none";
                        if (lobbyName) {
                            notify(`Your spectate ${lobbyName} room`)
                            socket!.emit("spec-game", { lobbyname: lobbyName });
                        }
                    });
                });

            }
            catch (err) {
                console.error("Error spec game:", err)
            }
        });
    }
}

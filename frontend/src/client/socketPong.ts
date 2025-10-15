import io, { Socket } from 'socket.io-client';
import { navigateTo } from './navClient.js';
import { getUsernameFromToken } from './loginClient.js';
import { clearPong, drawPong, handlePaddleReflect, handleWallReflect } from "./pongUI.js";
import { notify } from "./notify.js";

let lobbyname: String | null = null;
let keysPressed = {
    up: false,
    down: false,
    upP2: false,
    downP2: false,
};

export function getUserIdFromToken(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        return payload.userId || 0;
    } catch {
        return 0;
    }
}

export function createPongSocket(socketPong: Socket | null) {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();
    socketPong = io(`wss://${import.meta.env.VITE_LOCAL_ADDRESS}:8443`, {
        path: '/pongSocket/',
        auth: { token },
        withCredentials: true,
        transports: ['websocket'],
    });
    socketPong.on("connect", () => {
        console.log("Connected to game socket:", socketPong!.id);
        // Register this socket with backend so manager knows your userId
        socketPong!.emit("register-socket", userId);
    });

    socketPong.on("room-created", (data) => {
        console.log("Room created event:", data);
        const lobbyGame = document.getElementById("game-salon") as HTMLDivElement;
		const returnBtn = document.getElementById('return') as HTMLDivElement;
		returnBtn.style.display = 'none';
        lobbyGame.innerHTML = `
        <p id="lobbyname"><strong>Lobby name:</strong> ${data.lobbyName}</p>
        <p><strong>Player 1:</strong> ${data.userName}</p>
        <p><strong>Player 2:</strong> ${data.playerTwo ?? "-"}</p>
        <p><strong>Status:</strong> ${data.status}</p>`;
    });

    socketPong.on('player-joined', (data) => {
        console.log("Player joined event:", data);
        const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
		const returnBtn = document.getElementById('return') as HTMLDivElement;
		returnBtn.style.display = 'none';
        if (!startBtn)
            return;
        // Update UI with both players
        lobbyname = data.lobbyName;
        if (data.playerTwo === '-')
            startBtn.style.display = 'block';
        const lobbyGame = document.getElementById("game-salon") as HTMLDivElement;
        lobbyGame.innerHTML = `
        <p id="lobbyname"><strong>Lobby name:</strong> ${data.lobbyName}</p>
        <p><strong>Player 1:</strong> ${data.playerOne}</p>
        <p><strong>Player 2:</strong> ${data.playerTwo}</p>
        <p><strong>Status:</strong> ${data.status}</p>`;
    });

    socketPong.on("lobby-info", (data) => {
        const path = window.location.pathname;
        if (path !== '/pong')
            navigateTo('/pong')
        const lobbyGame = document.getElementById("game-salon") as HTMLDivElement;
        const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
        const quitBtn = document.getElementById('quit-game-button') as HTMLButtonElement;
        const createGameButton = document.getElementById('game-button') as HTMLButtonElement;
        const iaBtn = document.getElementById('game-vs-ia') as HTMLElement;
        const localGameBtn = document.getElementById('game-local') as HTMLElement;
        const joinGameButton = document.getElementById('join-button') as HTMLButtonElement;
        const specBtn = document.getElementById('spectator-btn') as HTMLButtonElement;
        const customBtn = document.getElementById('custom-button') as HTMLButtonElement;
        const tournamentBtn = document.getElementById('tournament-button') as HTMLButtonElement;
        const startTournament = document.getElementById('tournament-start') as HTMLButtonElement;
		const returnBtn = document.getElementById('return') as HTMLDivElement;
		returnBtn.style.display = 'none';

        lobbyGame.style.display = 'block';
        startTournament.style.display = "none";
        iaBtn.style.display = 'none';
        localGameBtn.style.display = 'none';
        tournamentBtn.style.display = "none";
        startTournament.style.display = "none";
        createGameButton.style.display = "none";
        joinGameButton.style.display = "none";
        specBtn.style.display = "none";
        customBtn.style.display = "none"
        if (getUsernameFromToken() === data.playerOne)
            startBtn.style.display = "block";
        quitBtn.style.display = 'block';

        lobbyGame.innerHTML = `
            <p id="lobbyname"><strong>Lobby name:</strong> ${data.lobbyName}</p>
            <p><strong>Player 1:</strong> ${data.playerOne}</p>
            <p><strong>Player 2:</strong> ${data.playerTwo ?? "-"}</p>
            <p><strong>Status:</strong> ${data.status}</p>`;
    });


    socketPong.on('in-game', () => {
        const path = window.location.pathname;
        if (path !== '/pong')
            navigateTo('/pong')
    });

    socketPong.on('game-state', (state) => {
    	const ffBtn = document.getElementById("pong-ff") as HTMLButtonElement;
        const msgGameEnd = document.getElementById("msg-end") as HTMLElement;
		if(!state.isLocal && ffBtn.style.display != "block") {
			ffBtn.style.display = "block";
			ffBtn.addEventListener("click", async (e) => {
				e.preventDefault();
				try {
					socketPong!.emit("ff");
				} catch (err) {
					console.error("Error while forfeiting: ", err);
				}
			});
		}
		msgGameEnd.style.display = "none";
        drawPong(state);
    });

	socketPong.on('spec-out', () => {
        const path = window.location.pathname;
        if (path !== '/lobby')
            navigateTo('/lobby');
	});

    socketPong.on('paddle-reflect', ({ballPos, ballDir}) => {
        handlePaddleReflect(ballPos, ballDir);
    });

    socketPong.on('wall-reflect', ({ballPos, ballDir}) => {
        handleWallReflect(ballPos, ballDir);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" && !keysPressed.up) {
            keysPressed.up = true;
            socketPong!.emit("input", { key: "up", action: "keydown" });
        }
        else if (e.key === "ArrowDown" && !keysPressed.down) {
            keysPressed.down = true;
            socketPong!.emit("input", { key: "down", action: "keydown" });
        }
        else if (e.key.toLowerCase() === "w" && !keysPressed.upP2) {
            keysPressed.upP2 = true;
            socketPong!.emit("input", { key: "up", action: "keydown", localPlayer: true });
        }
        else if (e.key.toLowerCase() === "s" && !keysPressed.downP2) {
            keysPressed.downP2 = true;
            socketPong!.emit("input", { key: "down", action: "keydown", localPlayer: true });
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowUp" && keysPressed.up) {
            keysPressed.up = false;
            socketPong!.emit("input", { key: "up", action: "keyup" });
        }
        else if (e.key === "ArrowDown" && keysPressed.down) {
            keysPressed.down = false;
            socketPong!.emit("input", { key: "down", action: "keyup" });
        }
        else if (e.key.toLowerCase() === "w" && keysPressed.upP2) {
            keysPressed.upP2 = false;
            socketPong!.emit("input", { key: "up", action: "keyup", localPlayer: true });
        }
        else if (e.key.toLowerCase() === "s" && keysPressed.downP2) {
            keysPressed.downP2 = false;
            socketPong!.emit("input", { key: "down", action: "keyup", localPlayer: true });
        }
    });

    socketPong.on('game-end', (data) => {
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        const ffBtn = document.getElementById("pong-ff") as HTMLButtonElement;
        const msgGameEnd = document.getElementById("msg-end") as HTMLElement;
		const returnBtn = document.getElementById('return') as HTMLDivElement;
		returnBtn.style.display = 'block';
		msgGameEnd.style.display = "block";
        let msg = "You won"
        let endMsg = `${data.score[0]} - ${data.score[1]}`
        if (data.score[0] < data.score[1] && data.player1 == getUsernameFromToken())
        {
            msg = "You lost";
            msgGameEnd.style.color = "#DC143C";
        }
        if (data.score[0] < data.score[1] && data.player2 == getUsernameFromToken())
            endMsg = `${data.score[1]} - ${data.score[0]}`
        if (data.score[0] > data.score[1] && data.player2 == getUsernameFromToken())
        {
            msg = "You lost";
            endMsg = `${data.score[1]} - ${data.score[0]}`
            msgGameEnd.style.color = "#DC143C";
        }
        if (getUsernameFromToken() != data.player1 && getUsernameFromToken() != data.player2)
        {
            if (data.score[0] < data.score[1]){
                msg = `Player 2 won`;
                endMsg = `${data.score[1]} - ${data.score[0]}`
            }
            else{
                msg = `Player 1 won`;
                endMsg = `${data.score[0]} - ${data.score[1]}`
            }
        }

        msgGameEnd.innerHTML = `
            <p>${msg} with score of ${endMsg}</p>`
        if (!canvas)
            return;
        
        canvas.style.display = "none";
        ffBtn.style.display = "none";
        clearPong();
		if(data.tMsg) notify(data.tMsg);
    })

    socketPong.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
    });

    socketPong.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
    });

    return socketPong;
}

import io, { Socket } from 'socket.io-client';
import { navigateTo } from './navClient.js';

let lobbyname: String | null = null;
let keysPressed = {
        up: false,
        down: false,
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
        lobbyname = data.lobbyName;
        lobbyGame.innerHTML = `
        <p><strong>Lobby name:</strong> ${data.lobbyName}</p>
        <p><strong>Player 1:</strong> ${data.userName}</p>
        <p><strong>Player 2:</strong> ${data.playerTwo ?? "-"}</p>
        <p><strong>Status:</strong> ${data.status}</p>`;
    });

    socketPong.on('player-joined', (data) => {
        console.log("Player joined event:", data);
        const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
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

    socketPong.on('in-game', () => {
        const path = window.location.pathname;
        if (path !== '/pong')
            navigateTo('/pong')
    });

    socketPong.on('game-state', (state) => {
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        const startBtn = document.getElementById("pong-wrapper") as HTMLButtonElement;
        startBtn.style.display = "none";
        canvas.style.display = "block";
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        const logicalWidth = 20;
        const logicalHeight = 10;

        const scaleX = canvas.width / logicalWidth;
        const scaleY = canvas.height / logicalHeight;

        const offsetX = canvas.width / 2;
        const offsetY = canvas.height / 2;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(187, 16, 158, 0.4)";
        for (let x = 0; x < canvas.width; x += scaleX) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += scaleY) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = "#0034de";
        ctx.lineWidth = 4;
        ctx.strokeRect(
            offsetX - (logicalWidth / 2) * scaleX,
            offsetY - (logicalHeight / 2) * scaleY,
            logicalWidth * scaleX,
            logicalHeight * scaleY
        );

        const ballRadius = 0.15 * Math.min(scaleX, scaleY);
        const ballX = state.ballPos.x * scaleX + offsetX;
        const ballY = state.ballPos.y * scaleY + offsetY;

        ctx.save();
        ctx.shadowColor = "#ffdd00";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffdd00";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        const paddleWidth = 0.5 * scaleX;
        const paddleHeight = 2 * scaleY;

        ctx.fillStyle = "#ffdd00";
        ctx.fillRect(
            state.leftPaddle.x * scaleX + offsetX,
            state.leftPaddle.y * scaleY + offsetY,
            paddleWidth,
            paddleHeight
        );

        ctx.fillStyle = "#ffdd00";
        ctx.fillRect(
            state.rightPaddle.x * scaleX + offsetX,
            state.rightPaddle.y * scaleY + offsetY,
            paddleWidth,
            paddleHeight
        );

        ctx.fillStyle = "#ffdd00";
        ctx.font = "20px 'Public Pixel'";
        ctx.textAlign = "center";
        ctx.fillText(`${state.leftScore} - ${state.rightScore}`, canvas.width / 2, 40);

        ctx.fillText(`${state.usernameLeftTeam}`, canvas.width / 5, 40);
        ctx.fillText(`${state.usernameRightTeam}`, canvas.width - canvas.width / 5, 40);

        ctx.fillStyle = "#ffdd00";
        ctx.font = "16px 'Public Pixel'";
        ctx.textAlign = "left";

        if (state.state === "idling") {
            ctx.fillText(`GAME PAUSED - WAITING FOR OPPONENT`, 25, 70);
        }

        if (state.state === "resume") {
            ctx.fillText(`GAME RESUMING IN ${state.resumeTimer}`, 150, 70);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" && !keysPressed.up) {
            keysPressed.up = true;
            socketPong!.emit("input", { key: "up", pressed: true });
            socketPong!.emit("input", { key: "up", action: "keyup" });
            console.log("Emit input:", { key: "up", pressed: true });
        }

        if (e.key === "ArrowDown" && !keysPressed.down) {
            keysPressed.down = true;
            socketPong!.emit("input", { key: "down", pressed: true });
            socketPong!.emit("input", { key: "down", action: "keyup" });
            console.log("Emit input:", { key: "down", pressed: true });
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowUp" && keysPressed.up) {
            keysPressed.up = false;
            socketPong!.emit("input", { key: "up", pressed: false });
            socketPong!.emit("input", { key: "up", action: "keydown" });
            console.log("Emit input:", { key: "up", pressed: false });
        }

        if (e.key === "ArrowDown" && keysPressed.down) {
            keysPressed.down = false;
            socketPong!.emit("input", { key: "down", pressed: false });
            socketPong!.emit("input", { key: "down", action: "keydown" });
            console.log("Emit input:", { key: "down", pressed: false });
        }
    });


    socketPong.on('game-end', (data) => {
        const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
        const msgGameEnd = document.getElementById("msg-end") as HTMLElement;
        msgGameEnd.innerHTML = `
            <p>${data.msg} with score of ${data.score[0]} - ${data.score[1]}</p>`
        if (!canvas)
            return;
        canvas.style.display = "none";
    })

    socketPong.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
    });

    socketPong.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
    });
    return socketPong;
}
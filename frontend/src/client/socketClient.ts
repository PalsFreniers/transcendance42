import io, { Socket } from 'socket.io-client';
import { createShifumiSocket } from './socketShifumi.js';

interface ChatMessage {
    from: string;
    userId: number;
    target: number;
    for: string;
    text: string;
    timestamp: string;
}


let socketChat: Socket | null = null;
let socketPong: Socket | null = null;
let socketShifumi: Socket | null = null;
let lobbyname: String | null = null;

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

export function getSockets(): [Socket, Socket, Socket] {
    if (!socketChat && !socketPong) {
        const token = localStorage.getItem('token');
        const userId = getUserIdFromToken();
        // SOCKET CHAT
        socketChat = io('http://localhost:3001', {
            path: '/chatSocket/',
            auth: { token },
            withCredentials: true,
            transports: ['websocket'],
            // autoConnect is true by default, reconnects automatically on disconnect
        });
        socketChat.on('connect', () => {
            console.log(`Socket (${socketChat!.id}) connected!`);
            // On first connect and reconnects, emit register
            socketChat!.emit('register-socket', userId);
        });

        socketChat.on('message', (msg: ChatMessage) => {
            console.log(`${msg.from} (${msg.timestamp}) : ${msg.text}`);
        });

        socketChat.on('error', (text: string) => {
            console.error(`${text}`);
        })

        socketChat.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
        });

        socketChat.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
        });


        // SOCKET PONG
        socketPong = io('http://localhost:3002', {
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
            // Update UI with both players
            lobbyname = data.lobbyName;
            const lobbyGame = document.getElementById("game-salon") as HTMLDivElement;
            lobbyGame.innerHTML = `
        <p><strong>Lobby name:</strong> ${data.lobbyName}</p>
        <p><strong>Player 1:</strong> ${data.playerOne}</p>
        <p><strong>Player 2:</strong> ${data.playerTwo}</p>
        <p><strong>Status:</strong> ${data.status}</p>`;
        });

        socketPong.on('game-state', (state) => {
            console.log('Game state received:', state);

            const canvas = document.getElementById("pong-canvas") as HTMLCanvasElement;
            if (!canvas)
                return;
            const ctx = canvas.getContext("2d");
            if (!ctx)
                return;

            const scale = 20; // 1 unité = 20 pixels
            const gameWidth = 20;
            const gameHeight = 10;

            const offsetX = canvas.width / 2;
            const offsetY = canvas.height / 2;

            // Fond
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bordure du jeu
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                offsetX - (gameWidth / 2) * scale,
                offsetY - (gameHeight / 2) * scale,
                gameWidth * scale,
                gameHeight * scale
            );

            // Balle (avec hitbox correcte)
            const ballRadius = 0.15 * scale; // rayon basé sur Ball.size
            ctx.beginPath();
            ctx.arc(
                state.ballPos.x * scale + offsetX,
                state.ballPos.y * scale + offsetY,
                ballRadius,
                0, Math.PI * 2
            );
            ctx.fillStyle = "white";
            ctx.fill();

            const paddleWidth = 0.5 * scale;
            const paddleHeight = 2 * scale;

            // Paddle gauche
            ctx.fillRect(
                state.leftPaddle.x * scale + offsetX,
                state.leftPaddle.y * scale + offsetY,
                paddleWidth,
                paddleHeight
            );

            // Paddle droit
            ctx.fillRect(
                state.rightPaddle.x * scale + offsetX,
                state.rightPaddle.y * scale + offsetY,
                paddleWidth,
                paddleHeight
            );

            // Score
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.fillText(`${state.leftScore} - ${state.rightScore}`, canvas.width / 2 - 20, 30);
        });


        document.addEventListener('keydown', (e) => {
            if (!lobbyname)
                return;
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                const payload = { key: e.key === "ArrowUp" ? "up" : "down", action: "keydown" };
                console.log("Emit input:", payload);
                socketPong!.emit("input", payload);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!lobbyname)
                return;
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                const payload = { key: e.key === "ArrowUp" ? "up" : "down", action: "keyup" };
                console.log("Emit input:", payload);
                socketPong!.emit("input", payload);
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
        //SOCKET SHIFUMI
       socketShifumi = createShifumiSocket(socketShifumi);
    }

    return [socketChat!, socketPong!, socketShifumi!];
}

export function getSocket(id: number) {
    switch (id) {
        case 0: return socketChat;
        case 1: return socketPong;
        case 2: return socketShifumi;
        default: return null;
    }
}


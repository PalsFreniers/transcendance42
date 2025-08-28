import { Server, Socket } from "socket.io";
import { GameManager } from "./gameManager.js";
import { verifTokenSocket } from "./index.js";
import db from './dbSqlite/db.js';


const manager = GameManager.getInstance();

function getUserIdFromToken(token: string): number {
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

function getUsernameFromToken(token: string): string | null {
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        return payload.username || null;
    } catch (err) {
        return null;
    }
}

export function socketManagement(io: Server) {
    io.use(async (socket, next) => {
        if (verifTokenSocket(socket)) {
            console.log('verif passed !');
            next();
        }
        else {
            console.log(`socket ${socket.id} can't connect !`);
            next(new Error('Authentification error'));
        }
    });
    // SOCKET LOGIC GAME
    io.on('connection', (socket) => {
        socket.on('register-socket', (userId: number) => {
            socket.data.userId = getUserIdFromToken(socket.handshake.auth.token);
            socket.data.userName = getUsernameFromToken(socket.handshake.auth.token);
            manager.registerSocket(socket.data.userId, socket.id);
            socket.data.gameId = -1;
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });

        socket.on('create-room', ({ gameId, lobbyName }) => {
            try {
                const userName = socket.data.userName;
                socket.data.lobbyName = lobbyName;
                socket.data.gameId = `game-${gameId}`;
                manager.createLobby(lobbyName, gameId);
                manager.joinLobby(lobbyName, socket.data.userId);

                socket.join(socket.data.gameId);

                socket.emit('room-created', {
                    gameId,
                    lobbyName,
                    userName,
                    playerTwo: null,
                    status: 'waiting'
                });

                console.log(`User ${socket.data.userId} created and joined room ${socket.data.gameId}`);
            } catch (err) {
                console.error('create-room error:', err);
                socket.emit('error', err);
            }
        });

        socket.on('join-room', ({ gameId }) => {
            try {
                socket.data.gameId = `game-${gameId}`;
                const userName = socket.data.userName;
                const lobby = db.prepare(
                    `SELECT player_one_id, player_two_id, lobby_name 
             FROM games WHERE id = ?`
                ).get(gameId) as { player_one_id: number; player_two_id: number | null; lobby_name: string };
                if (!lobby) {
                    throw new Error(`Lobby not found for gameId ${gameId}`);
                }
                const errno = manager.joinLobby(lobby.lobby_name, socket.data.userId);
                if (errno)
                    throw new Error(`Failed to join lobby: ${errno}`);
                socket.join(socket.data.gameId);
                socket.data.lobbyName = lobby.lobby_name;
                const playerOneSocketId = manager.getSocketId(lobby.player_one_id);
                const playerOneSocket = playerOneSocketId ? io.sockets.sockets.get(playerOneSocketId) : null;
                const playerOneName = playerOneSocket?.data.userName ?? "Unknown";
                io.to(socket.data.gameId).emit('player-joined', {
                    gameId,
                    lobbyName: lobby.lobby_name,
                    playerOne: playerOneName,
                    playerTwo: userName,
                    status: 'ready',
                });
                console.log(`User ${socket.data.userId} joined room ${socket.data.gameId} (lobbyName=${lobby.lobby_name})`);
            } catch (err) {
                console.error('join-room error:', err);
                socket.emit('error', err);
            }
        });

        socket.on('start-game', () => {
            try {
                const lobbyName = socket.data.lobbyName;
                if (!lobbyName) {
                    socket.emit('error', 'No lobby assigned to this socket');
                    return;
                }
                const errno = manager.startGame(lobbyName, socket.data.gameId , io);
                if (errno) {
                    throw new Error(`Failed to start game: ${errno}`);
                }
                console.log(`Game started for lobby ${lobbyName}`);
            } catch (err) {
                console.error("start-game error:", err);
                socket.emit("error", err);
            }
        });

        socket.on('input', ({ key, action }) => {
            const lobbyName = socket.data.lobbyName;
            const playerId = socket.data.userId;
            const game = manager.findGame(lobbyName);
            if (!game)
                return console.warn(`No active game for player ${playerId}`);
            const paddle = game.getPaddle(playerId)!;
            const state = paddle.getState();
            state[key === 'up' ? 0 : 1] = action === 'keyup';
        });

        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId)
                manager.unregisterSocket(userId);
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
import { Server } from "socket.io";
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
        socket.on('register-socket', () => {
            socket.data.userId = getUserIdFromToken(socket.handshake.auth.token);
            socket.data.userName = getUsernameFromToken(socket.handshake.auth.token);
            manager.registerSocket(socket.data.userId, socket.id);
            const game = manager.findGame(socket.data.userId?.toString());
            if (game) {
                socket.data.gameId = `game-${game.gameID}`;
                socket.join(socket.data.gameId);
                const lobbyname = db.prepare(`
                    SELECT lobby_name FROM games WHERE id = ?`
                ).get(socket.data.gameId) as { lobbyname: string };
                socket.data.lobbyname = lobbyname;
                console.log(socket.data.lobbyname);
                socket.emit('in-game');
            }
            else
                socket.data.gameId = -1;
            console.log(`User ${socket.data.userId} registered with socket ${socket.id}`);
        });

        socket.on('create-room', ({ gameId, lobbyName }) => {
            try {
                const userName = socket.data.userName;
                if (manager.createLobby(lobbyName, gameId))
                    throw new Error(`Couldn't create lobby with name ${lobbyName}`);
                if (manager.joinLobby(lobbyName, socket.data.userId))
                    throw new Error(`Couldn't join lobby with name ${lobbyName}`);

                manager.findGame(lobbyName)!.on("game-end",
                    ({ game, players }) => {
                        console.log("here");
                        const score: number[] = Array.from(game.score);
                        const [p1, p2] = players;
                        console.log(players);
                        io.to(p1).emit("game-end", {
                            msg: score![0] > score![1] ? "You win" : "You loose",
                            score: [score![0], score![1]]
                        });
                        io.to(p2).emit("game-end", {
                            msg: score![1] > score![0] ? "You win" : "You loose",
                            score: [score![1], score![0]]
                        });
                    });

                socket.data.lobbyName = lobbyName;
                socket.data.gameId = `game-${gameId}`;

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
                if (socket.data.gameId === -1)
                    throw new Error(`Failed to start game, you are already in game`);
                const errno = manager.startGame(lobbyName, socket.data.gameId, io);
                if (errno)
                    throw new Error(`Failed to start game: ${errno}`);
                db.prepare(`UPDATE games SET status = 'playing' WHERE lobby_name = ?`).run(lobbyName);
                console.log(`Game started for lobby ${lobbyName}`);

            } catch (err) {
                console.error("start-game error:", err);
                socket.emit("error", err);
            }
        });

        socket.on('input', ({ key, action }) => { // trueKey
            const playerId = socket.data.userId;
            if (!playerId)
                return;
            const game = manager.findGame(playerId.toString());
            if (!game)
                return console.warn(`No active game for player ${playerId}`);
            if (game.state !== 'running')
                return;
            let paddle = game.getPaddle(playerId)!;
            // if (!trueKey.startsWith("Arrow")) // paddle droit
            //     paddle = game.getPaddle(-1);
            const state = paddle.getState();
            const isPressed = action === 'keydown';
            if (key === 'up')
                state[0] = isPressed;
            else if (key === 'down')
                state[1] = isPressed;
        });

        socket.on('spec-game', ({ lobbyname }) => {
            const game = manager.findGame(lobbyname);
            if (!game)
                return console.warn(`Game ${lobbyname} not found or finished`);
            console.log(`spec register in room game-${game.gameID}`);
            socket.join(`game-${game.gameID}`);
        });

        socket.on('left-game', ({ lobbyname }) => {
            const game = manager.findGame(lobbyname);
            if (!game)
                return;
            console.log(`you left the room game-${game.gameID}`);
            const playerOneUsername = manager.getUsernameFromSocket(manager.getSocketId(manager.getGameInfo(lobbyname, io)!.playerOneID!)!, io);
            manager.leaveGame(lobbyname, socket.data.userId);
            socket.leave(socket.data.gameId);
            io.to(socket.data.gameId).emit('player-joined', {
                gameId: game.gameID,
                lobbyName: lobbyname,
                playerOne: playerOneUsername,
                playerTwo: '-',
                status: 'waiting'
            });
        });

        socket.on('disconnect', () => {
            manager.unregisterSocket(socket.data.userId);
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}
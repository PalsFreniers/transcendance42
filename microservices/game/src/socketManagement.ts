import { Server } from "socket.io";
import { GameManager } from "./gameManager.js";
import { verifTokenSocket } from "./index.js";
import db from './dbSqlite/db.js';
import { GameAI } from "./gameAI.js";
import { TournamentManager } from "./tournamentManager.js";
import { Paddle } from "./gameObjects/Paddle.js";

const manager = GameManager.getInstance();
const TmManager = TournamentManager.getInstance();

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
                const gameRow = db.prepare(`
                    SELECT lobby_name, status, player_one_id, player_two_id
                    FROM games WHERE id = ?`
                ).get(game.gameID) as {lobby_name: string, status: string, player_one_id: number, player_two_id: number};
                if (!gameRow)
                    return;
                const playerOneName = manager.getUsernameFromSocket(
                    manager.getSocketId(gameRow.player_one_id)!,
                    io
                ) || "Unknown";

                const playerTwoName = manager.getUsernameFromSocket(
                    manager.getSocketId(gameRow.player_two_id)!,
                    io
                ) || "-";
                socket.emit("lobby-info", {
                    gameId: game.gameID,
                    lobbyName: gameRow.lobby_name,
                    playerOne: playerOneName,
                    playerTwo: playerTwoName,
                    status: gameRow.status,
                });
                if (gameRow.status === "playing") {
                    socket.emit("in-game");
                }

            } else {
                socket.data.gameId = -1;
            }

            console.log(`User ${socket.data.userId} registered with socket ${socket.id}`);
        });

        socket.on('create-room', ({ gameId, lobbyName, ia, local }) => {
            try {
                const userName = socket.data.userName;
                if (manager.createLobby(lobbyName, gameId))
                    throw new Error(`Couldn't create lobby with name ${lobbyName}`);
                if (manager.joinLobby(lobbyName, socket.data.userId))
                    throw new Error(`Couldn't join lobby with name ${lobbyName}`);

                manager.findGame(lobbyName)!.on("game-end",
                    ({ game, players }) => {
                        const score: number[] = Array.from(game.score);
                        const [p1, p2] = players;
                        io.to(p1).emit("game-end", {
                            name: game.name,
                            msg: score![0] > score![1] ? "You win" : "You loose",
                            score: [score![0], score![1]]
                        });
                        if (p2 !== "-1" || p2 !== "-2")
                            io.to(p2).emit("game-end", {
                                name: game.name,
                                msg: score![1] > score![0] ? "You win" : "You loose",
                                score: [score![1], score![0]]
                            });
                    }).on("game-state", (state) => {
                        io.to(`game-${gameId}`).emit("game-state", state)
                    }).on("paddle-reflect", ({name, x, y}) => {
                        io.to(`game-${gameId}`).emit("paddle-reflect", {name, x, y})
                    }).on("wall-reflect", ({name, x, y}) => {
                        io.to(`game-${gameId}`).emit("wall-reflect", {name, x, y})
                    });

                socket.data.lobbyName = lobbyName;
                socket.data.gameId = `game-${gameId}`;

                socket.join(socket.data.gameId);
                if (ia) {
                    new GameAI(lobbyName, io);
                    socket.emit('room-created', {
                        gameId,
                        lobbyName,
                        userName,
                        playerTwo: 'ia',
                        status: 'ready'
                    });
                }
                else if (local) {
                    const errno = manager.joinLobby(lobbyName, -1);
                    if (errno)
                        throw new Error(`Couldn't make the second player join lobby with name ${lobbyName}: ${errno}`);
                    socket.emit('room-created', {
                        gameId,
                        lobbyName,
                        userName,
                        playerTwo: local,
                        status: 'ready'
                    });
                    manager.findGame(lobbyName)!.localPlayer = local;
                }
                else {
                    socket.emit('room-created', {
                        gameId,
                        lobbyName,
                        userName,
                        playerTwo: null,
                        status: 'waiting'
                    });
                }
                console.log(`User ${socket.data.userId} created and joined room ${socket.data.gameId}`);
            } catch (err) {
                console.error('create-room error:', err);
                socket.emit('error', err);
            }
        });

        socket.on('create-tournament', ({ lobbyName }) => {
            try {

                TmManager.createTournament(lobbyName, 8, io);
                const errno = TmManager.joinTournament(lobbyName, [socket.data.playerId, socket.data.socketId]);
                if (errno)
                    throw new Error(`joinTournament(tournamentName, p): ${errno}`);
                socket.data.lobbyName = lobbyName;
                TmManager.getTournament(lobbyName)!.on("game-start", ({ round, name, game }) => {
                    console.log(`${name}: ${round[0][0]} vs ${round[1][0]}`)
                }).on("won", ({ t, result }) => { // We can chain event listener for better code
                    console.log(`${result[0][0]} won against ${result[1][0]}`);
                }).on("lose", ({ t, result }) => {
                    console.log(`${result[1][0]} lost against ${result[0][0]}`);
                }).on("elimination", ({ t, result }) => {
                    console.log(`${result[1][0]} is eliminated and is ${t.remainingPlayers.length}th`);
                });
            } catch (e) {
                console.error(e);
                return;
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
                const errno = manager.startGame(lobbyName, socket.data.gameId, io, socket.handshake.auth.token);
                if (errno)
                    throw new Error(`Failed to start game: ${errno}`);
                db.prepare(`UPDATE games SET status = 'playing' WHERE lobby_name = ?`).run(lobbyName);
                console.log(`Game started for lobby ${lobbyName}`);
            } catch (err) {
                console.error("start-game error:", err);
                socket.emit("error", err);
            }
        });

        socket.on('start-tournament', () => {
            try {
                const lobbyName = socket.data.lobbyName;
                TmManager.startTournament(lobbyName, (t) => {
                    console.log(t.leaderboard);
                }, socket.handshake.auth.token);
            }
            catch (err) {
                console.error(err);
                return;
            }
        })

        socket.on('input', ({ key, action, localPlayer }) => { // trueKey
            const playerId = socket.data.userId;
            if (!playerId)
                return;
            const game = manager.findGame(playerId.toString());
            if (!game)
                return console.warn(`No active game for player ${playerId}`);
            if (game.state !== 'running')
                return;
            let paddle: Paddle | null = game.getPaddle(-1);
            if (!localPlayer || !paddle)
                paddle = game.getPaddle(playerId)!;
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
            manager.leaveGame(lobbyname, socket.data.userId, socket.handshake.auth.token);
            socket.leave(socket.data.gameId);
            const state = manager.getGameInfo(lobbyname, io);
            if (!state)
                return;
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
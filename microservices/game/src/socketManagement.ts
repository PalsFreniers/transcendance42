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
                        const gameTm = TmManager.isPlayerRegistered(socket.data.userId as number);
                        const game = manager.findGame(socket.data.userId?.toString());
                        if (gameTm){
                                const p = gameTm._players.find((p) => {
                                        return p[0] == socket.data.userId;
                                });
                                if(p) {
                                        p[1] = socket.id;
                                        socket.data.lobbyName = gameTm.name;
                                        socket.emit("lobby-info", {
                                                gameId: 'Tournament',
                                                lobbyName: 'Tournament ' + gameTm.name,
                                                playerOne: socket.data.userName,
                                                playerTwo: '-',
                                                status: 'waiting',
                                        });
                                }
                        }
                        if (game) {
                                socket.data.gameId = `game-${game.gameID}`;
                                const gameRow = db.prepare(`SELECT lobby_name, status, player_one_id, player_two_id FROM games WHERE id = ?`)
                                .get(game.gameID) as { lobby_name: string, status: string, player_one_id: number, player_two_id: number };
                                if (!gameRow)
                                        return;
                                socket.data.lobbyName = gameRow.lobby_name;
                                const playerOneName = manager.getUsernameFromSocket(
                                        manager.getSocketId(gameRow.player_one_id)!,
                                        io
                                ) || "Unknown";
                                let playerTwoName = manager.getUsernameFromSocket(
                                        manager.getSocketId(gameRow.player_two_id)!,
                                        io
                                ) || "-";
                                if (manager.getGameInfo(gameRow.lobby_name, io)!.playerTwoID == -2) {
                                        playerTwoName = 'ia';
                                }
                                if (manager.getGameInfo(gameRow.lobby_name, io)!.playerTwoID == -1)
                                        playerTwoName = manager.findGame(gameRow.lobby_name)!.localPlayer || '';
                                socket.emit("lobby-info", {
                                        gameId: game.gameID,
                                        lobbyName: gameRow.lobby_name,
                                        playerOne: playerOneName,
                                        playerTwo: playerTwoName,
                                        status: gameRow.status,
                                });
                                socket.join(socket.data.gameId);
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
                                if (!local && manager.joinLobby(lobbyName, socket.data.userId))
                                        throw new Error(`Couldn't join lobby with name ${lobbyName}`);
                                socket.data.gameId = `game-${gameId}`;
                                manager.findGame(lobbyName)!.on("game-end", ({ game, players }) => {
                                        const score: number[] = Array.from(game.score);
                                        io.to(socket.data.gameId).emit("game-end", {
                                                name: game.name,
                                                player1: manager.getUsernameFromSocket(players[0], io),
                                                player2: manager.getUsernameFromSocket(players[1], io),
                                                score: [score![0], score![1]],
                                        });
                                }).on("game-state", (state) => {
                                        io.to(`game-${gameId}`).emit("game-state", state)
                                }).on("paddle-reflect", ({ballPos, ballDir}) => {
                                        io.to(`game-${gameId}`).emit("paddle-reflect", {ballPos, ballDir})
                                }).on("wall-reflect", ({ballPos, ballDir}) => {
                                        io.to(`game-${gameId}`).emit("wall-reflect", {ballPos, ballDir})
                                });
                                socket.data.lobbyName = lobbyName;
                                socket.join(socket.data.gameId);
                                if (ia) {
                                        new GameAI(lobbyName, io);
                                        db.prepare(`UPDATE games SET status = 'ready' WHERE id = ?`).run(gameId);
                                        socket.emit('room-created', {
                                                gameId,
                                                lobbyName,
                                                userName,
                                                playerTwo: 'ia',
                                                status: 'ready'
                                        });
                                }
                                else if (local) {
                                        /*let errno =*/ manager.joinLobby(lobbyName, -1);
                                        // if (errno)
                                        //         throw new Error(`Couldn't make the second player join lobby with name ${lobbyName}: ${errno}`);
                                        /*errno =*/ manager.joinLobby(lobbyName, socket.data.userId);
                                        // if (errno)
                                        //         throw new Error(`Couldn't make the first player join lobby with name ${lobbyName}: ${errno}`);
                                        db.prepare(`UPDATE games SET status = 'ready' WHERE id = ?`).run(gameId);
                                        socket.emit('room-created', {
                                                gameId,
                                                lobbyName,
                                                userName,
                                                playerTwo: local,
                                                status: 'ready'
                                        });
                                        manager.findGame(lobbyName)!.localPlayer = lobbyName;
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
                                console.log(`${socket.data.userId, socket.id}`);
                                const errno = TmManager.joinTournament(lobbyName, [socket.data.userId, socket.id]);
                                if (errno)
                                        throw new Error(`joinTournament(tournamentName, p): ${errno}`);
                                socket.data.lobbyName = lobbyName;
                                console.log(`${lobbyName} was joined`);
                                TmManager.getTournament(lobbyName)!.on("game-start", ({ round, name, game }) => {
                                        console.log(`${name}: ${round[0][0]} vs ${round[1][0]}`)
                                }).on("won", ({ t, result }) => { // We can chain event listener for better code
                                        if(result[0][1] !== (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).id) return;
                                        let Msg = "you won! Go in the winner bracket";
                                        if(result[4]) {
                                                Msg = "you won! You won the tournament";
                                        }
                                        (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).emit("game-end", {
                                                name: result[2].name,
                                                player1: manager.getUsernameFromSocket(result[0][1], io),
                                                player2: manager.getUsernameFromSocket(result[1][1], io),
                                                score: [result[3][0], result[3][1]],
                                                tMsg: Msg,
                                        });
                                }).on("lose", ({ t, result }) => {
                                        if(result[1][1] !== (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).id) return;
                                        (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).emit("game-end", {
                                                name: result[2].name,
                                                player1: manager.getUsernameFromSocket(result[0][1], io),
                                                player2: manager.getUsernameFromSocket(result[1][1], io),
                                                score: [result[3][0], result[3][1]],
                                                tMsg: "you lost! Go in the loser bracket",
                                        });
                                }).on("elimination", ({ t, result }) => {
                                        if(result[1][1] !== (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).id) return;
                                        (io.sockets.sockets as any).get(t._players.find((p) => p[0] == socket.data.userId)[1]).emit("game-end", {
                                                name: result[2].name,
                                                player1: manager.getUsernameFromSocket(result[0][1], io),
                                                player2: manager.getUsernameFromSocket(result[1][1], io),
                                                score: [result[3][0], result[3][1]],
                                                tMsg: `you lost! You have been eliminated by ${manager.getUsernameFromSocket(result[0][1], io)}`,
                                        });
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
                                db.prepare(`UPDATE games SET status = 'ready' WHERE id = ?`).run(gameId);
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
                                db.prepare(`UPDATE games SET status = 'playing', start_time = ? WHERE lobby_name = ?`).run(Date.now(), lobbyName);
                                console.log(`Game started for lobby ${lobbyName}`);
                        } catch (err) {
                                console.error("start-game error:", err);
                                socket.emit("error", err);
                        }
                });

                socket.on('tournament-start', () => {
                        try {
                                const lobbyName = socket.data.lobbyName;
                                console.log(`${lobbyName}`);
                                const errno = TmManager.startTournament(lobbyName, (t) => {
                                        console.log(t.leaderboard);
                                        for (const player of t.leaderboard) {
                                                const errno = TmManager.leaveTournament(lobbyName, player);
                                                console.log(player[0], ": ", errno);
                                        }
                                        const errno = TmManager.deleteTournament(lobbyName);
                                        console.log("errno: ", errno);
                                }, socket.handshake.auth.token);
                                if (errno)
                                        throw new Error(`Failed to start tournament ${errno}`);
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
                        socket.data.gameId = `game-${game.gameID}`;
                        socket.data.lobbyName = lobbyname;
                });

                socket.on('left-game', ({ lobbyname }) => {
                        const game = manager.findGame(lobbyname);
                        if (!game)
                                return;
                        console.log(`you left the room game-${game.gameID}`);
                        manager.leaveGame(lobbyname, socket.data.userId, socket.handshake.auth.token);
                        socket.leave(socket.data.gameId);
                        const gameInfo = manager.getGameInfo(lobbyname, io);
                        if (!gameInfo)
                                return;
                        const playerOneUsername = manager.getUsernameFromSocket(manager.getSocketId(gameInfo.playerOneID!)!, io);
                        io.to(socket.data.gameId).emit('player-joined', {
                                gameId: game.gameID,
                                lobbyName: lobbyname,
                                playerOne: playerOneUsername,
                                playerTwo: '-',
                                status: 'waiting'
                        });
                });

                socket.on('ff', () => {
                        const playerId = socket.data.userId;
                        if (!playerId)
                                return;
                        const name = socket.data.lobbyName;
                        if (!name)
                                return console.warn(`No active game for player ${playerId}`);
                        const gameInfo = manager.getGameInfo2(name);
                        if(!gameInfo)
                                return;
                        if(gameInfo.p1 !== playerId && gameInfo.p2 !== playerId) {
                                socket.leave(socket.data.gameId);
                                socket.emit("spec-out");
                                return;
                        }
                        if (gameInfo.game.state !== 'running')
                                return;
                        manager.forfeit(name, playerId);
                });

                socket.on('disconnect', () => {
                        manager.unregisterSocket(socket.data.userId);
                        console.log(`Socket disconnected: ${socket.id}`);
                });
        });
}

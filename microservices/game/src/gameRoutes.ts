// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import { GameManager } from './gameManager';
import db from './dbSqlite/db';
import { createGameLobby, GameRecord } from './gameModel';
import { io } from './index';

export async function createRoom(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/create-game', async (req, reply) => {
        try {
            let errno = 0;
            const { userId, username } = req.user as { userId: number, username: string };
            const { lobbyName } = req.body as { lobbyName: string };
            if (!lobbyName)
                return reply.status(400).send({ error: 'lobbyName is required' });
            errno = manager.createLobby(lobbyName);
            if (errno)
                return reply.status(400).send({ error: `lobby ${lobbyName} is already used` });
            errno = manager.joinLobby(lobbyName, String(userId))
            if (errno)
                return reply.status(400).send(
                    { error: (errno === 1 ? `lobby ${lobbyName} does not exist`
                            :(errno === 2 ? `player ${username} is already in game/not found`
                            : `lobby ${lobbyName} is full`)) });
            const gameId = createGameLobby({
                playerOne: userId,
                playerTwo: null,
                lobbyName: lobbyName,
                finalScore: '0-0',
                status: 'waiting',
                gameDate: new Date().toISOString(),
            });
            const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRecord;
            //const socketId = manager.getSocketId(user.userId); // ? manager doesnt handle sockets
            const socket = socketId ? io.sockets.sockets.get(socketId) : null;
            if (socket && socketId) {
                socket.join(`game-${gameId}`);
                io.to(socketId).socketsJoin(`game-${gameId}`);
                console.log(`User ${userId} joined game room game-${gameId}`);
            } else {
                console.warn(`No socket found for user ${userId}`);
            }
            return reply.send({
                success: true,
                gameId,
                lobbyName,
                playerOne: username,
                playerTwo: null,
                status: game.status
            });
        } catch (err) {
            console.error("create-game error:", err);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

export async function awaitForOpponent(app: FastifyInstance) {
    app.post('/api/game/find-lobbies', async (_req, reply) => {
        const lobbies = db.prepare(`SELECT * FROM games WHERE player_two_id IS NULL`).all();
        return reply.send({ success: true, lobbies });
    });
}

export async function joinLobby(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/join-lobby', async (req, reply) => {
        const user = req.user as { userId: number, username: string };
        const { lobbyName, gameId } = req.body as { lobbyName: string, gameId: number };
        let errno = manager.joinLobby(lobbyName, String(user.userId))
        if (errno)
            return reply.status(400).send(
                { error: (errno === 1 ? `lobby ${lobbyName} does not exist`
                        :(errno === 2 ? `player ${user.username} is already in game/not found`
                            : `lobby ${lobbyName} is full`)) });
        const lobby = db.prepare(`SELECT player_one_id, lobby_name FROM games WHERE id = ?`).get(gameId) as {
            player_one_id: number;
            lobby_name: string;
        };
        if (!lobby)
            return reply.status(404).send({ error: 'Lobby not found' });
        const playerOneId = lobby.player_one_id;
        db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(user.userId, gameId);
        // const ok = manager.registerGame(playerOneId.toString(), user.userId.toString(), gameId);
        // if (!ok)
        //     return reply.status(409).send({ success: false, message: 'Players already in a game' });
        // Emit socket event to backend-managed sockets
        io.to(`game-${gameId}`).emit('player-joined', {
            roomId: `game-${gameId}`,
            lobbyName: lobby.lobby_name,
            playerOne: playerOneId,
            playerTwo: user.userId,
            status: 'ready'
        });
        return reply.send({ success: true, message: 'Joined and game registered', gameId });
    });
}

export async function startGame(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/start-game', async (req, reply) => {
        const { lobbyName, gameId, playerOneId, playerTwoId } = req.body as {
            lobbyName: string;
            gameId: number;
            playerOneId: number;
            playerTwoId: number;
        };
        const errno = manager.startGame(lobbyName);
        if (errno)
            reply.status(400).send({
                error: (errno === 1 ? `lobby ${lobbyName} not found` : `lobby ${lobbyName} not full`)
            });
        db.prepare(`UPDATE games SET status = 'playing', start_time = CURRENT_TIMESTAMP WHERE id = ?`).run(gameId);
        return reply.send({ success: true });
    });
}

export async function forfeit(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/ff', async (req, reply) => {
        const { lobbyName, gameID, playerID, username } = req.body as {
            lobbyName: string;
            gameID: number;
            playerID: number;
            username: string;
        }
        const errno = manager.forfeit(lobbyName, String(playerID));
        if (errno)
            reply.status(400).send({
                error: (errno === 1 ? `lobby ${lobbyName} not found` : `player ${username} is not in game`)
            });
        db.prepare(`UPDATE games SET finalScore = ?, status = 'finished', endTime = CURRENT_TIMESTAMP WHERE id = ?`).run(manager.getScore(lobbyName), gameID);
        return reply.send({ success: true });
    });
}

export async function stopGame(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/stop-game', async (req, reply) => {
        const { lobbyName, gameID } = req.body as {
            lobbyName: string;
            gameID: number;
        }
        const errno = manager.stopGame(lobbyName);
        if (errno)
            reply.status(400).send({ error: `lobby ${lobbyName} not found` });
        db.prepare(`UPDATE games SET finalScore = ?, status = 'finished', endTime = CURRENT_TIMESTAMP WHERE id = ?`).run(manager.getScore(lobbyName), gameID);
        return reply.send({ success: true });
    });
}

export async function getScore(app: FastifyInstance, manager: GameManager) {
    app.get('/api/game/get-score', async (req, reply) => {
        const { lobbyName, gameID, playerID } = req.body as {
            lobbyName: string;
            gameID: number;
            playerID: number;
        }
        const score = manager.getScore(lobbyName);
        if (score === null)
            reply.status(400).send({ error: `error while getting score` }); // sorry for poor error message, im tired af
        db.prepare(`UPDATE games SET finalScore = ?, status = 'finished', endTime = CURRENT_TIMESTAMP WHERE id = ?`).run(manager.getScore(lobbyName), gameID);
        return reply.send({ success: true });
    });
}

export async function deleteGame(app: FastifyInstance, manager: GameManager) {
    app.get('/api/game/delete-game', async (req, reply) => {
        const { lobbyName } = req.body as {
            lobbyName: string;
            gameID: number;
            playerID: number;
        }
        const errno = manager.deleteGame(lobbyName);
        if (errno)
            reply.status(400).send({ error: (errno === 1 ? `lobby ${lobbyName} not found` : `game is not finished`) });
        return reply.send({ success: true });
    });
}

export async function historyGame(app: FastifyInstance) {
    app.post('/api/game/history', async (req) => {
        const user = req.user as { userId: number };
        const history = db.prepare(`
            SELECT * FROM games
            WHERE player_one_id = ? OR player_two_id = ?
            ORDER BY date DESC
        `).all(user.userId, user.userId);
        return { success: true, history };
    });
}

export async function postGame(app: FastifyInstance) {
    app.post('/api/game/end-game', async (req) => {
        const { gameId, finalScore } = req.body as { gameId: number; finalScore: string };
        db.prepare(`
            UPDATE games
            SET game_score = ?, status = 'finished', end_time = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(finalScore, gameId);
        return { success: true };
    });
}

export async function handleInput(app: FastifyInstance, manager: GameManager) {
    app.post('/api/game/input', async (req, reply) => {
        const { playerID, key, action } = req.body as {
            playerID: string;
            key: 'up' | 'down';
            action: 'keydown' | 'keyup';
        };
        const game = manager.findGame(playerID);
        if (game === null)
            return reply.status(404).send({ success: false, message: 'Game not found' });
        const paddle = game.getPaddle(Number(playerID))!;
        let info = paddle.getState();
        info[key === 'up' ? 0 : 1] = (action == 'keyup')
        return reply.send({ success: true });
    });
}

// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import { GameManager } from './gameManager.js';
import db from './dbSqlite/db.js';
import { createGameLobby, GameRecord } from './gameModel.js';

export async function createRoom(app: FastifyInstance, manager: GameManager) {
    app.post("/api/game/create-game", async (req, reply) => {
        const user = req.user as { userId: number; username: string };
        const { lobbyName } = req.body as { lobbyName: string };
        const gameId = await createGameLobby({
            playerOne: user.userId,
            playerTwo: null,
            lobbyName,
            finalScore: "0-0",
            status: "waiting",
            gameDate: new Date().toISOString(),
        });

        // Return all info including status
        return reply.send({ 
            success: true, 
            username: user.username, 
            gameId, 
            lobbyName,
            status: "waiting" 
        });
    });
}


export async function awaitForOpponent(app: FastifyInstance) {
    app.post('/api/game/find-lobbies', async (_req, reply) => {
        const lobbies = db.prepare(`SELECT * FROM games WHERE player_two_id IS NULL`).all();
        return reply.send({ success: true, lobbies });
    });
}

export async function joinLobby(app: FastifyInstance) {
    app.post('/api/game/join-lobby', async (req, reply) => {
        const user = req.user as { userId: number, username: string };
        const { gameId } = req.body as { gameId: number };

        const lobby = db.prepare(`SELECT player_one_id, player_two_id, lobby_name FROM games WHERE id = ?`)
            .get(gameId) as { player_one_id: number; player_two_id: number | null; lobby_name: string };

        if (!lobby)
            return reply.status(404).send({ error: 'Lobby not found' });
        if (lobby.player_two_id)
            return reply.status(400).send({ error: 'Lobby is full' });

        // Update DB only
        db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(user.userId, gameId);

        return reply.send({ success: true, message: 'Joined lobby', gameId, lobbyName: lobby.lobby_name });
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
        const errno = manager.forfeit(lobbyName, playerID);
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
        const finalScore = `${score![0]}-${score![1]}`; // add this etap because db want string value not [number][number]
        db.prepare(`UPDATE games SET finalScore = ?, status = 'finished', endTime = CURRENT_TIMESTAMP WHERE id = ?`).run(finalScore, gameID);
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
/*
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
        info[key === 'up' ? 0 : 1] = (action === 'keydown');
        return reply.send({ success: true });
    });
}*/

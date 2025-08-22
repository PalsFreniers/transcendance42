import { FastifyInstance } from 'fastify';
import { createGameLobby, Game } from './gameModel.js';
import db from './dbSqlite/db.js';

export async function createRoom(app: FastifyInstance) {
    app.post('/create-game', async (request, reply) => {
        const user = request.user as { id: number };
        const { lobbyName, opponentId } = request.body as {
            lobbyName: string;
            opponentId: number;
        };
        // Prepare game object according to your interface
        const newGame: Game = {
            playerOne: user.id,
            playerTwo: opponentId,
            lobbyName,
            finalScore: '0-0',
            status: 'waiting',
            gameDate: new Date().toISOString(),
        };
        // Use createGameLobby to insert and get the ID
        const gameId = createGameLobby(newGame);
        return {
            success: true,
            gameId,
        };
    });
}

export async function awaitforOpponent(app: FastifyInstance) {
    app.post('/find-lobbies', async (request, reply) => {
        const stmt = db.prepare(`
      SELECT * FROM games WHERE player_two_id IS NULL
    `);
        const openLobbies = stmt.all();
        return {
            success: true,
            lobbies: openLobbies,
        };
    });
}

export async function joinLobby(app: FastifyInstance) {
    app.post('/join-lobby', async (request, reply) => {
        const { gameId } = request.body as { gameId: number };
        const user = request.user as { id: number };
        const update = db.prepare(`
      UPDATE games SET player_two_id = ? WHERE id = ?
    `);
        update.run(user.id, gameId);
        return {
            success: true,
            message: 'Successfully joined lobby',
        };
    });
}

export async function inGame(app: FastifyInstance) {
    app.post('/in-game', async (request, reply) => {
        const { gameId } = request.body as { gameId: number };
        const update = db.prepare(`
    UPDATE games SET status = 'playing', start_time = CURRENT_TIMESTAMP WHERE id = ?
  `);
        update.run(gameId);
        return { success: true };
    });
}

export async function historyGame(app: FastifyInstance) {
    app.post('/history', async (request, reply) => {
        const user = request.user as { id: number };
        const stmt = db.prepare(`
      SELECT * FROM games
      WHERE player_one_id = ? OR player_two_id = ?
      ORDER BY date DESC
    `);
        const history = stmt.all(user.id, user.id);
        return {
            success: true,
            history,
        };
    });
}

export async function postGame(app: FastifyInstance) {
    app.post('/end-game', async (request, reply) => {
        const { gameId, finalScore } = request.body as { gameId: number; finalScore: string };
        const update = db.prepare(`
    UPDATE games
    SET game_score = ?, status = 'finished', end_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
        update.run(finalScore, gameId);
        return { success: true };
    });
}
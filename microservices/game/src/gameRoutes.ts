import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db';


export async function createRoom(app: FastifyInstance) {
  app.post('/create-game', { preHandler: app.verifJWTToken }, async (request, reply) => {
    const user = request.user as { id: number };
    const { lobbyName, opponentId } = request.body as {
      lobbyName: string;
      opponentId: number;
    };
    const playerOne = user.id;
    const playerTwo = opponentId;
    // Save minimal lobby data for now
    const stmt = db.prepare(`
      INSERT INTO games (lobby_name, player_one_id, player_two_id, game_score)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(lobbyName, playerOne, playerTwo, '0-0');
    return {
      success: true,
      gameId: result.lastInsertRowid, // GAMEID NEED FOR IDENTIFIES THE ROOM
    };
  });
}

export async function awaitforOpponent(app:FastifyInstance) {
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

export async function joinLobby(app:FastifyInstance) {
    app.post('/join-lobby', { preHandler: app.verifJWTToken }, async (request, reply) => {
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

export async function inGame(app:FastifyInstance) {
    app.post('/in-game', async (request, reply) => {
    const { gameId } = request.body;
    const update = db.prepare(`
      UPDATE games SET status = 'playing', start_time = CURRENT_TIMESTAMP WHERE id = ?
    `);
    update.run(gameId);
    return { success: true };
  });
}

export async function historyGame(app:FastifyInstance) {
    app.post('/history', { preHandler: app.verifJWTToken }, async (request, reply) => {
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

export async function postGame(app:FastifyInstance) {
    app.post('/end-game', async (request, reply) => {
    const { gameId, finalScore } = request.body;

    const update = db.prepare(`
      UPDATE games
      SET game_score = ?, status = 'finished', end_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    update.run(finalScore, gameId);
    return { success: true };
  });
}
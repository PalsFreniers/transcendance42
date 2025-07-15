import { FastifyInstance } from 'fastify';
import { GameManager } from './gameManager.js';
import db from './dbSqlite/db.js';
import { createGameLobby } from './gameModel.js';

export async function createRoom(app: FastifyInstance, manager: GameManager) {
  app.post('/api/game/create-game', async (req, reply) => {
    const user = req.user as { userId: number };
    const { lobbyName, opponentId } = req.body as { lobbyName: string; opponentId: number };
    const gameId = createGameLobby({
      playerOne: user.userId,
      playerTwo: opponentId,
      lobbyName: lobbyName,
      finalScore: '0-0',
      status: 'waiting',
      gameDate: new Date().toISOString(),
    });
    const ok = manager.registerGame(user.userId.toString(), opponentId.toString());
    if (!ok) {
      return reply.status(409).send({ success: false, message: 'Players already in a game' });
    }
    return { success: true, gameId };
  });
}

export async function awaitForOpponent(app: FastifyInstance) {
  app.post('/api/game/find-lobbies', async () => {
    const lobbies = db.prepare(`SELECT * FROM games WHERE player_two_id IS NULL`).all();
    return { success: true, lobbies };
  });
}

export async function joinLobby(app: FastifyInstance) {
  app.post('/api/game/join-lobby', async (req, reply) => {
    const user = req.user as { userId: number };
    const { gameId } = req.body as { gameId: number };
    db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(user.userId, gameId);
    return { success: true, message: 'Joined lobby' };
  });
}

export async function inGame(app: FastifyInstance, manager: GameManager) {
  app.post('/api/game/in-game', async (req, reply) => {
    const { gameId, playerOneId, playerTwoId } = req.body as { gameId: number; playerOneId: number; playerTwoId: number };
    db.prepare(`UPDATE games SET status = 'playing', start_time = CURRENT_TIMESTAMP WHERE id = ?`).run(gameId);
    const finalScore = await manager.startGame(playerOneId.toString(), playerTwoId.toString());
    return { success: true, finalScore };
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
    const { socketId, key, action } = req.body as { socketId: string; key: string; action: 'keydown' | 'keyup' };
    const game = manager.getGameInfo(socketId);
    if (!game) return reply.status(404).send({ success: false, message: 'Not in a game' });
    game.handleClientInput(socketId, key, action);
    return reply.send({ success: true });
  });
}

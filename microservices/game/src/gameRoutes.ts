// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import { GameManager } from './gameManager.js';
import { createRoomLogic } from './gameService.js';
import { joinLobbyLogic } from './gameService.js';
import db from './dbSqlite/db.js';
import { io } from './index.js';

export async function createRoom(app: FastifyInstance, manager: GameManager) {
  app.post('/api/game/create-game', async (req, reply) => {
    try {
      const user = req.user as { userId: number, username: string };
      const { lobbyName } = req.body as { lobbyName: string };

      const gameData = createRoomLogic(manager, user.userId, user.username, lobbyName);

      // Notify only player 1
      const socketId = manager.getSocketId(user.userId);
      const socket = manager.getSocket(user.userId);
      if (socket)
        socket.join(`game-${gameData.gameId}`);
      if (socketId)
        io.to(socketId).emit('room-created', gameData);
      return reply.send({ success: true, ...gameData });
    } catch (err) {
      console.error("create-game error:", err);
      return reply.status(500).send({ error: err });
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
    try {
      const user = req.user as { userId: number, username: string };
      const { gameId, playerOneName } = req.body as { gameId: number, playerOneName: string };

      const gameData = joinLobbyLogic(manager, user.userId, user.username, playerOneName, gameId);

      const socket = manager.getSocket(user.userId);
      if (socket) {
        socket.join(`game-${gameId}`);
      }
      // Emit to all sockets in the game room
      io.to(`game-${gameId}`).emit('player-joined', gameData);
      return reply.send({ success: true, ...gameData });
    } catch (err) {
      console.error('join-lobby error:', err);
      return reply.status(400).send({ error: err });
    }
  });
}

export async function inGame(app: FastifyInstance, manager: GameManager) {
  app.post('/api/game/in-game', async (req, reply) => {
    const { gameId, playerOneId, playerTwoId } = req.body as {
      gameId: number;
      playerOneId: number;
      playerTwoId: number;
    };
    db.prepare(`UPDATE games SET status = 'playing', start_time = CURRENT_TIMESTAMP WHERE id = ?`).run(gameId);
    const finalScore = await manager.startGame(playerOneId.toString(), playerTwoId.toString());
    return reply.send({ success: true, finalScore });
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
    const { socketId, key, action } = req.body as {
      socketId: string;
      key: string;
      action: 'keydown' | 'keyup';
    };
    const userId = manager.getUserId(socketId);
    if (!userId) 
      return reply.status(404).send({ success: false, message: 'User not found' });
    const game = manager.getGameInfo(userId.toString());
    if (!game)
      return reply.status(404).send({ success: false, message: 'Not in a game' });
    game.handleClientInput(socketId, key, action);
    return reply.send({ success: true });
  });
}

// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import { GameManager } from './gameManager.js';
import db from './dbSqlite/db.js';
import { createGameLobby, GameRecord } from './gameModel.js';
import { io } from './index.js';

export async function createRoom(app: FastifyInstance, manager: GameManager) {
  app.post('/api/game/create-game', async (req, reply) => {
    try {
      const user = req.user as { userId: number, username: string };
      const { lobbyName } = req.body as { lobbyName: string };
      if (!lobbyName)
        return reply.status(400).send({ error: 'lobbyName is required' });
      const gameId = createGameLobby({
        playerOne: user.userId,
        playerTwo: null,
        lobbyName: lobbyName,
        finalScore: '0-0',
        status: 'waiting',
        gameDate: new Date().toISOString(),
      });
      const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRecord;
      const socketId = manager.getSocketId(user.userId);
      const socket = socketId ? io.sockets.sockets.get(socketId) : null;
      if (socket) {
        socket.join(`game-${gameId}`);
        io.to(socketId).socketsJoin(gameId);
        console.log(`User ${user.userId} joined game room game-${gameId}`);
      } else {
        console.warn(`No socket found for user ${user.userId}`);
      }
      return reply.send({
        success: true,
        gameId,
        lobbyName,
        playerOne: user.username,
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
    const user = req.user as { userId: number };
    const { gameId } = req.body as { gameId: number };
    const lobby = db.prepare(`SELECT player_one_id, lobby_name FROM games WHERE id = ?`).get(gameId) as {
      player_one_id: number;
      lobby_name: string;
    };
    if (!lobby)
      return reply.status(404).send({ error: 'Lobby not found' });
    const playerOneId = lobby.player_one_id;
    db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(user.userId, gameId);
    const ok = manager.registerGame(playerOneId.toString(), user.userId.toString(), gameId);
    if (!ok)
      return reply.status(409).send({ success: false, message: 'Players already in a game' });
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
    const game = manager.getGameInfo(socketId);
    if (!game)
      return reply.status(404).send({ success: false, message: 'Not in a game' });
    game.handleClientInput(socketId, key, action);
    return reply.send({ success: true });
  });
}

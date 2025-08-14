import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server } from "socket.io";
import {
    createRoom,
    inGame,
    awaitForOpponent,
    joinLobby,
    historyGame,
    postGame,
    handleInput, startGame, forfeit, stopGame, getScore, deleteGame
} from './gameRoutes.js';
import { GameManager } from './gameManager.js';
import { createRoomLogic } from './gameService.js';
import { joinLobbyLogic } from './gameService.js';

dotenv.config();

//START FOR GAME SERVICES
const app = Fastify();

const PORT = process.env.GAME_PORT;

//REQUEST CORS
await app.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST'],
    origin: '*',
    credentials: true,
});

export const io = new Server(app.server, {
  path: '/pongSocket/',
  cors: {
    origin: 'http://localhost:5173', // ALL ORIGIN REQUEST ALLOWED
    credentials: true,
  },
    cors: {
        origin: "*",
    },
});

//SETUP FOR PONG GAME
const manager = new GameManager();

// TOKEN 
await app.register(jwt , {secret: process.env.JWT_SECRET!});

io.use(async (socket, next) => {
  try {
    const tmp = await app.jwt.verify(socket.handshake.auth.token);
    // socket.decoded = tmp;
    console.log('verif passed !');
    next();
  }
  catch {
    console.log(`socket ${socket.id} can't connect !`);
    next(new Error('Authentication error'));
  }
});

// SOCKET LOGIC GAME
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register-socket', (userId: number) => {
    console.log(`User ${userId} registered with socket ${socket.id}`);
    manager.registerSocket(userId, socket.id);
  });

  socket.on('create-room', ({ userId, username, lobbyName }) => {
    try {
      const gameData = createRoomLogic(manager, userId, username, lobbyName);

      socket.join(`game-${gameData.gameId}`);
      socket.emit('room-created', gameData);
      console.log(`User ${userId} created and joined game-${gameData.gameId}`);
    } catch (err) {
      console.error('create-room error:', err);
      socket.emit('error', err);
    }
  });

  socket.on('join-room', ({ userId, username, hostUsername, gameId }) => {
    try {
      const gameData = joinLobbyLogic(manager, userId, username, hostUsername, gameId);

      socket.join(`game-${gameId}`);
      io.to(`game-${gameId}`).emit('player-joined', gameData);

      console.log(`User ${userId} joined room ${gameId}`);
    } catch (err) {
      console.error('join-room error:', err);
      socket.emit('error', err);
    }
  });
    socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('input', ({ gameId, playerId, key, action }) => {
        const game = manager.getGameInfo(playerId);
        if (game) {
            game.handleClientInput(playerId, key, action);
        } else {
            console.warn(`No active game found for player ${playerId}`);
        }
    });

  socket.on('disconnect', () => {
    console.log(`Socket pong disconnected: ${socket.id}`);
    manager.unregisterSocket(socket.id);
  });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        manager.unregisterSocket(socket.id);
    });
});

// HOOK
app.addHook('onRequest', async (request, reply) => {
    try {
        if (request.headers.authorization) {
            await request.jwtVerify();
        } else {
            return reply.status(401).send({ error: 'Unauthorized: No token provided' });
        }
    } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
});

//ROUTES
app.register(createRoom, manager);
app.register(awaitForOpponent);
app.register(joinLobby, manager)
app.register(startGame, manager);
app.register(forfeit, manager);
app.register(stopGame, manager);
app.register(getScore, manager);
app.register(deleteGame, manager);
app.register(historyGame);
app.register(handleInput, manager);

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
    if (err) throw err;
    console.log(`Game service running on port ${PORT}`);
});
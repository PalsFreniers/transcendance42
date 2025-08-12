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
  handleInput
} from './gameRoutes.js';
import { GameManager } from './gameManager.js';

dotenv.config();

//START FOR GAME SERVICES
const app = Fastify();

const PORT = process.env.GAME_PORT;

//REQUEST CORS
await app.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST'],
});

export const io = new Server(app.server, {
  path: '/pongSocket/',
  cors: {
    origin: 'http://localhost:5173', // ALL ORIGIN REQUEST ALLOWED
    credentials: true,
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
  console.log(`USER connected: ${socket.id} on Pong socket`);

  socket.on('register-socket', (userId: number) => {
    console.log(`User ${userId} registered with Pong socket ${socket.id}`);
    manager.registerSocket(userId, socket.id);
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
app.register(inGame, manager);
app.register(awaitForOpponent);
app.register(joinLobby, manager)
app.register(historyGame);
app.register(postGame);
app.register(handleInput, manager);

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game service running on port ${PORT}`);
});
import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server } from "socket.io";
import {
  createRoom,
  inGame,
  awaitforOpponent,
  joinLobby,
  historyGame,
  postGame
} from './gameRoutes.js';

dotenv.config();

//START FOR GAME SERVICES
const app = Fastify();

const PORT = process.env.GAME2_PORT;


await app.register(cors, {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST'],
});

export const io = new Server(app.server, {
  path: '/shifumiSocket/',
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// TOKEN 
app.register(jwt , {secret: process.env.JWT_SECRET!});

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

io.on('connection', (socket) => {
    console.log(`USER connected: ${socket.id} on Shifumi socket`);
  
    socket.on('register-socket', (userId: number) => {
      console.log(`User ${userId} registered with Shifumi socket ${socket.id}`);
    });
  
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
  
    socket.on('disconnect', () => {
      console.log(`Socket Shifumi disconnected: ${socket.id}`);
    });
  });

//ROUTES
app.register(createRoom);
app.register(inGame);
app.register(awaitforOpponent);
app.register(joinLobby)
app.register(historyGame);
app.register(postGame);

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

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game 2 service running on port ${PORT}`);
});
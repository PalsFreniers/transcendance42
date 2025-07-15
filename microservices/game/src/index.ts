import Fastify from 'fastify';
import dotenv from 'dotenv';
import jwt from '@fastify/jwt';
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

//START FOR GAME SERVICES
const app = Fastify();
//SETUP FOR PONG GAME
const manager = new GameManager();
dotenv.config();
const PORT = process.env.GAME_PORT;

// TOKEN 
app.register(jwt , {secret: process.env.JWT_SECRET!});

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
app.register(joinLobby)
app.register(historyGame);
app.register(postGame);
app.register(handleInput, manager);

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game service running on port ${PORT}`);
});
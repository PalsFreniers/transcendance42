import Fastify from 'fastify';
import dotenv from 'dotenv';
import jwt from '@fastify/jwt';
import {
  createRoom,
  inGame,
  awaitforOpponent,
  joinLobby,
  historyGame,
  postGame
} from './gameRoutes';

//START FOR GAME SERVICES
const app = Fastify();
dotenv.config();
const PORT = process.env.GAME_PORT;

// TOKEN 
app.register(jwt , {secret: process.env.JWT_SECRET!});

//ROUTES
app.register(createRoom, { prefix: 'api/game' });
app.register(inGame, { prefix: 'api/game' });
app.register(awaitforOpponent, {prefix: 'api/game' });
app.register(joinLobby, {prefix: 'api/game' })
app.register(historyGame, {prefix: 'api/game' });
app.register(postGame, { prefix: 'api/game' });

// HOOK
app.addHook('onRequest', async (request, reply) => {
  try {
    if (request.headers.authorization) {
      await request.jwtVerify();
    } else {
      reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
});

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game service running on port ${PORT}`);
});
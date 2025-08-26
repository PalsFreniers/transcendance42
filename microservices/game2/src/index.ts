import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server, Socket } from "socket.io";
import {
  inGame,
  awaitforOpponent,
  historyGame,
  postGame
} from './gameRoutes.js';
import { socketManagemente } from './socketManagement.js';

dotenv.config();


/* *
*
* faire attendre le joueur temps que son socket n'est pas co avant de
* faire en sorte qu'il puisse applier sur les boutons
* et faire en sorte qu'un user puisse etre dans une seule game et ne puisse pas
* rejoindre ca propre game
*
* */

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

export function verifTokenSocket(socket: Socket)
{
    try {
        const tmp = app.jwt.verify(socket.handshake.auth.token);
        return true ;
    } catch {
        // io.to(socket.id).emit("error", "Token expired or invalid");
        return false;
    }
}


// ajouter le socket management
socketManagemente(io);

//ROUTES
// app.register(createRoom);
app.register(inGame);
app.register(awaitforOpponent);
// app.register(joinLobby)
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
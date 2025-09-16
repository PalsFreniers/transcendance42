import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server, Socket } from "socket.io";
import {
    createRoom,
    awaitForOpponent,
    joinLobby,
    specGame
} from './gameRoutes.js';
import { socketManagement } from './socketManagement.js';

dotenv.config();

//START FOR GAME SERVICES
const app = Fastify();

const PORT = process.env.GAME_PORT;

//REQUEST CORS
await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
});

export const io = new Server(app.server, {
    path: '/pongSocket/',
    cors: {
        origin: true,
        credentials: true,
    }
});

// TOKEN 
await app.register(jwt, { secret: process.env.JWT_SECRET! });

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

socketManagement(io);

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
app.register(createRoom);
app.register(awaitForOpponent);
app.register(joinLobby);
app.register(specGame);

app.listen({ port: Number(PORT), host: `0.0.0.0` }, err => {
    if (err) throw err;
    console.log(`Game service running on port ${PORT}`);
});
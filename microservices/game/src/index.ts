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

dotenv.config();

//START FOR GAME SERVICES
const app = Fastify();

const PORT = process.env.GAME_PORT;

// REQUEST CORS
await app.register(cors, {
    origin: '*',
    credentials: true,
});

export const io = new Server(app.server, {
    cors: {
        origin: "*",
    },
});

//SETUP FOR PONG GAME
const manager = new GameManager();

// SOCKET LOGIC GAME
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('register-socket', (userId: number) => {
        console.log(`User ${userId} registered with socket ${socket.id}`);
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
        console.log(`Socket disconnected: ${socket.id}`);
        manager.unregisterSocket(socket.id);
    });
});


// TOKEN 
await app.register(jwt , {secret: process.env.JWT_SECRET!});

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
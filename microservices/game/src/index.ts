import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server } from "socket.io";
import db from './dbSqlite/db.js';
import {
    createRoom,
    // inGame,
    awaitForOpponent,
    joinLobby,
    historyGame,
    startGame,
    forfeit,
    stopGame,
    getScore,
    deleteGame
} from './gameRoutes.js';
import { GameManager } from './gameManager.js';
import { Game } from './game.js';
import { GameRecord } from './gameModel.js';

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
        origin: 'http://localhost:5173',
        credentials: true,
    }
});

//SETUP FOR PONG GAME
const manager = new GameManager();

// TOKEN 
await app.register(jwt, { secret: process.env.JWT_SECRET! });

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

    // Register socket with userId
    socket.on('register-socket', (userId: number) => {
        manager.registerSocket(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Create room (DB creation already done via API)
    socket.on('create-room', ({ userId, gameId, lobbyName, username }) => {
        try {
            manager.createLobby(lobbyName, gameId);
            manager.joinLobby(lobbyName, userId);
            socket.join(lobbyName);
            socket.emit('room-created', { gameId, lobbyName, username, playerTwo: null, status: 'waiting' });
            console.log(`User ${userId} joined in-memory game-${gameId}`);
        } catch (err) {
            console.error('create-room error:', err);
            socket.emit('error', err);
        }
    });

    // Join room (DB updated via API)
    socket.on('player-joined', ({ userId, gameId }) => {
    try {
        const lobbyName = `game-${gameId}`;
        const errno = manager.joinLobby(lobbyName, userId);
        if (errno) 
            throw new Error(`Failed to join lobby: ${errno}`);
        socket.join(lobbyName);
        // Get player info from DB
        const lobby = db.prepare(`SELECT player_one_id, player_two_id, lobby_name FROM games WHERE id = ?`).get(gameId) as { player_one_id: number; player_two_id: number | null; lobby_name: string };
        const playerOne = lobby.player_one_id;
        const playerTwo = lobby.player_two_id;

        io.to(lobbyName).emit('player-joined', {
            gameId,
            lobbyName,
            playerOne, // userId of player 1
            playerTwo, // userId of player 2
            status: 'ready', // update status when both players are in
        });
        console.log(`User ${userId} joined in-memory room ${gameId}`);
    } catch (err) {
        console.error('join-room error:', err);
        socket.emit('error', err);
    }
});


    // Player input
    socket.on('input', ({ playerId, key, action }) => {
        const game = manager.findGame(playerId);
        if (!game)
            return console.warn(`No active game for player ${playerId}`);
        const paddle = game.getPaddle(playerId)!;
        const state = paddle.getState();
        state[key === 'up' ? 0 : 1] = action === 'keyup';
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        manager.unregisterSocket(socket.id);
        console.log(`Socket disconnected: ${socket.id}`);
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

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
    if (err) throw err;
    console.log(`Game service running on port ${PORT}`);
});
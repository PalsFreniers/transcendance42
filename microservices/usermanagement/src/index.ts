import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import {
    auth,
    register,
    logOut
} from './authService.js';
import {
    friendList,
    profil,
    updateProfile,
    deleteProfile,
    friendAdd,
    friendDelete,
    addStatsInDB,
    getMessage,
    // friendSendMsg
} from './userRoutes.js';
import { startServer } from './userSocket.js';

dotenv.config();

const app = Fastify();

const PORT = process.env.USER_MANA_PORT;

//REQUEST CORS
await app.register(cors, {
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT'],
});

await app.register((multipart as any).default, {
    attachFieldsToBody: true
});

await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'), // dossier où tu enregistres les images
    prefix: '/uploads/',                       // URL publique
});

export const io = new Server(app.server, {
    path: '/chatSocket/',
    cors: {
        origin: true, // ALL ORIGIN REQUEST ALLOWED
        credentials: true,
    },
});

startServer(io);

//TOKEN
await app.register(jwt, { secret: process.env.JWT_SECRET! });

// Socket.io logic
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



// JWT auth hook
app.addHook('onRequest', async (request, reply) => {
    const url = request.raw.url || '';
    const publicRoutes = ['/api/user/login', '/api/user/register', '/api/user/verify-email', '/uploads/'];

    if (publicRoutes.some(route => url.startsWith(route))) return;

    try {
        if (request.headers.authorization) {
            await request.jwtVerify();
        } else {
            return reply.code(401).send({ error: 'Unauthor/userRoized: No token provided' });
        }
    } catch (err) {
        return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
});

// Register routes
app.register(register, { prefix: '/api/user' });
app.register(auth, { prefix: '/api/user' });
app.register(profil, { prefix: '/api/user' });
app.register(friendList, { prefix: '/api/user' });
app.register(updateProfile, { prefix: '/api/user' });
app.register(deleteProfile, { prefix: '/api/user' });
app.register(friendAdd, { prefix: '/api/user' });
app.register(friendDelete, { prefix: '/api/user' });
app.register(addStatsInDB, { prefix: '/api/user' });
app.register(logOut, { prefix: '/api/user' });
app.register(getMessage, { prefix: '/api/user' });
// app.register(friendSendMsg, { prefix: '/api/user' });

// Start Fastify server
app.listen({ port: Number(PORT), host: `0.0.0.0` }, (err,) => {
    if (err) {
        console.error(err);
    }
    console.log(`User service running on port ${PORT}`);
});

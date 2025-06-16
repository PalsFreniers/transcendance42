import Fastify from 'fastify';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import jwt from '@fastify/jwt';
import db from './dbSqlite';
import {
  auth,
  register,
} from './authService';
import {
  friendList,
  profil,
  updateProfile,
  deleteProfile,
  friendAdd,
  friendDelete,
  friendSendMsg
} from './userRoutes';

dotenv.config();
// START APP FOR USERMANAGEMENT
const app = Fastify();
// CREATE SERVER
const server = http.createServer(app.server);
// CREATE PATH DO SQLITE FOR STOCK DATA-USER
const PORT = process.env.USER_MANA_PORT;

// CREATE SOCKET.IO SERVER
const io = new Server(server, {
  cors: {
    origin: '*', // ALL ORIGIN REQUEST ALLOWED
  },
});

//SOCKET LOGIC
io.on('connection', (socket) => {
  console.log(`USER connected: ${socket.id}`);

  socket.on('register-socket', (userID: number) => {
    const stmt = db.prepare('UPDATE users SET socket = ?, is_online = 1 WHERE id = ?');
    stmt.run(socket.id, userID);
    console.log(`Socket ${socket.id} registered to user ${userID}`);
  });

  socket.on('disconnect', () => {
    const stmt = db.prepare('UPDATE users SET is_online = 0 WHERE socket = ?');
    stmt.run(socket.id);
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// ROUTES
app.register(jwt, { secret: process.env.JWT_SECRET! });
app.register(register, { prefix: '/api/user' });
app.register(auth, { prefix: '/api/user' });
app.register(profil, { prefix: '/api/user' });
app.register(friendList, { prefix: '/api/user' });
app.register(updateProfile, { prefix: '/api/user' });
app.register(deleteProfile, { prefix: '/api/user' });
app.register(friendAdd, { prefix: '/api/user' });
app.register(friendDelete, { prefix: '/api/user' });
app.register(friendSendMsg, { prefix: '/api/user' });

//HOOK REQUEST NEED AUTH
app.addHook('onRequest', async (request) => {
  if (request.headers.authorization) {
    await request.jwtVerify();
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`User service running on port ${PORT}`);
});


export default db;
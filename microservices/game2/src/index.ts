import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Server, Socket } from "socket.io";
import db from './dbSqlite/db.js';
import { playedCard } from "./gameObjects/gameBoard.js";
import {
  inGame,
  awaitforOpponent,
  // joinLobby,
  historyGame,
  postGame
} from './gameRoutes.js';
import { createRoom, joinRoom } from './Game2Database.js';
import { GameData } from './gameModel.js';
import { game } from './game.js';
import { Manager } from './gameManager.js'

dotenv.config();

const manager = Manager.getInstance();

let nextGameId: number = 1;

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

function verifTokenSocket(socket: Socket)
{
    try {
        const tmp = app.jwt.verify(socket.handshake.auth.token);
        return true ;
    } catch {
        // io.to(socket.id).emit("error", "Token expired or invalid");
        return false;
    }
}

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

io.on('connection', (socket: Socket) => {
    console.log(`USER connected: ${socket.id} on Shifumi socket`);

    socket.on('register-socket', (userId: number) => {
      console.log(`User ${userId} registered with Shifumi socket ${socket.id}`);
    });

    socket.on('start-game', (playerId: number) => {
        // const lobby = db.prepare(`SELECT * FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as GameData;
        const playerTwo = db.prepare(`SELECT player_two_id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { player_two_id: number };
        const id = db.prepare(`SELECT id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { id : number };
        db.prepare(`UPDATE games2 SET status = ? WHERE player_one_id = ? AND status = 'waiting'`).run('playing', playerId);

        if (playerTwo) {
            manager.newGame(playerId, playerTwo.player_two_id, 1)
            console.log(`in start-game, id = ${id.id}`);
            var shifumi = manager.getGame(id.id);
            if (shifumi)
                shifumi.start();
        }
    });

    socket.on('join-room', (userId : number, roomId: number, username: string) => {
        if (!verifTokenSocket(socket))
            return io.to(socket.id).emit('error', 'error : your token isn\'t valid !');
        if (!userId)
            return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');
        if (!roomId || roomId > nextGameId)
            return io.to(socket.id).emit('error', 'error : a part cannot be found with this id !');

        if (joinRoom(userId.toString(), roomId.toString())) {
            socket.join(`${roomId.toString()}.2`);
            io.to(socket.id).emit('roomJoined', roomId);
            io.to(`${roomId.toString()}.1`).emit('opponent-found', username);
        }
    });
  
    socket.on('create-room', (userId: number) => {
      if (!verifTokenSocket(socket))
          return io.to(socket.id).emit('error', 'your token is not valid !');

      if (!userId)
          return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');

      const roomId: number = nextGameId++;
      if (createRoom(userId, `game-${roomId.toString()}`))
         socket.join(`${roomId.toString()}.1`);

      // ajouter la fonction pour cree la game avec le roomId
      io.to(socket.id).emit('roomJoined', roomId);
    });

    socket.on('play-card', (gameId: number, play: playedCard) =>
    {
        const game = manager.getGame(gameId);
        console.log(`id player = ${play.userId}`);
        if (game)
            game.chooseCard(play);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Shifumi disconnected: ${socket.id}`);
    });
  });

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
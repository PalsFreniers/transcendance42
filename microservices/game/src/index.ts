import Fastify from 'fastify';
import Database from 'better-sqlite3';
import path from 'path';
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
const dbPath = path.join(__dirname, 'dbSqlite', 'db.sqlite');
const db = new Database(dbPath);
const PORT = process.env.GAME_PORT;

// MAKE SURE TABLE GAME EXIST (CREATE IF NOT)
db.exec(
`CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lobby_name TEXT NOT NULL,
  player_one_id INTEGER NOT NULL,
  player_two_id INTEGER,
  game_score TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  start_time TIMESTAMP DEFAULT NULL,
  end_time TIMESTAMP DEFAULT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
);

//ROUTES
app.register(jwt , {secret: process.env.JWT_SECRET!});
app.register(createRoom, { prefix: 'api/game' });
app.register(inGame, { prefix: 'api/game' });
app.register(awaitforOpponent, {prefix: 'api/game' });
app.register(joinLobby, {prefix: 'api/game' })
app.register(historyGame, {prefix: 'api/game' });
app.register(postGame, { prefix: 'api/game' });

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game service running on port ${PORT}`);
});

export default db;
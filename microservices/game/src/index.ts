import Fastify from 'fastify';
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import fastifyJwt from 'fastify-jwt';
import {
  createRoomRoutes,
  startGameRoutes,
  searchGameRoutes,
  historyGameRoutes,
  postGameRoutes
} from './gameRoutes';

//START FOR GAME SERVICES
const app = Fastify();
dotenv.config();
const dbPath = path.join(_dirname, 'dbSqlite', 'db.sqlite');
const db = new Database(dbPath);
const PORT = process.env.GAME_PORT;

// MAKE SURE TABLE GAME EXIST (CREATE IF NOT)
db.exec(
`CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lobby_name TEXT NOT NULL,
  player_one_id INTEGER NOT NULL,
  player_two_id INTEGER NOT NULL,
  game_score TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
);

//ROUTES
app.register(fastifyJwt, {secret: process.env.JWT_SECRET!});
app.register(createRoomRoutes, { prefix: 'api/game' });
app.register(startGameRoutes, { prefix: 'api/game' });
app.register(searchGameRoutes, {prefix: 'api/game' });
app.register(historyGameRoutes, {prefix: 'api/game' });
app.register(postGameRoutes, { prefix: 'api/game' });

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`Game service running on port ${PORT}`);
});

export default db;
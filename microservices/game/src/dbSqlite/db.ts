import Database from 'better-sqlite3';
import fs from 'fs';

const dataDir = '/data';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(`${dataDir}/db.sqlite`);
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lobby_name TEXT NOT NULL,
    player_one_id INTEGER NOT NULL,
    player_two_id INTEGER,
    game_score TEXT NOT NULL,
    status TEXT DEFAULT 'waiting',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
export default db;

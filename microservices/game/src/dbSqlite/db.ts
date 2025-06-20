import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import  path, { dirname } from 'path';
import fs from 'fs';

// Directory and file setup
const __filename = fileURLToPath(import.meta.url);
const dbDir = dirname(__filename);
const dbPath = path.join(dbDir, 'db.sqlite');

// Ensure dbSqlite folder exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and connect to the database
const db = new Database(dbPath);

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lobby_name TEXT NOT NULL,
    player_one_id INTEGER NOT NULL,
    player_two_id INTEGER,
    game_score TEXT NOT NULL,
    status TEXT DEFAULT 'waiting',
    start_time TIMESTAMP DEFAULT NULL,
    end_time TIMESTAMP DEFAULT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

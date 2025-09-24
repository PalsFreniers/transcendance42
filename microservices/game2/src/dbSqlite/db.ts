import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = '/data/db.sqlite'; // .ENV

// Ensure directory exists (safe to skip in Docker, but optional)
const dbDir = '/data';

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create and connect to the database
const db = new Database(dbPath);

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS games2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lobby_name TEXT NOT NULL,
    player_one_id INTEGER NOT NULL,
    player_one_name TEXT NOT NULL,
    player_two_id INTEGER DEFAULT 0,
    player_two_name TEXT,
    game_score TEXT NOT NULL,
    status TEXT DEFAULT 'waiting',
    start_time TIMESTAMP DEFAULT NULL,
    game_time INTEGER DEFAULT 0,
    round_nmb INTEGER DEFAULT 0,
    is_private INTEGER DEFAULT 0,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
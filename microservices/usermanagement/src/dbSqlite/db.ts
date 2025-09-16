import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = '/data/db.sqlite'; // .ENV

// Ensure directory exists (safe to skip in Docker, but optional)
const dbDir = '/data';
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    socket VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    profile_image_url TEXT DEFAULT NULL,
    friends TEXT DEFAULT '[]',
    bio TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS conversation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL,
    userId INTEGER NOT NULL,
    targetId INTEGER NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS gameStats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name VARCHAR(10) NOT NULL,
    part_name VARCHAR(50) NOT NULL,
    part_id INTEGER NOT NULL,
    player_one_id INTEGER NOT NULL,
    player_two_id INTEGER NOT NULL,
    final_score TEXT DEFAULT 'playerOneScore - playerTwoScore',
    round_number INTEGER NOT NULL,
    game_time TIMESTAMP NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

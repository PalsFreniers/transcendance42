import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

// Create the dbSqlite folder and db file if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const dbDir = dirname(__filename);
const dbPath = path.join(dbDir, 'db.sqlite');

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the SQLite database (it will be created if not present)
const db = new Database(dbPath);

// Create table if not already present (can be customized per service)
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

export default db;
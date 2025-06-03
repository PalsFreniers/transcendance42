import Fastify from 'fastify';
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import {
  authRoutes,
  registerRoutes,
} from './authService';
import {
  friendRoutes,
  profilRoutes,
  updateRoutes,
  deleteRoutes,
} from './userRoutes';

// START APP FOR USERMANAGEMENT
const app = Fastify();
dotenv.config();
// CREATE PATH DO SQLITE FOR STOCK DATA-USER
const dbPath = path.join(__dirname, 'dbSqlite', 'db.sqlite');
const db = new Database(dbPath);
const PORT = process.env.USER_MANA_PORT;

// MAKE SURE TABLE USER EXIST (CREATE IF NOT)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,            -- used for login
    email VARCHAR(100) NOT NULL UNIQUE,              -- optional for verification or recovery
    password_hash TEXT NOT NULL,                     -- store hashed password (bcrypt, argon2, etc.)
    profile_image_url TEXT DEFAULT NULL,             -- link to avatar image
    friends TEXT DEFAULT '[]',                       -- array of user IDs
    bio TEXT DEFAULT '',                             -- short user bio or status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- registration date
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- for profile updates
    is_online INTEGER DEFAULT 0,                     -- track user status
    is_admin INTEGER DEFAULT 0                       -- user permissions
);
`);

// ROUTES
app.register(registerRoutes, { prefix: '/api/user' });
app.register(authRoutes, { prefix: '/api/user' });
app.register(profilRoutes, { prefix: '/api/user' });
app.register(friendRoutes, { prefix: '/api/user' })
app.register(updateRoutes, { prefix: '/api/user' });
app.register(deleteRoutes, { prefix: '/api/user' });

app.listen({ port: Number(PORT), host: '0.0.0.0' }, err => {
  if (err) throw err;
  console.log(`User service running on port ${PORT}`);
});

export default db;
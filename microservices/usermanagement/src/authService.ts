import { FastifyInstance } from 'fastify';
import { createUser, User } from './userModel.js';
import bcrypt from 'bcrypt';
import db from './dbSqlite/db.js';

export async function register(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const { username, email, password } = request.body as {
      username: string;
      password: string;
      email: string;
    };
    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    const existingUser = db.prepare('SELECT 1 FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser)
      return reply.status(409).send({ error: 'Username or email already in use' });
    try {
      const password_hash = await bcrypt.hash(password, 10);
      const newUser: User = {
        username,
        password_hash,
        email,
      };
      const userId = createUser(newUser);
      return reply.status(201).send({ success: true, userId });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to register user' });
    }
  });
}

export async function auth(app: FastifyInstance) {
    app.post('/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };
    //GET USER FROM DB
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
      id: number;
      username: string;
      password_hash: string;
    };
    if (!user)
        return reply.code(401).send({ error: 'Invalid username or password' });
    // COMPARE HASHED PASSWORD RESULT
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) 
        return reply.code(401).send({ error: 'Invalid username or password' });
    //SIGN TOKEN FOR THAT SESSION ANOTHER IS GENERATE AT EACH CONNECTION
    const token = app.jwt.sign({ userId: user.id, username: user.username });
    // RETURN IT FOR OTHERS SERVICES CAN BE USED IT!
    return reply.send({ token });
    });
}
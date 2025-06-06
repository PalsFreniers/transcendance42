import { FastifyInstance } from 'fastify';
import { createUser } from './userModel';
import bcrypt from 'bcrypt';

export async function register(app: FastifyInstance) {
    app.post('/register', async (request, reply) => {
    
    const { username, email, password } = request.body as {
      username: string;
      email: string;
      password: string;
    };

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    try {
      const password_hash = await bcrypt.hash(password, 10);
      const userId = createUser({
        username,
        email,
        password_hash,
      });
      return reply.status(201).send({ success: true, userId });
    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to register user' });
    }
  });
}

export async function auth(app: FastifyInstance) {
    app.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    //GET USER FROM DB
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
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
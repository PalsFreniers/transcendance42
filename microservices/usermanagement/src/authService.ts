import { FastifyInstance } from 'fastify';
import { createUser } from './userModel';
import bcrypt from 'bcrypt';

export async function registerRoutes(app: FastifyInstance) {
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

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    
    return { success: true };
  });
}
import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export async function register(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const body = req.body;
    const response = await fetch('http://localhost:3001/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    reply.send(data);
  });
}

export async function login(app: FastifyInstance){
    app.post('/login', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://localhost:3001/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}
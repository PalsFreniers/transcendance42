import Fastify from 'fastify';

const app = Fastify();

app.get('/', async (req, res) => {
  return { message: 'Hello from frontend Fastify service!' };
});

app.listen({ port: 5173 }, err => {
  if (err) throw err;
  console.log('🚀 Server running on http://localhost:5173');
});

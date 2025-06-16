import Fastify from 'fastify';

const app = Fastify();

app.get('/', async () => {
  return { message: 'Hello from Fastify!' };
});

app.listen({ port: 5173, host: '0.0.0.0' }, () => {
  console.log('🚀 Server is running on http://0.0.0.0:5173');
});
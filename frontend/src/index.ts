import Fastify from 'fastify';
import { fastifyStatic } from '@fastify/static';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const app = Fastify();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.register(fastifyStatic, {
	root: path.join(__dirname, '../public'),
	prefix: '/',
});

app.setNotFoundHandler((req, reply) => {
	// For SPA navigation (back/forward buttons)
	reply.sendFile('index.html');
});

app.listen({ port: 5173, host: '0.0.0.0' })
	.then(() => console.log('✅ Frontend running on http://localhost:5173'))
	.catch(err => {
		console.error('❌ Fastify failed to start:', err);
	});

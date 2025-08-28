import Fastify from 'fastify';
import { fastifyStatic } from '@fastify/static';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.register(fastifyStatic, {
	root: path.join(__dirname, '../../dist'),
	prefix: '/',
});

app.setNotFoundHandler((req, reply) => {
	// For SPA navigation (back/forward buttons)
	reply.sendFile('/index.html');
});

app.listen({ port: 3004, host: '0.0.0.0' })
	.then(() => console.log('✅ Fastify running on http://localhost:3004'))
	.catch(err => {
		console.error('❌ Fastify failed to start:', err);
	});

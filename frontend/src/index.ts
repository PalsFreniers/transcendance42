import Fastify from 'fastify';
import { fastifyStatic } from '@fastify/static';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import {
  login,
  register
} from './routes/auth.js';
import {
  friendList,
  profil,
  updateProfile,
  deleteProfile,
  friendAdd,
  friendDelete,
  friendSendMsg
} from './routes/user.js';
import {
  createRoom,
  inGame,
  awaitforOpponent,
  joinLobby,
  historyGame,
  postGame
} from './routes/game.js';

const app = Fastify();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  wildcard: false,
});

app.register(register, { prefix: '/api/user' });
app.register(login, { prefix: '/api/user' });
app.register(friendList, { prefix: '/api/user' });
app.register(profil), { prefix: '/api/user' };
app.register(updateProfile, { prefix: '/api/user' });
app.register(deleteProfile, { prefix: '/api/user' });
app.register(friendAdd, { prefix: '/api/user' });
app.register(friendDelete, { prefix: '/api/user' });
app.register(friendSendMsg, { prefix: '/api/user' });
app.register(createRoom, { prefix: 'api/game' });
app.register(inGame, { prefix: 'api/game' });
app.register(awaitforOpponent, { prefix: 'api/game' });
app.register(joinLobby, { prefix: 'api/game' });
app.register(historyGame, { prefix: 'api/game' });
app.register(postGame, { prefix: 'api/game' });

app.setNotFoundHandler((req, reply) => {
  // For SPA navigation (back/forward buttons)
  reply.sendFile('index.html');
});

app.listen({ port: 5173, host: '0.0.0.0' })
  .then(() => console.log('✅ Frontend running on http://localhost:5173'))
  .catch(err => {
    console.error('❌ Fastify failed to start:', err);
  });

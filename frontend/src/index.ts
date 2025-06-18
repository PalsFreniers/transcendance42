import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
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

app.register(register);
app.register(login);
app.register(friendList);
app.register(profil);
app.register(updateProfile);
app.register(deleteProfile);
app.register(friendAdd);
app.register(friendDelete);
app.register(friendSendMsg);
app.register(createRoom);
app.register(inGame);
app.register(awaitforOpponent);
app.register(joinLobby);
app.register(historyGame);
app.register(postGame);

app.setNotFoundHandler((req, reply) => {
  // For SPA navigation (back/forward buttons)
  reply.sendFile('index.html');
});

app.listen({ port: 5173, host: '0.0.0.0' })
  .then(() => console.log('✅ Frontend running on http://localhost:5173'))
  .catch(err => {
    console.error('❌ Fastify failed to start:', err);
  });

import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db.js';

export async function profil(app: FastifyInstance) {
  app.get('/profil', async (request, reply) => {
    try {
      const user = request.user as { userId: number};
      const result = db
        .prepare('SELECT id, username, email, bio, profile_image_url FROM users WHERE id = ?')
        .get(user.userId);
      return { success: true, user: result };
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export async function friendAdd(app: FastifyInstance) {
  app.post('/add-friend', async (request, reply) => {
    try {
    const user = request.user as { userId: number };
      const { friendUsername } = request.body as { friendUsername: string };
      const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as { id: number };
      if (!friend)
        return reply.code(404).send({ error: 'Friend not found' });
      const currentUser = db.prepare('SELECT friends FROM users WHERE id = ?').get(user.userId) as { friends: string };
      let friends = JSON.parse(currentUser.friends || '[]');
      if (friends.includes(friend.id))
        return reply.code(400).send({ error: 'Already friends' });
      friends.push(friend.id);
      db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), user.userId);
      return { success: true, message: `${friendUsername} added as a friend` };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to add friend' });
    }
  });
}


export async function friendDelete(app: FastifyInstance) {
  app.post('/delete-friend', async (request, reply) => {
    try {
      const user = request.user as { userId: number };
      const { friendUsername } = request.body as { friendUsername: string };
      const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername) as { id: number };
      if (!friend)
        return reply.code(404).send({ error: 'Friend not found' });
      const currentUser = db.prepare('SELECT friends FROM users WHERE id = ?').get(user.userId) as { friends: string };
      let friends = JSON.parse(currentUser.friends || '[]');
      friends = friends.filter((fid: number) => fid !== friend.id);
      db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), user.userId);
      return { success: true, message: `${friendUsername} removed from friends` };
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to remove friend' });
    }
  });
}

export async function friendSendMsg(app: FastifyInstance) {
    app.post('/priv-msg/:username', async (request, reply) => {
    try {
        const user = request.user as { userId: number };
        const { message } = request.body as { message: string };
        const { username: targetUsername } = request.params as { username: string };
        const target = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername) as { id: number };
        if (!target) 
            return reply.code(404).send({ error: 'User not found' });
        // Real system would emit over socket or store in DB
        return { success: true, from: user.userId, to: target.id, message };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to send message' });
    }
  });
}

export async function friendList(app: FastifyInstance) {
    app.get('/friend-list', async (request, reply) => {
    try {
        const user = request.user as { userId: number };
        const result = db.prepare('SELECT friends FROM users WHERE id = ?').get(user.userId) as { friends: string };
        const friendIds = JSON.parse(result.friends || '[]');
        const friends = friendIds.map((id: number) => {
            return db.prepare('SELECT id, username, is_online FROM users WHERE id = ?').get(id);
        });
        return { success: true, friends };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to load friends' });
    }
  });
}

export async function updateProfile(app: FastifyInstance) {
  app.put('/update', async (request, reply) => {
    try {
      const user = request.user as { userId: number };
      const { bio, profile_image_url } = request.body as {
        bio: string;
        profile_image_url: string;
    };
      const stmt = db.prepare(`
        UPDATE users
        SET bio = ?, profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(bio, profile_image_url, user.userId);
      return reply.send({ success: true });
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to update profile' });
    }
  });
}

export async function deleteProfile(app: FastifyInstance) {
  app.delete('/profil-delete', async (request, reply) => {
    try {
      const user = request.user as { userId: number };
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(user.userId);
      return reply.send({ success: true });
    } catch (err) {
      return reply.code(500).send({ error: 'Failed to delete profile' });
    }
  });
}
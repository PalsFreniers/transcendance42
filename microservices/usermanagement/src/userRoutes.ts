import { FastifyInstance } from 'fastify';
import { getUserId } from './userMiddlewares';
import db from './dbSqlite/db';

 
export async function profil(app: FastifyInstance) {
    app.get('/profile', async (request, reply) => {
    try {
        const userId = getUserId(request);
        const user = db.prepare('SELECT id, username, email, bio, profile_image_url FROM users WHERE id = ?').get(userId);
        return { success: true, user };
    } catch (err) {
        return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

export async function friendAdd(app: FastifyInstance) {
    app.post('/add-friend', async (request, reply) => {
    try {
        const userId = getUserId(request);
        const { friendUsername } = request.body;
        const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername);
        if (!friend) 
            return reply.code(404).send({ error: 'Friend not found' });
        const user = db.prepare('SELECT friends FROM users WHERE id = ?').get(userId);
        let friends = JSON.parse(user.friends || '[]');
        if (friends.includes(friend.id))
            return reply.code(400).send({ error: 'Already friends' });
        friends.push(friend.id);
        db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), userId);
        return { success: true, message: `${friendUsername} added as a friend` };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to add friend' });
    }
  });
}

export async function friendDelete(app: FastifyInstance) {
    app.post('/delete-friend', async (request, reply) => {
    try {
        const userId = getUserId(request);
        const { friendUsername } = request.body;
        const friend = db.prepare('SELECT id FROM users WHERE username = ?').get(friendUsername);
        if (!friend) 
            return reply.code(404).send({ error: 'Friend not found' });
        const user = db.prepare('SELECT friends FROM users WHERE id = ?').get(userId);
        let friends = JSON.parse(user.friends || '[]');
        friends = friends.filter((fid: number) => fid !== friend.id);
        db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), userId);
        return { success: true, message: `${friendUsername} removed from friends` };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to remove friend' });
    }
  });
}

export async function friendSendMsg(app: FastifyInstance) {
    app.post('/priv-msg/:username', async (request, reply) => {
    try {
        const userId = getUserId(request);
        const { message } = request.body;
        const targetUsername = request.params.username;
        const target = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername);
        if (!target) 
            return reply.code(404).send({ error: 'User not found' });
        // Real system would emit over socket or store in DB
        return { success: true, from: userId, to: target.id, message };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to send message' });
    }
  });
}

export async function friendList(app: FastifyInstance) {
    app.get('/friendList', async (request, reply) => {
    try {
        const userId = getUserId(request);
        const result = db.prepare('SELECT friends FROM users WHERE id = ?').get(userId);
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
    app.put('/update', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const { bio, profile_image_url } = request.body;
    const stmt = db.prepare(`
        UPDATE users
        SET bio = ?, profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    stmt.run(bio, profile_image_url, userId);
    return reply.send({ success: true });
    });
}

export async function deleteProfile(app: FastifyInstance) {
    app.delete('/api/user/profile-delete', { preValidation: [app.authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
    return reply.send({ success: true });
    });

}
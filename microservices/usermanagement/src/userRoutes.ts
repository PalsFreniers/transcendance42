import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db.js';
import { GameStats, addStats } from './gameStatsModel.js';
import fs from 'fs';
import path from 'path';
import { ChatMessage } from './userSocket.js';
import { Message } from './chatModel.js'
//import { ChatMessage } from './userSocket.js';
//import { io } from './index.js'

export async function profil(app: FastifyInstance) {
    app.get('/profil', async (request, reply) => {
        try {
            const user = request.user as { userId: number };
			const { username } = request.query as { username?: string};
			let result : any;
			if (username)
			{
				result = db
					.prepare('SELECT id, username, bio, profile_image_url FROM users WHERE username = ?')
					.get(username) as { username: string };
			}
			else
			{
				result = db
					.prepare('SELECT id, username, email, bio, profile_image_url FROM users WHERE id = ?')
					.get(user.userId);
			}
            if (!result)
				return reply.code(404).send({ error: 'Profil not found' });
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
/*
export async function friendSendMsg(app: FastifyInstance) {
    app.post('/priv-msg/:username', async (request, reply) => {
    console.log('message load !');
    try {
        const user = request.user as { username: string, userId: number };
        const { message } = request.body as { message: string };
        const { username: targetUsername } = request.params as { username: string };
        const target = db.prepare('SELECT socket FROM users WHERE username = ?').get(targetUsername) as { socket: string};
        const targetId = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername) as { id: number};
        const isOnline = db.prepare('SELECT is_online FROM users WHERE username = ?').get(targetUsername) as { is_online: number};
        // ajouter un verification de target.onLine;
        if (!target) 
            return reply.code(404).send({ error: 'User not found' });
        console.log('userId = ', user, ' target = ', target.socket);
        const msg: ChatMessage = {
          from: user.username,
          userId: user.userId,
          target: targetId.id,
          for: target.socket,
          text: message,
          timestamp: Date.now().toString() // a garder ?
        };
        console.log(`target = ${target.socket}`);
        // ajouter une save des X dernier messages
        if (!isOnline.is_online)
          saveMessage(msg);
        else
          io.to(target.socket).emit('message', msg); // envoie du message au client 
        console.log('message emit !');

        return { success: true, from: user.userId, to: targetId.id, message };
    } catch (err) {
        return reply.code(500).send({ error: 'Failed to send message' });
    }
  });
}*/

export async function friendList(app: FastifyInstance) {
    app.get('/friend-list', async (request, reply) => {
        try {
            const user = request.user as { userId: number };
            const result = db.prepare('SELECT friends FROM users WHERE id = ?').get(user.userId) as { friends: string };
            const friendIds = JSON.parse(result.friends || '[]');
            const friends = friendIds.map((id: number) => {
                return db.prepare('SELECT id, username, is_online, profile_image_url FROM users WHERE id = ?').get(id);
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
            let fileUrl: string | null = null;

            const body = request.body as any; // avec attachFieldsToBody: true
            const bio = body.bio || '';

            if (body.profile_image) {
                const file = body.profile_image;
                const uploadDir = path.join('./', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, file.filename);
                await file.toBuffer().then(buffer => fs.writeFileSync(filePath, buffer));
                fileUrl = `http://${process.env.VITE_LOCAL_ADDRESS}:3001/uploads/${file.filename}`;
                console.log('File saved at:', fileUrl);
            }

            console.log('bio:', bio);
            console.log('fileUrl:', fileUrl);
            console.log('userId:', user.userId);


            db.prepare(`
          UPDATE users
          SET bio = ?, profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bio.value, fileUrl, user.userId);

            const updatedUser = db
                .prepare('SELECT id, username, email, bio, profile_image_url FROM users WHERE id = ?')
                .get(user.userId);

            return reply.send({ success: true, user: updatedUser });
        } catch (err) {
            console.error(err);
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

export async function addStatsInDB(app: FastifyInstance) {
    app.post('/add-stats', async (request, reply) => {
        console.log(`start save stats`);
        try {
            const { stats } = request.body as { stats: GameStats };
            addStats(stats);
            return reply.send({ success: true });
        } catch (err) {
            console.log(err);
            return reply.code(500).send({ error: 'Failed to add stats in gameStats table' });
        }
    });
}

export async function getMessage(app: FastifyInstance) {
    app.post('/get-message', async (request, reply) => {
        try {
            const friend = request.body as { friendUsername: string };
            const user = request.user as { userId: number };
            console.log(friend.friendUsername);
            if (friend) {
                const id = db.prepare(`SELECT id FROM users WHERE username = ?`).get(friend.friendUsername) as { id: number };
                if (!id)
                    return reply.code(498).send({ error: 'Failed to get user from users' });
                let msgs = db.prepare(`SELECT * FROM conversation WHERE (targetId = ? AND userId = ?) OR (userId = ? AND targetId = ?)`).all(id.id, user.userId, id.id, user.userId) as Message[];
                if (msgs) {
                    const messages: ChatMessage[] = msgs.map((row) => ({
                        from: row.username,
                        userId: row.userId,
                        target: row.targetId,
                        text: row.message,
                        timestamp: row.date,
                        isRead: row.is_read,
                    }))
                    return reply.code(200).send({ success: true, messages: messages });
                }
            }
            else
                return reply.code(499).send({ error: 'Failed to get message' });
        } catch (err) {
            console.log(err);
            return reply.code(500).send({ error: 'Failed to get message' });
        }
    })
}

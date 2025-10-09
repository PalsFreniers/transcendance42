import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db.js';
import { GameStats, addStats } from './gameStatsModel.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { ChatMessage } from './userSocket.js';
import { Message } from './chatModel.js'
import { FriendRequests, createRequests } from './friendRequestsModel.js';
import { io } from './index.js'
import { User } from './userModel.js';

export async function profil(app: FastifyInstance) {
    app.get('/profil', async (request, reply) => {
        try {
            const user = request.user as { userId: number };
            const { username } = request.query as { username?: string };
            let result: any;
            if (username) {
                result = db
                    .prepare('SELECT id, username, bio, profile_image_url FROM users WHERE username = ?')
                    .get(username) as { username: string };
            }
            else {
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

export async function acceptFriend(app: FastifyInstance) {
    app.post('accept-friend', async (request, reply) => {
        try {

        }
        catch (err) {
            return reply.code(500).send({ error: 'Failed to add friend' });
        }
    });
}

export async function friendAdd(app: FastifyInstance) {
    app.post('/add-friend', async (request, reply) => { // a changer pour ajouter la demande dans la db et envoyr un msg a la target
        try {
            const user = request.user as { userId: number };
            const { friendUsername } = request.body as { friendUsername: string };
            const friend = db.prepare('SELECT id, socket FROM users WHERE username = ?').get(friendUsername) as { id: number, socket: string };

            if (!friend)
                return reply.code(404).send({ error: 'Friend not found' });

            if (user.userId == friend.id)
                return reply.code(403).send({ error: 'Unable to be friend with yourself' });

            const newRequests: FriendRequests = {
                id: 0,
                sender_id: user.userId,
                receiver_id: friend.id,
                status: 'pending',
                created_at: Date.toString(),
                updated_at: Date.toString()
            }
            createRequests(newRequests);

            io.to(friend.socket).emit('new-friend-request');

            return { success: true, message: `${friendUsername} added as a friend` };
        } catch (err) {
            console.log(err);
            return reply.code(500).send({ error: 'Failed to add friend' });
        }
    });
}

interface frontFriendRequest {
    id: number
    sender_username: string,
    status: string,
    created_at: string,
}

export async function getFriendRequest(app: FastifyInstance) {
    app.get('/get-friend-requests', async (request, reply) => {
        try {
            const user = request.user as { userId: number };
            const res = db.prepare(`SELECT * FROM friend_requests WHERE receiver_id = ?`).all(user.userId) as FriendRequests[];
            if (!res)
                return reply.code(500).send('fail to get friend request');

            let tabRequest: frontFriendRequest[] = [];
            res.forEach(request => {
                const name = db.prepare(`SELECT username FROM users WHERE id = ?`).get(request.sender_id) as { username: string }
                if (!name)
                    return;
                tabRequest.push({
                    id: request.id,
                    sender_username: name.username,
                    status: request.status,
                    created_at: request.created_at
                });
            })
            return { success: true, friendRequest: tabRequest };
        } catch {

        }
    });
}

export async function friendDelete(app: FastifyInstance) {
    app.post('/delete-friend', async (request, reply) => { // a appeler deux fois pour supr des deux coter
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

            //const FriendUser = db.prepare('SELECT friends FROM users WHERE id = ?').get(friend.id) as { friends: string };
            friends = JSON.parse(currentUser.friends || '[]');
            friends = friends.filter((fid: number) => fid !== user.userId);
            db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), friend.id);



            return { success: true, message: `${friendUsername} removed from friends` };
        } catch (err) {
            return reply.code(500).send({ error: 'Failed to remove friend' });
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

            const body = request.body as any;
            console.log(body);
            const currentUser = db.prepare(`
                SELECT * FROM users WHERE id = ?
            `).get(user.userId) as User;
            const username = body.username.value || currentUser.username;
            const verifyUsername = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as User;
            if (verifyUsername)
                return reply.code(401).send({ error: 'Username already use' });
            const oldPassword = body.oldPassword.value || null;
            let newPassword = body.newPassword.value || currentUser.password_hash;
            const confirmPassword = body.confirmPassword.value || null;
            if (oldPassword && newPassword && confirmPassword) {
                const valid = await bcrypt.compare(oldPassword, currentUser.password_hash);
                if (!valid)
                    return reply.code(401).send({ error: 'Wrong password' });
                if (newPassword !== confirmPassword)
                    return reply.code(401).send({ error: 'New password && confirm new not match' });
                newPassword = await bcrypt.hash(newPassword, 10);
            }
            const bio = body.bio.value || '';
            if (body.profile_image_url) {
                const file = body.profile_image_url;
                const uploadDir = path.join('./', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, file.filename);
                await file.toBuffer().then(buffer => fs.writeFileSync(filePath, buffer));
                fileUrl = `/uploads/${file.filename}`;
                console.log('File saved at:', fileUrl);
            }
            else
                fileUrl = currentUser.profile_image_url || ''
            db.prepare(`
          UPDATE users
          SET bio = ?, profile_image_url = ?, username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bio, fileUrl, username, newPassword, user.userId);

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

export async function getHistoryGame(app: FastifyInstance) {
    app.get('/history', async (request, reply) => {
        try {
            const user = request.user as { userId: number };
            const games = db.prepare(`
				SELECT 
					id,
					player_one_id,
					player_two_id,
					game_name,
					final_score,
					game_time,
					mmr_gain_player_one,
					mmr_gain_player_two,
					date
				FROM gameStats
				WHERE player_one_id = ? OR player_two_id = ?
				ORDER BY date DESC
			`).all(user.userId, user.userId);

            if (!games || games.length === 0)
                return reply.code(404).send({ success: false, message: "No games found" });

            return reply.code(200).send({ success: true, games });
        } catch (err) {
            console.error(err);
            return reply.code(500).send({ success: false, error: "Failed to fetch player games" });
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

export async function getMmrShifumi(app: FastifyInstance) {
    app.post('/get-mmr-shifumi', async (request, reply) => {
        try {
            const { id } = request.body as { id: number };
            const mmr = db.prepare(`SELECT shifumi_mmr FROM users WHERE id = ?`).get(id) as { shifumi_mmr: number };
            reply.code(200).send({ success: true, mmr: (mmr ? mmr.shifumi_mmr : 0) })
        } catch (err) {
            reply.code(399).send({ success: false })
        }
    })
}

export async function setMmrShifumi(app: FastifyInstance) {
    app.post('/set-mmr-shifumi', async (request, reply) => {
        try {
            const { id, newMmr } = request.body as { id: number; newMmr: number };

            db.prepare(`UPDATE users SET shifumi_mmr = ? WHERE id = ?`).run(newMmr, id);

            reply.code(200).send({ success: true })
        } catch (err) {
            reply.code(370).send({ success: false })
        }
    })
}

export async function getPlayerFromList(app: FastifyInstance) {
    type Player = { id: number; mmr: number };
    app.post('/get-list-player', async (request, reply) => {
        try {
            const { playerIds } = request.body as { playerIds: number[] }

            const placeholders = playerIds.map(() => "?").join(",");
            const players: Player[] = db.prepare(`
                SELECT id, shifumi_mmr
                FROM users
                WHERE id IN (${placeholders})
            `).all(...playerIds) as Player[];

            reply.code(200).send({ success: true, players });
        } catch (err) {
            reply.code(400).send({ error: `fail to load players mmr !` });
        }
    })
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
                    msgs.forEach(msg => {
                        if (msg.targetId == user.userId) {
                            db.prepare(`
                                UPDATE conversation SET is_read = 1 WHERE id = ?
                                `).run(msg.id);
                            msg.is_read = 1;
                        }
                    });
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

export async function getDatas(app: FastifyInstance) {
    app.get('/data', async (req, rep) => {
        try {
            const { id } = req.query as { id?: number };
            const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
            return rep.code(200).send(user);
        } catch (err) {
            console.log(err);
            return rep.code(500).send({ error: 'Failed fetch user data' });
        }
    });
}

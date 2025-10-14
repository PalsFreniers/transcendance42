import { createMessage, Message } from './chatModel.js'
import db from './dbSqlite/db.js';
import { addFriend } from './updateFriends.js';

export interface ChatMessage {
    from: string;
    userId: number;
    target: number;
    text: string;
    timestamp: string;
    isRead: number;
}

export async function saveMessage(msg: ChatMessage) {
    const username = msg.from;
    const userId = msg.userId;
    const targetId = msg.target;
    const message = msg.text;
    const id = 0;
    const date = '';
    const newMessage: Message = {
        id,
        username,
        userId,
        targetId,
        message,
        date,
        is_read: 0
    };
    const msgId = createMessage(newMessage);
    console.log(`msgId = ${msgId}`);
}

export function startServer(io) {
    io.on('connection', (socket) => {
        console.log(`USER connected: ${socket.id} on Chat socket`);

        socket.on('register-socket', (userID: number) => {
            const stmt = db.prepare('UPDATE users SET socket = ?, is_online = 1 WHERE id = ?');
            stmt.run(socket.id, userID);
            console.log(`User ${userID} registered with Chat socket ${socket.id}`);
            const msg = db.prepare(`SELECT * FROM conversation WHERE targetId = ? AND is_read = 0`).all(userID) as Message[];
            if (msg) {
                let username: string[] = [];
                msg.forEach(msg => {
                    if (!username.includes(msg.username))
                        username.push(msg.username);
                });

                username.forEach(name => {
                    io.to(socket.id).emit("message", name);
                });
            }

            socket.on('message', (txt, userId, targetUsername) => {
                const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string };
                const targetId = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername) as { id: number };
                const targetSocket = db.prepare('SELECT socket FROM users WHERE username = ?').get(targetUsername) as { socket: string };
                const targetIsOnline = db.prepare('SELECT is_online FROM users WHERE username = ?').get(targetUsername) as { is_online: number };

                if (!targetSocket)
                    return io.to(socket.id).emit('error', 'error 404 : target not found !');
                if (!targetId || !targetId.id)
                    return io.to(socket.id).emit('error', 'error 404 : target not found !');
                if (!targetIsOnline)
                    return io.to(socket.id).emit('error', 'error 404 : target not found !');

                const msg: ChatMessage = {
                    from: username.username,
                    userId: userId,
                    target: targetId.id,
                    text: txt,
                    timestamp: Date.now().toString(),
                    isRead: 0
                }
                saveMessage(msg);

                if (targetIsOnline.is_online)
                    io.to(targetSocket.socket).emit('message', msg.from);
            });
        });

        socket.on('disconnect', () => {
            const stmt = db.prepare(`
            UPDATE users SET socket = NULL, is_online = 0 WHERE socket = ?
        `);
            console.log(socket.id, socket.data.userId);
            stmt.run(socket.id);
            console.log(`Socket ${socket.id} disconnected`);
        });

        socket.on('requests-friend', (requestsId: number, accept: boolean) => {
            let status: string;
            if (accept)
                status = 'accepted';
            else
                status = 'rejected';
            const sender = db.prepare(`SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?`).get(requestsId) as { sender_id : number, receiver_id : number };
            if (!sender)
                return io.to(socket.id).emit('error', `fail to found friend requests with this id (${requestsId})`);
            db.prepare(`UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?`).run(status, Date.toString(), requestsId);
            if (!accept)
                return ;
            let res = addFriend(sender.sender_id, sender.receiver_id);
            if (res.success)
                return io.to(socket.id).emit('error', res.error);
            
            res = addFriend(sender.receiver_id, sender.sender_id);
            if (res.success)
                return io.to(socket.id).emit('error', res.error);
        });
    });
}
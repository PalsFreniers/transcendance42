import db from './dbSqlite/db.js';

export interface Message {
    id: number,
    username: string;
    userId: number;
    targetId: number;
    message: string;
    date: string;
    is_read: number;
}

export function createMessage(message: Message) {
    const stmt = db.prepare(`
    INSERT INTO conversation (
      username, userId, targetId, message
    ) VALUES (?, ?, ?, ?)
  `);

    const result = stmt.run(
        message.username,
        message.userId,
        message.targetId,
        message.message
    );
    return result.lastInsertRowid;
}
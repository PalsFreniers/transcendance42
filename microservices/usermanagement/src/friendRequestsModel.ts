import db from './dbSqlite/db.js';

export interface FriendRequests {
    id: number,
    sender_id: number;
    receiver_id: number;
    status: string;
    created_at: string;
    updated_at: string;
}

export function createRequests(requests: FriendRequests) {
    const stmt = db.prepare(`
    INSERT INTO conversation (
      sender_id, receiver_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        requests.sender_id,
        requests.receiver_id,
        requests.created_at,
    );
    return result.lastInsertRowid;
}

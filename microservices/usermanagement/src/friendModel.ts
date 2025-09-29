import db from './dbSqlite/db.js';

export interface FriendRequests {
    id: number,
    sender_id: number;
    receiver_id: number;
    status: 'pending'| 'accepted'| 'rejected',
    created_at: string;
    updated_at: string;
}

export function createFriendRequest(friendrequests: FriendRequests) {
    const stmt = db.prepare(`
    INSERT INTO friend_requests (
      sender_id, receiver_id, status, updated_at
    ) VALUES (?, ?, ?, ?)
  `);

    const result = stmt.run(
        friendrequests.sender_id,
        friendrequests.receiver_id,
        friendrequests.status ?? 'pending',
		friendrequests.updated_at ?? new Date().toISOString()
    );
    return result.lastInsertRowid;
}
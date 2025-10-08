import db from './dbSqlite/db.js';

export function addFriend(userId: number, friendId: number) : {success: number, error: string} {
    try {
            if(userId == friendId)
				return { success: 1, error: `you can not add yourself as a friend` };
            
            const currentUser = db.prepare('SELECT friends FROM users WHERE id = ?').get(userId) as { friends: string };
            let friends = JSON.parse(currentUser.friends || '[]');
            
            if (friends.includes(friendId))
                return { success: 1, error: `you are already friends` } ;
            
            friends.push(friendId);
            db.prepare('UPDATE users SET friends = ? WHERE id = ?').run(JSON.stringify(friends), userId);
            
            return { success: 0, error: `` };
        } catch (err) {
            return { success: 1, error: `fail to add a friend` };
        }
}

import db from './dbSqlite/db.js';

export interface User {
    username: string;
    password_hash: string;
    email: string;
    phone_number?: string,
    profile_image_url?: string;
    friends?: string;
    bio?: string;
    is_online?: number;
    is_admin?: number;
}

export function createUser(user: User) {
    const stmt = db.prepare(`
    INSERT INTO users (
      username, password_hash, email, phone_number, profile_image_url, friends, bio, is_online, is_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        user.username,
        user.password_hash,
        user.email,
        user.phone_number ?? '',
        user.profile_image_url ?? 'https://pbs.twimg.com/profile_images/1915701923908329472/4oFAfwiD_400x400.jpg',
        user.friends ?? '[]',
        user.bio ?? '',
        user.is_online ?? 0,
        user.is_admin ?? 0
    );

    return result.lastInsertRowid;
}

import db from './dbSqlite';


export interface User {
  username: string;
  email: string;
  password_hash: string;
  profile_image_url?: string;
  friends?: string;
  bio?: string;
  is_online?: number;
  is_admin?: number;
}

export function createUser(user: User) {
  const stmt = db.prepare(`
    INSERT INTO users (
      username, email, password_hash, profile_image_url, friends, bio, is_online, is_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    user.username,
    user.email,
    user.password_hash,
    user.profile_image_url ?? null,
    user.friends ?? '[]',
    user.bio ?? '',
    user.is_online ?? 0,
    user.is_admin ?? 0
  );

  return result.lastInsertRowid;
}

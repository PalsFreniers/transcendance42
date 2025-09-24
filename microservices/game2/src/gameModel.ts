import db from './dbSqlite/db.js';

export interface GameData {
    player_one_id: number,
    player_one_name: string,
    player_two_id?: number | null,         // Optional at first
    player_two_name: string | null,
    lobby_name: string,
    game_score?: string,        // Will be set after game ends
    status?: 'waiting' | 'playing' | 'finished',
    start_time?: string,
    game_time?: number,
    round_nmb: number,
    is_private: number,
    date?: string,
}

export function createGameLobby(game: GameData) {
  const stmt = db.prepare(`
    INSERT INTO games2 (player_one_id, player_one_name, player_two_id, player_two_name, lobby_name, game_score, status, start_time, game_time, round_nmb, is_private, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    game.player_one_id,
    game.player_one_name,
    game.player_two_id ?? null,
    game.player_two_name ?? null,
    game.lobby_name,
    game.game_score ?? '0-0',
    game.status ?? 'waiting',
    game.start_time ?? null,
    game.game_time ?? null,
    game.round_nmb,
    game.is_private,
    game.date ?? new Date().toISOString()
  );
  return result.lastInsertRowid;
}
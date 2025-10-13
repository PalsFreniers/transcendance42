import db from './dbSqlite/db.js';

export interface GameRecord {
  playerOne: number;
  playerTwo: null;
  lobbyName: string;
  finalScore?: string;
  status?: 'waiting' | 'ready' | 'playing' | 'finished';
  startTime?: string;
  endTime?: string;
  gameDate?: string;
}

export interface GameRecordGet {
  player_one_id: number;
  player_two_id: null | number;
  lobby_name: string;
  game_score?: string;
  status?: 'waiting' | 'ready' | 'playing' | 'finished';
  start_time?: string;
  end_time?: string;
  date?: string;
}

export function createGameLobby(g: GameRecord) {
    const stmt = db.prepare(`
        INSERT INTO games (
            player_one_id, player_two_id, lobby_name, game_score,
            status, start_time, end_time, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
        g.playerOne,
        g.playerTwo ?? null,
        g.lobbyName,
        g.finalScore ?? '0-0',
        g.status ?? 'waiting',
        g.startTime ?? null,
        g.endTime ?? null,
        g.gameDate ?? new Date().toISOString().split('T')[0],
    );
    return result.lastInsertRowid as number;
}

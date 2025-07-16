import db from './dbSqlite/db.js';

export interface GameRecord {
  playerOne: number;
  playerTwo: null;
  lobbyName: string;
  finalScore?: string;
  status?: 'waiting' | 'playing' | 'finished';
  startTime?: string;
  endTime?: string;
  gameDate?: string;
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
    g.gameDate ?? new Date().toISOString(),
  );
  return result.lastInsertRowid as number;
}

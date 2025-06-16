import db from './dbSqlite/db';


export interface Game {
    playerOne: number;
    playerTwo?: number;         // Optional at first
    lobbyName: string;
    finalScore?: string;        // Will be set after game ends
    status?: 'waiting' | 'playing' | 'finished';
    startTime?: string;
    endTime?: string;
    gameDate?: string;
}

export function createGameLobby(game: Game) {
  const stmt = db.prepare(`
    INSERT INTO games (player_one_id, player_two_id, lobby_name, game_score, status, start_time, end_time, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    game.playerOne,
    game.playerTwo ?? null,
    game.lobbyName,
    game.finalScore ?? '0-0',
    game.status ?? 'waiting',
    game.startTime ?? null,
    game.endTime ?? null,
    game.gameDate ?? new Date().toISOString()
  );

  return result.lastInsertRowid;
}
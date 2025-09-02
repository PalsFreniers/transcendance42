import db from './dbSqlite/db.js';

export interface GameData {
    playerOne: number;
    playerOneName: string;
    playerTwo?: number | null;         // Optional at first
    playerTwoName: string | null;
    lobbyName: string;
    finalScore?: string;        // Will be set after game ends
    status?: 'waiting' | 'playing' | 'finished';
    startTime?: string;
    endTime?: string;
    gameDate?: string;
}

export function createGameLobby(game: GameData) {
  const stmt = db.prepare(`
    INSERT INTO games2 (player_one_id, player_one_name, player_two_id, player_two_name, lobby_name, game_score, status, start_time, end_time, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    game.playerOne,
    game.playerOneName,
    game.playerTwo ?? null,
    game.playerTwoName ?? null,
    game.lobbyName,
    game.finalScore ?? '0-0',
    game.status ?? 'waiting',
    game.startTime ?? null,
    game.endTime ?? null,
    game.gameDate ?? new Date().toISOString()
  );
  return result.lastInsertRowid;
}
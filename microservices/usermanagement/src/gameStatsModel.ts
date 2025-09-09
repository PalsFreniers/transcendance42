import db from './dbSqlite/db.js';

export interface GameStats {
    id: number,
    game_name: string,
    part_name: string,
    part_id: number,
    player_one_id: number,
    player_two_id: number,
    final_score: string,
    round_number: number,
    game_time: number,
    date: string
}

export function addStats(game: GameStats) {

    console.log(game.part_name);

    const stmt = db.prepare(`
    INSERT INTO gameStats (
      game_name, part_name, part_id, player_one_id, player_two_id, final_score, round_number, game_time, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(
        game.game_name,
        game.part_name,
        game.part_id,
        game.player_one_id,
        game.player_two_id,
        game.final_score,
        game.round_number,
        game.game_time,
        game.date
    );
    return result.lastInsertRowid;
}
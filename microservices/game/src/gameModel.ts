import db from '../dbSqlite';

export interface Game {
    playerOne: number;
    playerTwo: number;
    lobbyName: string;
    finalScore: string;
    gameDate: string;
}

export function gameSession(game: Game) {
    const stmt = db.prepare(`
        INSERT INTO games (player_one_id, player_two_id, lobby_name, game_score, date)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
        game.playerOne,
        game.playerTwo,
        game.lobbyName,
        game.finalScore,
        game.gameDate
    );
    return result.lastInsertRowid;
}
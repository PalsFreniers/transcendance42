import {createGameLobby, GameData} from "./gameModel.js";
import db from './dbSqlite/db.js';


export function timeStart(gameId: number) {
    const update = db.prepare(`
        UPDATE games2 SET start_time = ? WHERE id = ?
        `);
    update.run(Date.now(), gameId);
    return true;
}

export function joinRoom(userId, roomId)
{
    const update = db.prepare(`
        UPDATE games2 SET player_two_id = ? WHERE id = ?
        `);
    update.run(userId, roomId);
    return true;
}

export function endGame(gameId: number)
{
    const update = db.prepare(`UPDATE games2 SET end_time = ? , status = 'finished' WHERE id = ?`);
    update.run(Date.now(), gameId);
    return true
}

export function forfeit(gameId: number, player: number)
{
    console.log(`game ${gameId} is finish by forfeit`);
    let up;
    if (player == 1)
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit-3' , end_time = ? , status = 'finished' WHERE id = ?`);
    else if (player == 2)
        up = db.prepare(`UPDATE games2 SET game_score = '3-forfeit' , end_time = ? , status = 'finished' WHERE id = ?`);
    else
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit-forfeit' , end_time = ? , status = 'finished' WHERE id = ?`);
    up.run(Date.now(), gameId);
    return true;
}

export function createRoom(userId: number, lobbyName: string)
{
    const newGame: GameData = {
        playerOne: userId,
        playerTwo: null,
        lobbyName: lobbyName,
        finalScore: '0-0',
        status: 'waiting',
        gameDate: new Date().toISOString(),
    };
    const gameId = createGameLobby(newGame);
    return true;
}



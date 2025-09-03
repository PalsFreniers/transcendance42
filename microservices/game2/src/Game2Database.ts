import {createGameLobby, GameData} from "./gameModel.js";
import db from './dbSqlite/db.js';
import { Manager } from './gameManager.js';


export function timeStart(gameId: number)
{
    const update = db.prepare(`
        UPDATE games2 SET start_time = ? WHERE id = ?
        `);
    update.run(new Date().toISOString(), gameId);
    return true;
}

export function joinRoom(userId, name,  roomId)
{
    const update = db.prepare(`
        UPDATE games2 SET player_two_id = ?, player_two_name = ? WHERE id = ?
        `);
    update.run(userId, name, roomId);
    return true;
}

export function getOpponentName(gameId: number, userId:number)
{
    const game = db.prepare(`
        SELECT player_one_id, player_two_id, player_one_name, player_two_name FROM games2 WHERE id = ? 
    `);
    let opponentName = game.get(gameId) as {player_one_id : number, player_two_id : number, player_one_name : string, player_two_name : string};
    if (opponentName)
    {
        if (opponentName.player_one_id != userId)
            return opponentName.player_one_name;
        if (opponentName.player_two_id != userId)
            return opponentName.player_two_name;
    }
    return null;
}

export function kickOpponentFromDB(gameId: number)
{
    const opponentId = db.prepare('SELECT player_two_id FROM games2 WHERE id = ?').get(gameId) as {player_two_id: number};
    db.prepare(`
        UPDATE games2 SET player_two_name = NULL, player_two_id = NULL WHERE id = ?
    `).run(gameId);

    return opponentId.player_two_id;
}

export function endGame(gameId: number)
{
    const update = db.prepare(`UPDATE games2 SET end_time = ? , status = 'finished' WHERE id = ?`);
    update.run(new Date().toISOString(), gameId);
    // ajouter une supretion de la game dans la base de donner et evoyer les stat a usermanagement
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
    up.run(new Date().toISOString(), gameId);
    return true;
}

export function createRoom(userId: number, name :string | null,  lobbyName: string)
{
    if (!name)
        return ;
    const newGame: GameData = {
        playerOne: userId,
        playerOneName: name,
        playerTwo: null,
        playerTwoName: null,
        lobbyName: lobbyName,
        finalScore: '0-0',
        status: 'waiting',
        gameDate: new Date().toISOString(),
    };
    const gameId = createGameLobby(newGame);
    return true;
}

export function findGame(): number
{
    const game = db.prepare(`
        SELECT id FROM games2 WHERE player_two_id IS NULL
    `).get() as { id : number};
    if (!game)
        return 0;
    console.log(game.id);
    return game.id;
}

export function deleteGameFromDB(gameId)
{
    db.prepare(`DELETE FROM games2 WHERE id = ?`).run(gameId);
    return true;
}

export function checkReconnect(io, socket, userId)
{
    const manager = Manager.getInstance();
    const id = db.prepare(`SELECT id FROM games2 WHERE status = 'playing' AND (player_one_id = ? OR player_two_id = ?)`).get(userId, userId) as { id : number } | undefined;
    if (!id)
        return io.to(socket.id).emit('no-game');
    let game = manager.getGame(id.id);
    if (game)
    {
        socket.data.gameId = id.id;
        game.reconnect(userId, socket);
    }
}

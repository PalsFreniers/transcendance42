import {createGameLobby, GameData} from "./gameModel.js";
import db from './dbSqlite/db.js';
import { Manager } from './gameManager.js';

interface GameStats {
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

export function joinRoomSolo(name,  roomId)
{
    const update = db.prepare(`
        UPDATE games2 SET player_two_name = ? WHERE id = ?
        `);
    update.run(name, roomId);
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

export function getPlayerName(gameId: number)
{
    const game = db.prepare(`
        SELECT player_one_id, player_two_id, player_one_name, player_two_name FROM games2 WHERE id = ? 
    `);
    let opponentName = game.get(gameId) as {player_one_id : number, player_two_id : number, player_one_name : string, player_two_name : string};
    if (opponentName)
    {
        return {
            playerOneId: opponentName.player_one_id,
            playerTwoId: opponentName.player_two_id,
            playerOneName: opponentName.player_one_name,
            playerTwoName: opponentName.player_two_name
        }
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

export function endGame(gameId: number, gameTime: number, playerOne: number, playerTwo: number)
{
    const update = db.prepare(`UPDATE games2 SET game_time = ? , status = 'finished', game_score = ? WHERE id = ?`);
    if (update)
        update.run(gameTime, `${playerOne} - ${playerTwo}`, gameId);
    // ajouter une supretion de la game dans la base de donner et evoyer les stat a usermanagement
    return true
}

export function forfeit(gameId: number, player: number, score: number, gameTime: number)
{
    console.log(`game ${gameId} is finish by forfeit`);
    let up;
    if (player == 1)
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit - ${score}' , game_time = ? , status = 'finished' WHERE id = ?`);
    else if (player == 2)
        up = db.prepare(`UPDATE games2 SET game_score = '${score} - forfeit' , game_time = ? , status = 'finished' WHERE id = ?`);
    else
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit - forfeit' , game_time = ? , status = 'finished' WHERE id = ?`);
    up.run(gameTime, gameId);
    return true;
}

export function checkLobbyName(lobbyName: string): number
{
    const game = db.prepare(`SELECT id FROM games2 WHERE lobby_name = ?`).get(lobbyName) as { id: number};
    if (game)
        return game.id;
    else
        return 0;
}

export function createRoom(userId: number, name :string | null,  lobbyName: string)
{
    if (!name)
        return 0;
    if (checkLobbyName(lobbyName))
        return 0;
    const newGame: GameData = {
        player_one_id: userId,
        player_one_name: name,
        player_two_id: null,
        player_two_name: null,
        lobby_name: lobbyName,
        game_score: '0-0',
        status: 'waiting',
        date: new Date().toISOString(),
    };
    return createGameLobby(newGame);
}

export function createRoomSolo(userId: number, name :string | null,  lobbyName: string)
{
    if (!name)
        return ;
    const newGame: GameData = {
        player_one_id: userId,
        player_one_name: name,
        player_two_id: -1,
        player_two_name: null,
        lobby_name: lobbyName,
        game_score: '0-0',
        status: 'waiting',
        date: new Date().toISOString(),
    };
    createGameLobby(newGame);
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

export function findGameByName(lobbyName: string): number
{
    const game = checkLobbyName(lobbyName);
    if (!game)
        return 0;
    return game;
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

export async function saveStats(gameId: number, token: string)
{
    const game = db.prepare(`SELECT * FROM games2 WHERE id = ?`).get(gameId) as GameData | undefined;
    if (game)
    {
        console.log('game found in save Stats');
        const stats : GameStats = {
            game_name : 'shifumi',
            part_name : game.lobby_name,
            part_id : gameId,
            player_one_id : game.player_one_id,
            player_two_id : game.player_two_id!,
            final_score : game.game_score!,
            round_number : 0, // a modif
            game_time : game.game_time! / 4, // temps en s
            date : game.date!
        };
        try {
            const res = await fetch('http://user-service:3001/api/user/add-stats', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
             },
                body: JSON.stringify({
                    stats
                }),
            });
            if (res.ok)
                console.log(`successful saved stats for game : ${gameId}`);
            else
                console.log('fail to save stat ');
        } catch (err) { 
            console.log(`error save stats for game : ${gameId}\n(${err})`);
        }
    }
    else
        console.log(`can't find game : ${gameId}`);
}

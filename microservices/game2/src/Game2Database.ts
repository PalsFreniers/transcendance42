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
    mmr_gain_player_one : string,
    mmr_gain_player_two : string,
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
    if (opponentId && opponentId.player_two_id > 0)
    {
        db.prepare(`
            UPDATE games2 SET player_two_name = NULL, player_two_id = NULL WHERE id = ?
        `).run(gameId);
        return opponentId.player_two_id;
    }
    else
        return -1;
}

export function endGame(gameId: number, gameTime: number, playerOne: number, playerTwo: number, round_nmb: number)
{
    const update = db.prepare(`UPDATE games2 SET game_time = ? , status = 'finished', game_score = ?, round_nmb = ? WHERE id = ?`);
    if (update)
        update.run(gameTime, `${playerOne} - ${playerTwo}`, round_nmb, gameId);
    return true
}

export function forfeit(gameId: number, player: number, score: number, gameTime: number, round_nmb: number)
{
    let up;
    if (player == 1)
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit - ${score}' , game_time = ? , status = 'finished', round_nmb = ? WHERE id = ?`);
    else if (player == 2)
        up = db.prepare(`UPDATE games2 SET game_score = '${score} - forfeit' , game_time = ? , status = 'finished', round_nmb = ? WHERE id = ?`);
    else
        up = db.prepare(`UPDATE games2 SET game_score = 'forfeit - forfeit' , game_time = ? , status = 'finished', round_nmb = ? WHERE id = ?`);
    up.run(gameTime, gameId, round_nmb);
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

export function createRoom(userId: number, name :string | null,  lobbyName: string, isPrivate: number, isSpectabled: number)
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
        round_nmb: 0,
        is_private: isPrivate,
        is_spectable: isSpectabled,
        date: new Date().toISOString(),
    };
    return createGameLobby(newGame);
}

export function createRoomSolo(userId: number, name :string | null,  lobbyName: string, isSpectable: number)
{
    if (!name)
        return ;
    const newGame: GameData = {
        player_one_id: userId,
        player_one_name: name,
        player_two_id: 0,
        player_two_name: null,
        lobby_name: lobbyName,
        game_score: '0-0',
        status: 'waiting',
        round_nmb: 0,
        is_private: 1,
        is_spectable: isSpectable,
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
    if (game) {
        socket.data.gameId = id.id;
        game.reconnect(userId, socket);
    }
}

export async function saveStats(gameId: number, token: string, mmrPlayerOne, mmrPlayerTwo)
{
    const game = db.prepare(`SELECT * FROM games2 WHERE id = ?`).get(gameId) as GameData | undefined;
    if (game)
    {
        const stats : GameStats = {
            game_name : 'shifumi',
            part_name : game.lobby_name,
            part_id : gameId,
            player_one_id : game.player_one_id,
            player_two_id : game.player_two_id!,
            final_score : game.game_score!,
            round_number : game.round_nmb, // a modif
            game_time : game.game_time! / 4, // temps en s
            mmr_gain_player_one : ((mmrPlayerOne == -2000 ? 'private' : mmrPlayerOne.toString())),
            mmr_gain_player_two : ((mmrPlayerTwo == -2000 ? 'private' : mmrPlayerTwo.toString())),
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
            if (!res.ok)
                console.error('fail to save stat ');

        } catch (err) { 
            console.error(`error save stats for game : ${gameId}\n(${err})`);
        }
    }
    else
        console.error(`can't find game : ${gameId}`);
}

export function gameIsPrivate(gameId: number): number
{
    const { is_private } = db.prepare(`
        SELECT is_private FROM games2 WHERE id = ? 
    `).get(gameId) as {is_private: number};

    return is_private;
}

export function getAllGame() {
    type Ga = { id: number; player_one_id: number }
    const allGame: Ga[] = db.prepare(`
        SELECT id, player_one_id FROM games2 WHERE player_two_id IS NULL AND is_private = 0
    `).all() as Ga[];

    return allGame;
}

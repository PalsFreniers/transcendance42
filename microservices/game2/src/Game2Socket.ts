import { Server, Socket } from "socket.io";
import { io } from "./index.js"
import {createGameLobby, GameData} from "./gameModel.js";
import db from './dbSqlite/db.js';

export function findRoom()
{

}

export function joinRoom(userId, roomId)
{
    const update = db.prepare(`
        UPDATE games2 SET player_two_id = ? WHERE id = ?
        `);
    update.run(userId, roomId);
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
    // Use createGameLobby to insert and get the ID
    const gameId = createGameLobby(newGame);
    return true;
}



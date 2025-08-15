import { GameManager } from "./gameManager.js";
import { createGameLobby } from "./gameModel.js";
import db from './dbSqlite/db.js'

export function createRoomLogic(manager: GameManager, userId: number, username: string, lobbyName: string) {
  if (!lobbyName) 
    throw new Error('lobbyName is required');

  const gameId = createGameLobby({
    playerOne: userId,
    playerTwo: null,
    lobbyName,
    finalScore: '0-0',
    status: 'waiting',
    gameDate: new Date().toISOString(),
  });

  manager.createLobby(lobbyName, gameId);
  manager.joinLobby(lobbyName, String(userId));

  return {
    gameId,
    lobbyName,
    playerOne: username,
    playerTwo: null,
    status: 'waiting',
  };
}

export function joinLobbyLogic(manager: GameManager, userId: number, username: string, playerOneName: string, gameId: number) {
  const lobby = db.prepare(`
    SELECT player_one_id, lobby_name, player_two_id
    FROM games 
    WHERE id = ?
  `).get(gameId) as { player_one_id: number; player_two_id: number | null; lobby_name: string };

  if (!lobby || !manager.findGame(String(gameId)))
    throw new Error('Lobby not found');
  if (lobby.player_two_id)
    throw new Error('Lobby is full');

  db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(userId, gameId);

  // Register in GameManager
  manager.joinLobby(lobby.lobby_name, String(userId));

  return {
    gameId,
    lobbyName: lobby.lobby_name,
    playerOne: playerOneName,
    playerTwo: username,
    status: 'ready',
  };
}

// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db.js';
import { createGameLobby} from './gameModel.js';
import { Game } from './game.js';
import { GameManager } from './gameManager.js';
import { io } from './index.js';

const manager = GameManager.getInstance();

export async function createRoom(app: FastifyInstance) {
    app.post("/api/game/create-game", async (req, reply) => {
        const user = req.user as { userId: number; username: string };
        const { lobbyName } = req.body as { lobbyName: string };
        if (!lobbyName)
            return reply.status(401).send({ error: 'lobby name cannot be null' });
        const lobbyExist = db.prepare(`SELECT 1 FROM games WHERE lobby_name = ?`).get(lobbyName);
        if (lobbyExist)
            return reply.status(402).send({ error: 'lobby already exist' });
        const inGame = db.prepare(`SELECT 1 FROM games WHERE player_one_id = ? OR player_two_id = ?`).get(user.userId, user.userId);
        if (inGame)
             return reply.status(400).send({ error: 'User is already in game' });
        const gameId = await createGameLobby({
            playerOne: user.userId,
            playerTwo: null,
            lobbyName,
            finalScore: "0-0",
            status: "waiting",
            gameDate: new Date().toISOString(),
        });
        return reply.send({ 
            success: true, 
            username: user.username, 
            gameId, 
            lobbyName,
            status: "waiting"
        });
    });
}

export async function awaitForOpponent(app: FastifyInstance) {
    app.post('/api/game/find-lobbies', async (_req, reply) => {
        const lobbies = db.prepare(`SELECT * FROM games WHERE player_two_id IS NULL`).all();
        return reply.send({ success: true, lobbies });
    });
}

export async function specGame(app: FastifyInstance) {
    app.post('/api/game/spec-lobbies', async (req, reply) => {
        const lobbies = db.prepare(`
            SELECT lobby_name, status, player_one_id, player_two_id 
            FROM games 
            WHERE status = 'playing'
        `).all();

        const enriched = lobbies.map((l: any) => {
            const p1SocketId = manager.getSocketId(l.player_one_id);
            const p2SocketId = manager.getSocketId(l.player_two_id);

            return {
                lobby_name: l.lobby_name,
                status: l.status,
                playerOne: manager.getUsernameFromSocket(p1SocketId!, io),
                playerTwo: manager.getUsernameFromSocket(p2SocketId!, io),
            };
        });

        return reply.send({ success: true, lobbies: enriched });
    });
}


export async function joinLobby(app: FastifyInstance) {
    app.post('/api/game/join-lobby', async (req, reply) => {
        const user = req.user as { userId: number, username: string };
        const { gameId } = req.body as { gameId: number };

        const lobby = db.prepare(`SELECT player_one_id, player_two_id, lobby_name FROM games WHERE id = ?`)
            .get(gameId) as { player_one_id: number; player_two_id: number | null; lobby_name: string };

        if (!lobby)
            return reply.status(404).send({ error: 'Lobby not found' });
        if (lobby.player_two_id)
            return reply.status(400).send({ error: 'Lobby is full' });
        // Update DB only
        db.prepare(`UPDATE games SET player_two_id = ? WHERE id = ?`).run(user.userId, gameId);
        return reply.send({ success: true, message: 'Joined lobby', gameId, lobbyName: lobby.lobby_name, username: user.username });
    });
}

export async function saveStats(game: Game, stats: object, token: string){
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

        } 
        catch (err) {
            console.error(`error save stats for game : ${game.gameID}\n(${err})`);
        }
}

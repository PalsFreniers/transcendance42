// gameRoutes.ts
import { FastifyInstance } from 'fastify';
import db from './dbSqlite/db.js';
import { createGameLobby} from './gameModel.js';

export async function createRoom(app: FastifyInstance) {
    app.post("/api/game/create-game", async (req, reply) => {
        const user = req.user as { userId: number; username: string };
        const { lobbyName } = req.body as { lobbyName: string };
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

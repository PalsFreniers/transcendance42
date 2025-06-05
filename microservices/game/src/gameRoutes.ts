import { FastifyInstance } from 'fastify';

export async function createRoomRoutes(app: FastifyInstance) {
  app.post('/create-game', { preHandler: app.verifJWTToken }, async (request, reply) => {
    const user = request.user as { id: number };
    const { lobbyName, opponentId } = request.body as {
      lobbyName: string;
      opponentId: number;
    };
    const playerOne = user.id;
    const playerTwo = opponentId;
    // Save minimal lobby data for now
    const stmt = db.prepare(`
      INSERT INTO games (lobby_name, player_one_id, player_two_id, game_score)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(lobbyName, playerOne, playerTwo, '0-0');
    return {
      success: true,
      gameId: result.lastInsertRowid,
    };
  });
}

export async function startGameRoutes(app:FastifyInstance) {
    app.post('/in-game', async (request, reply) => {
        return { success: true };
    });
}

export async function searchGameRoutes(app:FastifyInstance) {
    app.post('/lobby-game', async (request, reply) => {
        return { success: true };
    });
}

export async function historyGameRoutes(app:FastifyInstance) {
    app.post('/history-game', async (request, reply) => {
        return { success: true };
    });
}

export async function postGameRoutes(app:FastifyInstance) {
    app.post('/end-game', async (request, reply) => {
        return { success: true };
    });
}
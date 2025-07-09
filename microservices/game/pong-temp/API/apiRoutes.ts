import Fastify from 'fastify';
import {GameManager} from "../GameManager.ts";

export function loadFastify(manager: GameManager, fastify: Fastify) {
    fastify.get('/api/game', async (request, reply) => {
        return { message: 'Hello from Game Service!' };
    });

    fastify.post('/api/game/input', async (request, reply) => {
        const { socketId, key, action, timestamp } = request.body;

        const currGame = manager.getGameInfo(socketId);
        if (currGame === undefined) return { success: false, processed: false, error: `${socketId} is not in a game` };

        if (action === "keydown") {
            if (key == "ArrowLeft")
                manager.receiveInput(socketId, [true, currGame.getPaddle(socketId)!.getState()[1]]);
            else if (key == "ArrowRight")
                manager.receiveInput(socketId, [currGame.getPaddle(socketId)!.getState()[0], true]);
        } else if (action === "keyup") {
            if (key == "ArrowLeft")
                manager.receiveInput(socketId, [false, currGame.getPaddle(socketId)!.getState()[1]]);
            else if (key == "ArrowRight")
            manager.receiveInput(socketId, [currGame.getPaddle(socketId)!.getState()[0], false]);
        }

        return { success: true, processed: true, lookAtMe: "hello" };
    });

    fastify.get('/api/game/state', async (request, reply) => {
        const { socketId } = request.query as { socketId?: string };

        if (!socketId) {
            reply.code(400).send({ success: false, message: 'socketId query parameter is required' });
            return;
        }

        const gameInfo = manager.getGameInfo(socketId);

        if (gameInfo === undefined) { 
            reply.code(404).send({ success: false, message: `No game found for socketId: ${socketId}` });
            return;
        }

        return { success: true, gameState: gameInfo };
    });

    fastify.post('/api/game/create', async (request, reply) => {
        const { player1, player2 } = request.body;

        return {
            success: manager.registerGame(player1, player2),
            processed: true,
        };
    });

    fastify.post('/api/game/start', async (request, reply) => {
        const { player1, player2 } = request.body;

        let score = await manager.startGame(player1, player2);

        return {
            success: score.length != 0,
            processed: true,
            scores: score
        };
    });

    fastify.post('/api/game/stop', async (request, reply) => {
        const { player1, player2 } = request.body;

        return {
            success: manager.stopGame(player1, player2),
            processed: true,
        };
    });
}

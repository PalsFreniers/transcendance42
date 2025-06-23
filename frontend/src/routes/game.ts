import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export async function createRoom(app: FastifyInstance){
    app.post('/create-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3002/api/user/create-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function awaitforOpponent(app: FastifyInstance){
    app.post('/find-lobbies', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3002/api/user/find-lobbies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function joinLobby(app: FastifyInstance){
    app.post('/join-lobby', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3002/api/user/join-lobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function inGame(app: FastifyInstance){
    app.post('/in-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3002/api/user/in-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function historyGame(app: FastifyInstance){
    app.post('/history', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3002/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function postGame(app: FastifyInstance){
    app.post('/end-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://game-service:3001/api/user/end-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}
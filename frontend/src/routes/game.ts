import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export async function createRoom(app: FastifyInstance){
    app.post('/api/create-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/create-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function awaitforOpponent(app: FastifyInstance){
    app.post('/api/find-lobbies', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/find-lobbies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function joinLobby(app: FastifyInstance){
    app.post('/api/join-lobby', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/join-lobby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function inGame(app: FastifyInstance){
    app.post('/api/in-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/in-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function historyGame(app: FastifyInstance){
    app.post('/api/history', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function postGame(app: FastifyInstance){
    app.post('/api/end-game', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/end-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}
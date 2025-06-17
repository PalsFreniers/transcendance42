import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export async function friendList(app: FastifyInstance){
    app.get('/api/friend-list', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/friend-list', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function friendAdd(app: FastifyInstance){
    app.post('/api/add-friend', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/add-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function friendDelete(app: FastifyInstance){
    app.post('/api/delete-friend', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/delete-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function friendSendMsg(app: FastifyInstance){
    app.post('/api/priv-msg/:username', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/priv-msg/:username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function profil(app: FastifyInstance){
    app.get('/api/profil', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/profil', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function updateProfile(app: FastifyInstance){
    app.put('/api/update', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}

export async function deleteProfile(app: FastifyInstance){
    app.delete('/api/profil-delete', async (req, reply) => {
        const body = req.body;
        const response = await fetch('http://usermanagement:3001/api/user/profil-delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        const data = await response.json();
        reply.send(data);
    });
}
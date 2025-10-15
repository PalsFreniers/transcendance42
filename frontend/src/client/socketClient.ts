import io, { Socket } from 'socket.io-client';
import { createShifumiSocket } from './socketShifumi.js';
import { createPongSocket } from './socketPong.js';
import { notify } from './notify.js'
import { friend_select, msg_friend } from './chatClient.js'

interface ChatMessage {
    from: string;
    userId: number;
    target: number;
    for: string;
    text: string;
    timestamp: string;
}


let socketChat: Socket | null = null;
let socketPong: Socket | null = null;
let socketShifumi: Socket | null = null;

export function getUserIdFromToken(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        return payload.userId || 0;
    } catch {
        return 0;
    }
}

export function getSockets(): [Socket, Socket, Socket] {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();
    if (!socketChat) {
        socketChat = io(`wss://${import.meta.env.VITE_LOCAL_ADDRESS}:8443`, {
            path: '/chatSocket/',
            auth: { token },
            withCredentials: true,
            transports: ['websocket'],
            // autoConnect is true by default, reconnects automatically on disconnect
        });

        socketChat.on('connect', () => {
            socketChat!.emit('register-socket', userId);
        });

        socketChat.on('message', (sender) => {
            if (sender == friend_select)
                msg_friend();
            else
                notify(`new message from ${sender}`);
        });

        socketChat.on('error', (text: string) => {
            console.error(`${text}`);
        })

        socketChat.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
        });

        socketChat.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
        });

        socketChat.on('new-friend-request', (data) => {
           notify(`You get a friend request from ${data.sender_name}`);
        });
    }

    // SOCKET PONG
    if (!socketPong)
        socketPong = createPongSocket(socketPong);
    //SOCKET SHIFUMI
    if (!socketShifumi)
        socketShifumi = createShifumiSocket(socketShifumi);

    return [socketChat!, socketPong!, socketShifumi!];
}

export function getSocket(id: number) {
    switch (id) {
        case 0: return socketChat;
        case 1: return socketPong;
        case 2: return socketShifumi;
        default: return null;
    }
}


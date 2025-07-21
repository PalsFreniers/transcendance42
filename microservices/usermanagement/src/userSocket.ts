import dotenv from 'dotenv'
import io from 'socket.io-client'
import { createMessage, Message } from './chatModel.js'

dotenv.config();

export interface ChatMessage {
    from: string;
    userId: number;
    target: number;
    for: string;
    text: string;
    timestamp: string;
}

export function creatUserSocket(userId : number) {
    const socket = io(process.env.URL_CHAT, {});
    socket.on("connect", () => {
    socket.emit("register-socket", userId);
    console.log("socket registed !");
    });
    socket.on("message", (msg: ChatMessage) => {
    console.log(msg.text);
    console.log('New message !');
    });
    socket.on("disconnect", () => {
    console.log("disconnected !");
    });
}

export async function saveMessage(msg: ChatMessage) {
    const username = msg.from;
    const userId = msg.userId;
    const targetId = msg.target;
    const message = msg.text;
    const id = 0;
    const date = '';
    const newMessage: Message = {
        id,
        username,
        userId,
        targetId,
        message,
        date
    };
    const msgId = createMessage(newMessage);
    console.log(`msgId = ${msgId}`);
}
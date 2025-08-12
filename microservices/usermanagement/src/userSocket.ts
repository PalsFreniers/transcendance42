import { createMessage, Message } from './chatModel.js'

export interface ChatMessage {
    from: string;
    userId: number;
    target: number;
    for: string;
    text: string;
    timestamp: string;
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
import { getSocket } from './socketClient.js';
import { getUserIdFromToken } from './loginClient.js'

export function init() {
    const token = localStorage.getItem('token'); // TOKEN LINK FROM THE USER CONNECTED
    const chat = document.getElementById('chat-container') as HTMLDivElement | null;

    if (!chat)
        return;
    console.log
    const Send = document.getElementById('chat-input') as HTMLFormElement;
    Send.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('en attents du message !')
        const msg = (document.getElementById('message') as HTMLInputElement).value;
        console.log(' message recuperer !')
        try {
            var socket = getSocket(0);
            if (socket)
                socket.emit('message', msg, getUserIdFromToken(), 'toma');
            else
                console.error(`error 404 : sokcet not found !`);
        }
        catch (error) {
            alert('failed to send message !');
            console.error('can\'t send message', error);
        }
    });
}

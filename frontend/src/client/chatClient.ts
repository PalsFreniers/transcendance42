/*import { getSocket } from './socketClient.js'
import { getUserIdFromToken } from './loginClient.js'
import { notify } from './notify.js'

export function init() {
    const token = localStorage.getItem('token');
    const chat = document.getElementById('chat-container') as HTMLDivElement | null;

    if (!chat)
        return;
    const Send = document.getElementById('chat-input') as HTMLFormElement;

    Send.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = (document.getElementById('message') as HTMLInputElement).value;
        try {
            var socket = getSocket(0);
            if (socket) {
                socket.emit('message', msg, getUserIdFromToken(), 'toma');
            }
            else
                console.error(`error 404 : socket not found !`);
        }
        catch (error) {
            notify('failed to send message !');
            console.error('can\'t send message', error);
        }
    });
    console.log(`ended add event`)
}*/

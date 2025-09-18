import {getSocket} from "./socketClient.js";
import {myCard, gameIdShifumi, spectate} from "./socketShifumi.js"
import {getUserIdFromToken} from "./loginClient.js";
import { handleRoute} from "./navClient.js";

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const app = document.getElementById('app');
    const quit = document.getElementById('quit-button');
    const start = document.getElementById('start-button');
    const kick = document.getElementById('kick-opponent');
    const card1 = document.getElementById('card1-button');
    const card2 = document.getElementById('card2-button');
    const card3 = document.getElementById('card3-button');

    if (quit)
    {
        quit.addEventListener('click', async (e) => {
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (!socketShifumi)
                return ;
            if (spectate.spec)
                socketShifumi.emit('spec-quit');
            else
                socketShifumi.emit('quit-lobby');
            history.pushState(null, '', '/2game');
            handleRoute();
        });
    }
    if (kick)
    {
        kick.addEventListener('click', async (e) => {
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (socketShifumi)
            {
                socketShifumi.emit('kick-opponent');
            }
        });
        kick.hidden = true;
    }
    if (start) {
        start.addEventListener('click', async (e) => {
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (socketShifumi) {
                socketShifumi.emit('start-game', getUserIdFromToken());
            }
            if (kick)
                kick.hidden = true;
            if (quit)
                quit.hidden = true;
        });
        start.hidden = true;
    }
    if (card1) {
        card1.hidden = true;
        console.log('here');
        card1.addEventListener('click', async (e) => {
            if (spectate.spec)
                return ;
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (socketShifumi)
                socketShifumi.emit('play-card', gameIdShifumi, {
                    userId : getUserIdFromToken(),
                    cardId : myCard[0][0],
                    cardNumber : myCard[0][1]
                });
            card1.textContent = '[][]';
        });
    }
    if (card2) {
        card2.hidden = true;
        card2.addEventListener('click', async (e) => {
            if (spectate.spec)
                return ;
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (socketShifumi)
                socketShifumi.emit('play-card', gameIdShifumi, {
                    userId : getUserIdFromToken(),
                    cardId : myCard[1][0],
                    cardNumber : myCard[1][1]
                });
            card2.textContent = '[][]';
        });
    }
    if (card3) {
        card3.hidden = true;
        card3.addEventListener('click', async (e) => {
            if (spectate.spec)
                return ;
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (socketShifumi)
                socketShifumi.emit('play-card', gameIdShifumi, {
                    userId : getUserIdFromToken(),
                    cardId : myCard[2][0],
                    cardNumber : myCard[2][1]
                });
            card3.textContent = '[][]';
        });
    }
}
import {getSocket} from "./socketClient.js";
import {myCard, gameIdShifumi, spectate, usedCoin} from "./socketShifumi.js"
import {getUserIdFromToken} from "./loginClient.js";
import { handleRoute} from "./navClient.js";
import { notify } from "./notify.js"
import * as Math from "mathjs";


let coinClick = false;
let choseCard: number = -1;
let replaceBy: number = -1;

let tmpButtons: HTMLButtonElement[] = [];

function creatTmpButton() {
    const app = document.getElementById('container-button');
    if (app)
    {
        notify(`app find`);
        for (let i: number = 0; i < 3; i++)
        {
            const btn = document.createElement('button');
            btn.hidden = false;
            app.appendChild(btn);
            tmpButtons.push(btn);
        }
    }
}

function updateTmpButton(value: string[]) {
    tmpButtons.forEach((btn, i) => {
        if (value[i])
        {
            btn.textContent = value[i];
            btn.addEventListener('click', (e) => {
                if (choseCard == -1) {
                    choseCard = i;
                    updateTmpButton(['pierre', 'papier', 'ciseaux'])
                }
                else {
                    replaceBy = i + 1;
                    deleteTmpButton();
                }
            })
        }
    })
}

function deleteTmpButton() {
    tmpButtons.forEach(btn => btn.remove());
    tmpButtons = [];
    getSocket(2)!.emit('use-coin', gameIdShifumi, myCard[choseCard], replaceBy);
}

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const quit = document.getElementById('quit-button');
    const next = document.getElementById('change-player');
    const start = document.getElementById('start-button');
    const kick = document.getElementById('kick-opponent');
    const card1 = document.getElementById('card1-button');
    const card2 = document.getElementById('card2-button');
    const card3 = document.getElementById('card3-button');
    const coin = document.getElementById('coin-button');

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
    if (next)
    {
        if (!spectate.spec)
            next.hidden = true;
        next.addEventListener('click', async  (e) => {
            if (spectate.spec == true)
            {
                next.hidden = false;
                if (spectate.player == 1)
                    spectate.player = 2;
                else
                    spectate.player = 1;
                const sock = getSocket(2);
                if (sock)
                    sock.emit('change-player-spec', spectate.player, gameIdShifumi)
            }
        })
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
    if (start)
    {
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
    if (card1)
    {
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
    if (card2)
    {
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
    if (card3)
    {
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
    if (coin)
    {
        coin.hidden = true;
        coin.addEventListener('click', async (e) => {
            e.preventDefault();
            if (spectate.spec || usedCoin)
                return ;

            const result = Math.floor(Math.random() * 100) % 2;
            // lancer l'animation
            if (result == 1)
            {
                notify(`result = ${result}`);
                creatTmpButton();
                updateTmpButton(['card 1', 'card 2', 'card 3']);
            }
            else
                notify('pile');
        });
    }
}
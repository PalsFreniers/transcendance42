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

async function animationCoin(result: number) {
  const text = ["pile", "face"];
  const coin = document.getElementById("coin-button");

  if (!coin)
    return;

  let flips = 0;
  const maxFlips = 10;
  const delay = 200;

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      coin.classList.toggle("flip");
      coin.textContent = text[flips % 2];

      flips++;
      if (flips >= maxFlips) {
        clearInterval(interval);

        coin.classList.remove("flip");
        coin.textContent = text[result];

        resolve();
      }
    }, delay);
  });
}



function creatTmpButton() {
    const app = document.getElementById('coin-button');
    if (app)
    {
        for (let i: number = 0; i < 3; i++)
        {
            const btn = document.createElement('button');
            btn.hidden = false;
            btn.classList.add("card")
            app.insertAdjacentElement('afterend', btn);
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
                    updateTmpButton(["Rock", "Paper", "Scissors"])
                }
                else {
                    replaceBy = i + 1;
                    deleteTmpButton();
                    getSocket(2)!.emit('use-coin', gameIdShifumi, myCard[choseCard], replaceBy);
                    hiddenButtonCard(false);
                }
            })
        }
    })
}

function deleteTmpButton() {
    if (!tmpButtons)
        return ;
    tmpButtons.forEach(btn => btn.remove());
    tmpButtons = [];
}

function hiddenButtonCard(hidden: boolean) {
    const butts = document.querySelectorAll<HTMLButtonElement>(".card");
    butts.forEach((btn) => {
       btn.style.display = hidden ? 'none' : 'block';
    });
    if (hidden == false) {
        const coin = document.getElementById("coin-button");
        coin!.style.display = 'none';
    }
}

export function init() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    const forfeit = document.getElementById('forfeit-button');
    const quit = document.getElementById('quit-button');
    const next = document.getElementById('change-player');
    const start = document.getElementById('start-button');
    const kick = document.getElementById('kick-opponent');
    const card1 = document.getElementById('card1-button');
    const card2 = document.getElementById('card2-button');
    const card3 = document.getElementById('card3-button');
    const coin = document.getElementById('coin-button');
    const info = document.getElementById('info-coin');

    if (forfeit) {
        forfeit.style.display = 'none';
        forfeit.addEventListener( 'click', async (e) => {
            e.preventDefault();
            const sock = getSocket(2);
            if (sock)
                sock.emit('forfeit');
        });
    }

    if (info)
    {
        info.addEventListener('mouseenter', async (e) => {
            e.preventDefault();
            const text = document.getElementById("div-info");
            text!.classList.remove("hidden");
            text!.classList.add("visible");
        })

        info.addEventListener('mouseleave', async (e) => {
            e.preventDefault();
            const text = document.getElementById("div-info");
            text!.classList.add("hidden");
            text!.classList.remove("visible");
        })
    }

    if (quit)
    {
        quit.style.display = 'block';
        quit.addEventListener('click', async (e) => {
            e.preventDefault();
            const socketShifumi = getSocket(2);
            if (!socketShifumi)
                return ;
            if (spectate.spec)
                socketShifumi.emit('spec-quit');
            else
                socketShifumi.emit('quit-lobby');
            history.pushState(null, '', '/shifumi-lobby');
            handleRoute();
        });
    }
    if (next)
    {
        if (!spectate.spec) {
            next.style.display = 'none';
        }
        else
            next.style.display = 'block';
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
            if (socketShifumi) {
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
            if (forfeit)
                forfeit.style.display = 'block';
        });
        start.hidden = true;
    }
    if (card1)
    {
        card1.hidden = true;
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
    
    function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
    if (coin)
    {
        coin.hidden = true;
        coin.addEventListener('click', async (e) => {
            e.preventDefault();
            if (spectate.spec || usedCoin)
                return ;
            choseCard = -1;
            replaceBy = -1;
            const result = Math.floor(Math.random() * 100) % 2;
            deleteTmpButton();
            await animationCoin(result);
            await sleep(1000);
            // lancer l'animation
            if (result == 1) {
                hiddenButtonCard(true);
                creatTmpButton();
                updateTmpButton(['card 1', 'card 2', 'card 3']);
            }
            else {
                choseCard = Math.floor(Math.random() * 30) % 3;
                replaceBy = (Math.floor(Math.random() * 30) % 3) + 1;
                getSocket(2)!.emit('use-coin', gameIdShifumi, myCard[choseCard], replaceBy);
                const coin = document.getElementById("coin-button");
                coin!.style.display = 'none';
            }
            const coin = document.getElementById("coin-button");
            coin!.style.display = 'none';
        });
    }
}
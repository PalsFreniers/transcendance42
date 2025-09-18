import io, { Socket } from 'socket.io-client';
import { handleRoute } from "./navClient.js";
import { getUserIdFromToken } from './socketClient.js';
import { notify } from './notify.js'

export let gameIdShifumi: number = -1;
export let myCard: [number, number][] = [];
export let opponentName: string | null = null;

export let spectate: {
    playerName: string | null,
    player?: number,
    playerCard: [number, number][] | null,
    playedCard: [number, number] | null,
    spec: boolean
} = {
    playerName: null,
    player: 0,
    playerCard: null,
    playedCard: null,
    spec: false
}

export function createShifumiSocket(socketShifumi: Socket | null) {
    
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();

    /******************************************************************************/
    /*                                                                            */
    /*                                base  socket                                */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi = io(`http://${import.meta.env.VITE_LOCAL_ADDRESS}:3003`, {
      path: '/shifumiSocket/',
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
    });

    socketShifumi.on('connect', () => {
      console.log(`Socket (${socketShifumi!.id}) connected!`);
      // On first connect and reconnects, emit register
      socketShifumi!.emit('register-socket', userId);
    });

    socketShifumi.on('disconnect', (reason) => {
      notify(`Socket disconnected: ${reason}`);
    });

    socketShifumi.on('reconnect', () => {
      history.pushState(null, '', '/shifumi');
      handleRoute();
      console.log('reconnect !');
    });

    /******************************************************************************/
    /*                                                                            */
    /*                                room  status                                */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('roomInfo', (info: string) => {
      notify(info);
    });

    socketShifumi.on('roomJoined', (roomId: number) => {
      history.pushState(null, '', '/shifumi');
      handleRoute();
      socketShifumi.emit('ready');
      console.log(`you join room ${roomId}`)
    });

    socketShifumi.on('opponent-found', (numPlayer: number, opponentName : string) => {
      const button = document.getElementById('start-button');
      const kick = document.getElementById('kick-opponent');
      const opponent = document.getElementById('opponent-name');

      if (spectate.spec)
          return notify("game full !");

      if (opponent)
          opponent.textContent = `your opponent is ${opponentName}`;

      if (button && numPlayer == 1) {
        button.hidden = false;
      }

      if (kick && numPlayer == 1)
          kick.hidden = false;
      notify('opponent found !');
    });

    socketShifumi.on('kick', () => {
        history.pushState(null, '', '/2game');
        handleRoute();
        notify('you have been kick !');
    });

    socketShifumi.on('opponent-leave', (reason : string) => {
        const start = document.getElementById('start-button');
        const kick = document.getElementById('kick-opponent');
        const opponent = document.getElementById('opponent-name');

        if (start)
            start.hidden = true;
        if (kick)
            kick.hidden = true;
        if (opponent) {
            if (reason === 'kick')
                opponent.textContent = 'opponent kicked';
        }// desafichier le bouton start et le bouton kick
    });

    /******************************************************************************/
    /*                                                                            */
    /*                                game  status                                */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('started-game', (gameId: number) => {
        gameIdShifumi = gameId; // a mettre aussi dans la fonction pour rerejoindre un partie
        console.log(`game (${gameId}) started`);

        // a passer dans un fonction a appeler pour rendre le code plus propre 
        const start = document.getElementById('start-button');
        const quit = document.getElementById('quit-button');
        const card1 = document.getElementById('card1-button');
        const card2 = document.getElementById('card2-button');
        const card3 = document.getElementById('card3-button');
        const pointsText = document.getElementById('points');

        if (pointsText)
            pointsText.textContent = `0 - 0`
        if (quit)
            quit.hidden = true;
        if (start)
            start.hidden = true;
        if (card1)
            card1.hidden = false;
        if (card2)
            card2.hidden = false;
        if (card3)
            card3.hidden = false;
    });

    socketShifumi.on('wait-opponent', (name: string) => {
      notify(`${name} as been disconnected he have 15 seconds for rejoined the game`);
    });

    socketShifumi.on('opponent-reconnected', (name) => {
      notify(`${name} as been reconnected`);
    });

    socketShifumi.on('game-ended', () => {
        console.log(`game ended`);
        gameIdShifumi = 0;
        history.pushState(null, '', '/2game');
        handleRoute();
    });

    socketShifumi.on('game-spectate', (gameId, player, opponentName) => {
        const opponent = document.getElementById('opponent-name')

        gameIdShifumi = gameId;
        spectate = {
            playerName: player.name,
            player: player.player,
            playerCard: null,
            playedCard: null,
            spec: true
        };
        if (opponent)
            opponent.textContent = `${player.name} versus ${opponentName}`;
    });

    /******************************************************************************/
    /*                                                                            */
    /*                           round or game win/lose                           */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('winRound', (myPoints: number, opponentPoints: number) => {
        const opponentPlayedCard = document.getElementById('opponent-card-played') as HTMLElement;
        const playedCard = document.getElementById('card-played') as HTMLElement;
        const pointsText = document.getElementById('points');

        if (pointsText)
            pointsText.textContent = `${myPoints} - ${opponentPoints}`;
        if (playedCard)
            playedCard.textContent = '';
        if (opponentPlayedCard)
            opponentPlayedCard.textContent = '';
    });

    socketShifumi.on('loseRound', (myPoints: number, opponentPoints: number) => {
        const opponentPlayedCard = document.getElementById('opponent-card-played') as HTMLElement;
        const playedCard = document.getElementById('card-played') as HTMLElement;
        const pointsText = document.getElementById('points');

        if (pointsText)
            pointsText.textContent = `${myPoints} - ${opponentPoints}`;
        if (playedCard)
            playedCard.textContent = '';
        if (opponentPlayedCard)
            opponentPlayedCard.textContent = '';
    });

    socketShifumi.on('drawRound', () => {
        const opponentPlayedCard = document.getElementById('opponent-card-played') as HTMLElement;
        const playedCard = document.getElementById('card-played') as HTMLElement;

        if (playedCard)
            playedCard.textContent = '';
        if (opponentPlayedCard)
            opponentPlayedCard.textContent = '';
    }) // a ajouter dans le manager game

    socketShifumi.on('equal', () => {
        const opponentPlayedCard = document.getElementById('opponent-card-played') as HTMLElement;
        const playedCard = document.getElementById('card-played') as HTMLElement;

        notify('no one win this round');
        if (playedCard)
            playedCard.textContent = '';
        if (opponentPlayedCard)
            opponentPlayedCard.textContent = '';
    }); // nom a changer ?

    socketShifumi.on('forfeit', (player : string) => {
      notify(`${player} as declared forfeit`);
    });

    socketShifumi.on('win-game', () => {
      console.log('you win this game !')
    });

    socketShifumi.on('lose-game', () => {
        console.log('you lose this game !');
    });

    socketShifumi.on('draw-game', () => {
        console.log('you lose this game !');
    });

    /******************************************************************************/
    /*                                                                            */
    /*                              game  management                              */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('card', (cards: [number, number][]) => {
        if (spectate.spec)
            spectate.playerCard = cards;
        else
            myCard = cards;

        cards.forEach((card, index) => {
            const button = document.getElementById(`card${index + 1}-button`);
            if (button) {
                button.textContent = `[${card[0]}][${card[1]}]`;
            }
        });

        const len = cards.length;

        for (let i = 0; i < 3; i++)
        {
            const button = document.getElementById(`card${i + 1}-button`)
            if (button) {
                if (i < len)
                    button.hidden = false;
                else
                    button.hidden = true;
            }
        }
        console.log('received card !');
    });

    socketShifumi.on('end-time', () => {
      const random:number = Math.floor(Math.random() * myCard.length);
      const card = document.getElementById(`card${random + 1}-button`);

      socketShifumi.emit('play-card', gameIdShifumi, {
        userId : getUserIdFromToken(),
        cardId : myCard[random][0],
        cardNumber : myCard[random][1]
      });
      if (card)
        card.textContent = '[][]'; // a changer par l'affichage basique 
    });

    socketShifumi.on('opponent-played-card', (card: [number, number]) => {
        const playedCard = document.getElementById('opponent-card-played') as HTMLElement;

        if (playedCard)
            playedCard.textContent = `[${card[0]}][${card[1]}]`;
    });

    socketShifumi.on('played-card', ( cards: [ number, number ] ) => {
        const playedCard = document.getElementById('card-played') as HTMLElement;

        if (playedCard)
            playedCard.textContent = `[${cards[0]}][${cards[1]}]`;

        if (spectate.spec)
        {
            spectate.playerCard?.forEach((card, index) => {
                if (card[0] == cards[0] && card[1] == cards[1]) {
                    const button = document.getElementById(`card${index + 1}-button`);
                    if (button)
                        button.textContent = '[][]';
                }
            })
        }
    });

    socketShifumi.on('score', (myPoints: number, opponentPoints: number) => {
        const pointsText = document.getElementById('points');

        if (pointsText)
            pointsText.textContent = `${myPoints} - ${opponentPoints}`;
    });

    // ajouter le lancement/resulta de la piece pour changer une carte

    // ajouter le passage de l'information sur la piece utiliser par l'adversaire

    /******************************************************************************/
    /*                                                                            */
    /*                              error management                              */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('no-game', () => {
      const path = window.location.pathname;
      if (path === '/shifumi')
      {
        history.pushState(null, '', '/2game')
        handleRoute();
      }
    });

    socketShifumi.on('error', (error: string) => {
      notify(error);
      console.log(error);
    });

    socketShifumi.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    return socketShifumi;
}
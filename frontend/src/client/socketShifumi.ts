import io, { Socket } from 'socket.io-client';
import { handleRoute} from "./navClient.js";
import { getUserIdFromToken } from './socketClient.js';

export let gameIdShifumi: number = -1;
export let myCard: [number, number][] = [];

export function createShifumiSocket(socketShifumi: Socket | null) {
    
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();

    /******************************************************************************/
    /*                                                                            */
    /*                                base  socket                                */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi = io('http://localhost:3003', {
      path: '/shifumiSocket/',
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
    });

    socketShifumi.on('connect', () => {
      console.log(`Socket (${socketShifumi!.id}) connected!`);
      // On first connect and reconnects, emit register
      socketShifumi!.emit('register-socket', userId); // peut etre a enlever
    });

    socketShifumi.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    // ajouter la reconexion en cas de recharge de page

    /******************************************************************************/
    /*                                                                            */
    /*                                room  status                                */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('roomInfo', (info: string) => {
      alert(info);
    });

    socketShifumi.on('roomJoined', (roomId: number) => {
      history.pushState(null, '', '/shifumi');
      handleRoute();
      console.log(`you join room ${roomId}`)
    });

    socketShifumi.on('opponent-found', (username: string) => {
      console.log('opponent found !');
      const button = document.getElementById('start-button');
      const opponent = document.getElementById('opponent-name');
      if (button) {
        button.hidden = false;
      }
      if (opponent)
        opponent.textContent = `your opponent is ${username}`;
    });

    // ajouter la gestion du l'adversaire qui quitte la partie

    // ajouter la gestion du joueur quittant la partie


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
        const card1 = document.getElementById('card1-button');
        const card2 = document.getElementById('card2-button');
        const card3 = document.getElementById('card3-button');
        if (start)
        start.hidden = true;
        if (card1)
        card1.hidden = false;
        if (card2)
        card2.hidden = false;
        if (card3)
        card3.hidden = false;
    });

    // ajouter le jeu en pause/attente de la reconexion de l'adversaire 

    socketShifumi.on('game-ended', () => {
        console.log(`game ended`);
        gameIdShifumi = 0;
    });

    /******************************************************************************/
    /*                                                                            */
    /*                           round or game win/lose                           */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('winRound', (myPoints: number, opponentPoints: number) => {
        const pointsText = document.getElementById('points');
        if (pointsText)
            pointsText.textContent = `${myPoints} - ${opponentPoints}`;
    });

    socketShifumi.on('loseRound', (myPoints: number, opponentPoints: number) => {
      const pointsText = document.getElementById('points');
      if (pointsText)
        pointsText.textContent = `${myPoints} - ${opponentPoints}`;
    });

    socketShifumi.on('forfeit', (player : String) => {
      console.log(`player ${player} as declared forfeit`);
    });

    // ajouter l'agaliter sur un round

    // ajouter win game

    // ajouter lose game

    /******************************************************************************/
    /*                                                                            */
    /*                              game  management                              */
    /*                                                                            */
    /******************************************************************************/
    
    socketShifumi.on('card', (card: [number, number][]) => {
      myCard = card;
      // a passer dans un fonction a appeler pour rendre le code plus propre 
      const card1 = document.getElementById('card1-button');
      if (card1)
        card1.textContent = `[${card[0][0]}][${card[0][1]}]`;
      const card2 = document.getElementById('card2-button');
      if (card2)
        card2.textContent = `[${card[1][0]}][${card[1][1]}]`;
      const card3 = document.getElementById('card3-button');
      if (card3)
        card3.textContent = `[${card[2][0]}][${card[2][1]}]`;
    });

    // ajouter la fin du temps de choix de carte

    // ajouter la carte jouer par l'adversaire

    // ajouter le lancement de la piece pour changer une carte

    // ajouter le passage de l'information sur la piece utiliser par l'adversaire

    /******************************************************************************/
    /*                                                                            */
    /*                              error management                              */
    /*                                                                            */
    /******************************************************************************/

    socketShifumi.on('error', (error: string) => {
        console.log(error);
    });

    socketShifumi.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    return socketShifumi;
}
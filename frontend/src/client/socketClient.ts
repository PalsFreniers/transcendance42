import io, { Socket } from 'socket.io-client';
import { handleRoute} from "./navClient.js";

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
export let gameIdShifumi: number = -1;
export let myCard: [number, number][] = [];

function getUserIdFromToken(): number {
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
  if (!socketChat && !socketPong) {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();
    // SOCKET CHAT
    socketChat = io('http://localhost:3001', {
      path: '/chatSocket/',
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
      // autoConnect is true by default, reconnects automatically on disconnect
    });
    socketChat.on('connect', () => {
      console.log(`Socket (${socketChat!.id}) connected!`);
      // On first connect and reconnects, emit register
      socketChat!.emit('register-socket', userId);
    });

    socketChat.on('message', (msg: ChatMessage) => {
      console.log(`${msg.from} (${msg.timestamp}) : ${msg.text}`);
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


    // SOCKET PONG
    socketPong = io('http://localhost:3002', {
      path: '/pongSocket/',
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
    });
    socketPong.on('connect', () => {
      console.log(`Socket (${socketPong!.id}) connected!`);
      // On first connect and reconnects, emit register
      socketPong!.emit('register-socket', userId);
    });

    socketPong.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketPong.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    //SOCKET SHIFUMI

    socketShifumi = io('http://localhost:3003', {
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

    socketShifumi.on('roomJoined', (roomId: number) => {
      history.pushState(null, '', '/shifumi');
      handleRoute();
      // alert(`you join room ${roomId}`);
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

    socketShifumi.on('started-game', (gameId: number) => {
      gameIdShifumi = gameId;
      console.log(`game (${gameId}) started`);
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

    socketShifumi.on('roomInfo', (info: string) => {
      alert(info);
    });

    socketShifumi.on('error', (error: string) => {
      // alert(error);
      console.log(error);
    });

    socketShifumi.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketShifumi.on('game-ended', () => {
      console.log(`game ended`);
      gameIdShifumi = 0;
    });

    socketShifumi.on('card', (card: [number, number][]) => {
      myCard = card;
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

    socketShifumi.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
  }

  return [socketChat!, socketPong!, socketShifumi!];
}

export function getSocket(id:number)
{
  switch (id)
  {
    case 0: return socketChat;
    case 1: return socketPong;
    case 2: return socketShifumi;
    default: return null;
  }
}


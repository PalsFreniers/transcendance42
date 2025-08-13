import io, { Socket } from 'socket.io-client';

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
      alert(`you join room ${roomId}`);
      console.log(`you join room ${roomId}`)
    });

    socketShifumi.on('roomInfo', (info: string) => {
      alert(info);
    });

    socketShifumi.on('error', (error: string) => {
      alert(error);
      console.log(error);
    });

    socketShifumi.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
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


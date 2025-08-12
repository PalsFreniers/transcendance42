import io, { Socket } from 'socket.io-client';

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

    socketShifumi.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketShifumi.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
  }

  return [socketChat!, socketPong!, socketShifumi!];
}
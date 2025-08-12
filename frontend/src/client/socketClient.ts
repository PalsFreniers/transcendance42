import io, { Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

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

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = localStorage.getItem('token');
    const userId = getUserIdFromToken();

    socketInstance = io('http://localhost:3001', {
      path: "/chatSocket/",
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
      // autoConnect is true by default, reconnects automatically on disconnect
    });

    socketInstance.on('connect', () => {
      console.log(`Socket (${socketInstance!.id}) connected!`);
      // On first connect and reconnects, emit register
      socketInstance!.emit('register-socket', userId);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
  }

  return socketInstance;
}
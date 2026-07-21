import { io, Socket } from 'socket.io-client';

const NOTIFICACIONES_URL = import.meta.env.VITE_NOTIFICACIONES_URL || 'http://localhost:3081';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(NOTIFICACIONES_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 10000
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
}

export function isSocketConnected(): boolean {
    return socket?.connected || false;
}

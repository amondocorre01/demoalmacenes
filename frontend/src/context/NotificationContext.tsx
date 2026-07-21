import React, { createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notificacion, NuevaNotificacion } from '../types/notificacion';

interface NotificationContextValue {
    notificaciones: Notificacion[];
    noLeidas: number;
    total: number;
    page: number;
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    conectado: boolean;
    error: { type: 'connection' | 'fetch' | 'server'; message: string; timestamp: number } | null;
    clearError: () => void;
    latestNotification: Notificacion | null;
    clearLatestNotification: () => void;
    cargarNotificaciones: (p?: number, pageSize?: number, q?: string) => Promise<void>;
    cargarMas: () => Promise<void>;
    cargarNoLeidas: () => Promise<void>;
    marcarLeida: (id: number) => Promise<void>;
    marcarTodasLeidas: () => Promise<void>;
    desconectar: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const notifications = useNotifications();
    return (
        <NotificationContext.Provider value={notifications}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotificationContext debe usarse dentro de un NotificationProvider');
    }
    return ctx;
}

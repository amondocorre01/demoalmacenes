import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '../config/notificaciones';
import type { Notificacion, NuevaNotificacion, TipoNotificacion } from '../types/notificacion';

const NOTIFICACIONES_URL = import.meta.env.VITE_NOTIFICACIONES_URL || 'http://localhost:3081';

interface NotificationError {
    type: 'connection' | 'fetch' | 'server';
    message: string;
    timestamp: number;
}

interface Options {
    onNotificacion?: (data: NuevaNotificacion) => void;
    onConexionCambio?: (conectado: boolean) => void;
}

export function useNotifications(options: Options = {}) {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [conectado, setConectado] = useState(false);
    const [error, setError] = useState<NotificationError | null>(null);
    const [latestNotification, setLatestNotification] = useState<Notificacion | null>(null);
    const PAGE_SIZE = 20;
    const opcionesRef = useRef(options);
    opcionesRef.current = options;
    const markedIdsRef = useRef<Set<number>>(new Set());
    const markedAllRef = useRef(false);

    const clearError = useCallback(() => setError(null), []);
    const clearLatestNotification = useCallback(() => setLatestNotification(null), []);

    useEffect(() => {
        const socket = getSocket();

        socket.on('connect', () => {
            setConectado(true);
            setError(null);
            opcionesRef.current.onConexionCambio?.(true);
        });

        socket.on('disconnect', (reason: string) => {
            setConectado(false);
            opcionesRef.current.onConexionCambio?.(false);
            if (reason === 'io server disconnect') {
                setError({
                    type: 'connection',
                    message: 'Desconectado por el servidor. Intentando reconectar...',
                    timestamp: Date.now()
                });
            }
        });

        socket.on('connect_error', (err: Error) => {
            setConectado(false);
            setError({
                type: 'connection',
                message: `Error de conexion: ${err.message || 'No se pudo conectar al servidor de notificaciones'}`,
                timestamp: Date.now()
            });
        });

        socket.on('notificacion:nueva', (data: NuevaNotificacion) => {
            const mensaje: Notificacion = {
                FECHA_REGISTRO: data.timestamp,
                ID_NOTIFICACION: data.ID_NOTIFICACION,
                ID_USUARIO_DESTINO: 0,
                ID_USUARIO_ORIGEN: data.usuarioOrigen,
                LEIDA: false,
                MENSAJE: data.mensaje,
                REFERENCIA_ID: data.referenciaId,
                REFERENCIA_MODULO: data.referenciaModulo,
                TIPO: data.tipo,
                TITULO: data.titulo
            };
            setNotificaciones(prev => [mensaje, ...prev]);
            setNoLeidas(prev => prev + 1);
            setTotal(prev => prev + 1);
            setLatestNotification(mensaje);
            opcionesRef.current.onNotificacion?.(data);
        });

        socket.on('notificacion:leida', (data: { idNotificacion: number }) => {
            if (markedIdsRef.current.has(data.idNotificacion)) {
                markedIdsRef.current.delete(data.idNotificacion);
                return;
            }
            setNotificaciones(prev =>
                prev.map(n => n.ID_NOTIFICACION === data.idNotificacion
                    ? { ...n, LEIDA: true }
                    : n
                )
            );
            setNoLeidas(prev => Math.max(0, prev - 1));
        });

        socket.on('notificacion:todasLeidas', () => {
            if (markedAllRef.current) {
                markedAllRef.current = false;
                return;
            }
            setNotificaciones(prev => prev.map(n => ({ ...n, LEIDA: true })));
            setNoLeidas(0);
        });

        socket.on('error', (err: { message: string }) => {
            setError({
                type: 'server',
                message: err.message || 'Error del servidor de notificaciones',
                timestamp: Date.now()
            });
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('notificacion:nueva');
            socket.off('notificacion:leida');
            socket.off('notificacion:todasLeidas');
            socket.off('error');
        };
    }, []);

    const cargarNotificaciones = useCallback(async (p = 1, pageSize = PAGE_SIZE, q = '') => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) });
            if (q) params.set('q', q);
            const res = await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones?${params}`, { credentials: "include" });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            if (data.success) {
                setNotificaciones(data.datos);
                setNoLeidas(data.noLeidas);
                setTotal(data.total);
                setPage(p);
                setHasMore(data.datos.length === pageSize && (p * pageSize) < data.total);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar notificaciones';
            setError({ type: 'fetch', message, timestamp: Date.now() });
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarMas = useCallback(async () => {
        try {
            setLoadingMore(true);
            setError(null);
            const nextPage = page + 1;
            const params = new URLSearchParams({ page: String(nextPage), page_size: String(PAGE_SIZE) });
            const res = await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones?${params}`, { credentials: "include" });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            if (data.success) {
                setNotificaciones(prev => [...prev, ...data.datos]);
                setPage(nextPage);
                setHasMore(data.datos.length === PAGE_SIZE && (nextPage * PAGE_SIZE) < data.total);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar mas notificaciones';
            setError({ type: 'fetch', message, timestamp: Date.now() });
        } finally {
            setLoadingMore(false);
        }
    }, [page]);

    useEffect(() => {
        cargarNotificaciones();
    }, [cargarNotificaciones]);

    const cargarNoLeidas = useCallback(async () => {
        try {
            const res = await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones/no-leidas`, { credentials: "include" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) setNoLeidas(data.total);
        } catch (err) {
            console.error('[Notif] Error al contar:', err);
        }
    }, []);

    const marcarLeida = useCallback(async (id: number) => {
        try {
            markedIdsRef.current.add(id);
            await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones/${id}/leer`, {
                method: 'PATCH', credentials: "include"
            });
            setNotificaciones(prev =>
                prev.map(n => n.ID_NOTIFICACION === id ? { ...n, LEIDA: true } : n)
            );
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch (err) {
            markedIdsRef.current.delete(id);
            console.error('[Notif] Error al marcar leida:', err);
        }
    }, []);

    const marcarTodasLeidas = useCallback(async () => {
        try {
            markedAllRef.current = true;
            await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones/leer-todas`, {
                method: "PATCH",
                credentials: "include",
            });
            setNotificaciones(prev => prev.map(n => ({ ...n, LEIDA: true })));
            setNoLeidas(0);
        } catch (err) {
            markedAllRef.current = false;
            console.error('[Notif] Error al marcar todas:', err);
        }
    }, []);

    const desconectar = useCallback(() => {
        disconnectSocket();
        setConectado(false);
    }, []);

    return {
        notificaciones,
        noLeidas,
        total,
        page,
        hasMore,
        loading,
        loadingMore,
        conectado,
        error,
        clearError,
        latestNotification,
        clearLatestNotification,
        cargarNotificaciones,
        cargarMas,
        cargarNoLeidas,
        marcarLeida,
        marcarTodasLeidas,
        desconectar
    };
}

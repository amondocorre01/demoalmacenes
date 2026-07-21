import React, { useState, useEffect, useRef, useCallback } from 'react';
import NotificationPanel from './NotificationPanel';
import { useNotificationContext } from '../../context/NotificationContext';

export default function NotificationBell() {
    const { notificaciones, noLeidas, total, loading, loadingMore, hasMore, conectado, marcarLeida, marcarTodasLeidas, cargarMas } = useNotificationContext();
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleClose = useCallback(() => {
        setClosing(true);
        timerRef.current = setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 180);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        if (open && !closing) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, closing, handleClose]);

    const handleToggle = () => {
        if (open) {
            handleClose();
        } else {
            setOpen(true);
            setClosing(false);
        }
    };

    return (
        <div ref={panelRef} className="relative">
            <button
                onClick={handleToggle}
                className="group relative p-2.5 rounded-xl transition-all duration-300 ease-out hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 hover:shadow-lg hover:shadow-primary/10 hover:scale-105 active:scale-95"
                title={conectado ? 'Notificaciones' : 'Desconectado'}
            >
                <span className="material-symbols-outlined text-[22px] text-gray-500 dark:text-zinc-400 transition-all duration-300 group-hover:text-primary group-hover:drop-shadow-[0_0_6px_rgba(157,0,19,0.3)]">
                    notifications
                </span>
                {noLeidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[8px] font-black rounded-full shadow-lg shadow-red-500/40 border-2 border-white dark:border-zinc-900 animate-bounce">
                        {noLeidas > 99 ? '99+' : noLeidas}
                    </span>
                )}
                {!conectado && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 bg-amber-400 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                )}
                {open && (
                    <span className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse pointer-events-none" />
                )}
            </button>
            {(open || closing) && (
                <NotificationPanel
                    isClosing={closing}
                    onClose={handleClose}
                />
            )}
        </div>
    );
}

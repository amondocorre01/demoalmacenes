import React, { useEffect, useState, useCallback } from 'react';
import { useNotificationContext } from '../../context/NotificationContext';
import { getTipoConfig } from '../../config/notificacionStyles';
import type { Notificacion } from '../../types/notificacion';

export default function NotificationToast() {
    const { latestNotification, clearLatestNotification } = useNotificationContext();
    const [visible, setVisible] = useState(false);
    const [current, setCurrent] = useState<Notificacion | null>(null);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            setCurrent(null);
            clearLatestNotification();
        }, 300);
    }, [clearLatestNotification]);

    useEffect(() => {
        if (latestNotification && latestNotification.ID_NOTIFICACION !== current?.ID_NOTIFICACION) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setCurrent(latestNotification);
            setVisible(true);
            timerRef.current = setTimeout(dismiss, 5000);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [latestNotification, current, dismiss]);

    const handleClick = () => {
        if (!current) return;
        if (current.REFERENCIA_MODULO && current.REFERENCIA_ID) {
            window.location.href = `/${current.REFERENCIA_MODULO}/${current.REFERENCIA_ID}`;
        }
        dismiss();
    };

    if (!current) return null;

    const config = getTipoConfig(current.TIPO);

    return (
        <div
            className={`fixed bottom-6 right-6 z-[1500] w-[360px] transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
        >
            <div
                onClick={handleClick}
                className={`flex items-start gap-3 px-4 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border rounded-xl shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${config.darkBg}`}
            >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}>
                    <span className={`material-symbols-outlined text-base ${config.color}`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest truncate">
                        {current.TITULO}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                        {current.MENSAJE}
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); dismiss(); }}
                    className="shrink-0 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px] text-zinc-400">close</span>
                </button>
            </div>
        </div>
    );
}

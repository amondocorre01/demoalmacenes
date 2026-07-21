import React, { useEffect, useState } from 'react';

interface Props {
    error: { type: 'connection' | 'fetch' | 'server'; message: string; timestamp: number } | null;
    onDismiss: () => void;
}

export default function NotificationError({ error, onDismiss }: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (error) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
            }, 6000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [error, onDismiss]);

    if (!error) return null;

    const iconMap = {
        connection: 'cloud_off',
        fetch: 'sync_problem',
        server: 'error'
    };

    return (
        <div
            className={`fixed top-20 right-4 z-[1500] max-w-sm transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
        >
            <div className="flex items-start gap-3 px-4 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-red-200/50 dark:border-red-800/30 rounded-xl shadow-lg shadow-red-500/10">
                <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-red-500">{iconMap[error.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                        {error.type === 'connection' ? 'Conexion' : error.type === 'fetch' ? 'Error' : 'Servidor'}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                        {error.message}
                    </p>
                </div>
                <button
                    onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
                    className="shrink-0 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px] text-zinc-400">close</span>
                </button>
            </div>
        </div>
    );
}

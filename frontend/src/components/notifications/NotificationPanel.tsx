import React from 'react';
import NotificationItem from './NotificationItem';
import { useNotificationContext } from '../../context/NotificationContext';

interface Props {
    isClosing: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ isClosing, onClose }: Props) {
  const { notificaciones, loading, loadingMore, hasMore, total, noLeidas, marcarLeida, marcarTodasLeidas, cargarMas } = useNotificationContext();

  return (
        <div
            className={`fixed top-16 right-0 bottom-2 w-[420px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/40 rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden z-[1300] flex flex-col ${isClosing ? 'animate-panel-out' : 'animate-panel-in'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[17px] text-primary">notifications</span>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest leading-none">
                            Notificaciones
                        </h3>
                        {noLeidas > 0 && (
                            <span className="text-[9px] font-bold text-primary/70 dark:text-primary/60 uppercase tracking-wider">
                                {noLeidas} nuevas
                            </span>
                        )}
                    </div>
                </div>
                {noLeidas > 0 && (
                    <button
                        onClick={marcarTodasLeidas}
                        className="px-3 py-1.5 text-[9px] font-black text-primary hover:text-white hover:bg-primary uppercase tracking-widest rounded-lg transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary"
                    >
                        Marcar todas
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : notificaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl text-zinc-300 dark:text-zinc-600">notifications_off</span>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sin notificaciones</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {notificaciones.map((n) => (
                            <NotificationItem
                                key={n.ID_NOTIFICACION}
                                notificacion={n}
                                onMarcarLeida={marcarLeida}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer paginacion */}
            {!loading && notificaciones.length > 0 && (
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-5 py-3 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {notificaciones.length} de {total}
                    </span>
                    {hasMore && (
                        <button
                            onClick={cargarMas}
                            disabled={loadingMore}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-primary hover:text-white hover:bg-primary uppercase tracking-widest rounded-lg transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-[1.5px] border-primary border-t-transparent rounded-full animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                'Cargar mas'
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

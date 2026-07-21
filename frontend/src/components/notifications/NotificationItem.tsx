import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { getTipoConfig } from '../../config/notificacionStyles';
import type { Notificacion } from '../../types/notificacion';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface Props {
    notificacion: Notificacion;
    onMarcarLeida: (id: number) => void;
}

export default function NotificationItem({ notificacion, onMarcarLeida }: Props) {
    const esNoLeida = notificacion.LEIDA === false;
    const config = getTipoConfig(notificacion.TIPO);

    const handleClick = () => {
        if (esNoLeida && notificacion.ID_NOTIFICACION) {
            onMarcarLeida(notificacion.ID_NOTIFICACION);
        }
        if (notificacion.REFERENCIA_MODULO && notificacion.REFERENCIA_ID) {
            window.location.href = `/${notificacion.REFERENCIA_MODULO}/${notificacion.REFERENCIA_ID}`;
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-3 ${
                esNoLeida
                    ? `${config.bg} border-l-current ${config.color} hover:brightness-95`
                    : 'border-l-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                esNoLeida ? `${config.bg} ${config.color}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}>
                <span className="material-symbols-outlined text-base">{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-[11px] uppercase tracking-tight truncate ${
                        esNoLeida ? 'font-black text-zinc-900 dark:text-white' : 'font-bold text-zinc-700 dark:text-zinc-300'
                    }`}>
                        {notificacion.TITULO}
                    </p>
                    {notificacion.FECHA_REGISTRO && (
                        <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap shrink-0">
                            {dayjs(notificacion.FECHA_REGISTRO).fromNow()}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                    {notificacion.MENSAJE}
                </p>
            </div>
            {esNoLeida && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 animate-pulse" />
            )}
        </div>
    );
}

import type { TipoNotificacion } from '../types/notificacion';

export const TIPO_CONFIG: Record<TipoNotificacion, { color: string; bg: string; darkBg: string; icon: string }> = {
    info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', darkBg: 'border-blue-200 dark:border-blue-800/30', icon: 'info' },
    exito: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', darkBg: 'border-emerald-200 dark:border-emerald-800/30', icon: 'check_circle' },
    alerta: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', darkBg: 'border-amber-200 dark:border-amber-800/30', icon: 'warning' },
    pedido: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20', darkBg: 'border-purple-200 dark:border-purple-800/30', icon: 'assignment' },
    documento: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/20', darkBg: 'border-cyan-200 dark:border-cyan-800/30', icon: 'description' },
    prueba: { color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800/50', darkBg: 'border-zinc-200 dark:border-zinc-700/30', icon: 'science' },
    produccion: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', darkBg: 'border-zinc-200 dark:border-zinc-700/30', icon: 'science' },
};

export function getTipoConfig(tipo: TipoNotificacion) {
    return TIPO_CONFIG[tipo] || TIPO_CONFIG.info;
}

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { HistorialInventarioItem } from '../services/useHistorialProductos';

interface ModalDetalleHistorialProps {
  open: boolean;
  onClose: () => void;
  movement: HistorialInventarioItem | null;
  warehouseName?: string;
}

const formatDateClean = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('T');
    const datePart = parts[0];
    const timePart = parts[1] ? parts[1].substring(0, 8) : '';
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}${timePart ? ` ${timePart}` : ''}`;
  } catch {
    return dateStr;
  }
};

export const ModalDetalleHistorial: React.FC<ModalDetalleHistorialProps> = ({
  open,
  onClose,
  movement,
  warehouseName,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!movement) return null;

  const isIngreso = Number(movement.ESTADO_INGRESO) === 1;
  const cantVal = Number(movement.CANTIDAD || movement.CANTIDAD_INGRESO || movement.CANTIDAD_SALIDA || 0);
  const cantUsedVal = Number(movement.CANTIDAD_UTILIZADA || 0);
  const stockFinalVal = movement.STOCK_FINAL !== undefined ? Number(movement.STOCK_FINAL) : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 0 : 2,
            borderRadius: isMobile ? 0 : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)',
          },
        },
      }}
    >
      {/* ── Encabezado Estándar ── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 3,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">history_toggle_off</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                HISTORIAL DE MOVIMIENTOS
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                DETALLE DE MOVIMIENTO EN ALMACÉN
              </h2>
            </div>
          </div>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Modal ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxHeight: '78vh', overflowY: 'auto' }}>
        <div className="space-y-4">
          {/* Tarjeta de Información General */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-800/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  INFORMACIÓN DEL PRODUCTO Y MOVIMIENTO
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  isIngreso
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-xs">
                  {isIngreso ? 'arrow_circle_down' : 'arrow_circle_up'}
                </span>
                {isIngreso ? 'Ingreso / Entrada' : 'Salida / Descuento'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Almacén
                </span>
                <p className="font-black text-on-surface dark:text-zinc-100 uppercase truncate">
                  {movement.ALMACEN || warehouseName || 'N/A'}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs sm:col-span-2">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Producto / Insumo
                </span>
                <p className="font-black text-on-surface dark:text-zinc-100 uppercase truncate">
                  {movement.PRODUCTO || movement.NOMBRE || 'N/A'}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Cantidad Operada
                </span>
                <p className={`text-base font-black ${isIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isIngreso ? '+' : '-'}{cantVal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 ml-1.5 uppercase">
                    {movement.UNIDAD_MEDIDA || 'Unidad'}
                  </span>
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Cantidad Utilizada
                </span>
                <p className="text-base font-black text-zinc-700 dark:text-zinc-300">
                  {cantUsedVal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 ml-1.5 uppercase">
                    {movement.UNIDAD_MEDIDA || 'Unidad'}
                  </span>
                </p>
              </div>

              {stockFinalVal !== undefined && (
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                  <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                    Saldo / Stock Resultante
                  </span>
                  <p className="text-base font-black text-primary">
                    {stockFinalVal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 ml-1.5 uppercase">
                      {movement.UNIDAD_MEDIDA || 'Unidad'}
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Lote
                </span>
                <p className="font-black text-on-surface dark:text-zinc-200 uppercase">
                  {movement.LOTE || 'SIN LOTE'}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Fecha de Registro
                </span>
                <p className="font-bold text-on-surface dark:text-zinc-200">
                  {formatDateClean(movement.FECHA_REGISTRO)}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block mb-0.5">
                  Fecha de Vencimiento
                </span>
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  {formatDateClean(movement.FECHA_VENCIMIENTO)}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Auditoría y Responsable */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-800/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">person_pin</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                AUDITORÍA Y RESPONSABLE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">
                  {movement.USUARIO
                    ? movement.USUARIO.substring(0, 2).toUpperCase()
                    : movement.NOMBRE_USUARIO
                    ? movement.NOMBRE_USUARIO.substring(0, 2).toUpperCase()
                    : 'US'}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Usuario / Operador
                  </span>
                  <p className="font-black text-on-surface dark:text-zinc-100 uppercase truncate">
                    {movement.NOMBRE_USUARIO || movement.USUARIO_REGISTRO || movement.USUARIO || 'NO ESPECIFICADO'}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">label</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                    Tipo de Movimiento / Motivo
                  </span>
                  <p className="font-black text-on-surface dark:text-zinc-100 uppercase truncate">
                    {movement.TIPO_MOVIMIENTO || movement.MOTIVO || (isIngreso ? 'ENTRADA DE PLANTA / AJUSTE' : 'SALIDA / DESCUENTO')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Sub-Lotes o Detalle adicional si existe */}
          {Array.isArray(movement.DETALLE) && movement.DETALLE.length > 0 && (
            <div className="p-4 bg-surface-variant/40 dark:bg-zinc-800/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  DESGLOSE DE LOTES / SUBLOTES ({movement.DETALLE.length})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="py-2 px-3 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">Lote</th>
                      <th className="py-2 px-3 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-right">Cantidad</th>
                      <th className="py-2 px-3 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-right">Utilizada</th>
                      <th className="py-2 px-3 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {movement.DETALLE.map((sub, sIdx) => (
                      <tr key={sIdx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2 px-3 font-bold text-on-surface dark:text-zinc-200 uppercase">{sub.LOTE || 'S/L'}</td>
                        <td className="py-2 px-3 font-black text-right text-on-surface dark:text-zinc-100">{sub.CANTIDAD || 0}</td>
                        <td className="py-2 px-3 font-bold text-right text-zinc-500">{sub.CANTIDAD_UTILIZADA || 0}</td>
                        <td className="py-2 px-3 font-medium text-zinc-600 dark:text-zinc-400">{formatDateClean(sub.FECHA_VENCIMIENTO)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* ── Pie de Modal Estándar ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'var(--background, #fafafa)',
          borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

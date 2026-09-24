/**
 * ModalDetalleLotes.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal para visualizar el desglose de lotes y movimientos de existencias
 * de un producto en el almacén:
 * - Cantidad Ingreso
 * - Cantidad Utilizada
 * - Cantidad Disponible
 * - Fecha Registro
 * - Fecha Vencimiento
 * - Usuario Registra
 * - Descripción
 */

import React from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
  Zoom,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { InventarioItem } from '../services/useInventarioAlmacen';

interface ModalDetalleLotesProps {
  open: boolean;
  onClose: () => void;
  item: InventarioItem | null;
  almacenNombre: string;
}

export const ModalDetalleLotes: React.FC<ModalDetalleLotesProps> = ({
  open,
  onClose,
  item,
  almacenNombre,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!item) return null;

  const formatDate = (dateStr?: string, includeTime = false) => {
    if (!dateStr) return '-';
    try {
      const d = dayjs(dateStr);
      if (!d.isValid()) return dateStr;
      return includeTime ? d.format('DD/MM/YYYY HH:mm') : d.format('DD/MM/YYYY');
    } catch {
      return dateStr;
    }
  };

  const detalles = Array.isArray(item.DETALLE) ? item.DETALLE : [];
  const cantidadTotal = item.CANTIDAD !== undefined ? item.CANTIDAD : (item.STOCK !== undefined ? Number(item.STOCK) : 0);
  const unidadMedida = item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA || 'UND';

  const renderHeaderTitle = (title: string, align: 'left' | 'center' | 'right' = 'left') => {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
      return <span>{title}</span>;
    }
    const alignClass =
      align === 'right'
        ? 'items-end text-right'
        : align === 'center'
          ? 'items-center text-center'
          : 'items-start text-left';

    return (
      <div className={`flex flex-col ${alignClass} leading-tight`}>
        <span>{words[0]}</span>
        <span>{words.slice(1).join(' ')}</span>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 0 : 2,
            borderRadius: isMobile ? '1rem' : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)',
          },
        },
      }}
    >
      {/* ── Encabezado Estándar (AGENTS.md) ── */}
      <DialogTitle
        sx={{
          p: 1.5,
          px: 1.5,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                {almacenNombre || 'INVENTARIO DE ALMACÉN'}
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                DETALLE DE INGRESOS Y LOTES
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

      {/* ── Contenido ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '74vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4">
          {/* Tarjeta de Resumen del Producto */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-sm font-black text-on-surface uppercase font-headline">
                  {item.PRODUCTO || item.NOMBRE || 'Producto sin nombre'}
                </p>
                {item.NOMBRE_DETALLE && (
                  <p className="text-xs font-bold text-primary uppercase tracking-tight mt-0.5">
                    {item.NOMBRE_DETALLE}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.CATEGORIA && (
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {item.CATEGORIA}
                    </span>
                  )}
                  {item.CANTIDAD_ADECUACION !== undefined && item.CANTIDAD_ADECUACION > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      Factor: {item.CANTIDAD_ADECUACION} {item.UNIDAD_MEDIDA_A || ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:text-right bg-white dark:bg-zinc-850 p-2.5 px-4 rounded-xl border border-outline-variant/60 shadow-xs">
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block">
                  Cantidad Total Disponible
                </span>
                <span className="text-lg font-black text-primary font-headline">
                  {Number(cantidadTotal).toFixed(2)}{' '}
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {unidadMedida}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle de Ingresos */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="pl-4 pr-2 py-2.5 whitespace-nowrap">
                      {renderHeaderTitle('N°', 'left')}
                    </th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">
                      {renderHeaderTitle('CANTIDAD INGRESO', 'right')}
                    </th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">
                      {renderHeaderTitle('CANTIDAD UTILIZADA', 'right')}
                    </th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">
                      {renderHeaderTitle('CANTIDAD DISPONIBLE', 'right')}
                    </th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap">
                      {renderHeaderTitle('FECHA REGISTRO', 'center')}
                    </th>
                    <th className="px-3 py-2.5 text-center whitespace-nowrap">
                      {renderHeaderTitle('FECHA VENCIMIENTO', 'center')}
                    </th>
                    <th className="px-3 py-2.5 whitespace-nowrap">
                      {renderHeaderTitle('USUARIO REGISTRA', 'left')}
                    </th>
                    <th className="pl-3 pr-4 py-2.5 whitespace-nowrap">
                      {renderHeaderTitle('DESCRIPCIÓN', 'left')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {detalles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-2xl opacity-40 mb-1">
                            playlist_remove
                          </span>
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            No hay desglose de ingresos disponible para este producto.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    detalles.map((det, idx) => {
                      const cantIngreso = Number(det.CANTIDAD || 0);
                      const cantUtilizada = Number(det.CANTIDAD_UTILIZADA || 0);
                      const cantDisponible = det.DISPONIBLE !== undefined
                        ? Number(det.DISPONIBLE)
                        : (cantIngreso - cantUtilizada);

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors"
                        >
                          {/* N° */}
                          <td className="pl-4 pr-2 py-2 font-black text-xs text-primary whitespace-nowrap">
                            {idx + 1}
                          </td>

                          {/* Cantidad Ingreso */}
                          <td className="px-3 py-2 text-right font-black text-xs text-zinc-700 dark:text-zinc-300 font-headline whitespace-nowrap">
                            {cantIngreso.toFixed(2)}
                          </td>

                          {/* Cantidad Utilizada */}
                          <td className="px-3 py-2 text-right font-black text-xs text-amber-600 dark:text-amber-400 font-headline whitespace-nowrap">
                            {cantUtilizada.toFixed(2)}
                          </td>

                          {/* Cantidad Disponible */}
                          <td className="px-3 py-2 text-right font-black text-xs text-emerald-600 dark:text-emerald-400 font-headline whitespace-nowrap">
                            {cantDisponible.toFixed(2)}
                          </td>

                          {/* Fecha Registro */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {det.FECHA_REGISTRO ? (
                              <div className="flex flex-col items-center leading-tight">
                                <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                                  {dayjs(det.FECHA_REGISTRO).format('DD/MM/YYYY')}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">
                                  {dayjs(det.FECHA_REGISTRO).format('HH:mm:ss')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400">-</span>
                            )}
                          </td>

                          {/* Fecha Vencimiento */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {det.FECHA_VENCIMIENTO ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40">
                                {formatDate(det.FECHA_VENCIMIENTO)}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-400">-</span>
                            )}
                          </td>

                          {/* Usuario Registra */}
                          <td className="px-3 py-2 font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap">
                            {det.USUARIO_REGISTRA || '-'}
                          </td>

                          {/* Descripción */}
                          <td className="pl-3 pr-4 py-2 font-bold text-xs text-zinc-500 dark:text-zinc-400">
                            {det.DESCRICION || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

export default ModalDetalleLotes;

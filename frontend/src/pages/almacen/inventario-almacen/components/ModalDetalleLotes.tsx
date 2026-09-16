/**
 * ModalDetalleLotes.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal para visualizar el desglose de lotes, fechas de vencimiento
 * y existencias específicas de un producto del inventario.
 */

import React from 'react';
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const detalles = Array.isArray(item.DETALLE) ? item.DETALLE : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                {almacenNombre || 'INVENTARIO'}
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                DETALLE DE LOTES Y STOCK
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
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-black text-on-surface uppercase font-headline">
                  {item.PRODUCTO || item.NOMBRE || 'Producto sin nombre'}
                </p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                  {item.CATEGORIA || item.SUB_CATEGORIA || 'Sin Categoría'}
                  {item.SKU || item.CODIGO ? ` • SKU: ${item.SKU || item.CODIGO}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block">
                  Stock Total
                </span>
                <span className="text-base font-black text-primary font-headline">
                  {Number(item.STOCK || 0).toFixed(2)}{' '}
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_A || ''}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Lotes */}
          <div className="bg-surface rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/50 text-[9px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60">
                    <th className="px-4 py-2.5">Lote / ID</th>
                    <th className="px-4 py-2.5">F. Vencimiento</th>
                    <th className="px-4 py-2.5 text-right">Cantidad / Stock</th>
                    <th className="px-4 py-2.5 text-right">F. Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {detalles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-2xl opacity-40 mb-1">
                          playlist_remove
                        </span>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          No hay desglose por lotes disponible para este producto.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    detalles.map((det, idx) => {
                      const stockLote =
                        det.STOCK_LOTE !== undefined
                          ? det.STOCK_LOTE
                          : det.CANTIDAD !== undefined && det.CANTIDAD_UTILIZADA !== undefined
                          ? Number(det.CANTIDAD) - Number(det.CANTIDAD_UTILIZADA)
                          : det.CANTIDAD || 0;

                      return (
                        <tr
                          key={det.ID_ALMACEN_INVENTARIO || idx}
                          className="hover:bg-surface-variant/30 transition-colors"
                        >
                          <td className="px-4 py-2 font-bold text-xs text-on-surface uppercase">
                            {det.LOTE || `#${det.ID_ALMACEN_INVENTARIO || idx + 1}`}
                          </td>
                          <td className="px-4 py-2 font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatDate(det.FECHA_VENCIMIENTO)}
                          </td>
                          <td className="px-4 py-2 text-right font-black text-xs text-primary font-headline whitespace-nowrap">
                            {Number(stockLote).toFixed(2)}{' '}
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                              {det.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA || ''}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-xs text-on-surface-variant whitespace-nowrap">
                            {formatDate(det.FECHA_REGISTRO)}
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

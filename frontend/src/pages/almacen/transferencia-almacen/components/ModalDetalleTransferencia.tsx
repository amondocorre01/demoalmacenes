import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Zoom,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { TransferenciaItem } from '../services/useTransferenciaAlmacen';

interface ModalDetalleTransferenciaProps {
  open: boolean;
  onClose: () => void;
  item: TransferenciaItem | null;
}

export const ModalDetalleTransferencia: React.FC<ModalDetalleTransferenciaProps> = ({
  open,
  onClose,
  item,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!item) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateStr?: string, fallbackHour?: string) => {
    const target = (dateStr && (dateStr.includes('T') || dateStr.includes(' '))) ? dateStr : fallbackHour;
    if (!target) return '';
    if (target.includes('T')) {
      const timePart = target.split('T')[1];
      return timePart.split('.')[0].replace('Z', '');
    }
    if (target.includes(' ')) {
      return target.split(' ')[1].split('.')[0];
    }
    if (target.includes(':')) {
      return target.split('.')[0];
    }
    return '';
  };

  const renderEstadoBadge = (estado?: number | string) => {
    const estadoNum = Number(estado);
    if (estadoNum === 4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          TRANSFERIDO
        </span>
      );
    }
    if (estadoNum === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          EN CAMINO
        </span>
      );
    }
    if (estadoNum === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          STOCK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        {estado ? `ESTADO ${estado}` : '-'}
      </span>
    );
  };

  const detalleList = Array.isArray(item.DETALLE) ? item.DETALLE : [];

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
      {/* ── Encabezado ── */}
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
              <span className="material-symbols-outlined text-xl">visibility</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                DETALLE DE TRANSFERENCIA
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                TRANSFERENCIA #{item.ID_DOCUMENTO_TRANSFERENCIA}
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
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4">
          {/* Ficha Informativa */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">info</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                INFORMACIÓN DEL MOVIMIENTO
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Almacén Origen
                </span>
                <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight block">
                  {item.ORIGEN || item.ALMACEN_ORIGEN || '-'}
                </span>
              </div> */}

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Almacén Destino
                </span>
                <span className="font-black text-primary uppercase tracking-tight block">
                  {item.DESTINO || item.ALMACEN_DESTINO || '-'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Usuario Registro
                </span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight block">
                  {item.USUARIO || item.NOMBRE_USUARIO || '-'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Fecha Registro
                </span>
                <span className="font-bold text-zinc-600 dark:text-zinc-400 block">
                  {formatDate(item.FECHA_REGISTRO)} {formatTime(item.FECHA_REGISTRO, item.HORA_REGISTRO) ? `• ${formatTime(item.FECHA_REGISTRO, item.HORA_REGISTRO)}` : ''}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Estado
                </span>
                <div>
                  {renderEstadoBadge(item.ESTADO)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">list_alt</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                PRODUCTOS TRANSFERIDOS ({detalleList.length})
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800">
                      <td className="pl-4 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        N°
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Producto
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Cant. Transferida
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Unidad
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Fecha Venc.
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {detalleList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-zinc-400 text-xs font-bold">
                          No hay items detallados en este registro.
                        </td>
                      </tr>
                    ) : (
                      detalleList.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors">
                          <td className="pl-4 pr-2 py-2 text-[10px] font-black text-primary whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                              {prod.PRODUCTO || prod.PRODUCTO_INTERMEDIO || prod.PRODUCTO_DETALLE || `Producto #${prod.ID_PRODUCTO_INTERMEDIO || prod.ID_PRODUCTO_DETALLE}`}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-primary/10 text-primary border border-primary/20">
                              {prod.CANTIDAD_TRANFERIDA ?? prod.CANTIDAD ?? 0}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {prod.UNIDAD_MEDIDA || 'UNIDAD'}
                          </td>
                          <td className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {formatDate(prod.FECHA_VENCIMIENTO)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ── Pie ── */}
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

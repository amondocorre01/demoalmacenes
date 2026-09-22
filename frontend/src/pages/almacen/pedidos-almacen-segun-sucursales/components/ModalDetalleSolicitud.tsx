import React, { useState, useEffect } from 'react';
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
import {
  SolicitudPedidoAlmacenItem,
  usePedidosAlmacenSegunSucursalesServices,
} from '../services/usePedidosAlmacenSegunSucursales';

interface ModalDetalleSolicitudProps {
  open: boolean;
  onClose: () => void;
  requestItem: SolicitudPedidoAlmacenItem | null;
}

export const ModalDetalleSolicitud: React.FC<ModalDetalleSolicitudProps> = ({
  open,
  onClose,
  requestItem,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loadApiGetSolicitudById } = usePedidosAlmacenSegunSucursalesServices();
  const [fullSolicitud, setFullSolicitud] = useState<SolicitudPedidoAlmacenItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    if (open && requestItem?.ID_ALMACEN_SOLICITUD_DOCUMENTO) {
      setLoadingDetail(true);
      loadApiGetSolicitudById(requestItem.ID_ALMACEN_SOLICITUD_DOCUMENTO).then((res) => {
        setFullSolicitud(res || requestItem);
        setLoadingDetail(false);
      });
    } else {
      setFullSolicitud(null);
    }
  }, [open, requestItem, loadApiGetSolicitudById]);

  if (!requestItem && !fullSolicitud) return null;

  const current = fullSolicitud || requestItem!;

  const getStatusBadge = (estado: number) => {
    switch (estado) {
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pendiente / Solicitado
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Enviado / En Tránsito
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Recibido / Entregado
          </span>
        );
      case 4:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-500/10 text-zinc-600 border border-zinc-500/20">
            Desconocido
          </span>
        );
    }
  };

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
              <span className="material-symbols-outlined text-xl">description</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                DETALLE DE SOLICITUD DE PEDIDO
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                SOLICITUD N° {current.ID_ALMACEN_SOLICITUD_DOCUMENTO}
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

      {/* ── Contenido del Modal ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4 font-body">
          {/* Tarjeta de Resumen General */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  RESUMEN DE LA SOLICITUD
                </span>
              </div>
              {getStatusBadge(current.ESTADO)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Almacén Solicitante</span>
                <span className="font-black text-on-surface">{current.ALMACEN_SOLICITANTE || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Almacén Destino</span>
                <span className="font-black text-on-surface">{current.ALMACEN_DESTINO || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Fecha Registro</span>
                <span className="font-bold text-on-surface">
                  {current.FECHA_REGISTRO ? current.FECHA_REGISTRO.split('T')[0] : '-'} {current.HORA_REGISTRO || ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Fecha a Entregar</span>
                <span className="font-bold text-primary">
                  {current.FECHA_A_ENTREGAR ? current.FECHA_A_ENTREGAR.split('T')[0] : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Desglose de Productos */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">inventory</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                DESGLOSE DE PRODUCTOS ({current.DETALLE?.length || 0})
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/70 border-b border-outline-variant/60">
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">N°</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Producto / Insumo</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Unidad</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Cant. Solicitada</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Cant. Enviada</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Cant. Aceptada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {current.DETALLE && current.DETALLE.length > 0 ? (
                    current.DETALLE.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-variant/20 transition-colors">
                        <td className="px-3 py-2 text-xs font-black text-primary">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-black text-on-surface leading-tight">
                            {item.PRODUCTO || item.GRUPO}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-bold text-zinc-400">
                          {item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA_E || '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-black text-xs text-on-surface bg-surface-variant/60 px-2.5 py-0.5 rounded-lg border border-outline-variant/40">
                            {item.CANTIDAD_SOLICITADA}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${
                              item.CANTIDAD_ENVIADA > 0
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                : 'text-zinc-400'
                            }`}
                          >
                            {item.CANTIDAD_ENVIADA ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${
                              item.CANTIDAD_ACEPTADA > 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'text-zinc-400'
                            }`}
                          >
                            {item.CANTIDAD_ACEPTADA ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        {loadingDetail ? 'Cargando detalle...' : 'No hay detalle disponible'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjeta de Trazabilidad / Registros */}
          {current.REGISTROS && current.REGISTROS.length > 0 && (
            <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-lg">history</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  HISTORIAL Y TRAZABILIDAD
                </span>
              </div>

              <div className="space-y-2">
                {current.REGISTROS.map((reg, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-surface rounded-xl border border-outline-variant/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                      <span className="font-black text-on-surface">
                        {reg.ID_ESTADO === 1
                          ? 'SOLICITADO POR'
                          : reg.ID_ESTADO === 2
                          ? 'ENVIADO / DESPACHADO POR'
                          : reg.ID_ESTADO === 3
                          ? 'RECIBIDO POR'
                          : 'CANCELADO POR'}
                        : <span className="font-bold text-zinc-500">{reg.NOMBRE_COMPLETO || `Usuario #${reg.ID_USUARIO}`}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 mt-1 sm:mt-0">
                      {reg.FECHA ? reg.FECHA.replace('T', ' ').split('.')[0] : '-'}
                    </span>
                  </div>
                ))}
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

export default ModalDetalleSolicitud;

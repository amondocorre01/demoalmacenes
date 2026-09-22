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
import { showAlert } from '../../../../config/alerts';
import {
  SolicitudPedidoAlmacenItem,
  usePedidosAlmacenSegunSucursalesServices,
} from '../services/usePedidosAlmacenSegunSucursales';

interface ModalRecepcionSolicitudProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requestItem: SolicitudPedidoAlmacenItem | null;
}

interface ReceiveRow {
  id_detalle: number;
  producto: string;
  unidad: string;
  cantidad_solicitada: number;
  cantidad_enviada: number;
  cantidad_aceptada: number | '';
}

export const ModalRecepcionSolicitud: React.FC<ModalRecepcionSolicitudProps> = ({
  open,
  onClose,
  onSuccess,
  requestItem,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loadApiGetSolicitudById, loadApiRecibirSolicitud } =
    usePedidosAlmacenSegunSucursalesServices();

  const [receiveRows, setReceiveRows] = useState<ReceiveRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (open && requestItem) {
      setLoading(true);
      loadApiGetSolicitudById(requestItem.ID_ALMACEN_SOLICITUD_DOCUMENTO).then((sol) => {
        const detList = sol?.DETALLE || requestItem.DETALLE || [];
        const rows: ReceiveRow[] = detList.map((d) => ({
          id_detalle: d.ID_ALMACEN_SOLICITUD_DETALLE,
          producto: d.PRODUCTO || d.GRUPO || '',
          unidad: d.UNIDAD_MEDIDA_A || d.UNIDAD_MEDIDA_E || '',
          cantidad_solicitada: d.CANTIDAD_SOLICITADA,
          cantidad_enviada: d.CANTIDAD_ENVIADA ?? d.CANTIDAD_SOLICITADA,
          cantidad_aceptada: d.CANTIDAD_ENVIADA ?? d.CANTIDAD_SOLICITADA, // Por defecto aceptar lo enviado
        }));
        setReceiveRows(rows);
        setLoading(false);
      });
    } else {
      setReceiveRows([]);
    }
  }, [open, requestItem, loadApiGetSolicitudById]);

  const handleQtyChange = (index: number, valStr: string) => {
    if (valStr === '') {
      setReceiveRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, cantidad_aceptada: '' } : r))
      );
      return;
    }
    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return;
    setReceiveRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, cantidad_aceptada: num } : r))
    );
  };

  const handleConfirmReceive = async () => {
    if (!requestItem) return;

    for (const r of receiveRows) {
      const q = typeof r.cantidad_aceptada === 'number' ? r.cantidad_aceptada : parseFloat(String(r.cantidad_aceptada));
      if (isNaN(q) || q < 0) {
        showAlert.warning('Cantidad inválida', `Verifique la cantidad aceptada de ${r.producto}.`);
        return;
      }
    }

    const payload = {
      id_documento: requestItem.ID_ALMACEN_SOLICITUD_DOCUMENTO,
      detalles: receiveRows.map((r) => ({
        id_detalle: r.id_detalle,
        cantidad_aceptada: typeof r.cantidad_aceptada === 'number' ? r.cantidad_aceptada : parseFloat(String(r.cantidad_aceptada)) || 0,
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await loadApiRecibirSolicitud(payload);
      if (res.success) {
        showAlert.success('Recepción Confirmada', res.message || 'La solicitud fue recibida correctamente.');
        onSuccess();
        onClose();
      } else {
        showAlert.error('Error al recibir', res.message || 'No se pudo confirmar la recepción.');
      }
    } catch (error) {
      console.error('Error al recibir solicitud:', error);
      showAlert.error('Error', 'Ocurrió un error inesperado al confirmar recepción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!requestItem) return null;

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
              <span className="material-symbols-outlined text-xl">inventory</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                RECEPCIÓN DE PEDIDO EN ALMACÉN
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                RECIBIR SOLICITUD N° {requestItem.ID_ALMACEN_SOLICITUD_DOCUMENTO}
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
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  CONFIRMACIÓN DE CANTIDADES RECIBIDAS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Almacén Remitente</span>
                <span className="font-black text-on-surface">{requestItem.ALMACEN_DESTINO}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Almacén Receptor (Mi Almacén)</span>
                <span className="font-black text-on-surface">{requestItem.ALMACEN_SOLICITANTE}</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/70 border-b border-outline-variant/60">
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">N°</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Producto</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Unidad</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Solicitado</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Enviado</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center w-36">Cant. Aceptada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {receiveRows.length > 0 ? (
                    receiveRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-surface-variant/20 transition-colors">
                        <td className="px-3 py-2 text-xs font-black text-primary">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-black text-on-surface leading-tight">{r.producto}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-bold text-zinc-400">{r.unidad}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-xs text-zinc-500">
                            {r.cantidad_solicitada}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-black text-xs text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                            {r.cantidad_enviada}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            value={r.cantidad_aceptada}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="w-24 text-center bg-surface border border-outline-variant rounded-xl py-1 px-2 text-xs font-black text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        {loading ? 'Cargando datos...' : 'Sin productos para recepcionar'}
                      </td>
                    </tr>
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
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          disabled={isSubmitting}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmReceive}
          disabled={isSubmitting || receiveRows.length === 0}
          icon="check_circle"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Recepción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRecepcionSolicitud;

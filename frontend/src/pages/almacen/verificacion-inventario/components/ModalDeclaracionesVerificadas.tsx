import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import LoadingOverlay from '../../../../components/common/LoadingOverlay';
import { useVerificacionInventarioServices, AlmacenItem } from '../services/useVerificacionInventario';

interface Props {
  open: boolean;
  onClose: () => void;
  currentWarehouse: AlmacenItem | null;
}

export const ModalDeclaracionesVerificadas: React.FC<Props> = ({
  open,
  onClose,
  currentWarehouse,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetDeclaracionesVerificadas } = useVerificacionInventarioServices();

  const [loading, setLoading] = useState(false);
  const [almacenesVerificados, setAlmacenesVerificados] = useState<AlmacenItem[]>([]);

  useEffect(() => {
    if (open && currentWarehouse) {
      fetchVerificadas();
    }
  }, [open, currentWarehouse]);

  const fetchVerificadas = async () => {
    if (!currentWarehouse) return;
    setLoading(true);
    const res = await loadApiGetDeclaracionesVerificadas(currentWarehouse.ID_PLANTA_ALMACEN);
    setLoading(false);

    if (res && res.success && Array.isArray(res.datos)) {
      setAlmacenesVerificados(res.datos);
    } else if (Array.isArray(res)) {
      setAlmacenesVerificados(res);
    } else {
      setAlmacenesVerificados([]);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sin fecha';
    const clean = dateStr.split('T')[0];
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
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
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                CONTROL Y AUDITORÍA
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                HISTORIAL DE ALMACENES Y VERIFICACIONES
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
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '78vh', overflowY: 'auto' }}>
        <LoadingOverlay show={loading} message="Consultando verificaciones..." />

        <div className="space-y-5">
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">warehouse</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                ESTADO DE VERIFICACIONES POR ALMACÉN
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100/60 dark:bg-zinc-800/60 border-b border-outline-variant/40">
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">N°</td>
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">ALMACÉN</td>
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">FECHA REGISTRO</td>
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">FECHA VERIFICACIÓN</td>
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-center">DÍAS SIN VERIFICAR</td>
                    <td className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400 text-center">ESTADO</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {almacenesVerificados.map((alm, idx) => {
                    const isVerif = Boolean(alm.ULTIMA_VERIFICACION?.ESTADO_VERIFICACION);
                    return (
                      <tr key={alm.ID_PLANTA_ALMACEN || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-3 py-2.5 font-bold text-primary">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-on-surface">
                          {alm.DESCRICION || alm.nombre || alm.NOMBRE || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-on-surface-variant">
                          {formatDate(alm.ULTIMA_VERIFICACION?.FECHA_REGISTRO)}
                        </td>
                        <td className="px-3 py-2.5 text-on-surface-variant">
                          {formatDate(alm.ULTIMA_VERIFICACION?.FECHA_VERIFICACION)}
                        </td>
                        <td className="px-3 py-2.5 text-center font-black">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${Number(alm.DIAS) > 7 ? 'bg-red-500/10 text-red-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                            {alm.DIAS !== undefined ? `${alm.DIAS} días` : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              isVerif
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isVerif ? 'Verificado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && almacenesVerificados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        No se encontraron registros de verificaciones.
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

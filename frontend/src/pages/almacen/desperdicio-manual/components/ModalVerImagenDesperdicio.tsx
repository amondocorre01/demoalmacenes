import React, { useState, useEffect } from 'react';
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
import { DesperdicioManualItem, getImageUrl } from '../services/useDesperdicioManual';

interface ModalVerImagenDesperdicioProps {
  open: boolean;
  onClose: () => void;
  item: DesperdicioManualItem | null;
  imageUrl: string | null;
}

export const ModalVerImagenDesperdicio: React.FC<ModalVerImagenDesperdicioProps> = ({
  open,
  onClose,
  item,
  imageUrl,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [imageError, setImageError] = useState(false);

  // Resolver la URL final usando el helper getImageUrl
  const rawCandidate =
    imageUrl ||
    item?.IMAGEN ||
    item?.FOTO ||
    item?.RUTA_IMAGEN ||
    item?.ARCHIVO ||
    null;
  const finalUrl = getImageUrl(rawCandidate);

  useEffect(() => {
    if (open) setImageError(false);
  }, [open, finalUrl]);

  const productName =
    item?.PRODUCTO || item?.NOMBRE_PRODUCTO || item?.NOMBRE_DETALLE || 'Producto';
  const detailName = item?.NOMBRE_DETALLE || item?.DETALLE || '';
  const warehouseName = item?.ALMACEN || item?.DESCRICION || 'Almacén';
  const observacion = item?.OBSERVACION || item?.DETALLE || '';

  const isPdf = Boolean(
    finalUrl &&
    (finalUrl.toLowerCase().endsWith('.pdf') ||
      finalUrl.toLowerCase().includes('.pdf?') ||
      finalUrl.toLowerCase().includes('/pdf') ||
      finalUrl.startsWith('data:application/pdf'))
  );

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
            m: isMobile ? 1 : 2,
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
          px: { xs: 2, sm: 3 },
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">
                {isPdf ? 'picture_as_pdf' : 'image'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                EVIDENCIA DE DESPERDICIO
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {isPdf ? 'DOCUMENTO PDF DE RESPALDO' : 'IMAGEN DE EVIDENCIA'}
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
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-3.5">
          {/* Tarjeta de Información del Producto */}
          <div className="p-3.5 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest block">
                {warehouseName}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-headline break-words">
                {productName}
              </h4>
              {detailName && detailName.toUpperCase() !== productName.toUpperCase() && (
                <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-0.5 break-words">
                  {detailName}
                </p>
              )}
              {observacion && (
                <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 mt-1 italic break-words">
                  <span className="font-bold not-italic text-zinc-400 uppercase text-[9px] mr-1">
                    Motivo:
                  </span>
                  {observacion}
                </p>
              )}
            </div>

            {item?.CANTIDAD !== undefined && item?.CANTIDAD !== null && (
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">
                  Cantidad
                </span>
                <span className="text-xs sm:text-sm font-black text-primary">
                  {Number(item.CANTIDAD).toLocaleString('es-BO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">
                    {item.UNIDAD_MEDIDA || item.MEDIDA || ''}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Contenedor del Archivo (PDF o Imagen) */}
          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center min-h-[320px] max-h-[540px] relative shadow-inner">
            {finalUrl && !imageError ? (
              isPdf ? (
                <iframe
                  src={finalUrl}
                  title="Evidencia PDF"
                  className="w-full h-[520px] border-none bg-white rounded-2xl"
                />
              ) : (
                <img
                  src={finalUrl}
                  alt={productName}
                  onError={() => setImageError(true)}
                  className="w-full h-auto max-h-[520px] object-contain rounded-2xl transition-all"
                />
              )
            ) : (
              <div className="py-14 text-center text-zinc-400 dark:text-zinc-500 space-y-2 p-4">
                <span className="material-symbols-outlined text-5xl block text-zinc-500">
                  {isPdf ? 'picture_as_pdf' : 'broken_image'}
                </span>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {isPdf
                    ? 'No se pudo cargar el documento PDF'
                    : 'No se pudo cargar la imagen de evidencia'}
                </p>
                {finalUrl && (
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-xs font-bold text-primary underline"
                  >
                    Abrir enlace directamente
                  </a>
                )}
              </div>
            )}
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
          alignItems: 'center',
        }}
      >
        {finalUrl && !finalUrl.startsWith('data:') ? (
          <a
            href={finalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>Abrir en pestaña nueva</span>
          </a>
        ) : (
          <div></div>
        )}

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

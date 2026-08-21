import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

interface SuccessRecetaModalProps {
  open: boolean;
  onClose: () => void;
  productName?: string;
  onGoToFinalRecipe: () => void;
}

export const SuccessRecetaModal: React.FC<SuccessRecetaModalProps> = ({
  open,
  onClose,
  productName = '',
  onGoToFinalRecipe,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
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
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)'
          }
        }
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4 }, bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md border border-emerald-500/20">
            <span className="material-symbols-outlined text-4xl sm:text-5xl font-black">done_all</span>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] leading-none mb-1 font-headline">
              Consolidación Exitosa
            </p>
            <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
              ¡Receta Intermedia Guardada!
            </h2>
            <p className="text-on-surface-variant font-medium text-xs leading-relaxed mt-2">
              La receta intermedia para <strong className="text-primary uppercase">{productName}</strong> se ha guardado y consolidado correctamente.
            </p>
          </div>

          <div className="w-full border-t border-outline-variant/60 my-1" />

          <div className="space-y-3 w-full bg-surface-variant/40 rounded-2xl p-4 border border-outline-variant/60">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none font-headline">
              Siguiente Paso Sugerido
            </p>
            <p className="text-xs font-black text-on-surface uppercase tracking-tight">
              ¿Deseas registrar la Receta Final ahora?
            </p>

            <Button
              variant="primary"
              size="md"
              fullWidth
              icon="restaurant_menu"
              onClick={onGoToFinalRecipe}
              className="!h-9 shadow-lg shadow-primary/20"
            >
              Sí, Registrar Receta Final
            </Button>
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        py: 2,
        bgcolor: 'var(--background, #fafafa)',
        borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
        display: 'flex',
        justify: 'center', gap: 1.5
      }}>
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          No por ahora, salir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

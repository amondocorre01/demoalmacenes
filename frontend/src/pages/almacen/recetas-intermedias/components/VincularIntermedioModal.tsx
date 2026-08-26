import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

interface VincularIntermedioModalProps {
  open: boolean;
  onClose: () => void;
  warehouseName: string;
  masterProductList: any[];
  onLink: (product: any) => Promise<void>;
  isLoading?: boolean;
  selectSx?: any;
}

export const VincularIntermedioModal: React.FC<VincularIntermedioModalProps> = ({
  open,
  onClose,
  warehouseName,
  masterProductList,
  onLink,
  isLoading = false,
  selectSx
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleLink = async () => {
    if (!selectedProduct) return;
    await onLink(selectedProduct);
    setSelectedProduct(null);
    onClose();
  };

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
      {/* ── Encabezado Estándar (ModalNewAlmacen.tsx) ── */}
      <DialogTitle sx={{ p: 2, px: 3, borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)', bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">link</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                Gestión de Vinculación
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                Vincular Producto Intermedio
              </h2>
            </div>
          </div>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Formulario ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '78vh', overflowY: 'auto' }}>
        <div className="space-y-5">
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Selección de Producto Maestro</span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed uppercase">
              Habilite un producto intermedio del catálogo maestro para el almacén{' '}
              <strong className="text-primary font-black">"{warehouseName || 'SELECCIONADO'}"</strong>.
            </p>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                Producto Maestro Intermedio <span className="text-primary">*</span>
              </label>
              <Autocomplete
                options={masterProductList}
                getOptionLabel={(o: any) => o.NOMBRE || o.name || o.PRODUCTO || ''}
                value={selectedProduct}
                onChange={(_, v) => setSelectedProduct(v)}
                isOptionEqualToValue={(o, v) => (o.ID_PRODUCTO_INTERMEDIO || o.id) === (v.ID_PRODUCTO_INTERMEDIO || v.id)}
                sx={selectSx}
                renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="BUSCAR PRODUCTO MAESTRO..." />}
              />
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ── Pie de Modal Estándar (ModalNewAlmacen.tsx) ── */}
      <DialogActions sx={{
        px: 3,
        py: 2,
        bgcolor: 'var(--background, #fafafa)',
        borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
        display: 'flex',
        justify: 'space-between',
        gap: 1.5
      }}>
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleLink}
          disabled={!selectedProduct || isLoading}
          icon="link"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Vincular e Iniciar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

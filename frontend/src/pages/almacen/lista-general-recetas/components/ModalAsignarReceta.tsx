/**
 * ModalAsignarReceta.tsx
 * 
 * Modal para asociar y habilitar una receta de producto intermedio a un almacén seleccionado.
 * Cumple con el estándar visual de modales definido en AGENTS.md.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';

interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
}

interface ProductoItem {
  ID_PRODUCTO_INTERMEDIO?: number;
  ID_PRODUCTO?: number;
  NOMBRE?: string;
  PRODUCTO?: string;
  DESCRIPCION?: string;
}

interface ModalAsignarRecetaProps {
  open: boolean;
  onClose: () => void;
  warehousesList: AlmacenItem[];
  masterProductsList: ProductoItem[];
  selectedWarehouseDefault?: AlmacenItem | null;
  onSave: (data: { id_planta_almacen: number; id_producto_intermedio: number }) => Promise<void>;
  isLoading?: boolean;
}

export const ModalAsignarReceta: React.FC<ModalAsignarRecetaProps> = ({
  open,
  onClose,
  warehousesList,
  masterProductsList,
  selectedWarehouseDefault,
  onSave,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductoItem | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedWarehouse(selectedWarehouseDefault || (warehousesList.length > 0 ? warehousesList[0] : null));
      setSelectedProduct(null);
    }
  }, [open, selectedWarehouseDefault, warehousesList]);

  const handleConfirmSave = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén requerido', 'Por favor seleccione el almacén de destino.');
      return;
    }
    if (!selectedProduct) {
      showAlert.warning('Producto requerido', 'Por favor seleccione la receta del producto intermedio.');
      return;
    }

    const idProd = selectedProduct.ID_PRODUCTO_INTERMEDIO || selectedProduct.ID_PRODUCTO || 0;
    if (!idProd) {
      showAlert.error('Error de selección', 'El producto seleccionado no cuenta con un identificador válido.');
      return;
    }

    await onSave({
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      id_producto_intermedio: idProd,
    });
    onClose();
  };

  const selectSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '15px',
      backgroundColor: 'var(--input-bg, var(--surface))',
      color: 'var(--on-surface)',
      padding: '3px 8px',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--outline-variant)',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--outline)',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: 'var(--primary)',
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
              <span className="material-symbols-outlined text-xl">add_link</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                GESTIÓN DE RECETAS
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                ASIGNAR RECETA A ALMACÉN
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

      {/* ── Cuerpo del Formulario ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 2 }, bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="space-y-4 font-body">
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">store</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                VINCULACIÓN DE ALMACÉN Y RECETA
              </span>
            </div>

            {/* 1. Almacén Destino */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Almacén Destino *
              </label>
              <Autocomplete
                options={warehousesList}
                getOptionLabel={(option) => option.DESCRICION || ''}
                value={selectedWarehouse}
                onChange={(_, newValue) => setSelectedWarehouse(newValue)}
                isOptionEqualToValue={(option, value) =>
                  option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                }
                fullWidth
                disableClearable
                noOptionsText="No hay almacenes disponibles"
                sx={selectSx}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                )}
              />
            </div>

            {/* 2. Producto / Receta Intermedia */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Receta de Producto Intermedio *
              </label>
              <Autocomplete
                options={masterProductsList}
                getOptionLabel={(option) =>
                  option.NOMBRE || option.PRODUCTO || option.DESCRIPCION || ''
                }
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                isOptionEqualToValue={(option, value) =>
                  (option.ID_PRODUCTO_INTERMEDIO || option.ID_PRODUCTO) ===
                  (value?.ID_PRODUCTO_INTERMEDIO || value?.ID_PRODUCTO)
                }
                fullWidth
                noOptionsText="No hay recetas disponibles"
                sx={selectSx}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR RECETA..." />
                )}
              />
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
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmSave}
          disabled={isLoading}
          icon="check"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Asignar Receta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

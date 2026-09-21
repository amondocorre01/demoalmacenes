import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { AlmacenItem } from '../services/useDesperdicioInsumos';

interface ModalSeleccionarAlmacenesProps {
  open: boolean;
  onClose: () => void;
  warehouses: AlmacenItem[];
  selectedWarehouses: AlmacenItem[];
  onApply: (selected: AlmacenItem[]) => void;
}

const ALL_OPTION: AlmacenItem = {
  ID_PLANTA_ALMACEN: 0,
  DESCRICION: 'TODOS LOS ALMACENES',
};

export const ModalSeleccionarAlmacenes: React.FC<ModalSeleccionarAlmacenesProps> = ({
  open,
  onClose,
  warehouses,
  selectedWarehouses,
  onApply,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tempSelected, setTempSelected] = useState<AlmacenItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sincronizar selección inicial al abrir el modal
  useEffect(() => {
    if (open) {
      if (
        selectedWarehouses.length === 0 ||
        selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
      ) {
        setTempSelected([ALL_OPTION]);
      } else {
        setTempSelected([...selectedWarehouses]);
      }
      setSearchTerm('');
    }
  }, [open, selectedWarehouses]);

  const isAllSelected = useMemo(() => {
    return tempSelected.some((w) => w.ID_PLANTA_ALMACEN === 0);
  }, [tempSelected]);

  // Filtrar almacenes por término de búsqueda
  const filteredWarehouses = useMemo(() => {
    if (!searchTerm.trim()) return warehouses;
    const term = searchTerm.toLowerCase();
    return warehouses.filter((w) => {
      const name = (w.DESCRICION || w.nombre || '').toLowerCase();
      const id = String(w.ID_PLANTA_ALMACEN);
      return name.includes(term) || id.includes(term);
    });
  }, [warehouses, searchTerm]);

  // Toggle "Todos los almacenes"
  const handleToggleAll = () => {
    if (isAllSelected) {
      setTempSelected([]);
    } else {
      setTempSelected([ALL_OPTION]);
    }
  };

  // Toggle almacén individual
  const handleToggleWarehouse = (item: AlmacenItem) => {
    if (isAllSelected) {
      setTempSelected([item]);
      return;
    }

    const exists = tempSelected.some((w) => w.ID_PLANTA_ALMACEN === item.ID_PLANTA_ALMACEN);
    let updated: AlmacenItem[];

    if (exists) {
      updated = tempSelected.filter((w) => w.ID_PLANTA_ALMACEN !== item.ID_PLANTA_ALMACEN);
    } else {
      updated = [...tempSelected, item];
    }

    if (updated.length === 0) {
      setTempSelected([ALL_OPTION]);
    } else if (updated.length === warehouses.length) {
      setTempSelected([ALL_OPTION]);
    } else {
      setTempSelected(updated);
    }
  };

  // Aplicar selección
  const handleApply = () => {
    if (tempSelected.length === 0) {
      onApply([ALL_OPTION]);
    } else {
      onApply(tempSelected);
    }
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
              <span className="material-symbols-outlined text-xl">store</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                FILTRO DE ALMACENES
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                SELECCIONAR ALMACENES
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
          maxHeight: '75vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-3">
          {/* Buscador de almacenes */}
          <div className="relative">
            <input
              type="text"
              placeholder="BUSCAR ALMACÉN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-variant/40 dark:bg-zinc-800/50 border border-outline-variant dark:border-zinc-700 rounded-xl py-2 px-4 pl-9 text-xs font-bold text-on-surface uppercase tracking-wider focus:outline-none focus:border-primary transition-all"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-zinc-400 text-sm">
              search
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
              </button>
            )}
          </div>

          {/* Opción Todos los Almacenes */}
          <div
            onClick={handleToggleAll}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              isAllSelected
                ? 'bg-primary/10 border-primary/40 dark:bg-primary/20 dark:border-primary/50'
                : 'bg-surface-variant/20 hover:bg-surface-variant/40 border-outline-variant/60 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-xl">
                domain
              </span>
              <div>
                <p className="text-xs font-black uppercase text-on-surface">
                  TODOS LOS ALMACENES
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                  Consultar información global de todas las sucursales
                </p>
              </div>
            </div>
            <Checkbox
              checked={isAllSelected}
              size="small"
              sx={{
                color: 'var(--outline-variant)',
                '&.Mui-checked': { color: 'var(--primary)' },
              }}
            />
          </div>

          {/* Lista individual de almacenes */}
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            <p className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider px-1 pt-1">
              Almacenes ({filteredWarehouses.length})
            </p>

            {filteredWarehouses.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                <span className="material-symbols-outlined text-3xl block mb-1">store_mall_directory</span>
                <span className="text-xs font-bold uppercase">No se encontraron almacenes</span>
              </div>
            ) : (
              filteredWarehouses.map((w) => {
                const isSelected =
                  isAllSelected ||
                  tempSelected.some((item) => item.ID_PLANTA_ALMACEN === w.ID_PLANTA_ALMACEN);

                return (
                  <div
                    key={w.ID_PLANTA_ALMACEN}
                    onClick={() => handleToggleWarehouse(w)}
                    className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/40'
                        : 'bg-surface hover:bg-surface-variant/30 border-outline-variant/40 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-zinc-400 text-lg">
                        storefront
                      </span>
                      <span className="text-xs font-bold uppercase text-on-surface">
                        {w.DESCRICION || w.nombre || `Almacén #${w.ID_PLANTA_ALMACEN}`}
                      </span>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      size="small"
                      sx={{
                        color: 'var(--outline-variant)',
                        '&.Mui-checked': { color: 'var(--primary)' },
                      }}
                    />
                  </div>
                );
              })
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
          justify: 'space-between',
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
          onClick={handleApply}
          icon="check"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Aplicar Filtro ({isAllSelected ? 'Todos' : tempSelected.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

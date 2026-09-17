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
import { AlmacenItem } from '../services/useDesperdicioManual';

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

  // Aplicar selección y cerrar
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
          px: 3,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">warehouse</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                FILTRO DE CONSULTA
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
          maxHeight: '65vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-3">
          {/* Buscador de almacén */}
          <div className="relative group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="BUSCAR ALMACÉN..."
              className="w-full bg-surface-variant/40 dark:bg-zinc-850 border border-outline-variant dark:border-zinc-800 rounded-xl py-2 px-3 pl-9 text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-zinc-400 text-sm">
              search
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Opción Todos los Almacenes */}
          <div
            onClick={handleToggleAll}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isAllSelected
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                : 'bg-surface-variant/20 dark:bg-zinc-850/30 border-outline-variant/60 dark:border-zinc-800 hover:bg-surface-variant/40 text-on-surface'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={isAllSelected}
                size="small"
                sx={{
                  color: isAllSelected ? 'var(--primary)' : 'var(--outline)',
                  '&.Mui-checked': { color: 'var(--primary)' },
                  p: 0.5,
                }}
              />
              <div>
                <span className="text-xs font-black uppercase tracking-wider">
                  TODOS LOS ALMACENES
                </span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase">
                  Consultar información de todos los almacenes autorizados
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-lg">
              {isAllSelected ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>

          {/* Lista de Almacenes Individuales */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {filteredWarehouses.length === 0 ? (
              <div className="py-6 text-center text-zinc-400">
                <span className="material-symbols-outlined text-3xl block mb-1">
                  search_off
                </span>
                <span className="text-xs font-bold uppercase">
                  No se encontraron almacenes
                </span>
              </div>
            ) : (
              filteredWarehouses.map((wh) => {
                const isSelected =
                  !isAllSelected &&
                  tempSelected.some(
                    (w) => w.ID_PLANTA_ALMACEN === wh.ID_PLANTA_ALMACEN
                  );

                return (
                  <div
                    key={wh.ID_PLANTA_ALMACEN}
                    onClick={() => handleToggleWarehouse(wh)}
                    className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                        : isAllSelected
                          ? 'bg-surface dark:bg-zinc-900 border-outline-variant/40 dark:border-zinc-800 opacity-60 text-zinc-500'
                          : 'bg-surface dark:bg-zinc-900 border-outline-variant/60 dark:border-zinc-800 hover:bg-surface-variant/30 text-on-surface'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={isSelected || isAllSelected}
                        disabled={isAllSelected}
                        size="small"
                        sx={{
                          color: isSelected ? 'var(--primary)' : 'var(--outline)',
                          '&.Mui-checked': { color: 'var(--primary)' },
                          p: 0.5,
                        }}
                      />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        {wh.DESCRICION || wh.nombre || String(wh.ID_PLANTA_ALMACEN)}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-base">
                        check
                      </span>
                    )}
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
          Aplicar Filtro
        </Button>
      </DialogActions>
    </Dialog>
  );
};

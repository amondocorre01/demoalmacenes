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
import { AlmacenItem } from '../services/useReposicionUsuarioAlmacen';

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
    if (!searchTerm.trim()) return warehouses.filter((w) => w.ID_PLANTA_ALMACEN > 0);
    const term = searchTerm.toLowerCase();
    return warehouses
      .filter((w) => w.ID_PLANTA_ALMACEN > 0)
      .filter((w) => {
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
    } else {
      setTempSelected(updated);
    }
  };

  // Confirmar y aplicar
  const handleConfirm = () => {
    if (tempSelected.length === 0 || isAllSelected) {
      onApply([ALL_OPTION]);
    } else {
      onApply(tempSelected);
    }
    onClose();
  };

  const actualWarehousesCount = warehouses.filter((w) => w.ID_PLANTA_ALMACEN > 0).length;
  const selectedCount = isAllSelected ? actualWarehousesCount : tempSelected.length;

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
                GESTIÓN DE REPOSICIÓN
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
        <div className="space-y-4">
          {/* Buscador interno */}
          <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
            <div className="relative group w-full">
              <input
                type="text"
                placeholder="BUSCAR ALMACÉN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-variant/40 dark:bg-zinc-850/40 border border-outline-variant dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-xs font-black text-on-surface transition-all uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-base">
                search
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta de Control Rápido: TODOS */}
          <div
            onClick={handleToggleAll}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              isAllSelected
                ? 'bg-primary/10 border-primary/40 shadow-sm'
                : 'bg-surface-variant/30 border-outline-variant/60 hover:bg-surface-variant/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                size="small"
                sx={{
                  color: 'var(--outline)',
                  '&.Mui-checked': { color: 'var(--primary)' },
                  p: 0.5,
                }}
              />
              <div>
                <span className="font-black text-xs uppercase tracking-tight text-on-surface">
                  TODOS LOS ALMACENES
                </span>
                <p className="text-[10px] font-bold text-on-surface-variant">
                  Consultar información de todos los almacenes autorizados
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                isAllSelected ? 'bg-primary text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {actualWarehousesCount} ALMACENES
            </span>
          </div>

          {/* Listado de Almacenes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-headline">
                ALMACENES DISPONIBLES ({filteredWarehouses.length})
              </span>
              <span className="text-[10px] font-bold text-primary font-body">
                {isAllSelected
                  ? 'Todos seleccionados'
                  : `${selectedCount} de ${actualWarehousesCount} seleccionados`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
              {filteredWarehouses.length === 0 ? (
                <div className="col-span-full py-6 text-center text-zinc-400">
                  <span className="material-symbols-outlined text-3xl block mb-1">storefront</span>
                  <span className="text-xs font-bold uppercase">No se encontraron almacenes</span>
                </div>
              ) : (
                filteredWarehouses.map((w) => {
                  const isChecked =
                    isAllSelected ||
                    tempSelected.some((item) => item.ID_PLANTA_ALMACEN === w.ID_PLANTA_ALMACEN);

                  return (
                    <div
                      key={w.ID_PLANTA_ALMACEN}
                      onClick={() => handleToggleWarehouse(w)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                        isChecked && !isAllSelected
                          ? 'bg-primary/10 border-primary/40 shadow-sm'
                          : isChecked && isAllSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                          : 'bg-surface border-outline-variant/50 hover:bg-surface-variant/30 hover:border-outline-variant'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        size="small"
                        sx={{
                          color: 'var(--outline)',
                          '&.Mui-checked': { color: 'var(--primary)' },
                          p: 0,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase truncate text-on-surface">
                          {w.DESCRICION || w.nombre}
                        </p>
                        <p className="text-[9px] font-semibold text-on-surface-variant">
                          ID: #{w.ID_PLANTA_ALMACEN}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ── Pie del Modal ── */}
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
          onClick={handleConfirm}
          icon="check"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Aplicar Selección ({isAllSelected ? 'Todos' : tempSelected.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalSeleccionarAlmacenes;

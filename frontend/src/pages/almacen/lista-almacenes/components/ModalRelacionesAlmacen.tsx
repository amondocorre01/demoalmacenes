import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  Autocomplete,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

/**
 * ModalRelacionesAlmacen.tsx
 * 
 * 1. Propósito del Componente:
 *    Modal para visualizar y explorar los vínculos de solicitud entre almacenes:
 *    - "solicita_a": Almacenes a los que el almacén seleccionado puede solicitar insumos/productos.
 *    - "puede_solicitarle": Almacenes que pueden solicitar insumos/productos al almacén seleccionado.
 * 
 * 2. APIs Utilizadas:
 *    Utiliza la lista global de almacenes cargada en ListaAlmacenes desde `/v1/almacen`.
 * 
 * 3. Controles Clave:
 *    - Selector de autocompletado para cambiar el almacén en consulta en tiempo real.
 *    - Resolución robusta de IDs a objetos de almacén completos (nombres, IDs y estados).
 *    - Diseño adaptable 100% responsivo para móviles y escritorio con soporte para Modo Claro y Oscuro.
 */

interface RelacionItem {
  id_almacen?: number;
  ID_PLANTA_ALMACEN?: number;
  estado?: number;
  DESCRICION?: string;
}

interface Warehouse {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO: number | boolean;
  ESTADO_PRODUCCION?: number | boolean;
  GESTION_PI?: number | boolean;
  SOLICITUD_PLANTA?: number | boolean;
  ENTREGA_PLANTA?: number | boolean;
  solicita_a?: RelacionItem[];
  puede_solicitarle?: RelacionItem[];
}

interface ModalRelacionesAlmacenProps {
  open: boolean;
  onClose: () => void;
  selectedWarehouse: Warehouse | null;
  allWarehouses: Warehouse[];
}

export const ModalRelacionesAlmacen: React.FC<ModalRelacionesAlmacenProps> = ({
  open,
  onClose,
  selectedWarehouse: initialWarehouse,
  allWarehouses = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estado del almacén actualmente seleccionado dentro del modal
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(initialWarehouse);
  const [searchTerm, setSearchTerm] = useState('');

  // Actualizar almacén actual si cambia la prop inicial
  useEffect(() => {
    if (open) {
      setCurrentWarehouse(initialWarehouse || (allWarehouses.length > 0 ? allWarehouses[0] : null));
      setSearchTerm('');
    }
  }, [open, initialWarehouse, allWarehouses]);

  const isFlagActive = (val: any): boolean => val === true || val === 1 || val === '1';

  // Helper para resolver los datos completos de un almacén referenciado por ID
  const resolveWarehouseInfo = (item: RelacionItem): { id: number; nombre: string; activo: boolean } => {
    const id = item.id_almacen ?? item.ID_PLANTA_ALMACEN ?? 0;

    // Buscar en la lista general de almacenes
    const found = allWarehouses.find(w => w.ID_PLANTA_ALMACEN === id);
    if (found) {
      return {
        id,
        nombre: found.DESCRICION,
        activo: isFlagActive(found.ESTADO)
      };
    }

    return {
      id,
      nombre: item.DESCRICION || `Almacén #${id}`,
      activo: item.estado !== 0 && item.estado !== false
    };
  };

  // Listas resueltas para el almacén seleccionado
  const solicitaAList = useMemo(() => {
    if (!currentWarehouse?.solicita_a) return [];
    return currentWarehouse.solicita_a
      .map(resolveWarehouseInfo)
      .filter(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [currentWarehouse, allWarehouses, searchTerm]);

  const puedeSolicitarleList = useMemo(() => {
    if (!currentWarehouse?.puede_solicitarle) return [];
    return currentWarehouse.puede_solicitarle
      .map(resolveWarehouseInfo)
      .filter(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [currentWarehouse, allWarehouses, searchTerm]);

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? '100%' : '880px',
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
      {/* ── Encabezado del Modal ── */}
      <DialogTitle sx={{ p: 2, px: 3, borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)', bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">alt_route</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                Gestión de Almacenes
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                Vínculos & Permisos de Solicitud
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

      {/* ── Cuerpo del Modal ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '80vh', overflowY: 'auto' }}>
        <div className="space-y-4">

          {/* Almacén en Consulta y Selector Autocompletable */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Información del Almacén Actual */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-xl">warehouse</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest font-headline block leading-none mb-1">
                    Almacén en Consulta
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-on-surface uppercase tracking-tight font-headline truncate">
                    {currentWarehouse?.DESCRICION || 'SIN ALMACÉN SELECCIONADO'}
                  </h3>
                  {currentWarehouse && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8.5px] font-black text-on-surface-variant uppercase tracking-wider">
                        ID: #{currentWarehouse.ID_PLANTA_ALMACEN}
                      </span>
                      <span className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${isFlagActive(currentWarehouse.ESTADO)
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                        {isFlagActive(currentWarehouse.ESTADO) ? '● Activo' : '○ Inactivo'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Autocompletable al lado para seleccionar/cambiar el almacén a consultar */}
              <div className="w-full md:w-80 space-y-1.5 shrink-0">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1 font-headline">
                  Seleccionar Almacén a Consultar
                </label>
                <Autocomplete
                  options={allWarehouses}
                  getOptionLabel={(option) => option.DESCRICION || ''}
                  value={currentWarehouse}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setCurrentWarehouse(newValue);
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                  }
                  fullWidth
                  disableClearable
                  noOptionsText="No hay almacenes disponibles"
                  sx={{
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
                      '& .MuiSvgIcon-root': {
                        color: 'var(--on-surface-variant)',
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      size="small"
                      placeholder="SELECCIONAR ALMACÉN..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Filtro de Búsqueda Interno */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative group flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                placeholder="FILTRAR VÍNCULOS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-variant/40 border border-outline-variant rounded-xl py-2 pl-9 pr-4 text-[10px] font-black text-on-surface uppercase tracking-widest outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Grid de Relaciones en 2 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* BLOQUE 1: Puede Solicitar A */}
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant/80 flex flex-col justify-between space-y-3 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-base">outbound</span>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-on-surface uppercase tracking-wider font-headline leading-tight">
                        Puede Solicitar A
                      </h3>
                      <p className="text-[8px] font-medium text-on-surface-variant uppercase tracking-tight">
                        Almacenes a los que este almacén puede pedir
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {solicitaAList.length}
                  </span>
                </div>

                {/* Lista de Almacenes destino (solicita_a) */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {solicitaAList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-outline-variant/60 bg-surface-variant/20 hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-surface text-primary border border-outline-variant flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">store</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-on-surface uppercase truncate font-headline">
                            {item.nombre}
                          </p>
                          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-wider block">
                            ID: #{item.id}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shrink-0 ${item.activo
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-500/15 text-zinc-500 border border-zinc-500/30'
                        }`}>
                        {item.activo ? 'Autorizado' : 'Inactivo'}
                      </span>
                    </div>
                  ))}

                  {solicitaAList.length === 0 && (
                    <div className="py-10 flex flex-col items-center text-center text-on-surface-variant opacity-60">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-30">swap_horizontal_circle</span>
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {searchTerm ? 'Sin coincidencias para el filtro' : 'No tiene almacenes configurados para solicitar'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOQUE 2: Le Pueden Solicitar */}
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant/80 flex flex-col justify-between space-y-3 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-base">move_to_inbox</span>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-on-surface uppercase tracking-wider font-headline leading-tight">
                        Le Pueden Solicitar
                      </h3>
                      <p className="text-[8px] font-medium text-on-surface-variant uppercase tracking-tight">
                        Almacenes que tienen permiso para pedirle
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {puedeSolicitarleList.length}
                  </span>
                </div>

                {/* Lista de Almacenes origen (puede_solicitarle) */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {puedeSolicitarleList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-outline-variant/60 bg-surface-variant/20 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-surface text-emerald-600 dark:text-emerald-400 border border-outline-variant flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">store</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-on-surface uppercase truncate font-headline">
                            {item.nombre}
                          </p>
                          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-wider block">
                            ID: #{item.id}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shrink-0 ${item.activo
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-500/15 text-zinc-500 border border-zinc-500/30'
                        }`}>
                        {item.activo ? 'Autorizado' : 'Inactivo'}
                      </span>
                    </div>
                  ))}

                  {puedeSolicitarleList.length === 0 && (
                    <div className="py-10 flex flex-col items-center text-center text-on-surface-variant opacity-60">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-30">inbox</span>
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {searchTerm ? 'Sin coincidencias para el filtro' : 'Ningún almacén tiene permiso para solicitar a este almacén'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </DialogContent>

      {/* ── Pie del Modal ── */}
      <DialogActions sx={{
        px: 3,
        py: 2,
        bgcolor: 'var(--background, #fafafa)',
        borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
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

export default ModalRelacionesAlmacen;

/**
 * ListaAlmacenes.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión centralizada de almacenes, recetas e insumos por unidad productiva.
 *    Permite visualizar, registrar, editar, activar/desactivar almacenes y explorar
 *    sus relaciones de solicitud (solicita_a y puede_solicitarle).
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/almacen (Listar almacenes con recetas, estado y configuraciones)
 *    - GET /v1/almacen/activos (Listar almacenes activos para selectores)
 *    - POST /v1/almacen (Crear nuevo almacén)
 *    - PUT /v1/almacen/:id (Editar almacén existente)
 *    - PATCH /v1/almacen/recetas-almacen/estado (Modificar disponibilidad de recetas)
 * 
 * 3. Controles Clave:
 *    - Control único de Gestión PI: Solo un almacén en el sistema puede tener GESTION_PI activo.
 *    - Modal de Vínculos & Permisos de Solicitud: Visualización de almacenes a los que solicita y almacenes que le solicitan.
 *    - Persistencia de borradores ante 401 / refrescos.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  SwipeableDrawer,
  Box,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ModalNewAlmacen from './components/ModalNewAlmacen';
import ModalRelacionesAlmacen from './components/ModalRelacionesAlmacen';
import { useListaAlmacenesServices } from './services/useListaAlmacenes';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';

// --- Helper para normalizar valores booleanos o numéricos (1/0/true/false) ---
export const isFlagActive = (val: any): boolean => val === true || val === 1 || val === '1';

// --- Types ---
interface Ingredient {
  PRODUCTO?: string;
  PRODUCTO_INTERMEDIO_ANTECESOR?: string;
  CANTIDAD: number;
  UNIDAD_MEDIDA: string;
}

interface Recipe {
  DESCRIPCION: string;
  ESTADO_RECETA_ALMACEN: number | boolean;
  PRODUCTOS: Ingredient[];
  ID_PLANTA_RECETA_ALMACEN?: number;
  ID_ALMACEN_PRODUCTO_INTERMEDIO?: number;
}

interface Warehouse {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO: number | boolean;
  ESTADO_PRODUCCION: number | boolean;
  GESTION_PI: number | boolean;
  SOLICITUD_PLANTA: number | boolean;
  ENTREGA_PLANTA: number | boolean;
  solicita_a: { id_almacen: number; estado: number }[];
  puede_solicitarle: { id_almacen: number; estado: number }[];
  RECETAS: Recipe[];
}

// --- Components ---

const WarehouseCard: React.FC<{
  warehouse: Warehouse;
  onOpenDetail: (w: Warehouse) => void;
  onEdit: (w: Warehouse) => void;
  onToggleStatus: (w: Warehouse) => void;
  onOpenRelaciones: (w: Warehouse) => void;
}> = ({ warehouse, onOpenDetail, onEdit, onToggleStatus, onOpenRelaciones }) => {
  const isActive = isFlagActive(warehouse.ESTADO);
  const isProduccion = isFlagActive(warehouse.ESTADO_PRODUCCION);
  const isGestionPi = isFlagActive(warehouse.GESTION_PI);
  const isSolicitudPlanta = isFlagActive(warehouse.SOLICITUD_PLANTA);
  const isEntregaPlanta = isFlagActive(warehouse.ENTREGA_PLANTA);

  return (
    <div
      className={`rounded-[2rem] border p-3 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between 
        ${isActive
          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300'
          : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50 hover:border-rose-300'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner
            ${isActive ? 'bg-surface text-emerald-500 shadow-emerald-200/20' : 'bg-surface text-rose-400 shadow-rose-200/20'}`}>
            <span className="material-symbols-outlined text-2xl">warehouse</span>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-sm
              ${isActive ? 'bg-surface border-emerald-100 dark:border-emerald-900/40' : 'bg-surface border-rose-100 dark:border-rose-900/40'}`}>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
              <Switch
                size="small"
                checked={isActive}
                onChange={() => onToggleStatus(warehouse)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'emerald.500',
                    '& + .MuiSwitch-track': { backgroundColor: 'emerald.500' },
                  },
                  '& .MuiSwitch-switchBase': {
                    '& + .MuiSwitch-track': { backgroundColor: isActive ? 'emerald.200' : 'rose.200' },
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-on-surface uppercase tracking-tight font-headline mb-1.5">
            {warehouse.DESCRICION}
          </h2>

          {/* Badges de Flags: Producción, Gestión PI, Solicitud Planta, Entrega Planta */}
          <div className="flex flex-wrap items-center gap-1 mb-3">
            <span className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${isProduccion
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20'
              }`}>
              {isProduccion ? 'PRODUCCIÓN ON' : 'PRODUCCIÓN OFF'}
            </span>

            {isGestionPi && (
              <span className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                GESTIÓN PI
              </span>
            )}

            {isSolicitudPlanta && (
              <span className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                SOLICITA A PLANTA
              </span>
            )}

            {isEntregaPlanta && (
              <span className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                ENTREGA A PLANTA
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-on-surface-variant mb-4">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{warehouse.RECETAS.length} Recetas</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[15px]">alt_route</span>
              <span className="text-[9px] font-black uppercase tracking-wider">
                {(warehouse.solicita_a?.length || 0) + (warehouse.puede_solicitarle?.length || 0)} Vínculos
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
        <button
          type="button"
          onClick={() => onOpenRelaciones(warehouse)}
          title="Ver Vínculos de Solicitud (Puede solicitar A / Le pueden solicitar)"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] sm:text-base">alt_route</span>
        </button>
        <button
          type="button"
          onClick={() => onEdit(warehouse)}
          title="Editar Almacén"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] sm:text-base">edit</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail(warehouse)}
          title="Ver Detalle y Recetas"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] sm:text-base">visibility</span>
        </button>
      </div>
    </div>
  );
};

export const ListaAlmacenes: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouses, setActiveWarehouses] = useState<{ ID_PLANTA_ALMACEN: number; DESCRICION: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Relaciones (puede_solicitarle y solicita_a)
  const [isRelacionesModalOpen, setIsRelacionesModalOpen] = useState(false);
  const [relacionesWarehouse, setRelacionesWarehouse] = useState<Warehouse | null>(null);

  // Search States & View Mode
  const [mainSearch, setMainSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'box' | 'table'>('box');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ID del almacén que actualmente tiene GESTION_PI activo (solo puede haber uno)
  const gestionPiId = warehouses.find(w => isFlagActive(w.GESTION_PI))?.ID_PLANTA_ALMACEN ?? null;

  useEffect(() => {
    setExpandedIndex(null);
  }, [selectedWarehouse, recipeSearch]);

  const { getAlmacenes, getAlmacenesActivos, createAlmacen, updateAlmacen, updateEstadoRecetaAlmacen } = useListaAlmacenesServices();

  const fetchWarehouses = async () => {
    setIsLoading(true);
    const [resAll, resActivos] = await Promise.all([getAlmacenes(), getAlmacenesActivos()]);
    if (resAll && resAll.success) {
      setWarehouses(resAll.data || []);
    } else {
      setWarehouses([]);
    }
    if (resActivos && resActivos.success) {
      setActiveWarehouses(resActivos.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenDetail = (w: Warehouse) => {
    setSelectedWarehouse(w);
    setRecipeSearch(''); // Reset drawer search
    setDetailDrawerOpen(true);
  };

  const handleOpenRelaciones = (w: Warehouse) => {
    setRelacionesWarehouse(w);
    setIsRelacionesModalOpen(true);
  };

  const handleEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setIsModalOpen(true);
  };

  type WarehouseFlag = 'ESTADO' | 'ESTADO_PRODUCCION' | 'GESTION_PI' | 'SOLICITUD_PLANTA' | 'ENTREGA_PLANTA';

  const flagLabels: Record<WarehouseFlag, string> = {
    ESTADO: 'Estado Operativo',
    ESTADO_PRODUCCION: 'Área de Producción',
    GESTION_PI: 'Gestión PI',
    SOLICITUD_PLANTA: 'Solicitud a Planta',
    ENTREGA_PLANTA: 'Entrega a Planta',
  };

  const handleToggleFlagWithConfirm = async (warehouse: Warehouse, flag: WarehouseFlag) => {
    const currentVal = isFlagActive(warehouse[flag]);
    const nextVal = !currentVal;
    const label = flagLabels[flag];
    const newStatusText = nextVal ? 'activar' : 'desactivar';

    // Validación previa para GESTION_PI
    if (flag === 'GESTION_PI' && nextVal && gestionPiId !== null && gestionPiId !== warehouse.ID_PLANTA_ALMACEN) {
      const confirmChangePi = await showAlert.confirm(
        'Cambiar Almacén con Gestión PI',
        `Solo un almacén en todo el sistema puede tener "Gestión PI" activo. Al activarlo aquí para "${warehouse.DESCRICION}", se deshabilitará en los demás almacenes. ¿Desea continuar?`
      );
      if (!confirmChangePi) return;
    } else {
      const confirmed = await showAlert.confirm(
        'Confirmar Cambio de Estado',
        `¿Está seguro de ${newStatusText} "${label}" para el almacén "${warehouse.DESCRICION}"?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);

    const payload: any = {
      almacen: warehouse.DESCRICION,
      estado: flag === 'ESTADO' ? (nextVal ? 1 : 0) : (isFlagActive(warehouse.ESTADO) ? 1 : 0),
      estado_produccion: flag === 'ESTADO_PRODUCCION' ? (nextVal ? 1 : 0) : (isFlagActive(warehouse.ESTADO_PRODUCCION) ? 1 : 0),
      gestion_pi: flag === 'GESTION_PI' ? (nextVal ? 1 : 0) : (isFlagActive(warehouse.GESTION_PI) ? 1 : 0),
      solicitud_planta: flag === 'SOLICITUD_PLANTA' ? (nextVal ? 1 : 0) : (isFlagActive(warehouse.SOLICITUD_PLANTA) ? 1 : 0),
      entrega_planta: flag === 'ENTREGA_PLANTA' ? (nextVal ? 1 : 0) : (isFlagActive(warehouse.ENTREGA_PLANTA) ? 1 : 0),
    };

    // Regla de negocio: Si se activa gestion_pi, se deshabilitan solicitud_planta y entrega_planta
    if (flag === 'GESTION_PI' && nextVal) {
      payload.solicitud_planta = 0;
      payload.entrega_planta = 0;
    }

    const res = await updateAlmacen(warehouse.ID_PLANTA_ALMACEN, payload);
    if (res && res.success) {
      showAlert.toast(`${label} ${nextVal ? 'activado' : 'desactivado'} correctamente.`);
      fetchWarehouses();
    }
    setIsLoading(false);
  };

  const toggleWarehouseStatus = async (warehouse: Warehouse) => {
    await handleToggleFlagWithConfirm(warehouse, 'ESTADO');
  };

  const toggleRecipeStatus = async (warehouseId: number, recipe: Recipe) => {
    const newStatus = recipe.ESTADO_RECETA_ALMACEN === 1 ? 0 : 1;
    setIsLoading(true);
    const payload = {
      id_planta_receta_almacen: recipe.ID_PLANTA_RECETA_ALMACEN || 0,
      id_almacen_producto_intermedio: recipe.ID_ALMACEN_PRODUCTO_INTERMEDIO || 0,
      estado: newStatus
    };
    const res = await updateEstadoRecetaAlmacen(payload);
    if (res && res.success) {
      showAlert.toast(`Estado de receta actualizado.`);

      const updatedList = warehouses.map(w => {
        if (w.ID_PLANTA_ALMACEN !== warehouseId) return w;
        const newRecetas = w.RECETAS.map(r => {
          const isTarget =
            (payload.id_planta_receta_almacen && r.ID_PLANTA_RECETA_ALMACEN === payload.id_planta_receta_almacen) ||
            (payload.id_almacen_producto_intermedio && r.ID_ALMACEN_PRODUCTO_INTERMEDIO === payload.id_almacen_producto_intermedio);
          return isTarget ? { ...r, ESTADO_RECETA_ALMACEN: newStatus } : r;
        });
        return { ...w, RECETAS: newRecetas };
      });

      setWarehouses(updatedList);
      const updatedWarehouse = updatedList.find(w => w.ID_PLANTA_ALMACEN === warehouseId);
      if (updatedWarehouse) {
        setSelectedWarehouse(updatedWarehouse);
      }
    }
    setIsLoading(false);
  };

  const handleSaveWarehouse = async (formData: {
    almacen?: string;
    nombre?: string;
    estado_produccion: boolean;
    activo: boolean;
    gestion_pi: number;
    solicitud_planta: number;
    entrega_planta: number;
    solicita_a: { id_almacen: number; estado: number }[];
  }) => {
    const nombreAlmacen = (formData.almacen || formData.nombre || '').trim();

    // Control: solo un almacén puede tener gestion_pi = 1
    if (formData.gestion_pi == 1 && gestionPiId !== null && gestionPiId !== editingWarehouse?.ID_PLANTA_ALMACEN) {
      showAlert.error('Control Gestión PI', 'Ya existe un almacén con Gestión PI activo. Desactívelo primero antes de habilitarlo aquí.');
      return;
    }

    setIsLoading(true);
    if (editingWarehouse) {
      // Editing
      const res = await updateAlmacen(editingWarehouse.ID_PLANTA_ALMACEN, {
        almacen: nombreAlmacen,
        estado: formData.activo ? 1 : 0,
        estado_produccion: formData.estado_produccion ? 1 : 0,
        gestion_pi: formData.gestion_pi,
        solicitud_planta: formData.solicitud_planta,
        entrega_planta: formData.entrega_planta,
        solicita_a: formData.solicita_a,
      });
      if (res && res.success) {
        showAlert.success('Éxito', 'Almacén actualizado correctamente.');
        fetchWarehouses();
      }
    } else {
      // Creating new
      const res = await createAlmacen({
        almacen: nombreAlmacen,
        estado_produccion: formData.estado_produccion ? 1 : 0,
        gestion_pi: formData.gestion_pi,
        solicitud_planta: formData.solicitud_planta,
        entrega_planta: formData.entrega_planta,
        solicita_a: formData.solicita_a,
      });
      if (res && res.success) {
        showAlert.success('Éxito', 'Almacén creado correctamente.');
        fetchWarehouses();
      }
    }
    setIsLoading(false);
  };

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w =>
      w.DESCRICION.toLowerCase().includes(mainSearch.toLowerCase())
    );
  }, [mainSearch, warehouses]);

  const totalItems = filteredWarehouses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedWarehouses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredWarehouses.slice(start, start + pageSize);
  }, [filteredWarehouses, page, pageSize]);

  const filteredRecipes = useMemo(() => {
    if (!selectedWarehouse) return [];
    return selectedWarehouse.RECETAS.filter(r =>
      r.DESCRIPCION.toLowerCase().includes(recipeSearch.toLowerCase())
    );
  }, [selectedWarehouse, recipeSearch]);

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-1">
      <LoadingOverlay show={isLoading} message="Cargando información de almacenes..." />

      {/* ── Encabezado Principal (Responsive: en móvil el botón se apila debajo del texto) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            Gestión de Almacenes
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Control centralizado de recetas e insumos por unidad productiva
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <Button
            onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
            variant="primary"
            size="md"
            icon="add"
            className="!h-10 !px-6 shadow-lg shadow-primary/20 w-full sm:w-auto shrink-0"
          >
            Crear Nuevo Almacén
          </Button>
        </div>
      </div>

      {/* ── Barra Superior de Búsqueda y Control de Vista (Box vs Tabla) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3 mb-3">
        {/* Global Search */}
        <div className="bg-surface border border-outline-variant rounded-2xl px-3 py-2 flex items-center gap-2 w-full sm:w-80 shadow-sm focus-within:border-primary/50 transition-all">
          <SearchIcon sx={{ color: 'var(--on-surface-variant)', fontSize: '20px' }} />
          <input
            type="text"
            placeholder="BUSCAR ALMACÉN..."
            className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-on-surface w-full placeholder:text-on-surface-variant/60"
            value={mainSearch}
            onChange={(e) => {
              setMainSearch(e.target.value);
              setPage(1);
            }}
          />
          {mainSearch && (
            <button
              type="button"
              onClick={() => { setMainSearch(''); setPage(1); }}
              className="text-on-surface-variant hover:text-on-surface text-xs font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Control de Vista (Box vs Tabla) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-surface-variant/50 p-1 rounded-2xl border border-outline-variant/60 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('box')}
            title="Vista en Tarjetas / Box"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'box'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/60'
              }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Vista en Tabla"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'table'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/60'
              }`}
          >
            <span className="material-symbols-outlined text-base">table_rows</span>
          </button>
        </div>
      </div>

      {/* ── Contenido Principal según modo de vista ── */}
      {viewMode === 'box' ? (
        /* Vista de Tarjetas / Box */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
          {filteredWarehouses.map((w) => (
            <WarehouseCard
              key={w.ID_PLANTA_ALMACEN}
              warehouse={w}
              onOpenDetail={handleOpenDetail}
              onEdit={handleEdit}
              onToggleStatus={toggleWarehouseStatus}
              onOpenRelaciones={handleOpenRelaciones}
            />
          ))}
          {filteredWarehouses.length === 0 && !isLoading && (
            <div className="col-span-full py-20 flex flex-col items-center text-on-surface-variant opacity-60">
              <span className="material-symbols-outlined text-6xl opacity-20">search_off</span>
              <p className="text-xs font-black uppercase tracking-widest mt-4">No se encontraron almacenes con "{mainSearch}"</p>
            </div>
          )}
        </div>
      ) : (
        /* Vista de Tabla Unificada con Estandarización UI */
        <div className="bg-surface rounded-[1rem] border border-outline-variant shadow-sm overflow-hidden mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/40 border-b border-outline-variant/60">
                  <th className="pl-6 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap">N°</th>
                  <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant min-w-[150px]">Almacén</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Estado</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Producción</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Gestión PI</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Solicita Planta</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Entrega Planta</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Recetas</th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-center">Vínculos</th>
                  <th className="pr-6 pl-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {paginatedWarehouses.map((w, idx) => {
                  const isActive = isFlagActive(w.ESTADO);
                  const isProduccion = isFlagActive(w.ESTADO_PRODUCCION);
                  const isGestionPi = isFlagActive(w.GESTION_PI);
                  const isSolicitudPlanta = isFlagActive(w.SOLICITUD_PLANTA);
                  const isEntregaPlanta = isFlagActive(w.ENTREGA_PLANTA);
                  const rowNumber = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={w.ID_PLANTA_ALMACEN}
                      className="hover:bg-surface-variant/20 transition-colors group"
                    >
                      {/* N° */}
                      <td className="pl-6 pr-2 py-1.5 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{rowNumber}</span>
                      </td>

                      {/* Almacén */}
                      <td className="px-3 py-1.5">
                        <div>
                          <p className="text-xs font-black text-on-surface uppercase tracking-tight font-headline leading-tight">
                            {w.DESCRICION}
                          </p>
                          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-wider block">
                            ID: #{w.ID_PLANTA_ALMACEN}
                          </span>
                        </div>
                      </td>

                      {/* ESTADO (Botón delgado con alerta de confirmación) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFlagWithConfirm(w, 'ESTADO')}
                          title="Clic para cambiar Estado Operativo"
                          className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border ${isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                            }`}
                        >
                          {isActive ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>

                      {/* ESTADO_PRODUCCION (Botón delgado con alerta de confirmación) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFlagWithConfirm(w, 'ESTADO_PRODUCCION')}
                          title="Clic para cambiar Área de Producción"
                          className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border ${isProduccion
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                            : 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                          {isProduccion ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>

                      {/* GESTION_PI (Botón delgado con alerta de confirmación) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFlagWithConfirm(w, 'GESTION_PI')}
                          title="Clic para cambiar Gestión PI"
                          className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border ${isGestionPi
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-600 hover:text-white'
                            : 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                          {isGestionPi ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>

                      {/* SOLICITUD_PLANTA (Botón delgado con alerta de confirmación) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFlagWithConfirm(w, 'SOLICITUD_PLANTA')}
                          title="Clic para cambiar Solicitud a Planta"
                          className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border ${isSolicitudPlanta
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-600 hover:text-white'
                            : 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                          {isSolicitudPlanta ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>

                      {/* ENTREGA_PLANTA (Botón delgado con alerta de confirmación) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFlagWithConfirm(w, 'ENTREGA_PLANTA')}
                          title="Clic para cambiar Entrega a Planta"
                          className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 border ${isEntregaPlanta
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-600 hover:text-white'
                            : 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                          {isEntregaPlanta ? '● Activo' : '○ Inactivo'}
                        </button>
                      </td>

                      {/* RECETAS (Botón compacto y delgado) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(w)}
                          title="Ver Detalle y Recetas"
                          className="inline-flex items-center gap-1 text-[8px] font-black text-on-surface uppercase px-2 py-0.5 rounded-md bg-surface-variant/40 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 border border-outline-variant/60 transition-all cursor-pointer shadow-sm group"
                        >
                          <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">restaurant_menu</span>
                          <span>{w.RECETAS.length} Recetas</span>
                        </button>
                      </td>

                      {/* VÍNCULOS (Botón compacto y delgado) */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenRelaciones(w)}
                          title="Ver Vínculos de Solicitud"
                          className="inline-flex items-center gap-1 text-[8px] font-black text-primary uppercase px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary hover:text-white border border-primary/20 transition-all cursor-pointer shadow-sm group"
                        >
                          <span className="material-symbols-outlined text-[13px] group-hover:scale-110 transition-transform">alt_route</span>
                          <span>{(w.solicita_a?.length || 0) + (w.puede_solicitarle?.length || 0)} Vínculos</span>
                        </button>
                      </td>

                      {/* ACCIONES */}
                      <td className="pr-6 pl-3 py-1.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* <button
                            type="button"
                            onClick={() => handleOpenRelaciones(w)}
                            title="Ver Vínculos de Solicitud"
                            className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">alt_route</span>
                          </button> */}
                          <button
                            type="button"
                            onClick={() => handleEdit(w)}
                            title="Editar Almacén"
                            className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          {/* <button
                            type="button"
                            onClick={() => handleOpenDetail(w)}
                            title="Ver Detalle y Recetas"
                            className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredWarehouses.length === 0 && !isLoading && (
              <div className="py-20 flex flex-col items-center text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-6xl opacity-20">search_off</span>
                <p className="text-xs font-black uppercase tracking-widest mt-4">No se encontraron almacenes con "{mainSearch}"</p>
              </div>
            )}
          </div>

          {/* Table Footer / Pagination */}
          {!isLoading && totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-variant/30 p-4 border-t border-outline-variant/60">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">
                    Mostrar:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 rounded-xl bg-surface border border-outline-variant text-[10px] font-black uppercase text-on-surface px-2.5 outline-none shadow-sm cursor-pointer"
                  >
                    <option value={5}>5 filas</option>
                    <option value={10}>10 filas</option>
                    <option value={20}>20 filas</option>
                    <option value={50}>50 filas</option>
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">
                  Mostrando {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalItems)} de {totalItems} registros
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-xl bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                </button>
                <span className="text-[10px] font-black uppercase text-on-surface-variant px-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-xl bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onOpen={() => setDetailDrawerOpen(true)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 500, md: 600 },
              borderRadius: { xs: 0, sm: '32px 0 0 32px' },
              p: 0,
              overflow: 'hidden',
              bgcolor: 'var(--background)',
              color: 'var(--on-background)'
            }
          }
        }}
      >
        {selectedWarehouse && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'var(--background)' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 2, bgcolor: 'var(--primary)', color: 'var(--on-primary)' }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-1xl">restaurant</span>
                  </div>
                  <div>
                    <h2 className="text-[12px] font-bold text-white uppercase font-headline leading-none mb-1">{selectedWarehouse.DESCRICION}</h2>
                    <span className="text-[8px] font-black uppercase text-white/70 tracking-widest block font-body">ID: #{selectedWarehouse.ID_PLANTA_ALMACEN}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
                        {isFlagActive(selectedWarehouse.ESTADO) ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
                        {isFlagActive(selectedWarehouse.ESTADO_PRODUCCION) ? 'Producción ON' : 'Producción OFF'}
                      </span>
                      {isFlagActive(selectedWarehouse.GESTION_PI) && (
                        <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/30 text-white font-bold border border-white/40">
                          Gestión PI
                        </span>
                      )}
                      {isFlagActive(selectedWarehouse.SOLICITUD_PLANTA) && (
                        <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
                          Solicita Planta
                        </span>
                      )}
                      {isFlagActive(selectedWarehouse.ENTREGA_PLANTA) && (
                        <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30">
                          Entrega Planta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <IconButton onClick={() => setDetailDrawerOpen(false)} sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                  <CloseIcon />
                </IconButton>
              </div>

              {/* Search Recipes inside Drawer */}
              <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2 border border-white/10 focus-within:bg-white/20 transition-all">
                <SearchIcon sx={{ color: 'white', opacity: 0.5, fontSize: '18px' }} />
                <input
                  type="text"
                  placeholder="Buscar receta..."
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white w-full placeholder:text-white/40"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                />
              </div>
            </Box>

            {/* Recipes List */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1, bgcolor: 'var(--background)' }}>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase mb-1 font-headline">
                RECETAS Y COMPOSICIÓN ({filteredRecipes.length})
              </h3>

              {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant opacity-60">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-20">menu_book</span>
                  <p className="text-xs font-black uppercase tracking-widest">No se encontraron recetas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecipes.map((recipe, idx) => (
                    <Accordion
                      key={idx}
                      expanded={expandedIndex === idx}
                      onChange={(_, isExpanded) => setExpandedIndex(isExpanded ? idx : null)}
                      elevation={0}
                      sx={{
                        borderRadius: '24px !important',
                        border: expandedIndex === idx ? '1.5px solid var(--primary)' : '1px solid var(--border-outline-variant, #f4f4f5)',
                        bgcolor: expandedIndex === idx ? 'rgba(157, 0, 19, 0.03)' : 'var(--surface)',
                        color: 'var(--on-surface)',
                        '&:before': { display: 'none' },
                        mb: 2,
                        overflow: 'hidden',
                        opacity: recipe.ESTADO_RECETA_ALMACEN === 1 ? 1 : 0.6,
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'var(--on-surface)' }} />}
                        sx={{ bgcolor: expandedIndex === idx ? 'rgba(157, 0, 19, 0.01)' : 'var(--surface)', py: 1 }}
                      >
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className={`flex items-center gap-3 transition-all ${expandedIndex === idx ? 'border border-primary/30 bg-primary/5 rounded-2xl px-4 py-2 shadow-inner' : 'p-1'}`}>
                            <div className={`w-8 h-8 rounded-xl ${recipe.ESTADO_RECETA_ALMACEN === 1 ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center`}>
                              <span className="material-symbols-outlined text-[18px]">skillet</span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-on-surface uppercase block font-headline leading-none mb-1">
                                {recipe.DESCRIPCION}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-widest block font-body ${recipe.ESTADO_RECETA_ALMACEN === 1 ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {recipe.ESTADO_RECETA_ALMACEN === 1 ? 'Disponible' : 'No Disponible'}
                              </span>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                              size="small"
                              checked={recipe.ESTADO_RECETA_ALMACEN === 1}
                              onChange={() => toggleRecipeStatus(selectedWarehouse.ID_PLANTA_ALMACEN, recipe)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: 'var(--primary)',
                                  '& + .MuiSwitch-track': { backgroundColor: 'var(--primary)' },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 2, bgcolor: 'var(--surface)' }}>
                        <div className="p-3.5 rounded-2xl border border-outline-variant bg-zinc-50/50 dark:bg-zinc-950/20">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-outline-variant text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                                <th className="pb-2 pl-2">Ingrediente</th>
                                <th className="pb-2 pr-2 text-right">Cant. Fija</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/50">
                              {recipe.PRODUCTOS && recipe.PRODUCTOS.map((p, pIdx) => (
                                <tr key={pIdx} className="hover:bg-surface-variant/20 transition-colors group">
                                  <td className="py-2.5 pl-2">
                                    <p className="text-[11px] font-bold text-on-surface uppercase">{p.PRODUCTO || p.PRODUCTO_INTERMEDIO_ANTECESOR}</p>
                                    <p className="text-[8px] font-black text-primary uppercase mt-0.5">{p.PRODUCTO_INTERMEDIO_ANTECESOR ? 'INTERMEDIO' : 'INSUMO'}</p>
                                  </td>
                                  <td className="py-2.5 pr-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="text-xs font-black text-on-surface">{p.CANTIDAD.toLocaleString()}</span>
                                      <span className="text-[9px] font-black text-on-surface-variant uppercase">{p.UNIDAD_MEDIDA}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 3, bgcolor: 'var(--surface)', borderTop: '1px solid var(--border-outline-variant)', display: 'flex', gap: 2 }}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  showAlert.success('Exportar', 'Ficha exportada con éxito (Simulado).');
                }}
              >
                Exportar Ficha
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setDetailDrawerOpen(false);
                  handleEdit(selectedWarehouse);
                }}
              >
                Editar Almacén
              </Button>
            </Box>
          </Box>
        )}
      </SwipeableDrawer>

      <ModalNewAlmacen
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingWarehouse(null); }}
        data={editingWarehouse}
        onSave={handleSaveWarehouse}
        allWarehouses={activeWarehouses}
        currentGestionPiId={gestionPiId}
      />

      <ModalRelacionesAlmacen
        open={isRelacionesModalOpen}
        onClose={() => setIsRelacionesModalOpen(false)}
        selectedWarehouse={relacionesWarehouse}
        allWarehouses={warehouses}
      />
    </div>
  );
};

export default ListaAlmacenes;

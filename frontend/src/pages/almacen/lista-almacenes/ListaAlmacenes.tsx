import React, { useState, useMemo, useEffect } from 'react';
import {
  SwipeableDrawer,
  Box,
  IconButton,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ModalNewAlmacen from './components/ModalNewAlmacen';
import { useListaAlmacenesServices } from './services/useListaAlmacenes';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';

// --- Types ---
interface Ingredient {
  PRODUCTO?: string;
  PRODUCTO_INTERMEDIO_ANTECESOR?: string;
  CANTIDAD: number;
  UNIDAD_MEDIDA: string;
}

interface Recipe {
  DESCRIPCION: string;
  ESTADO_RECETA_ALMACEN: number;
  PRODUCTOS: Ingredient[];
  ID_PLANTA_RECETA_ALMACEN?: number;
  ID_ALMACEN_PRODUCTO_INTERMEDIO?: number;
}

interface Warehouse {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO: number;
  ESTADO_PRODUCCION: number;
  GESTION_PI: number;
  SOLICITUD_PLANTA: number;
  ENTREGA_PLANTA: number;
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
}> = ({ warehouse, onOpenDetail, onEdit, onToggleStatus }) => (
  <div
    className={`rounded-[2rem] border p-3 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between 
      ${warehouse.ESTADO === 1
        ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300'
        : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50 hover:border-rose-300'}`}
  >
    <div className="flex justify-between items-start mb-1">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner
        ${warehouse.ESTADO === 1 ? 'bg-surface text-emerald-500 shadow-emerald-200/20' : 'bg-surface text-rose-400 shadow-rose-200/20'}`}>
        <span className="material-symbols-outlined text-2xl">warehouse</span>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-sm
          ${warehouse.ESTADO === 1 ? 'bg-surface border-emerald-100 dark:border-emerald-900/40' : 'bg-surface border-rose-100 dark:border-rose-900/40'}`}>
          <span className={`text-[8px] font-black uppercase tracking-tighter ${warehouse.ESTADO === 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {warehouse.ESTADO === 1 ? 'Activo' : 'Inactivo'}
          </span>
          <Switch
            size="small"
            checked={warehouse.ESTADO === 1}
            onChange={() => onToggleStatus(warehouse)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'emerald.500',
                '& + .MuiSwitch-track': { backgroundColor: 'emerald.500' },
              },
              '& .MuiSwitch-switchBase': {
                '& + .MuiSwitch-track': { backgroundColor: warehouse.ESTADO === 1 ? 'emerald.200' : 'rose.200' },
              }
            }}
          />
        </div>
        <Chip
          label={warehouse.ESTADO_PRODUCCION == 1 ? 'PRODUCCIÓN ON' : 'PRODUCCIÓN OFF'}
          size="small"
          variant="outlined"
          sx={{
            height: 18,
            fontSize: '8px',
            fontWeight: '900',
            borderColor: warehouse.ESTADO === 1 ? 'emerald.100' : 'rose.100',
            color: warehouse.ESTADO === 1 ? 'emerald.400' : 'rose.400',
            borderRadius: '6px',
            bgcolor: 'var(--surface-variant)'
          }}
        />
      </div>
    </div>

    <div>
      <h2 className="text-base font-bold text-on-surface uppercase tracking-tight font-headline mb-1">
        {warehouse.DESCRICION}
      </h2>
      <div className="flex items-center gap-1 text-on-surface-variant mb-6">
        <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{warehouse.RECETAS.length} Recetas</span>
      </div>
    </div>

    <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
      <button
        type="button"
        onClick={() => onEdit(warehouse)}
        className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner hover:bg-amber-500/20 transition-all cursor-pointer"
        title="Editar"
      >
        <span className="material-symbols-outlined text-2xl font-bold">edit</span>
      </button>
      <button
        type="button"
        onClick={() => onOpenDetail(warehouse)}
        className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner hover:bg-primary/20 transition-all cursor-pointer"
        title="Ver"
      >
        <span className="material-symbols-outlined text-2xl font-bold">visibility</span>
      </button>
    </div>
  </div>
);

export const ListaAlmacenes: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouses, setActiveWarehouses] = useState<{ ID_PLANTA_ALMACEN: number; DESCRICION: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search States
  const [mainSearch, setMainSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // ID del almacén que actualmente tiene GESTION_PI activo (solo puede haber uno)
  const gestionPiId = warehouses.find(w => w.GESTION_PI === 1)?.ID_PLANTA_ALMACEN ?? null;

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

  const handleEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setIsModalOpen(true);
  };

  const toggleWarehouseStatus = async (warehouse: Warehouse) => {
    const newStatus = warehouse.ESTADO === 1 ? 0 : 1;
    setIsLoading(true);
    const res = await updateAlmacen(warehouse.ID_PLANTA_ALMACEN, {
      estado: newStatus
    });
    if (res && res.success) {
      showAlert.toast(`Almacén ${newStatus === 1 ? 'activado' : 'desactivado'}.`);

      const updatedList = warehouses.map(w =>
        w.ID_PLANTA_ALMACEN === warehouse.ID_PLANTA_ALMACEN ? { ...w, ESTADO: newStatus } : w
      );
      setWarehouses(updatedList);
      if (selectedWarehouse?.ID_PLANTA_ALMACEN === warehouse.ID_PLANTA_ALMACEN) {
        setSelectedWarehouse(prev => prev ? { ...prev, ESTADO: newStatus } : null);
      }
    }
    setIsLoading(false);
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
    produccion: boolean;
    activo: boolean;
    gestion_pi: number;
    solicitud_planta: number;
    entrega_planta: number;
    solicita_a: { id_almacen: number; estado: number }[];
  }) => {
    const nombreAlmacen = (formData.almacen || formData.nombre || '').trim();

    // Control: solo un almacén puede tener gestion_pi = 1
    if (formData.gestion_pi === 1 && gestionPiId !== null && gestionPiId !== editingWarehouse?.ID_PLANTA_ALMACEN) {
      showAlert.error('Control Gestión PI', 'Ya existe un almacén con Gestión PI activo. Desactívelo primero antes de habilitarlo aquí.');
      return;
    }

    setIsLoading(true);
    if (editingWarehouse) {
      // Editing
      const res = await updateAlmacen(editingWarehouse.ID_PLANTA_ALMACEN, {
        almacen: nombreAlmacen,
        estado: formData.activo ? 1 : 0,
        estado_produccion: formData.produccion ? 1 : 0,
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
        estado_produccion: formData.produccion ? 1 : 0,
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

  const filteredRecipes = useMemo(() => {
    if (!selectedWarehouse) return [];
    return selectedWarehouse.RECETAS.filter(r =>
      r.DESCRIPCION.toLowerCase().includes(recipeSearch.toLowerCase())
    );
  }, [selectedWarehouse, recipeSearch]);

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-12">
      <LoadingOverlay show={isLoading} message="Cargando información de almacenes..." />

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Gestión de Almacenes
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Control centralizado de recetas e insumos por unidad productiva.
          </p>
        </div>

        <div className="shrink-0">
          <Button
            onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
            variant="primary"
            size="sm"
            icon="add"
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Crear Nuevo Almacén
          </Button>
        </div>
      </div>

      {/* Global Search */}
      <div className="bg-surface border border-outline rounded-2xl px-2 py-2 flex items-center gap-2 w-full sm:w-80 shadow-sm focus-within:border-primary/50 transition-all mt-2">
        <SearchIcon sx={{ color: 'var(--on-surface-variant)', fontSize: '20px' }} />
        <input
          type="text"
          placeholder="Buscar Almacén..."
          className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-on-surface w-full"
          value={mainSearch}
          onChange={(e) => setMainSearch(e.target.value)}
        />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 mt-8">
        {filteredWarehouses.map((w) => (
          <WarehouseCard
            key={w.ID_PLANTA_ALMACEN}
            warehouse={w}
            onOpenDetail={handleOpenDetail}
            onEdit={handleEdit}
            onToggleStatus={toggleWarehouseStatus}
          />
        ))}
        {filteredWarehouses.length === 0 && !isLoading && (
          <div className="col-span-full py-20 flex flex-col items-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-6xl opacity-20">search_off</span>
            <p className="text-xs font-black uppercase tracking-widest mt-4">No se encontraron almacenes con "{mainSearch}"</p>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default ListaAlmacenes;

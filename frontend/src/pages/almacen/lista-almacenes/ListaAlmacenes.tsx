import React, { useState, useMemo } from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Zoom,
  Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ModalNewAlmacen from './components/ModalNewAlmacen';

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
}

interface Warehouse {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO: number;
  ESTADO_PRODUCCION: number;
  RECETAS: Recipe[];
}

// --- Full Mock Data ---
const MOCK_WAREHOUSES: Warehouse[] = [
  {
    "ID_PLANTA_ALMACEN": 1,
    "DESCRICION": "BIZCOCHOS",
    "ESTADO": 1,
    "ESTADO_PRODUCCION": 1,
    "RECETAS": [
      {
        "DESCRIPCION": "BIZCOCHO DE ALMENDRA - RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 3250, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "HARINA" },
          { "CANTIDAD": 800, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "AZUCAR" },
          { "CANTIDAD": 80, "UNIDAD_MEDIDA": "Unidad", "PRODUCTO": "HUEVO" },
          { "CANTIDAD": 800, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "ALMENDRA" },
          { "CANTIDAD": 700, "UNIDAD_MEDIDA": "Mililitro", "PRODUCTO": "ACEITE" },
          { "CANTIDAD": 2800, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO_INTERMEDIO_ANTECESOR": "LECHE CONDENSADA PROD - RI" }
        ]
      },
      {
        "DESCRIPCION": "BIZCOCHO DE CHOCOLATE-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 2300, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "AZUCAR" },
          { "CANTIDAD": 800, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "CHISPAS DE CHOCOLATE" },
          { "CANTIDAD": 500, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "COCOA BREICK" }
        ]
      },
      {
        "DESCRIPCION": "BIZCOCHO DE ZANAHORIA - RI",
        "ESTADO_RECETA_ALMACEN": 0,
        "PRODUCTOS": [
          { "CANTIDAD": 40, "UNIDAD_MEDIDA": "Unidad", "PRODUCTO": "HUEVO" },
          { "CANTIDAD": 1500, "UNIDAD_MEDIDA": "Mililitro", "PRODUCTO": "ACEITE" },
          { "CANTIDAD": 3300, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "AZUCAR MORENA" }
        ]
      }
    ]
  },
  {
    "ID_PLANTA_ALMACEN": 2,
    "DESCRICION": "CHEESECAKE",
    "ESTADO": 1,
    "ESTADO_PRODUCCION": 1,
    "RECETAS": [
      {
        "DESCRIPCION": "BASE DE CHEESECAKE-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 250, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "AZUCAR" },
          { "CANTIDAD": 250, "UNIDAD_MEDIDA": "Mililitro", "PRODUCTO": "ESENCIA DE VAINILLA CARAMELO" },
          { "CANTIDAD": 900, "VEGETAL": "Gramo", "PRODUCTO": "MARGARINA S/N SAL" }
        ]
      },
      {
        "DESCRIPCION": "CHEESECAKE-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 320, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "AZUCAR" },
          { "CANTIDAD": 150, "UNIDAD_MEDIDA": "Mililitro", "PRODUCTO": "ESENCIA DE VAINILLA CARAMELO" },
          { "CANTIDAD": 2800, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "QUESO CREMA" }
        ]
      }
    ]
  },
  {
    "ID_PLANTA_ALMACEN": 3,
    "DESCRICION": "ESENCIAS",
    "ESTADO": 1,
    "ESTADO_PRODUCCION": 1,
    "RECETAS": [
      {
        "DESCRIPCION": "CANELA - RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 900, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "CANELA EN RAMA" },
          { "CANTIDAD": 54, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "CONSERVANTE" }
        ]
      },
      {
        "DESCRIPCION": "DULCE DE LECHE-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 36000, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "DULCE DE LECHE" },
          { "CANTIDAD": 1000, "UNIDAD_MEDIDA": "Mililitro", "PRODUCTO": "ESENCIA DE VAINILLA CARAMELO" }
        ]
      }
    ]
  },
  {
    "ID_PLANTA_ALMACEN": 4,
    "DESCRICION": "FRUTAS",
    "ESTADO": 0,
    "ESTADO_PRODUCCION": 1,
    "RECETAS": [
      {
        "DESCRIPCION": "ACHACHAIRU-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 35, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "PULPA DE ACHACHAIRU" },
          { "CANTIDAD": 1, "UNIDAD_MEDIDA": "Unidad", "PRODUCTO": "BOLSA PARA PORCIONAR 10X20 N " }
        ]
      },
      {
        "DESCRIPCION": "MARACUYA-RI",
        "ESTADO_RECETA_ALMACEN": 1,
        "PRODUCTOS": [
          { "CANTIDAD": 15, "UNIDAD_MEDIDA": "Gramo", "PRODUCTO": "PULPA DE MARACUYA" }
        ]
      }
    ]
  }
];

// --- Components ---

const WarehouseCard: React.FC<{ warehouse: Warehouse, onOpenDetail: (w: Warehouse) => void, onEdit: (w: Warehouse) => void }> = ({ warehouse, onOpenDetail, onEdit }) => (
  <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group flex flex-col justify-between">
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 bg-zinc-50 text-zinc-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-inner">
        <span className="material-symbols-outlined text-2xl">warehouse</span>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Chip
          label={warehouse.ESTADO === 1 ? 'ACTIVO' : 'INACTIVO'}
          size="small"
          sx={{
            height: 18, fontSize: '8px', fontWeight: '900',
            bgcolor: warehouse.ESTADO === 1 ? 'emerald.50' : 'rose.50',
            color: warehouse.ESTADO === 1 ? 'emerald.600' : 'rose.600',
            borderRadius: '6px'
          }}
        />
        <Chip
          label={warehouse.ESTADO_PRODUCCION === 1 ? 'PRODUCCIÓN ON' : 'PRODUCCIÓN OFF'}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '8px', fontWeight: '900', borderColor: 'zinc.200', color: 'zinc.400', borderRadius: '6px' }}
        />
      </div>
    </div>

    <div>
      <Typography variant="h6" sx={{ fontWeight: '900', color: 'zinc.900', textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 1 }}>
        {warehouse.DESCRICION}
      </Typography>
      <div className="flex items-center gap-1 text-zinc-400 mb-6">
        <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{warehouse.RECETAS.length} Recetas Disponibles</span>
      </div>
    </div>

    <div className="flex items-center gap-2 pt-5 border-t border-zinc-50">
      <button
        onClick={() => onEdit(warehouse)}
        className="flex-1 py-2.5 text-[10px] font-black uppercase text-zinc-500 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">edit</span> Editar
      </button>
      <button
        onClick={() => onOpenDetail(warehouse)}
        className="flex-1 py-2.5 text-[10px] font-black uppercase text-white bg-zinc-900 rounded-xl hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
      >
        <span className="material-symbols-outlined text-sm">visibility</span> Detalles
      </button>
    </div>
  </div>
);

export const ListaAlmacenes: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Search States
  const [mainSearch, setMainSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');

  const handleOpenDetail = (w: Warehouse) => {
    setSelectedWarehouse(w);
    setRecipeSearch(''); // Reset drawer search
    setDetailDrawerOpen(true);
  };

  const handleEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setIsModalOpen(true);
  };

  const toggleWarehouseStatus = (id: number) => {
    setWarehouses(prev => prev.map(w =>
      w.ID_PLANTA_ALMACEN === id ? { ...w, ESTADO: w.ESTADO === 1 ? 0 : 1 } : w
    ));
  };

  const toggleRecipeStatus = (warehouseId: number, recipeIndex: number) => {
    setWarehouses(prev => prev.map(w => {
      if (w.ID_PLANTA_ALMACEN !== warehouseId) return w;
      const newRecetas = [...w.RECETAS];
      newRecetas[recipeIndex] = {
        ...newRecetas[recipeIndex],
        ESTADO_RECETA_ALMACEN: newRecetas[recipeIndex].ESTADO_RECETA_ALMACEN === 1 ? 0 : 1
      };
      const updatedWarehouse = { ...w, RECETAS: newRecetas };
      // Also update selectedWarehouse if it's the one currently open in drawer
      if (selectedWarehouse?.ID_PLANTA_ALMACEN === warehouseId) {
        setSelectedWarehouse(updatedWarehouse);
      }
      return updatedWarehouse;
    }));
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
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1 mb-12 -mt-1">
        <div className="flex-1">
          <Typography variant="h4" sx={{ fontWeight: '900', color: 'zinc.900', textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 0.8 }}>
            Gestión de Almacenes
          </Typography>
          <Typography variant="body2" sx={{ color: 'zinc.400', mt: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Control centralizado de recetas e insumos por unidad productiva.
          </Typography>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
            className="h-14 px-8 bg-primary text-white rounded-[1.25rem] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 group w-full sm:w-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <span className="material-symbols-outlined text-xl">add</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Crear Nuevo Almacén</span>
          </button>
        </div>
      </div>
      {/* Global Search */}
      <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2 flex items-center gap-2 w-full sm:w-80 shadow-sm focus-within:border-primary/50 transition-all mt-2">
        <SearchIcon sx={{ color: 'zinc.300', fontSize: '20px' }} />
        <input
          type="text"
          placeholder="Buscar Almacén..."
          className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-zinc-900 w-full"
          value={mainSearch}
          onChange={(e) => setMainSearch(e.target.value)}
        />
      </div>
      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 mt-8">
        {filteredWarehouses.map((w) => (
          <div
            key={w.ID_PLANTA_ALMACEN}
            className={`rounded-[2rem] border p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between 
              ${w.ESTADO === 1
                ? 'bg-emerald-50/40 border-emerald-100/50 hover:border-emerald-200'
                : 'bg-rose-50/40 border-rose-100/50 hover:border-rose-200'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner
                ${w.ESTADO === 1 ? 'bg-white text-emerald-500 shadow-emerald-200/20' : 'bg-white text-rose-400 shadow-rose-200/20'}`}>
                <span className="material-symbols-outlined text-2xl">warehouse</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-sm
                  ${w.ESTADO === 1 ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}>
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${w.ESTADO === 1 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {w.ESTADO === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                  <Switch
                    size="small"
                    checked={w.ESTADO === 1}
                    onChange={() => toggleWarehouseStatus(w.ID_PLANTA_ALMACEN)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'emerald.500',
                        '& + .MuiSwitch-track': { backgroundColor: 'emerald.500' },
                      },
                      '& .MuiSwitch-switchBase': {
                        '& + .MuiSwitch-track': { backgroundColor: w.ESTADO === 1 ? 'emerald.200' : 'rose.200' },
                      }
                    }}
                  />
                </div>
                <Chip
                  label={w.ESTADO_PRODUCCION === 1 ? 'PRODUCCIÓN ON' : 'PRODUCCIÓN OFF'}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: '8px',
                    fontWeight: '900',
                    borderColor: w.ESTADO === 1 ? 'emerald.100' : 'rose.100',
                    color: w.ESTADO === 1 ? 'emerald.400' : 'rose.400',
                    borderRadius: '6px',
                    bgcolor: 'white/50'
                  }}
                />
              </div>
            </div>

            <div>
              <Typography variant="h6" sx={{ fontWeight: '900', color: w.ESTADO === 1 ? 'zinc.900' : 'zinc.400', textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 1 }}>
                {w.DESCRICION}
              </Typography>
              <div className="flex items-center gap-1 text-zinc-400 mb-6">
                <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{w.RECETAS.length} Recetas</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-5 border-t border-zinc-50">
              <button
                onClick={() => handleEdit(w)}
                className="flex-1 py-2.5 text-[10px] font-black uppercase text-zinc-500 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Editar
              </button>
              <button
                onClick={() => handleOpenDetail(w)}
                className="flex-1 py-2.5 text-[10px] font-black uppercase text-white bg-zinc-900 rounded-xl hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10"
              >
                <span className="material-symbols-outlined text-sm">visibility</span> Detalles
              </button>
            </div>
          </div>
        ))}
        {filteredWarehouses.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-zinc-300">
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
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 500, md: 600 }, borderRadius: { xs: 0, sm: '32px 0 0 32px' }, p: 0, overflow: 'hidden' } } }}
      >
        {selectedWarehouse && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
            {/* Drawer Header */}
            <Box sx={{ p: 4, bgcolor: 'primary.main', color: 'white' }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">restaurant</span>
                  </div>
                  <div>
                    <Typography variant="h5" sx={{ fontWeight: '900', textTransform: 'uppercase', lineHeight: 1 }}>{selectedWarehouse.DESCRICION}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID: #{selectedWarehouse.ID_PLANTA_ALMACEN}</Typography>
                  </div>
                </div>
                <IconButton onClick={() => setDetailDrawerOpen(false)} sx={{ color: 'white/50', '&:hover': { color: 'white' } }}>
                  <CloseIcon />
                </IconButton>
              </div>

              {/* Search Recipes inside Drawer */}
              <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2 border border-white/10 focus-within:bg-white/20 transition-all">
                <SearchIcon sx={{ color: 'white/50', fontSize: '18px' }} />
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
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: '900', color: 'zinc.400', mb: 3, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                RECETAS Y COMPOSICIÓN ({filteredRecipes.length})
              </Typography>

              {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-300">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-20">menu_book</span>
                  <p className="text-xs font-black uppercase tracking-widest">No se encontraron recetas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecipes.map((recipe, idx) => (
                    <Accordion key={idx} elevation={0} sx={{ borderRadius: '24px !important', border: '1px solid #f4f4f5', '&:before': { display: 'none' }, mb: 2, overflow: 'hidden', opacity: recipe.ESTADO_RECETA_ALMACEN === 1 ? 1 : 0.6 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'white', py: 1 }}>
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${recipe.ESTADO_RECETA_ALMACEN === 1 ? 'bg-primary/5 text-primary' : 'bg-zinc-100 text-zinc-400'} flex items-center justify-center`}>
                              <span className="material-symbols-outlined text-[18px]">skillet</span>
                            </div>
                            <div>
                              <Typography sx={{ fontSize: '13px', fontWeight: '800', color: recipe.ESTADO_RECETA_ALMACEN === 1 ? 'zinc.900' : 'zinc.400', textTransform: 'uppercase' }}>
                                {recipe.DESCRIPCION}
                              </Typography>
                              <Typography sx={{ fontSize: '8px', fontWeight: '900', color: recipe.ESTADO_RECETA_ALMACEN === 1 ? 'emerald.600' : 'rose.600', textTransform: 'uppercase' }}>
                                {recipe.ESTADO_RECETA_ALMACEN === 1 ? 'Disponible' : 'No Disponible'}
                              </Typography>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                              size="small"
                              checked={recipe.ESTADO_RECETA_ALMACEN === 1}
                              onChange={() => toggleRecipeStatus(selectedWarehouse.ID_PLANTA_ALMACEN, idx)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: 'primary.main',
                                  '& + .MuiSwitch-track': { backgroundColor: 'primary.main' },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <Divider />
                        <table className="w-full text-left">
                          <thead className="bg-zinc-50">
                            <tr>
                              <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Ingrediente</th>
                              <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Cant. Fija</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {recipe.PRODUCTOS.map((p, pIdx) => (
                              <tr key={pIdx} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-3">
                                  <p className="text-[11px] font-bold text-zinc-700 uppercase">{p.PRODUCTO || p.PRODUCTO_INTERMEDIO_ANTECESOR}</p>
                                  <p className="text-[8px] font-black text-primary uppercase mt-0.5">{p.PRODUCTO_INTERMEDIO_ANTECESOR ? 'INTERMEDIO' : 'INSUMO'}</p>
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-xs font-black text-zinc-900">{p.CANTIDAD.toLocaleString()}</span>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase">{p.UNIDAD_MEDIDA}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #f4f4f5', display: 'flex', gap: 2 }}>
              <button className="flex-1 h-12 bg-zinc-100 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Exportar Ficha</button>
              <button
                onClick={() => { setDetailDrawerOpen(false); handleEdit(selectedWarehouse); }}
                className="flex-1 h-12 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-zinc-900/10"
              >
                Editar Almacén
              </button>
            </Box>
          </Box>
        )}
      </SwipeableDrawer>

      <ModalNewAlmacen
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingWarehouse(null); }}
        data={editingWarehouse}
        onSave={(data) => {
          console.log('Almacén guardado:', data);
          setIsModalOpen(false);
          setEditingWarehouse(null);
        }}
      />
    </div>
  );
};

export default ListaAlmacenes;

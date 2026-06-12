import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import { showAlert } from '../../../config/alerts';
import LoadingOverlay from '../../../components/common/LoadingOverlay';

// --- Mock Data ---
const warehouses = ['CHEESECAKE', 'BIZCOCHOS', 'ESENCIAS', 'FRUTAS'];
const unitsList = ['Unidad', 'Gramo', 'Kilo', 'Mililitro', 'Litro', 'Lote', 'Caja', 'Paquete'];

const initialProducts = [
  { id: 1119, name: 'BIZCOCHO DE ALMENDRA - RI', warehouse: 'BIZCOCHOS' },
  { id: 74, name: 'BIZCOCHO DE CHOCOLATE-RI', warehouse: 'BIZCOCHOS' },
  { id: 101, name: 'LECHE CONDENSADA RI', warehouse: 'BIZCOCHOS' },
];

const masterProductList = [
  { id: 6001, name: 'JARABE DE AGAVE RI' },
  { id: 6002, name: 'BASE PARA MOUSSE CHOCOLATE' },
  { id: 6003, name: 'CONCENTRADO DE FRUTILLA RI' },
  { id: 6004, name: 'MASA QUEBRADA DULCE' },
];

const availableIngredients = [
  { id: 1, name: 'HARINA', unit: 'Gramo', type: 'insumo', icon: 'bakery_dining' },
  { id: 2, name: 'AZUCAR', unit: 'Gramo', type: 'insumo', icon: 'egg' },
  { id: 3, name: 'HUEVO', unit: 'Unidad', type: 'insumo', icon: 'egg' },
  { id: 101, name: 'REMOJO TRES LECHES-RI', unit: 'Unidad', type: 'intermedio', icon: 'water_drop' },
];

const initialMeasures: Record<number, any[]> = {
  1119: [
    {
      id: 1,
      label: 'Lote de (11 Unidades)',
      stdQty: 11,
      stdUnit: 'Unidad',
      adeqQty: 1.00,
      adeqUnit: 'Unidad',
      enabled: true,
      recipe: [
        { id: 1, name: 'HARINA', unit: 'Gramo', type: 'insumo', icon: 'bakery_dining', qty: 3250 },
        { id: 2, name: 'AZUCAR', unit: 'Gramo', type: 'insumo', icon: 'egg', qty: 800 },
      ]
    },
    {
      id: 2,
      label: 'Lote de (22 Unidades)',
      stdQty: 22,
      stdUnit: 'Unidad',
      adeqQty: 2.00,
      adeqUnit: 'Unidad',
      enabled: false,
      recipe: []
    }
  ]
};

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</span>
  </div>
);

const RecetasIntermedias: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Context State
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState(initialProducts);

  // Linking State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<any>(null);

  // Measures State
  const [measures, setMeasures] = useState<Record<number, any[]>>(initialMeasures);
  const [selectedMeasureId, setSelectedMeasureId] = useState<number | null>(null);
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [newMeasure, setNewMeasure] = useState({
    label: '',
    stdQty: '',
    stdUnit: 'Unidad' as string | null,
    adeqQty: '',
    adeqUnit: 'Unidad' as string | null
  });

  // Recipe Adder State
  const [ingType, setIngType] = useState<'insumo' | 'intermedio'>('insumo');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [quantity, setQuantity] = useState<string | number>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const currentMeasures = selectedProduct ? (measures[selectedProduct.id] || []) : [];
  const activeMeasure = currentMeasures.find(m => m.id === selectedMeasureId);

  const handleToggleMeasure = (measureId: number) => {
    if (!selectedProduct) return;

    const updated = measures[selectedProduct.id].map(m => ({
      ...m,
      enabled: m.id === measureId // Only one can be enabled
    }));

    setMeasures({ ...measures, [selectedProduct.id]: updated });
    setSnackbar({ open: true, message: 'Medida habilitada correctamente', severity: 'success' });
  };

  const handleLinkProduct = () => {
    if (!selectedGlobalProduct || !warehouse) return;

    const newLinkedProduct = {
      ...selectedGlobalProduct,
      warehouse: warehouse
    };

    setAvailableProducts([...availableProducts, newLinkedProduct]);
    setSelectedProduct(newLinkedProduct);
    setIsLinkModalOpen(false);
    setSelectedGlobalProduct(null);
    setSnackbar({ open: true, message: 'Producto vinculado correctamente', severity: 'success' });
  };

  const handleSearch = () => {
    if (!warehouse || !selectedProduct) {
      setSnackbar({ open: true, message: 'Seleccione almacén y producto primero', severity: 'error' });
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsDataVisible(true);
      setSnackbar({ open: true, message: 'Datos actualizados', severity: 'success' });
    }, 1500);
  };

  const handleAddMeasure = () => {
    if (!selectedProduct || !newMeasure.label || !newMeasure.stdQty) return;

    const newEntry = {
      ...newMeasure,
      id: Date.now(),
      stdQty: Number(newMeasure.stdQty),
      adeqQty: Number(newMeasure.adeqQty),
      enabled: currentMeasures.length === 0, // Enable if first one
      recipe: []
    };

    setMeasures({
      ...measures,
      [selectedProduct.id]: [...currentMeasures, newEntry]
    });
    setIsMeasureModalOpen(false);
    setNewMeasure({ label: '', stdQty: '', stdUnit: 'Unidad', adeqQty: '', adeqUnit: 'Unidad' });
  };

  const handleAddIngredient = () => {
    if (!selectedProduct || !selectedMeasureId || !selectedIngredient || !quantity) return;

    const updatedMeasures = measures[selectedProduct.id].map(m => {
      if (m.id === selectedMeasureId) {
        return {
          ...m,
          recipe: [{ ...selectedIngredient, qty: Number(quantity), tempId: Date.now() }, ...m.recipe]
        };
      }
      return m;
    });

    setMeasures({ ...measures, [selectedProduct.id]: updatedMeasures });
    setSelectedIngredient(null);
    setQuantity('');
  };

  const handleRemoveIngredient = (tempId: number) => {
    if (!selectedProduct || !selectedMeasureId) return;

    const updatedMeasures = measures[selectedProduct.id].map(m => {
      if (m.id === selectedMeasureId) {
        return { ...m, recipe: m.recipe.filter((i: any) => i.tempId !== tempId) };
      }
      return m;
    });

    setMeasures({ ...measures, [selectedProduct.id]: updatedMeasures });
  };

  const handleSaveRecipe = () => {
    if (!selectedProduct || !selectedMeasureId) {
      setSnackbar({ open: true, message: 'Seleccione un producto y medida para guardar', severity: 'error' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSnackbar({ open: true, message: 'Receta intermedia guardada con éxito', severity: 'success' });
      setIsSuccessDialogOpen(true);
    }, 1200);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className='-mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Recetas Intermedias</p>
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">Gestión jerárquica de medidas y composiciones base.</p>
          </div>
          <Tooltip title="Vincular nuevo producto intermedio a un almacén">
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl mt-1"
            >
              <span className="material-symbols-outlined text-xl">link</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Header / Filters */}
      <div className="mb-5 pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex gap-4 p-5 bg-white rounded-[2rem] border border-zinc-100 shadow-sm w-full md:w-fit">
          <div className="w-full md:w-56 space-y-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén</label>
            <Autocomplete
              options={warehouses}
              value={warehouse}
              onChange={(_, v) => { setWarehouse(v); setSelectedProduct(null); setSelectedMeasureId(null); }}
              renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Filtrar..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
            />
          </div>
          <div className={`w-full md:w-72 space-y-1 transition-all ${!warehouse ? 'opacity-30' : ''}`}>
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Producto Intermedio</label>
            <Autocomplete
              options={availableProducts.filter(p => p.warehouse === warehouse)}
              getOptionLabel={(o) => o.name}
              value={selectedProduct}
              onChange={(_, v) => { setSelectedProduct(v); setSelectedMeasureId(null); }}
              renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
            />
            {!selectedProduct && warehouse && (
              <p className="text-[8px] text-zinc-400 font-black uppercase tracking-tighter mt-1 ml-1 animate-pulse">
                ¿No encuentras el producto? Usa el botón de enlace arriba.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-6">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className={`w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner hover:bg-primary/20 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <span className="material-symbols-outlined text-2xl">
                  search
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay show={isLoading} message="Cargando recetas e ingredientes..." />

      {!isDataVisible ? (
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100 shadow-inner">
            <span className="material-symbols-outlined text-4xl text-zinc-300">manage_search</span>
          </div>
          <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Esperando búsqueda...</p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2 max-w-[300px] text-center leading-relaxed">
            Selecciona un almacén y producto para visualizar sus recetas y medidas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Left: Measures List */}
          <div className={`lg:col-span-4 space-y-6`}>
            <div className="flex justify-between items-center">
              <StepBadge num="01" label="Unidades de Medida" />
              <button
                onClick={() => setIsMeasureModalOpen(true)}
                className="px-4 py-2 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva Medida
              </button>
            </div>

            <div className="space-y-2 -mt-3">
              {currentMeasures.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-zinc-100 rounded-[2rem] text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-zinc-200">straighten</span>
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">No hay medidas definidas</p>
                </div>
              ) : (
                currentMeasures.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeasureId(m.id)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group ${selectedMeasureId === m.id ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white border-zinc-100 hover:border-zinc-200 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <p className={`font-black text-sm uppercase tracking-tight ${selectedMeasureId === m.id ? 'text-white' : 'text-zinc-900'}`}>{m.label}</p>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={m.enabled}
                          size="small"
                          onChange={(e) => { e.stopPropagation(); handleToggleMeasure(m.id); }}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: selectedMeasureId === m.id ? '#fff' : '#ef4444' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: selectedMeasureId === m.id ? 'rgba(255,255,255,0.4)' : '#ef4444' } }}
                        />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${m.enabled ? (selectedMeasureId === m.id ? 'text-white' : 'text-emerald-500') : (selectedMeasureId === m.id ? 'text-white/40' : 'text-zinc-400')}`}>
                          {m.enabled ? 'Habilitado' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-2xl ${selectedMeasureId === m.id ? 'bg-white/20' : 'bg-zinc-50'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedMeasureId === m.id ? 'text-white/60' : 'text-zinc-400'}`}>Estándar</p>
                        <p className="text-xs font-black">{m.stdQty} {m.stdUnit}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${selectedMeasureId === m.id ? 'bg-white/20' : 'bg-zinc-50'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedMeasureId === m.id ? 'text-white/60' : 'text-zinc-400'}`}>Adecuación</p>
                        <p className="text-xs font-black">{m.adeqQty} {m.adeqUnit}</p>
                      </div>
                    </div>
                    {selectedMeasureId === m.id && (
                      <div className="absolute top-1/2 -right-4 w-4 h-8 bg-primary rounded-r-lg hidden lg:flex items-center justify-center border-l border-white/20">
                        <span className="material-symbols-outlined text-white text-[12px]">chevron_right</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Recipe Editor */}
          <div className={`lg:col-span-8 space-y-8 transition-all ${!activeMeasure ? 'opacity-30 blur-[2px] pointer-events-none' : 'animate-in fade-in slide-in-from-right-8'}`}>
            <div className="flex justify-between items-center">
              <StepBadge num="02" label={`Composición: ${activeMeasure?.label || ''}`} />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveRecipe}
                  className="h-10 px-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">save</span>
                  Guardar Receta
                </button>
              </div>
            </div>

            {/* Quick Adder */}
            <div className="p-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm space-y-6 -mt-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-zinc-50 pb-6">
                <ToggleButtonGroup
                  value={ingType}
                  exclusive
                  onChange={(_, v) => { if (v) { setIngType(v); setSelectedIngredient(null); } }}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: '12px',
                      px: 3,
                      border: '1px solid #f4f4f5',
                      textTransform: 'none',
                      fontWeight: 900,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      '&.Mui-selected': {
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#dc2626' }
                      }
                    }
                  }}
                >
                  <ToggleButton value="insumo" className="uppercase">🍎 Materia Prima</ToggleButton>
                  <ToggleButton value="intermedio" className="uppercase">⚙️ P. Intermedio</ToggleButton>
                </ToggleButtonGroup>
                <p className="text-[9px] text-zinc-400 font-bold uppercase italic">* Puede agregar sub-recetas intermedias</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end -mt-10">
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Ingrediente</label>
                  <Autocomplete
                    options={availableIngredients.filter(i => i.type === ingType)}
                    getOptionLabel={(o) => o.name}
                    value={selectedIngredient}
                    onChange={(_, v) => setSelectedIngredient(v)}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad</label>
                  <TextField
                    fullWidth
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddIngredient(); }}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    onClick={handleAddIngredient}
                    className="w-full h-10 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Añadir
                  </button>
                </div>
              </div>
            </div>

            {/* Ingredient List */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-50">
                      <td className="px-10 py-6">Componente</td>
                      <td className="px-10 py-6 text-center">Tipo</td>
                      <td className="px-10 py-6 text-center">Cantidad</td>
                      <td className="px-10 py-6 text-right">Acción</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {activeMeasure?.recipe.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-10 py-20 text-center opacity-30">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Esta medida no tiene receta definida</p>
                        </td>
                      </tr>
                    ) : (
                      activeMeasure?.recipe.map((item: any) => (
                        <tr key={item.tempId} className="hover:bg-zinc-50/30 transition-all group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                              </div>
                              <div>
                                <p className="font-black text-zinc-900 uppercase text-xs tracking-tight">{item.name}</p>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{item.unit}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.type === 'insumo' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.type === 'insumo' ? 'M. Prima' : 'Intermedio'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-center font-black text-zinc-900">{item.qty}</td>
                          <td className="px-10 py-6 text-right">
                            <IconButton onClick={() => handleRemoveIngredient(item.tempId)} className="text-zinc-200 hover:text-rose-500 p-2">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </IconButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measure Modal */}
      <Dialog
        open={isMeasureModalOpen}
        onClose={() => setIsMeasureModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '2rem', p: 1 } } }}
      >
        <DialogTitle className="font-black text-zinc-900 uppercase tracking-tight text-xl">Nueva Unidad de Medida</DialogTitle>
        <DialogContent className="space-y-6 pt-4 min-w-[400px]">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre de la Medida</label>
              <TextField fullWidth size="small" placeholder="Ej: Lote de 10 Unidades" value={newMeasure.label} onChange={(e) => setNewMeasure({ ...newMeasure, label: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl space-y-4">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Configuración Estándar</p>
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad</label>
                  <TextField fullWidth type="number" size="small" value={newMeasure.stdQty} onChange={(e) => setNewMeasure({ ...newMeasure, stdQty: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />
                </div>
                <div className="col-span-8 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Unidad Medida</label>
                  <Autocomplete
                    options={unitsList}
                    value={newMeasure.stdUnit}
                    onChange={(_, v) => setNewMeasure({ ...newMeasure, stdUnit: v })}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl space-y-4">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Configuración Adecuación</p>
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad</label>
                  <TextField fullWidth type="number" size="small" value={newMeasure.adeqQty} onChange={(e) => setNewMeasure({ ...newMeasure, adeqQty: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />
                </div>
                <div className="col-span-8 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Unidad Medida</label>
                  <Autocomplete
                    options={unitsList}
                    value={newMeasure.adeqUnit}
                    onChange={(_, v) => setNewMeasure({ ...newMeasure, adeqUnit: v })}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={() => setIsMeasureModalOpen(false)} sx={{ color: 'zinc.400', fontWeight: 900, fontSize: '10px' }}>Cancelar</Button>
          <button
            onClick={handleAddMeasure}
            className="h-12 px-8 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Guardar Medida
          </button>
        </DialogActions>
      </Dialog>

      {/* Linking Modal */}
      <Dialog
        open={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '2rem', p: 2 } } }}
      >
        <DialogTitle className="font-black text-zinc-900 uppercase tracking-tight text-xl">Vincular Producto Intermedio</DialogTitle>
        <DialogContent className="space-y-6 pt-4 min-w-[400px]">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
            Habilite un producto del catálogo maestro para el almacén <span className="text-primary font-black">"{warehouse}"</span>.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Producto Maestro</label>
            <Autocomplete
              options={masterProductList}
              getOptionLabel={(o) => o.name}
              value={selectedGlobalProduct}
              onChange={(_, v) => setSelectedGlobalProduct(v)}
              renderInput={(params) => <TextField {...params} variant="outlined" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={() => setIsLinkModalOpen(false)} sx={{ color: 'zinc.400', fontWeight: 900, fontSize: '10px' }}>Cancelar</Button>
          <button
            onClick={handleLinkProduct}
            disabled={!selectedGlobalProduct}
            className={`h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!selectedGlobalProduct ? 'bg-zinc-100 text-zinc-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
          >
            Vincular e Iniciar
          </button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Success / Next Step Dialog */}
      <Dialog
        open={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '2.5rem',
              p: 2,
              maxWidth: '450px',
              bgcolor: 'background.paper'
            }
          }
        }}
      >
        <DialogContent className="flex flex-col items-center py-6 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-650 dark:text-emerald-400 shadow-lg border-4 border-emerald-50 dark:border-emerald-900/30 animate-bounce">
            <span className="material-symbols-outlined text-4xl font-black">done_all</span>
          </div>

          <div className="space-y-1">
            <p className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">¡Receta Intermedia Guardada!</p>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs leading-relaxed">
              La receta intermedia para el producto <strong className="text-zinc-900 dark:text-white uppercase">{selectedProduct?.name}</strong> se ha guardado y consolidado con éxito.
            </p>
          </div>

          <div className="w-full border-t border-zinc-100 dark:border-zinc-800" />

          <div className="space-y-4 w-full">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Siguiente Paso Sugerido</p>
            <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">¿Deseas registrar la Receta Final ahora?</p>

            <button
              onClick={() => {
                setIsSuccessDialogOpen(false);
                navigate('/almacen/crear-receta');
              }}
              className="w-full h-12 bg-zinc-900 hover:bg-primary dark:bg-zinc-800 dark:hover:bg-primary hover:shadow-primary/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">restaurant_menu</span>
              Sí, Registrar Receta Final
            </button>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0 justify-center">
          <Button
            onClick={() => setIsSuccessDialogOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: 900, fontSize: '10px', letterSpacing: '0.1em' }}
          >
            No por ahora, salir
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RecetasIntermedias;

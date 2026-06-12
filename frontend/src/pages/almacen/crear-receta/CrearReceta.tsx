import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { showAlert } from '../../../config/alerts';

// --- Mock Data ---
const warehouses = ['CHEESECAKE', 'BIZCOCHOS', 'ESENCIAS', 'FRUTAS'];

const initialMainProducts = [
  { id: 1119, name: 'BIZCOCHO DE ALMENDRA - RI', warehouse: 'BIZCOCHOS' },
  { id: 74, name: 'BIZCOCHO DE CHOCOLATE-RI', warehouse: 'BIZCOCHOS' },
  { id: 2002, name: 'CHEESECAKE FRUTOS ROJOS', warehouse: 'CHEESECAKE' },
];

const masterProductList = [
  { id: 5002, name: 'TORTA RED VELVET FAMILIAR' },
  { id: 5003, name: 'CHEESECAKE DE OREO XL' },
  { id: 5004, name: 'MUFFIN DE ARANDANOS' },
  { id: 5005, name: 'PAN DE BONO ESPECIAL' },
];

const mockSavedRecipes: Record<number, any[]> = {
  1119: [ // BIZCOCHO DE ALMENDRA
    { id: 1, name: 'HARINA', unit: 'Gramo', type: 'insumo', icon: 'bakery_dining', qty: 3250, tempId: 1 },
    { id: 2, name: 'AZUCAR', unit: 'Gramo', type: 'insumo', icon: 'egg', qty: 800, tempId: 2 },
    { id: 3, name: 'HUEVO', unit: 'Unidad', type: 'insumo', icon: 'egg', qty: 80, tempId: 3 },
  ],
  74: [ // BIZCOCHO DE CHOCOLATE
    { id: 2, name: 'AZUCAR', unit: 'Gramo', type: 'insumo', icon: 'egg', qty: 2300, tempId: 4 },
    { id: 1, name: 'HARINA', unit: 'Gramo', type: 'insumo', icon: 'bakery_dining', qty: 2300, tempId: 5 },
  ]
};

const availableIngredients = [
  // Raw Materials (Insumos)
  { id: 1, name: 'HARINA', unit: 'Gramo', type: 'insumo', icon: 'bakery_dining' },
  { id: 2, name: 'AZUCAR', unit: 'Gramo', type: 'insumo', icon: 'egg' },
  { id: 3, name: 'HUEVO', unit: 'Unidad', type: 'insumo', icon: 'egg' },
  { id: 4, name: 'ACEITE', unit: 'Mililitro', type: 'insumo', icon: 'water_drop' },
  
  // Intermediate Products
  { id: 101, name: 'REMOJO TRES LECHES-RI', unit: 'Unidad', type: 'intermedio', icon: 'water_drop' },
  { id: 102, name: 'LECHE CONDENSADA RI', unit: 'Gramo', type: 'intermedio', icon: 'opacity' },
  { id: 103, name: 'MASA BASE BIZCOCHO', unit: 'kg', type: 'intermedio', icon: 'bakery_dining' },
];

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</span>
  </div>
);

const CrearReceta: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Header State
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [availableMainProducts, setAvailableMainProducts] = useState(initialMainProducts);
  
  // Linker Modal State
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<any>(null);

  // Adder State
  const [ingType, setIngType] = useState<'insumo' | 'intermedio'>('insumo');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [quantity, setQuantity] = useState<string | number>('');

  // Recipe State
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const hasExistingRecipe = targetProduct && !!mockSavedRecipes[targetProduct.id];

  React.useEffect(() => {
    if (targetProduct && mockSavedRecipes[targetProduct.id]) {
      setRecipeItems(mockSavedRecipes[targetProduct.id]);
    } else {
      setRecipeItems([]);
    }
  }, [targetProduct]);

  const filteredIngredients = availableIngredients.filter(i => i.type === ingType);

  const handleAddItem = () => {
    if (!selectedIngredient || !quantity) return;

    const exists = recipeItems.find(item => item.id === selectedIngredient.id && item.type === selectedIngredient.type);
    if (exists) {
      setSnackbar({ open: true, message: 'Este ingrediente ya está en la receta', severity: 'error' });
      return;
    }

    const newItem = {
      ...selectedIngredient,
      qty: quantity,
      tempId: Date.now()
    };

    setRecipeItems([newItem, ...recipeItems]);
    setSelectedIngredient(null);
    setQuantity('');
    
    // Auto-focus back to ingredient search would be ideal, but for now simple clear
  };

  const handleRemoveItem = (tempId: number) => {
    setRecipeItems(recipeItems.filter(item => item.tempId !== tempId));
  };

  const handleLinkProduct = () => {
    if (!selectedGlobalProduct || !warehouse) return;

    const newLinkedProduct = {
      ...selectedGlobalProduct,
      warehouse: warehouse
    };

    setAvailableMainProducts([...availableMainProducts, newLinkedProduct]);
    setTargetProduct(newLinkedProduct);
    setIsLinkingModalOpen(false);
    setSelectedGlobalProduct(null);
    setSnackbar({ open: true, message: 'Producto vinculado correctamente', severity: 'success' });
  };

  const handleSaveRecipe = () => {
    if (!targetProduct || recipeItems.length === 0) {
      setSnackbar({ open: true, message: 'Complete los datos y agregue al menos un ingrediente', severity: 'error' });
      return;
    }
    showAlert.success('¡Éxito!', 'Receta registrada correctamente');
    handleReset();
  };

  const handleReset = () => {
    setWarehouse(null);
    setTargetProduct(null);
    setRecipeItems([]);
    setIngType('insumo');
    setSelectedIngredient(null);
    setQuantity('');
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      
      {/* Header Section */}
      <div className="mb-10 pt-4">
        <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Configuración de Receta</p>
        <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">Defina los componentes y cantidades exactas para la producción central.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* STEP 01: Producto Objetivo */}
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <StepBadge num="01" label="Producto Objetivo" />
            <div className="grid grid-cols-1 gap-8 mt-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén Propietario</label>
                <Autocomplete
                  options={warehouses}
                  value={warehouse}
                  onChange={(_, v) => { setWarehouse(v); setTargetProduct(null); }}
                  renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Seleccionar almacén..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/30' } }} />}
                />
              </div>
              <div className={`space-y-2 transition-all ${!warehouse ? 'opacity-30 pointer-events-none' : ''} flex-1`}>
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Producto a Definir</label>
                  {targetProduct && (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md animate-in fade-in zoom-in duration-300 ${hasExistingRecipe ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {hasExistingRecipe ? '📝 Receta Existente' : '✨ Nueva Receta'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Autocomplete
                    options={availableMainProducts.filter(p => p.warehouse === warehouse)}
                    getOptionLabel={(o) => o.name}
                    value={targetProduct}
                    fullWidth
                    onChange={(_, v) => setTargetProduct(v)}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/30' } }} />}
                  />
                  <Tooltip title="Vincular nuevo producto a este almacén">
                    <button 
                      onClick={() => setIsLinkingModalOpen(true)}
                      className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-200"
                    >
                      <span className="material-symbols-outlined text-xl">link</span>
                    </button>
                  </Tooltip>
                </div>
                {!targetProduct && warehouse && (
                  <p className="text-[8px] text-zinc-400 font-black uppercase tracking-tighter mt-1 ml-1 animate-pulse">
                    ¿No encuentras el producto? Haz clic en el icono de enlace para vincularlo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 02: Quick Adder */}
          <div className={`bg-white p-6 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm transition-all ${!targetProduct ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
            <StepBadge num="02" label="Agregar Componentes" />
            
            <div className="space-y-8 mt-6">
              {/* Type Switcher */}
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-zinc-50 pb-6">
                <ToggleButtonGroup
                  value={ingType}
                  exclusive
                  onChange={(_, v) => { if(v) { setIngType(v); setSelectedIngredient(null); } }}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { borderRadius: '12px', px: 3, border: '1px solid #f4f4f5', textTransform: 'none', fontWeight: 900, fontSize: '10px', letterSpacing: '0.1em' } }}
                >
                  <ToggleButton value="insumo" className="uppercase">🍎 Materia Prima</ToggleButton>
                  <ToggleButton value="intermedio" className="uppercase">⚙️ P. Intermedio</ToggleButton>
                </ToggleButtonGroup>
                <p className="text-[9px] text-zinc-400 font-bold uppercase italic">* Puede mezclar ambos tipos en una misma receta</p>
              </div>

              {/* Adder Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6 space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Ingrediente</label>
                  <Autocomplete
                    options={filteredIngredients}
                    getOptionLabel={(o) => o.name}
                    value={selectedIngredient}
                    onChange={(_, v) => setSelectedIngredient(v)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(); }}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad {selectedIngredient ? `(${selectedIngredient.unit})` : ''}</label>
                  <TextField 
                    fullWidth 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddItem(); }}
                    size="small" 
                    placeholder="0.00"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} 
                  />
                </div>
                <div className="md:col-span-3">
                  <button 
                    onClick={handleAddItem}
                    disabled={!selectedIngredient || !quantity}
                    className={`w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${(!selectedIngredient || !quantity) ? 'bg-zinc-100 text-zinc-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95'}`}
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 03: Recipe Table */}
          <div className={`bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden transition-all ${recipeItems.length === 0 ? 'opacity-30' : 'animate-in fade-in slide-in-from-bottom-4'}`}>
            <div className="px-10 py-6 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
              <StepBadge num="03" label="Componentes Definidos" />
              {recipeItems.length > 0 && (
                <button onClick={() => setRecipeItems([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline decoration-2">Limpiar Todo</button>
              )}
            </div>
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
                  {recipeItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-16 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <span className="material-symbols-outlined text-4xl">receipt_long</span>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay ingredientes en la receta</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recipeItems.map((item) => (
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
                          <IconButton onClick={() => handleRemoveItem(item.tempId)} className="text-zinc-200 hover:text-rose-500 p-2">
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

        {/* Right Column: Summary & Actions */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <div className="bg-indigo-50/50 rounded-[3rem] p-8 md:p-10 text-zinc-900 shadow-sm border border-indigo-100/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <StepBadge num="✓" label="Resumen de Receta" />
              
              <div className="space-y-8 mt-8">
                <div className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Total Componentes</p>
                  <p className="text-3xl font-black text-zinc-900">{recipeItems.length} <span className="text-xs text-zinc-300 uppercase">ítems</span></p>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-indigo-100/50 pb-4">
                     <span className="text-zinc-400">Materias Primas</span>
                     <span className="text-zinc-900">{recipeItems.filter(i => i.type === 'insumo').length}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-indigo-100/50 pb-4">
                     <span className="text-zinc-400">Prod. Intermedios</span>
                     <span className="text-zinc-900">{recipeItems.filter(i => i.type === 'intermedio').length}</span>
                   </div>
                </div>

                <div className="pt-6">
                   <button 
                     onClick={handleSaveRecipe}
                     className={`w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 ${hasExistingRecipe ? 'bg-amber-500 text-white' : 'bg-primary text-white'}`}
                   >
                     <span className="material-symbols-outlined">{hasExistingRecipe ? 'history_edu' : 'auto_fix_high'}</span>
                     {hasExistingRecipe ? 'Actualizar Receta' : 'Guardar Receta'}
                   </button>
                   <button 
                     onClick={handleReset}
                     className="w-full h-12 text-zinc-400 hover:text-zinc-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all mt-4"
                   >
                     Cancelar Edición
                   </button>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
              <span className="material-symbols-outlined text-amber-500">info</span>
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
                Consejo: Puede presionar <span className="bg-amber-200/50 px-1.5 py-0.5 rounded text-amber-900">Enter</span> después de escribir la cantidad para añadir rápidamente el ingrediente a la lista.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linking Modal */}
      <Dialog 
        open={isLinkingModalOpen} 
        onClose={() => setIsLinkingModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '2rem', p: 2 } } }}
      >
        <DialogTitle className="font-black text-zinc-900 uppercase tracking-tight text-xl">Vincular Producto</DialogTitle>
        <DialogContent className="space-y-6 pt-4">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
            Seleccione un producto del catálogo maestro para habilitarlo en el almacén <span className="text-primary font-black">"{warehouse}"</span>.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Producto Maestro</label>
              <Autocomplete
                options={masterProductList}
                getOptionLabel={(o) => o.name}
                value={selectedGlobalProduct}
                onChange={(_, v) => setSelectedGlobalProduct(v)}
                renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto global..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={() => setIsLinkingModalOpen(false)} sx={{ color: 'zinc.400', fontWeight: 900, fontSize: '10px' }}>Cancelar</Button>
          <button 
            onClick={handleLinkProduct}
            disabled={!selectedGlobalProduct}
            className={`h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!selectedGlobalProduct ? 'bg-zinc-100 text-zinc-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
          >
            Vincular y Continuar
          </button>
        </DialogActions>
      </Dialog>

      {/* Global Alerts */}
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
    </div>
  );
};

export default CrearReceta;

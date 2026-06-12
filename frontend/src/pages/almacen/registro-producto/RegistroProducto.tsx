import React, { useState } from 'react';
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Chip,
  Box,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';

// --- Types ---
interface ProductGroup {
  name: string;
  hasAccount: boolean;
}

interface Product {
  id: string;
  provider: string;
  group: string;
  name: string;
  measureDesc: string;
  durationDays: number;
  hasHistogram: boolean;
  branchRelation?: string;
  packagingType: string;
  packagingPrice: number;
  packagingQty: number;
  unitMeasure: string;
  unitQty: number;
  valueMeasure: string;
  stockMin: number;
  stockDesired: number;
  status: 'Activo' | 'Inactivo';
}

// --- Mock Data ---
const initialProducts: Product[] = [
  {
    id: 'CP-00124',
    provider: '4 LLAMAS S.R.L.',
    group: 'ACEITE',
    name: 'Aceite de Girasol Extra',
    measureDesc: 'Botella 900ml',
    durationDays: 365,
    hasHistogram: true,
    branchRelation: 'Aceite ( 900 ml. Fino)',
    packagingType: 'Caja',
    packagingPrice: 120.50,
    packagingQty: 12,
    unitMeasure: 'Mililitro',
    unitQty: 900,
    valueMeasure: 'Mililitro',
    stockMin: 10,
    stockDesired: 50,
    status: 'Activo'
  },
  {
    id: 'CP-00125',
    provider: 'CAMPANELLA S.R.L.',
    group: 'HARINA',
    name: 'Harina de Trigo Especial',
    measureDesc: 'Saco 50kg',
    durationDays: 180,
    hasHistogram: false,
    packagingType: 'Saco',
    packagingPrice: 210.00,
    packagingQty: 1,
    unitMeasure: 'Kilogramo',
    unitQty: 50,
    valueMeasure: 'Kilogramo',
    stockMin: 5,
    stockDesired: 20,
    status: 'Activo'
  },
  {
    id: 'CP-00126',
    provider: 'ACAISHOP EXPRESS S.R.L.',
    group: 'ALMENDRA',
    name: 'Almendra Fileteada',
    measureDesc: 'Bolsa 1kg',
    durationDays: 90,
    hasHistogram: true,
    packagingType: 'Caja',
    packagingPrice: 85.00,
    packagingQty: 10,
    unitMeasure: 'Gramo',
    unitQty: 1000,
    valueMeasure: 'Gramo',
    stockMin: 2,
    stockDesired: 10,
    status: 'Inactivo'
  }
];

const providers = [
  '4 LLAMAS S.R.L.',
  'ACAISHOP EXPRESS S.R.L.',
  'BISA SEGUROS Y REASEGUROS S.A.',
  'CAMPANELLA S.R.L.'
];

const groups: ProductGroup[] = [
  { name: 'ACEITE', hasAccount: true },
  { name: 'ALMENDRA', hasAccount: false },
  { name: 'CAFE EN GRANO - 75', hasAccount: true },
  { name: 'HARINA', hasAccount: true }
];

const branchProducts = [
  'Aceite ( 900 ml. Fino)',
  'Huevo',
  'Leche condensada'
];

const packagingTypes = ['Botella', 'Caja', 'Bolsa', 'Saco', 'Frasco', 'Lata'];
const units = ['Kilogramo', 'Gramo', 'Mililitro', 'Unidad'];

const RegistroProducto: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // --- States ---
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRelateBranch, setShouldRelateBranch] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    hasHistogram: false,
    packagingType: 'Caja',
    unitMeasure: 'Unidad',
    valueMeasure: 'Unidad',
    status: 'Activo'
  });

  const selectedGroup = groups.find(g => g.name === formData.group);

  // --- Handlers ---
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setFormData(product);
      setShouldRelateBranch(!!product.branchRelation);
      setIsEditMode(true);
    } else {
      setFormData({
        id: `CP-${Math.floor(Math.random() * 90000) + 10000}`,
        hasHistogram: false,
        packagingType: 'Caja',
        unitMeasure: 'Unidad',
        valueMeasure: 'Unidad',
        status: 'Activo'
      });
      setShouldRelateBranch(false);
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.group || !formData.provider) {
      setSnackbar({ open: true, message: 'Complete los campos obligatorios', severity: 'error' });
      return;
    }
    
    if (isEditMode) {
      setProducts(prev => prev.map(p => p.id === formData.id ? (formData as Product) : p));
      setSnackbar({ open: true, message: 'Producto actualizado correctamente', severity: 'success' });
    } else {
      setProducts(prev => [formData as Product, ...prev]);
      setSnackbar({ open: true, message: 'Producto registrado correctamente', severity: 'success' });
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-4xl font-black text-zinc-900 tracking-tight uppercase leading-none">Catálogo de Productos</p>
          <p className="text-zinc-500 mt-3 font-medium max-w-xl text-sm">
            Maestro centralizado para la homologación de insumos, configuración de empaques y niveles críticos de abastecimiento.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-zinc-200 rounded-2xl text-xs font-bold w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">search</span>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-8 py-4 bg-zinc-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100">
                <td className="px-8 py-6 w-24">Código</td>
                <td className="px-8 py-6 w-24 text-center">Acciones</td>
                <td className="px-8 py-6">Producto</td>
                <td className="px-8 py-6">Grupo / Proveedor</td>
                <td className="px-8 py-6 text-center">Medida Base</td>
                <td className="px-8 py-6 text-center">Stock (Min/Des)</td>
                <td className="px-8 py-6 text-center">Estado</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/30 transition-all group">
                  <td className="px-8 py-6 font-black text-zinc-400 text-[10px] uppercase tracking-tighter">{p.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-1">
                      <IconButton onClick={() => handleOpenModal(p)} size="small" className="text-zinc-400 hover:text-amber-500 hover:bg-amber-50">
                        <span className="material-symbols-outlined text-xl">edit_note</span>
                      </IconButton>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-zinc-900 text-xs uppercase tracking-tight">{p.name}</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{p.measureDesc}</p>
                  </td>
                  <td className="px-8 py-6">
                    <Chip 
                      label={p.group} 
                      size="small" 
                      sx={{ fontSize: '8px', fontWeight: 900, borderRadius: '6px', height: '20px', mb: 0.5, bgcolor: 'zinc.100', color: 'zinc.600' }} 
                    />
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">{p.provider}</p>
                  </td>
                  <td className="px-8 py-6 text-center font-black text-zinc-900 text-xs">
                    {p.unitQty} {p.unitMeasure}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100">
                        {p.stockMin}
                      </div>
                      <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100">
                        {p.stockDesired}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <Chip 
                      label={p.status} 
                      size="small" 
                      color={p.status === 'Activo' ? 'success' : 'default'}
                      sx={{ fontSize: '8px', fontWeight: 900, borderRadius: '6px', height: '20px' }} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : '2.5rem',
              p: 1,
              overflow: 'hidden'
            }
          }
        }}
      >
        <DialogTitle sx={{ p: 4, pb: 2 }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-black text-zinc-900 uppercase tracking-tight">
                {isEditMode ? 'Actualizar Producto' : 'Registro de Producto'}
              </p>
            </div>
            <IconButton onClick={() => setIsModalOpen(false)} size="small" className="bg-zinc-50">
              <span className="material-symbols-outlined">close</span>
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <div className="space-y-10">
            {/* Section 1: Identificación General */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">01</span>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identificación y Grupo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seleccione el Proveedor</label>
                  <Autocomplete
                    options={providers}
                    value={formData.provider}
                    onChange={(_, v) => setFormData({...formData, provider: v || ''})}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: 4 LLAMAS S.R.L." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoría o Grupo</label>
                  <Autocomplete
                    options={groups.map(g => g.name)}
                    value={formData.group}
                    onChange={(_, v) => setFormData({...formData, group: v || ''})}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: HARINA" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                  {formData.group && (
                    <p className={`text-[8px] font-black uppercase tracking-tighter mt-1 ml-1 ${selectedGroup?.hasAccount ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {selectedGroup?.hasAccount ? '✓ Posee Cuenta Contable' : '✗ Sin Cuenta Contable'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
                  <TextField fullWidth size="small" placeholder="Ej: Harina de Trigo 000" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Detalle de Presentación</label>
                  <TextField fullWidth size="small" placeholder="Ej: Bolsa de 50kg" value={formData.measureDesc} onChange={e => setFormData({...formData, measureDesc: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Vida Útil en Días</label>
                    <TextField fullWidth type="number" size="small" placeholder="0" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: parseInt(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </div>
                  <div className="flex flex-col justify-center px-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <FormControlLabel
                      control={<Switch size="small" checked={formData.hasHistogram} onChange={e => setFormData({...formData, hasHistogram: e.target.checked})} />}
                      label={<span className="text-[9px] font-black text-zinc-600 uppercase">Histograma</span>}
                      sx={{ m: 0 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Relación y Empaque */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">02</span>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Empaque y Relación de Sucursal</p>
              </div>

              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                      <span className="material-symbols-outlined">hub</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-900 uppercase">Relación con Sucursal</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">¿Vincular con un producto existente de sucursal?</p>
                    </div>
                  </div>
                  <Switch checked={shouldRelateBranch} onChange={e => setShouldRelateBranch(e.target.checked)} />
                </div>

                {shouldRelateBranch && (
                  <div className="animate-in zoom-in-95 duration-300">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-1 block">Producto de Sucursal a Relacionar</label>
                    <Autocomplete
                      options={branchProducts}
                      value={formData.branchRelation}
                      onChange={(_, v) => setFormData({...formData, branchRelation: v || ''})}
                      renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'white' } }} />}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Envase / Empaque</label>
                  <Autocomplete
                    options={packagingTypes}
                    value={formData.packagingType}
                    onChange={(_, v) => setFormData({...formData, packagingType: v || ''})}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: Saco" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Precio x Envase</label>
                  <TextField fullWidth type="number" size="small" placeholder="0.00" value={formData.packagingPrice} onChange={e => setFormData({...formData, packagingPrice: parseFloat(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Contenido Neto x Envase</label>
                  <TextField fullWidth type="number" size="small" placeholder="0.00" value={formData.packagingQty} onChange={e => setFormData({...formData, packagingQty: parseFloat(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </div>
              </div>
            </div>

            {/* Section 3: Medida y Stocks */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">03</span>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Unidades y Niveles Críticos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Unidad de Medida</label>
                  <Autocomplete
                    options={units}
                    value={formData.unitMeasure}
                    onChange={(_, v) => setFormData({...formData, unitMeasure: v || ''})}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: Kilogramo" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Contenido Unitario</label>
                  <TextField fullWidth type="number" size="small" placeholder="0.00" value={formData.unitQty} onChange={e => setFormData({...formData, unitQty: parseFloat(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Unidad de Valoración</label>
                  <Autocomplete
                    options={units}
                    value={formData.valueMeasure}
                    onChange={(_, v) => setFormData({...formData, valueMeasure: v || ''})}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: Kilogramo" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
                  />
                </div>
                
                <Divider className="md:col-span-3 opacity-50" />

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Mínimo (Alerta)</label>
                  <TextField fullWidth type="number" size="small" placeholder="0.00" value={formData.stockMin} onChange={e => setFormData({...formData, stockMin: parseFloat(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rose.50/30' } }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Ideal (Reposición)</label>
                  <TextField fullWidth type="number" size="small" placeholder="0.00" value={formData.stockDesired} onChange={e => setFormData({...formData, stockDesired: parseFloat(e.target.value)})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'emerald.50/30' } }} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'zinc.400', fontWeight: 900, fontSize: '11px', px: 4 }}>Cancelar</Button>
          <button
            onClick={handleSave}
            className="h-12 px-10 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            {isEditMode ? 'Actualizar Producto' : 'Guardar Producto'}
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
    </div>
  );
};

export default RegistroProducto;

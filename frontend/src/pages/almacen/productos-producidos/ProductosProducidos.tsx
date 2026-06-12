import React, { useState, useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { 
  Autocomplete, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Switch, 
  FormControlLabel,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Alert
} from '@mui/material';

// --- Mock Data ---
const warehouses = ['CHEESECAKE', 'BIZCOCHOS', 'ESENCIAS', 'FRUTAS'];
const areas = ['PERECEDEROS', 'NO PERECEDEROS', 'SEGUNDA VUELTA', 'TERCERA VUELTA'];

const availableProducts = [
  // --- BIZCOCHOS (From JSON) ---
  { id: 1119, name: 'BIZCOCHO DE ALMENDRA - RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'bakery_dining', isIntermediate: true, recipe: [
      { item: 'HARINA', req: 3250 }, { item: 'AZUCAR', req: 800 }, { item: 'HUEVO', req: 80 }, { item: 'ALMENDRA', req: 800 },
      { item: 'ACEITE', req: 700 }, { item: 'POLVO DE HORNEAR', req: 83 }, { item: 'ESENCIA DE ALMENDRA', req: 3 }, { item: 'LECHE CONDENSADA PROD - RI', req: 2800 }
  ]},
  { id: 74, name: 'BIZCOCHO DE CHOCOLATE-RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'cookie', isIntermediate: true, recipe: [
      { item: 'AZUCAR', req: 2300 }, { item: 'CHISPAS DE CHOCOLATE', req: 800 }, { item: 'COCOA BREICK', req: 500 }, { item: 'HARINA', req: 2300 },
      { item: 'HUEVO', req: 90 }, { item: 'CARAMELINA', req: 50 }, { item: 'POLVO DE HORNEAR', req: 60 }, { item: 'MARGARINA S/N SAL', req: 800 }
  ]},
  { id: 2159, name: 'BIZCOCHO DE ZANAHORIA - RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'bakery_dining', isIntermediate: true, recipe: [
      { item: 'HUEVO', req: 40 }, { item: 'ACEITE', req: 1500 }, { item: 'AZUCAR MORENA', req: 3300 }, { item: 'ESENCIA DE VAINILLA CARAMELO', req: 50 },
      { item: 'HARINA', req: 3300 }, { item: 'CANELA EN POLVO', req: 50 }, { item: 'NUEZ MOSCADA', req: 7 }, { item: 'BICARBONATO', req: 50 },
      { item: 'POLVO DE HORNEAR', req: 55 }, { item: 'SAL', req: 26 }, { item: 'JENGIBRE POLVO', req: 5 }, { item: 'CLAVO DE OLOR EN POLVO', req: 3 },
      { item: 'EMULSIONANTE', req: 10 }, { item: 'ZANAHORIA', req: 4500 }, { item: 'PROPIONATO DE CALCIO', req: 2 }
  ]},
  { id: 61, name: 'BIZCOCHO RED VELVET-RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'cake', isIntermediate: true, recipe: [
      { item: 'AZUCAR', req: 2400 }, { item: 'COCOA BREICK', req: 100 }, { item: 'HARINA', req: 4000 }, { item: 'HUEVO', req: 135 },
      { item: 'POLVO DE HORNEAR', req: 50 }, { item: 'YOGURT NATURAL', req: 500 }, { item: 'ESENCIA DE CHOCOLATE PREPARADA-RI', req: 50 }, { item: 'COLORANTE ROJO', req: 20 }
  ]},
  { id: 64, name: 'BIZCOCHO TORTA 3 LECHES-RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'cake', isIntermediate: true, recipe: [
      { item: 'AZUCAR', req: 1500 }, { item: 'ESENCIA DE VAINILLA CARAMELO', req: 100 }, { item: 'HARINA', req: 1600 }, { item: 'HUEVO', req: 64 },
      { item: 'POLVO DE HORNEAR', req: 42 }, { item: 'DESMOLDANTE-RI', req: 6 }
  ]},
  { id: 114, name: 'LECHE CONDENSADA RI', warehouse: 'BIZCOCHOS', unit: 'Gramo', icon: 'water_drop', isIntermediate: true, recipe: [
      { item: 'MANTEQUILLA SIN SAL', req: 960 }, { item: 'AZUCAR', req: 5600 }, { item: 'SAL', req: 20 }, { item: 'CONSERVANTE', req: 32 },
      { item: 'LECHE EN POLVO FLUIDA', req: 3500 }, { item: 'EMULSIONANTE', req: 20 }, { item: 'GLUCOSA LIQUIDA', req: 1400 }
  ]},
  { id: 65, name: 'REMOJO TRES LECHES-RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'water_drop', isIntermediate: true, recipe: [
      { item: 'LECHE DESLACTOSADA', req: 60 }, { item: 'LECHE EVAPORADA', req: 50 }, { item: 'LECHE CONDENSADA PROD - RI', req: 50 }
  ]},
  { id: 66, name: 'TORTA 3 LECHES-RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'cake', isIntermediate: true, recipe: [
      { item: 'CANELA EN POLVO', req: 0.2 }, { item: 'CREMA VEGETAL', req: 20 }, { item: 'LECHE DESLACTOSADA', req: 5 }, { item: 'TRIANGULARES TAPA ALTA', req: 1 },
      { item: 'BIZCOCHO TORTA 3 LECHES-RI', req: 1 }, { item: 'REMOJO TRES LECHES-RI', req: 1 }
  ]},
  { id: 1120, name: 'TORTA DE ALMENDRA - RI', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'bakery_dining', isIntermediate: true, recipe: [
      { item: 'AZUCAR', req: 33 }, { item: 'ALMENDRA', req: 17 }, { item: 'BIZCOCHO RELLENO TORTA DE ALMENDRA - RI', req: 1 },
      { item: 'CREMA VEGETAL', req: 150 }, { item: 'LECHE DESLACTOSADA', req: 50 }, { item: 'AZUCAR IMPALPABLE', req: 20 }
  ]},

  // --- Final Products for BIZCOCHOS ---
  { id: 5001, name: 'TORTA 3 LECHES FAMILIAR', warehouse: 'BIZCOCHOS', unit: 'Unidad', icon: 'cake', isIntermediate: false, recipe: [
    { item: 'TORTA 3 LECHES-RI', req: 10 }, { item: 'CREMA VEGETAL', req: 500 }
  ]},

  // --- CHEESECAKE ---
  { id: 2001, name: 'CHEESECAKE DE OREO - RI', warehouse: 'CHEESECAKE', unit: 'Unidad', icon: 'cake', isIntermediate: true, recipe: [
    { item: 'QUESO CREMA', req: 500 }, { item: 'GALLETA OREO', req: 200 }, { item: 'AZUCAR', req: 100 }
  ]},
  { id: 2002, name: 'CHEESECAKE FRUTOS ROJOS', warehouse: 'CHEESECAKE', unit: 'Unidad', icon: 'cake', isIntermediate: false, recipe: [
    { item: 'QUESO CREMA', req: 400 }, { item: 'MERMELADA FRUTILLA', req: 150 }, { item: 'GALLETA BASE', req: 100 }
  ]},

  // --- ESENCIAS ---
  { id: 3001, name: 'ESENCIA VAINILLA CONCENTRADA', warehouse: 'ESENCIAS', unit: 'Litro', icon: 'colorize', isIntermediate: true, recipe: [
    { item: 'VAINILLA VAINA', req: 10 }, { item: 'ALCOHOL GRADO ALIMENTICIO', req: 1000 }
  ]},

  // --- FRUTAS ---
  { id: 4001, name: 'PULPA DE FRUTILLA CONGELADA', warehouse: 'FRUTAS', unit: 'kg', icon: 'nutrition', isIntermediate: true, recipe: [
    { item: 'FRUTILLA FRESCA', req: 1.2 }, { item: 'AZUCAR', req: 0.1 }
  ]},
];

const currentStock = {
  'HARINA': 16200.00,
  'AZUCAR': 3700.00,
  'HUEVO': 12.00,
  'ALMENDRA': 62.00,
  'ACEITE': 0.00,
  'POLVO DE HORNEAR': 779.00,
  'ESENCIA DE ALMENDRA': 390.00,
  'LECHE CONDENSADA PROD - RI': 700.00,
  'CHISPAS DE CHOCOLATE': 13300.00,
  'COCOA BREICK': 950.00,
  'CARAMELINA': 720.00,
  'MARGARINA S/N SAL': 4900.00,
  'AZUCAR MORENA': 3380.00,
  'ESENCIA DE VAINILLA CARAMELO': 400.00,
  'CANELA EN POLVO': 312.00,
  'NUEZ MOSCADA': 37.00,
  'BICARBONATO': 200.00,
  'SAL': 548.00,
  'JENGIBRE POLVO': 53.00,
  'CLAVO DE OLOR EN POLVO': 420.00,
  'EMULSIONANTE': 840.00,
  'ZANAHORIA': 32750.00,
  'PROPIONATO DE CALCIO': 116.00,
  'YOGURT NATURAL': 1000.00,
  'ESENCIA DE CHOCOLATE PREPARADA-RI': 120.00,
  'COLORANTE ROJO': 380.00,
  'DESMOLDANTE-RI': 1188.00,
  'LECHE DESLACTOSADA': 4420.00,
  'LECHE EVAPORADA': 6200.00,
  'CREMA VEGETAL': 3320.00,
  'TRIANGULARES TAPA ALTA': 235.00,
  'BIZCOCHO TORTA 3 LECHES-RI': 15.00,
  'REMOJO TRES LECHES-RI': 7.00,
  
  // Others for simulation
  'QUESO CREMA': 5000,
  'GALLETA OREO': 2000,
  'FRUTILLA FRESCA': 10000,
  'MERMELADA FRUTILLA': 500,
  'GALLETA BASE': 1000,
  'VAINILLA VAINA': 50,
  'ALCOHOL GRADO ALIMENTICIO': 5000,
  'MANTEQUILLA SIN SAL': 0,
  'LECHE EN POLVO FLUIDA': 0,
  'GLUCOSA LIQUIDA': 0,
  'CONSERVANTE': 0,
  'BIZCOCHO RELLENO TORTA DE ALMENDRA - RI': 0,
  'AZUCAR IMPALPABLE': 0
};

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</span>
  </div>
);

const ProductosProducidos: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('2023-10-24'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs('2023-10-25'));
  
  // Modal States
  const [open, setOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [productionList, setProductionList] = useState<any[]>([]);
  
  // Adder States
  const [prodType, setProdType] = useState<'intermediate' | 'final'>('intermediate');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);

  // Alert States
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

  const records = [
    { product: 'BIZCOCHO DE ZANAHORIA - RI', isIntermediate: 'No', warehouse: 'BIZCOCHOS', date: '25/10/2023 09:15', user: 'Helen', qty: '450', unit: 'uds', icon: 'bakery_dining' },
    { product: 'TORTA 3 LECHES-RI', isIntermediate: 'No', warehouse: 'PASTELERÍA', date: '25/10/2023 08:30', user: 'Helen', qty: '120', unit: 'uds', icon: 'cake' },
    { product: 'REMOJO TRES LECHES-RI', isIntermediate: 'Sí', warehouse: 'MP - HARINAS', date: '25/10/2023 07:10', user: 'Helen', qty: '50', unit: 'litros', icon: 'water_drop' },
  ];

  const filteredOptions = useMemo(() => {
    if (!selectedWarehouse) return [];
    return availableProducts.filter(p => 
      p.warehouse === selectedWarehouse && 
      p.isIntermediate === (prodType === 'intermediate')
    );
  }, [selectedWarehouse, prodType]);

  const checkStockForAddition = (product: any, qty: number) => {
    // Current Requirements from list
    const currentReqs: Record<string, number> = {};
    productionList.forEach(p => {
      p.recipe.forEach((r: any) => {
        currentReqs[r.item] = (currentReqs[r.item] || 0) + (r.req * p.qty);
      });
    });

    // New Requirements from addition
    const missing: string[] = [];
    product.recipe.forEach((r: any) => {
      const neededTotal = (currentReqs[r.item] || 0) + (r.req * qty);
      const available = (currentStock as any)[r.item] || 0;
      if (available < neededTotal) {
        missing.push(`${r.item} (Faltan ${(neededTotal - available).toFixed(2)})`);
      }
    });

    return missing;
  };

  const handleAddProduct = () => {
    if (!selectedProduct || !quantity) return;
    
    const missing = checkStockForAddition(selectedProduct, Number(quantity));
    
    if (missing.length > 0) {
      setSnackbar({ 
        open: true, 
        message: `Stock insuficiente para añadir: ${missing.join(', ')}` 
      });
      return; // Stop addition
    }

    const newItem = {
      ...selectedProduct,
      qty: Number(quantity),
      destArea: prodType === 'final' ? selectedArea : null,
      tempId: Date.now()
    };
    setProductionList([...productionList, newItem]);
    setSelectedProduct(null);
    setSelectedArea(null);
    setQuantity(1);
  };

  const handleRemoveProduct = (tempId: number) => {
    setProductionList(productionList.filter(p => p.tempId !== tempId));
  };

  const aggregatedStock = useMemo(() => {
    const requirements: Record<string, { total: number; confirmed: number }> = {};
    
    // Confirmed requirements from list
    productionList.forEach(p => {
      p.recipe.forEach((r: any) => {
        if (!requirements[r.item]) requirements[r.item] = { total: 0, confirmed: 0 };
        const amt = r.req * p.qty;
        requirements[r.item].total += amt;
        requirements[r.item].confirmed += amt;
      });
    });

    // Preview requirements from current selection
    if (selectedProduct && Number(quantity) > 0) {
      selectedProduct.recipe.forEach((r: any) => {
        if (!requirements[r.item]) requirements[r.item] = { total: 0, confirmed: 0 };
        requirements[r.item].total += (r.req * Number(quantity));
      });
    }

    return Object.entries(requirements)
      .map(([item, data]) => {
        const available = (currentStock as any)[item] || 0;
        return {
          item,
          required: data.total,
          confirmed: data.confirmed,
          available,
          sufficient: available >= data.total,
          isPreview: data.total > data.confirmed
        };
      })
      .sort((a, b) => {
        // Sort by insufficient first, then by preview status
        if (a.sufficient !== b.sufficient) return a.sufficient ? 1 : -1;
        if (a.isPreview !== b.isPreview) return a.isPreview ? -1 : 1;
        return 0;
      });
  }, [productionList, selectedProduct, quantity]);

  const hasConfirmedMissingStock = aggregatedStock.some(s => s.confirmed > s.available);
  const hasTotalMissingStock = aggregatedStock.some(s => !s.sufficient);

  const handleReset = () => {
    setSelectedWarehouse(null);
    setProductionList([]);
    handleResetAdder();
  };

  const handleResetAdder = () => {
    setSelectedProduct(null);
    setSelectedArea(null);
    setQuantity(1);
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8 px-4 md:px-0">
        <div>
          <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Productos Producidos</p>
          <div className="mt-2">
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-[0.2em]">Registro masivo de producción con validación de stock agrupada.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-end gap-4 p-5 md:p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 w-full md:w-fit">
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén de Consulta</label>
            <Autocomplete
              options={warehouses}
              size="small"
              sx={{ width: { xs: '100%', md: 220 }, '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/50' } }}
              renderInput={(params) => <TextField {...params} placeholder="Seleccionar..." variant="outlined" />}
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
            <DatePicker
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/50' } } } }}
            />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Fin</label>
            <DatePicker
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/50' } } } }}
            />
          </div>
          <button className="h-12 w-full md:w-auto bg-primary text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">manage_search</span>
            Filtrar
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-zinc-100 shadow-sm overflow-hidden mb-8 mx-4 md:mx-0">
        <div className="px-6 md:px-10 py-6 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
          <p className="font-black text-zinc-400 uppercase text-[9px] md:text-[10px] tracking-[0.3em]">Registros de Producción</p>
          <div className="flex gap-2">
             <button className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">download</span></button>
             <button className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">print</span></button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-50">
                <td className="px-10 py-6">Producto</td>
                <td className="px-10 py-6 text-center">Tipo</td>
                <td className="px-10 py-6">Almacén</td>
                <td className="px-10 py-6">Fecha</td>
                <td className="px-10 py-6">Usuario</td>
                <td className="px-10 py-6 text-center">Cantidad</td>
                <td className="px-10 py-6 text-right">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 text-sm">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/30 transition-colors group text-xs">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined text-[24px]">{r.icon}</span>
                      </div>
                      <span className="font-black text-zinc-900 uppercase tracking-tight">{r.product}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.isIntermediate === 'Sí' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {r.isIntermediate === 'Sí' ? 'Intermedio' : 'Final'}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-zinc-400 uppercase font-bold tracking-tight">{r.warehouse}</td>
                  <td className="px-10 py-8 text-zinc-400 font-bold tracking-tighter">{r.date}</td>
                  <td className="px-10 py-8 text-zinc-500 font-bold uppercase">{r.user}</td>
                  <td className="px-10 py-8 text-center font-black text-zinc-900">{r.qty} {r.unit}</td>
                  <td className="px-10 py-8 text-right">
                    <button className="text-zinc-300 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button */}
      <Tooltip title="Registrar Nueva Producción" placement="left">
        <button 
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="material-symbols-outlined text-3xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </button>
      </Tooltip>

      {/* Registration Modal - MULTI-PRODUCT & GUIDED */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ 
          transition: { onExited: handleReset },
          paper: { sx: { borderRadius: isMobile ? 0 : '3rem', bgcolor: 'zinc.50' } } 
        }}
      >
        <DialogTitle className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 bg-white rounded-t-[3rem] border-b border-zinc-100">
          <div>
            <p className="text-xl md:text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Registro Masivo de Producción</p>
            <p className="text-[9px] md:text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase mt-2">Agregue múltiples productos e intermedios en una sola orden</p>
          </div>
          <IconButton onClick={() => setOpen(false)} className="rounded-2xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 p-3">
            <span className="material-symbols-outlined text-2xl">close</span>
          </IconButton>
        </DialogTitle>
        <DialogContent className="px-4 md:px-8 py-8 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Section: Form & List */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* STEP 01: Almacén Productor */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StepBadge num="01" label="Origen de Producción" />
                <div className="p-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén Productor</label>
                    <Autocomplete
                      options={warehouses}
                      value={selectedWarehouse}
                      disabled={productionList.length > 0}
                      onChange={(_, v) => { setSelectedWarehouse(v); handleResetAdder(); }}
                      renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar almacén..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/30' } }} />}
                    />
                    {productionList.length > 0 && <p className="text-[8px] text-primary font-black uppercase mt-1">El almacén está bloqueado mientras haya productos en la lista</p>}
                  </div>
                </div>
              </div>

              {/* STEP 02: Selector de Productos (Adder) */}
              <div className={`transition-all duration-500 ${!selectedWarehouse ? 'opacity-30 blur-[2px] pointer-events-none' : 'animate-in fade-in slide-in-from-bottom-4'}`}>
                <StepBadge num="02" label="Agregar a la Lista de Producción" />
                <div className="p-6 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                  
                  {/* Type Selection */}
                  <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-zinc-50 pb-6">
                    <ToggleButtonGroup
                      value={prodType}
                      exclusive
                      onChange={(_, v) => { if(v) { setProdType(v); setSelectedProduct(null); } }}
                      size="small"
                      sx={{ '& .MuiToggleButton-root': { borderRadius: '12px', px: 3, border: '1px solid #f4f4f5', textTransform: 'none', fontWeight: 900, fontSize: '10px', letterSpacing: '0.1em' } }}
                    >
                      <ToggleButton value="intermediate" className="uppercase">📦 Producto Intermedio</ToggleButton>
                      <ToggleButton value="final" className="uppercase">✨ Producto Final</ToggleButton>
                    </ToggleButtonGroup>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase italic">* Los catálogos cambian según el tipo seleccionado</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-5 space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Producto ({prodType})</label>
                      <Autocomplete
                        options={filteredOptions}
                        getOptionLabel={(o) => o.name}
                        value={selectedProduct}
                        onChange={(_, v) => setSelectedProduct(v)}
                        renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
                      />
                    </div>
                    {prodType === 'final' && (
                      <div className="lg:col-span-3 space-y-2 animate-in fade-in slide-in-from-left-4">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Destino</label>
                        <Autocomplete
                          options={areas}
                          value={selectedArea}
                          onChange={(_, v) => setSelectedArea(v)}
                          renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Área..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
                        />
                      </div>
                    )}
                    <div className={prodType === 'final' ? 'lg:col-span-2 space-y-2' : 'lg:col-span-4 space-y-2'}>
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cant.</label>
                      <TextField fullWidth type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />
                    </div>
                    <div className="lg:col-span-2">
                      <button 
                        onClick={handleAddProduct}
                        disabled={!selectedProduct || (prodType === 'final' && !selectedArea)}
                        className={`w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${(!selectedProduct || (prodType === 'final' && !selectedArea)) ? 'bg-zinc-100 text-zinc-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 03: Lista Actual */}
              <div className={`transition-all duration-500 ${productionList.length === 0 ? 'opacity-30' : 'animate-in fade-in slide-in-from-bottom-4'}`}>
                <StepBadge num="03" label="Lista de Producción Actual" />
                <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50">
                           <td className="px-6 py-4">Ítem</td>
                           <td className="px-6 py-4 text-center">Tipo</td>
                           <td className="px-6 py-4 text-center">Cant.</td>
                           <td className="px-6 py-4">Destino</td>
                           <td className="px-6 py-4 text-right">Quitar</td>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-50">
                         {productionList.length === 0 ? (
                           <tr><td colSpan={5} className="px-6 py-10 text-center text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">La lista está vacía</td></tr>
                         ) : (
                           productionList.map((p) => (
                             <tr key={p.tempId} className="hover:bg-zinc-50/30 text-[11px] font-bold text-zinc-700">
                               <td className="px-6 py-4 uppercase">{p.name}</td>
                               <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded text-[8px] uppercase ${p.isIntermediate ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>{p.isIntermediate ? 'Intermedio' : 'Final'}</span></td>
                               <td className="px-6 py-4 text-center">{p.qty} {p.unit}</td>
                               <td className="px-6 py-4 uppercase text-[9px] text-zinc-400">{p.destArea || '-'}</td>
                               <td className="px-6 py-4 text-right">
                                 <button onClick={() => handleRemoveProduct(p.tempId)} className="w-8 h-8 rounded-lg text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
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

            {/* Right Section: Aggregated Validation */}
            <div className={`lg:col-span-4 ${isMobile ? 'mt-8' : ''}`}>
               <div className={`h-full bg-zinc-900 rounded-[3rem] p-8 text-white shadow-2xl ring-4 transition-all duration-700 ${hasTotalMissingStock ? 'ring-rose-500/20' : (productionList.length > 0 || selectedProduct) ? 'ring-emerald-500/20' : 'ring-white/5'}`}>
                  <StepBadge num="04" label="Análisis de Insumos Agrupado" />
                  
                  {productionList.length === 0 && !selectedProduct ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 opacity-30">
                      <span className="material-symbols-outlined text-6xl">inventory</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Agregue productos para validar el stock total necesario</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasTotalMissingStock ? 'bg-rose-500/20 border-rose-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasTotalMissingStock ? 'bg-rose-500 pulse-subtle' : 'bg-emerald-500'} text-white shadow-lg`}>
                          <span className="material-symbols-outlined">{hasTotalMissingStock ? 'warning' : 'verified'}</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/30 tracking-widest">Estado del Almacén</p>
                          <p className="text-xs font-black uppercase">
                            {hasTotalMissingStock ? 'Insumos Insuficientes' : 'Todo en Orden'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[450px] pr-2">
                        {aggregatedStock.map((s, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${s.sufficient ? 'bg-white/5 border-white/5' : 'bg-rose-500/10 border-rose-500/40'}`}>
                             {s.isPreview && (
                               <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary/20 text-primary text-[7px] font-black uppercase tracking-tighter rounded-bl-lg">Vista Previa</div>
                             )}
                             <div className="flex justify-between items-start mb-2">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${s.sufficient ? 'text-white/80' : 'text-rose-400'}`}>{s.item}</span>
                               <span className={`material-symbols-outlined text-sm ${s.sufficient ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`}>{s.sufficient ? 'check_circle' : 'error'}</span>
                             </div>
                             <div className="flex justify-between text-[11px] font-black">
                               <div className="flex flex-col">
                                 <span className="text-[8px] text-white/30 uppercase">Necesario</span>
                                 <span>{s.required.toFixed(2)}</span>
                               </div>
                               <div className="flex flex-col items-end">
                                 <span className="text-[8px] text-white/30 uppercase">Disponible</span>
                                 <span className={s.sufficient ? 'text-white' : 'text-rose-500'}>{s.available}</span>
                               </div>
                             </div>
                             {!s.sufficient && (
                               <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{ width: `${Math.min((s.available/s.required)*100, 100)}%` }}></div>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-8">
                         <button 
                           disabled={hasConfirmedMissingStock || productionList.length === 0}
                           className={`w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${ (hasConfirmedMissingStock || productionList.length === 0) ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-primary text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95'}`}
                         >
                           <span className="material-symbols-outlined">save_as</span>
                           Registrar Orden
                         </button>
                         {hasTotalMissingStock && !hasConfirmedMissingStock && (
                           <p className="text-[8px] text-primary/60 font-black uppercase text-center mt-3 animate-pulse tracking-widest">Aviso: El producto actual requiere más stock</p>
                         )}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Stock Alert */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: isMobile ? 8 : 0 }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductosProducidos;





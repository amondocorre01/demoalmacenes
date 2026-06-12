import React, { useState } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface TransferItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
  qty: string | number;
}

const availableWarehouses = ['Supervision', 'Pies', 'Frutas', 'Bizcochos', 'Tortas'];
const availableProductsList = [
  { name: 'CHISPAS DE CHOCOLATE', unit: 'Kilogramos', stock: 50 },
  { name: 'HARINA DE TRIGO 000', unit: 'Bolsas', stock: 120 },
  { name: 'MANTEQUILLA CON SAL', unit: 'Unidades', stock: 85 },
  { name: 'AZUCAR IMPALPABLE', unit: 'Kilogramos', stock: 40 },
  { name: 'ESENCIA DE VAINILLA', unit: 'Litros', stock: 15 },
];

const TransferenciaAlmacen: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Modal State
  const [sourceWarehouse, setSourceWarehouse] = useState<string | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);

  const history = [
    { date: '2025-01-16 17:19:20', operation: 'Enviado', warehouse: 'SUPERVISIÓN', status: 'Aceptado(En Stock)', statusColor: 'bg-emerald-100 text-emerald-700' },
    { date: '2025-01-16 17:19:20', operation: 'Enviado', warehouse: 'PANADERIA', status: 'Aceptado(En Stock)', statusColor: 'bg-emerald-100 text-emerald-700' },
    { date: '2025-01-16 17:19:20', operation: 'Enviado', warehouse: 'TORTAS', status: 'Aceptado(En Stock)', statusColor: 'bg-emerald-100 text-emerald-700' },
    { date: '2025-01-16 17:19:20', operation: 'Enviado', warehouse: 'GALLETA', status: 'Aceptado(En Stock)', statusColor: 'bg-emerald-100 text-emerald-700' },
  ];

  const handleAddProduct = (product: any) => {
    if (!product) return;
    if (transferItems.find(item => item.name === product.name)) {
      setSnackbar({ open: true, message: 'El producto ya está en la lista', severity: 'error' });
      return;
    }
    setTransferItems(prev => [
      ...prev,
      { id: Date.now(), name: product.name, unit: product.unit, stock: product.stock, qty: '' }
    ]);
    setSelectedProduct(null);
  };

  const handleQtyChange = (id: number, value: string) => {
    const qty = parseFloat(value) || 0;
    const item = transferItems.find(i => i.id === id);
    if (item && qty > item.stock) {
      setTransferItems(prev => prev.map(i => i.id === id ? { ...i, qty: item.stock.toString() } : i));
      setSnackbar({ open: true, message: `La cantidad no puede superar el stock disponible (${item.stock})`, severity: 'error' });
    } else {
      setTransferItems(prev => prev.map(i => i.id === id ? { ...i, qty: value } : i));
    }
  };

  const handleRemoveItem = (id: number) => {
    setTransferItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveTransfer = () => {
    if (!sourceWarehouse || !targetWarehouse || transferItems.length === 0) {
      setSnackbar({ open: true, message: 'Complete todos los datos y añada productos', severity: 'error' });
      return;
    }
    if (sourceWarehouse === targetWarehouse) {
      setSnackbar({ open: true, message: 'El almacén de origen y destino no pueden ser iguales', severity: 'error' });
      return;
    }
    
    setSnackbar({ open: true, message: 'Transferencia registrada con éxito', severity: 'success' });
    setIsModalOpen(false);
    setTransferItems([]);
    setSourceWarehouse(null);
    setTargetWarehouse(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <p className="text-4xl font-black tracking-tighter text-zinc-900 uppercase leading-none">Transferencia de Stock</p>
          <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest mt-2">Mueva insumos de manera eficiente entre sus puntos de control internos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-zinc-900/20 hover:bg-primary transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">sync_alt</span>
          REGISTRAR TRANSFERENCIA
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-10 bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-2 ml-1">Filtro Almacén</label>
            <Autocomplete
              options={availableWarehouses}
              renderInput={(params) => <TextField {...params} size="small" placeholder="Todos los almacenes" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/30' } }} />}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-2 ml-1">Fecha Inicio</label>
            <DatePicker
              value={startDate}
              onChange={(v) => setStartDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/30' } } } }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-2 ml-1">Fecha Fin</label>
            <DatePicker
              value={endDate}
              onChange={(v) => setEndDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/30' } } } }}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-zinc-100 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 md:p-10 border-b border-zinc-50 bg-zinc-50/20">
          <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.2em]">Historial de Operaciones</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-100">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black text-zinc-400 tracking-[0.3em] uppercase">
                <td className="px-10 py-6">Fecha Registro</td>
                <td className="px-8 py-6">Operación</td>
                <td className="px-8 py-6">Almacén</td>
                <td className="px-8 py-6">Estado</td>
                <td className="px-10 py-6 text-right">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 text-sm">
              {history.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/30 transition-all group">
                  <td className="px-10 py-6 font-black text-zinc-900 uppercase tracking-tighter text-xs">{item.date}</td>
                  <td className="px-8 py-6 font-bold text-zinc-500 uppercase text-[11px] tracking-tight">{item.operation}</td>
                  <td className="px-8 py-6 font-black text-zinc-400 uppercase tracking-widest text-[11px]">{item.warehouse}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1 text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <IconButton size="small" className="text-zinc-200 hover:text-zinc-900 transition-colors">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Transfer Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : '2.5rem', p: 0.5, bgcolor: 'zinc.50/50' } } }}
      >
        <DialogTitle sx={{ p: 2, px: 4, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'zinc-50' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-xl">move_up</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Operación de Almacén</p>
                <p className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Nueva Transferencia</p>
              </div>
            </div>
            <IconButton onClick={() => setIsModalOpen(false)} size="small" className="bg-zinc-50">
              <span className="material-symbols-outlined text-lg">close</span>
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-4 mb-10 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén Origen</label>
              <Autocomplete
                options={availableWarehouses}
                value={sourceWarehouse}
                onChange={(_, v) => setSourceWarehouse(v)}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar origen..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén Destino</label>
              <Autocomplete
                options={availableWarehouses}
                value={targetWarehouse}
                onChange={(_, v) => setTargetWarehouse(v)}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar destino..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Buscar Producto</label>
              <Autocomplete
                options={availableProductsList}
                getOptionLabel={(o) => `${o.name} (${o.unit}) - Stock: ${o.stock}`}
                value={selectedProduct}
                onChange={(_, v) => setSelectedProduct(v)}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Escriba nombre..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
              />
            </div>
            <button 
              onClick={() => handleAddProduct(selectedProduct)}
              className="h-10 bg-zinc-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-100"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Añadir Producto
            </button>
          </div>

          <div className="bg-zinc-50/50 rounded-[2rem] border border-zinc-100 overflow-hidden">
            <div className="px-8 py-4 border-b border-zinc-100 bg-zinc-50/80">
              <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Detalle de Transferencia</p>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100">
                    <td className="px-8 py-4">Producto</td>
                    <td className="px-8 py-4 text-center">U. Medida</td>
                    <td className="px-8 py-4 text-center">Stock Actual</td>
                    <td className="px-8 py-4 text-center w-40">Cant. a Enviar</td>
                    <td className="px-8 py-4 text-right">Acciones</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 bg-white">
                  {transferItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                        Utilice el buscador arriba para añadir productos al listado
                      </td>
                    </tr>
                  ) : (
                    transferItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-all group">
                        <td className="px-8 py-5">
                          <p className="font-black text-zinc-900 text-[11px] uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</p>
                        </td>
                        <td className="px-8 py-5 text-center text-[10px] font-bold text-zinc-400 uppercase">{item.unit}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <input 
                            type="number"
                            className="w-24 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 text-xs font-black text-center text-zinc-900 outline-none focus:border-primary transition-all"
                            placeholder="0.00"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          />
                        </td>
                        <td className="px-8 py-5 text-right">
                          <IconButton onClick={() => handleRemoveItem(item.id)} size="small" className="text-zinc-200 hover:text-primary transition-colors">
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
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 4, bgcolor: 'white', borderTop: '1px solid', borderColor: 'zinc-50' }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'zinc-400', fontWeight: 900, fontSize: '10px', px: 4 }}>Cancelar</Button>
          <button 
            onClick={handleSaveTransfer}
            className="h-10 px-10 bg-zinc-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-zinc-200 hover:bg-primary hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Procesar Transferencia
          </button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TransferenciaAlmacen;

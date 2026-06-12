import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface RequestProduct {
  id: number;
  name: string;
  detail: string;
  measureQty: string;
  stock: number;
  requestQty: string | number;
  requestByUnit: string;
}

const availableAreas = ['Producción', 'Planta', 'Administracion Planta', 'Administración', 'Sistemas'];
const availableWarehousesList = ['Panadería', 'Tortas', 'Pies', 'Frutas', 'Bizcochos', 'Escencias', 'Polvos'];

const initialMockProducts: RequestProduct[] = [
  {
    id: 1,
    name: 'CHISPAS DE CHOCOLATE',
    detail: '103320 CHIPS COMP SEMI AMARGO 650-750 1X10KG EXP',
    measureQty: '1000.00 Gramo',
    stock: 10,
    requestQty: '',
    requestByUnit: 'Kilogramos'
  },
  {
    id: 2,
    name: 'HARINA DE TRIGO 000',
    detail: 'HARINA ESPECIAL X 50KG',
    measureQty: '50.00 Kilogramo',
    stock: 120,
    requestQty: '',
    requestByUnit: 'Bolsas'
  },
  {
    id: 3,
    name: 'MANTEQUILLA CON SAL',
    detail: 'MANTEQUILLA PURA X 1KG',
    measureQty: '1000.00 Gramo',
    stock: 45,
    requestQty: '',
    requestByUnit: 'Unidades'
  }
];

const SolicitudesAlmacen: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showOnlyZeroStock, setShowOnlyZeroStock] = useState(false);

  // Modal State
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [tableProducts, setTableProducts] = useState<RequestProduct[]>(initialMockProducts);

  const requests = [
    { warehouse: 'Panadería', dateTime: '24/10/2023 - 08:30 AM', requestedBy: 'Juan Pérez', deliveryDate: '25/10/2023', area: 'Producción', inCharge: 'Helen M.', status: 'ENTREGADO', statusColor: 'bg-green-100 text-green-700' },
    { warehouse: 'Tortas', dateTime: '24/10/2023 - 09:15 AM', requestedBy: 'Marta Gómez', deliveryDate: '24/10/2023', area: 'Repostería', inCharge: 'Carlos R.', status: 'SOLICITADO', statusColor: 'bg-red-100 text-red-700' },
    { warehouse: 'Pies', dateTime: '23/10/2023 - 14:20 PM', requestedBy: 'Luis Rojas', deliveryDate: '26/10/2023', area: 'Logística', inCharge: 'Helen M.', status: 'SOLICITADO', statusColor: 'bg-blue-100 text-blue-700' },
    { warehouse: 'Bizcochos', dateTime: '22/10/2023 - 11:45 AM', requestedBy: 'Ana Belén', deliveryDate: '23/10/2023', area: 'Producción', inCharge: 'Carlos R.', status: 'ENTREGADO', statusColor: 'bg-green-100 text-green-700' },
  ];

  const handleQtyChange = (id: number, value: string) => {
    setTableProducts(prev => prev.map(p => p.id === id ? { ...p, requestQty: value } : p));
  };

  const handleUnitChange = (id: number, value: string) => {
    setTableProducts(prev => prev.map(p => p.id === id ? { ...p, requestByUnit: value } : p));
  };

  const handleSaveRequest = () => {
    if (!selectedArea || !selectedWarehouse) {
      setSnackbar({ open: true, message: 'Por favor seleccione Área y Almacén', severity: 'error' });
      return;
    }
    const hasItems = tableProducts.some(p => p.requestQty && parseFloat(p.requestQty.toString()) > 0);
    if (!hasItems) {
      setSnackbar({ open: true, message: 'Por favor ingrese al menos una cantidad válida', severity: 'error' });
      return;
    }

    setSnackbar({ open: true, message: 'Solicitud registrada correctamente', severity: 'success' });
    setIsModalOpen(false);
    // Reset modal
    setSelectedArea(null);
    setSelectedWarehouse(null);
    setTableProducts(initialMockProducts);
  };

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex justify-between items-end mb-4 pt-6">
        <div>
          <p className="text-3xl md:text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Solicitudes de Almacén</p>
          <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">Gestione y rastree los pedidos internos de insumos entre áreas y almacenes.</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-100 shadow-sm mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Filtro Almacén</label>
            <Autocomplete
              multiple
              options={availableWarehousesList}
              renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc-50/30' } }} />}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
            <DatePicker
              value={startDate}
              onChange={(v) => setStartDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc-50/30' } } } }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Fin</label>
            <DatePicker
              value={endDate}
              onChange={(v) => setEndDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc-50/30' } } } }}
            />
          </div>
          <button className="h-10 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all shadow-lg shadow-zinc-200">
            Filtrar Solicitudes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden mb-10">
        <div className="p-8 md:p-10 border-b border-zinc-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-zinc-50/20">
          <div>
            <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.2em]">Historial Reciente</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Total de registros: 128</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-white text-[10px] font-black rounded-2xl hover:bg-primary hover:shadow-xl hover:shadow-primary/20 transition-all uppercase tracking-[0.2em]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            NUEVA SOLICITUD
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-100 w-full">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Almacén</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Fecha/Hora</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Solicitado Por</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Entrega</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Área</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Encargado</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Estado</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 text-sm">
              {requests.map((req, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/30 transition-all group">
                  <td className="px-10 py-6 text-xs font-black text-zinc-900 uppercase tracking-tight">{req.warehouse}</td>
                  <td className="px-8 py-6 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">{req.dateTime}</td>
                  <td className="px-8 py-6 text-xs font-bold text-zinc-700 uppercase tracking-tight">{req.requestedBy}</td>
                  <td className="px-8 py-6 text-[11px] font-bold text-zinc-500 uppercase tracking-tighter">{req.deliveryDate}</td>
                  <td className="px-8 py-6 text-[11px] font-black text-zinc-400 uppercase tracking-widest">{req.area}</td>
                  <td className="px-8 py-6 text-[11px] font-bold text-zinc-500 uppercase">{req.inCharge}</td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.statusColor} shadow-sm`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right space-x-3">
                    <IconButton size="small" className="text-zinc-200 hover:text-zinc-900 transition-colors"><span className="material-symbols-outlined text-lg">visibility</span></IconButton>
                    <IconButton size="small" className="text-zinc-200 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
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
                <span className="material-symbols-outlined text-xl">post_add</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Formulario Interno</p>
                <p className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Nueva Solicitud</p>
              </div>
            </div>
            <IconButton onClick={() => setIsModalOpen(false)} size="small" className="bg-zinc-50">
              <span className="material-symbols-outlined text-lg">close</span>
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Área a Solicitar</label>
              <Autocomplete
                options={availableAreas}
                value={selectedArea}
                onChange={(_, v) => setSelectedArea(v)}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar área..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Almacén Destino</label>
              <Autocomplete
                options={availableWarehousesList}
                value={selectedWarehouse}
                onChange={(_, v) => setSelectedWarehouse(v)}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar almacén..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }} />}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha de Entrega</label>
              <DatePicker
                value={deliveryDate}
                onChange={(v) => setDeliveryDate(v)}
                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '14px' } } } }}
              />
            </div>
          </div>

          <div className="bg-zinc-50/50 rounded-[2rem] border border-zinc-100 overflow-hidden">
            <div className="px-8 py-4 border-b border-zinc-100 bg-zinc-50/80 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Desglose de Productos</p>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{selectedWarehouse ? `* Mostrando stock real en ${selectedWarehouse}` : '* Seleccione un almacén para ver stock'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOnlyZeroStock(!showOnlyZeroStock)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showOnlyZeroStock ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-50'}`}
                >
                  <span className="material-symbols-outlined text-sm">{showOnlyZeroStock ? 'filter_list_off' : 'filter_list'}</span>
                  Filtrar Stock 0
                </button>
              </div>
            </div>
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-zinc-200">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-white/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100">
                    <td className="px-8 py-4">Producto</td>
                    <td className="px-8 py-4">Producto Fact</td>
                    <td className="px-8 py-4 text-center">Cant. Medida</td>
                    <td className="px-8 py-4 text-center">Stock</td>
                    <td className="px-8 py-4 text-center">Cantidad</td>
                    <td className="px-8 py-4">Solicitar Por</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 bg-white">
                  {tableProducts
                    .filter(p => !showOnlyZeroStock || p.stock === 0)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 transition-all group">
                        <td className="px-8 py-5">
                          <p className="font-black text-zinc-900 text-[11px] uppercase tracking-tight group-hover:text-primary transition-colors">{p.name}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight max-w-[200px] truncate" title={p.detail}>{p.detail}</p>
                        </td>
                        <td className="px-8 py-5 text-center font-black text-zinc-500 text-[11px]">{p.measureQty}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-zinc-100 text-zinc-900'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <input
                            type="number"
                            className={`w-24 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 text-xs font-black text-center outline-none focus:border-primary transition-all ${p.stock <= 0 ? 'opacity-30 pointer-events-none' : 'text-zinc-900'}`}
                            placeholder="0.00"
                            value={p.requestQty}
                            max={p.stock}
                            min={0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val <= p.stock) {
                                handleQtyChange(p.id, e.target.value);
                              } else {
                                handleQtyChange(p.id, p.stock.toString());
                                setSnackbar({ open: true, message: `No puede solicitar más del stock disponible (${p.stock})`, severity: 'error' });
                              }
                            }}
                          />
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {p.requestByUnit}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 4, bgcolor: 'white', borderTop: '1px solid', borderColor: 'zinc-50' }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'zinc-400', fontWeight: 900, fontSize: '10px', px: 4 }}>Cancelar</Button>
          <button
            onClick={handleSaveRequest}
            className="h-12 px-10 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 hover:bg-primary hover:shadow-primary/20 transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Enviar Solicitud
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

export default SolicitudesAlmacen;

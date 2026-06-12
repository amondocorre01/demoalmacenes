import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  TextField,
  useMediaQuery,
  useTheme,
  DialogActions,
  Zoom,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../components/common/Button';
import { showAlert } from '../../config/alerts';

interface Product {
  id: string;
  name: string;
  medida: string;
  stock: number;
  category: string;
  sku: string;
}

interface ConversionRecord {
  id: string;
  almacen: string;
  productoSaliente: string;
  medidaSalida: string;
  cantidadSalida: number;
  productoIngreso: string;
  medidaIngreso: string;
  cantidadIngreso: number;
  fechaRegistro: string;
}

interface ModalConvertirProductosProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  almacenes: { ID_PLANTA_ALMACEN: number; DESCRICION: string }[];
  onConvert: (data: {
    almacen: string;
    productoSalienteId: string;
    cantidadSalida: number;
    productoIngresoId: string;
    cantidadIngreso: number;
  }) => boolean;
  history: ConversionRecord[];
}

const ModalConvertirProductos: React.FC<ModalConvertirProductosProps> = ({
  open,
  onClose,
  products,
  almacenes,
  onConvert,
  history
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState(0);

  // Pestaña 1: Convertir Productos Form State
  const [selectedAlmacen, setSelectedAlmacen] = useState<any>(null);
  const [selectedSaliente, setSelectedSaliente] = useState<Product | null>(null);
  const [qtySalida, setQtySalida] = useState('');
  const [selectedIngreso, setSelectedIngreso] = useState<Product | null>(null);
  const [qtyIngreso, setQtyIngreso] = useState('');

  // Pestaña 2: Historial State
  const [historyAlmacen, setHistoryAlmacen] = useState<any>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [filteredHistory, setFilteredHistory] = useState<ConversionRecord[]>(history);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle conversion confirmation
  const handleConfirm = () => {
    if (!selectedAlmacen) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar un almacén para realizar la conversión.');
      return;
    }
    if (!selectedSaliente) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar el producto saliente.');
      return;
    }
    if (!qtySalida || parseFloat(qtySalida) <= 0) {
      showAlert.error('Cantidad Inválida', 'La cantidad de salida debe ser mayor a 0.');
      return;
    }
    if (parseFloat(qtySalida) > selectedSaliente.stock) {
      showAlert.error('Stock Insuficiente', `El stock de ${selectedSaliente.name} (${selectedSaliente.stock} ${selectedSaliente.medida}) es menor a la cantidad solicitada.`);
      return;
    }
    if (!selectedIngreso) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar el producto de ingreso.');
      return;
    }
    if (!qtyIngreso || parseFloat(qtyIngreso) <= 0) {
      showAlert.error('Cantidad Inválida', 'La cantidad de ingreso debe ser mayor a 0.');
      return;
    }
    if (selectedSaliente.id === selectedIngreso.id) {
      showAlert.error('Conflicto de Productos', 'El producto saliente no puede ser igual al de ingreso.');
      return;
    }

    const success = onConvert({
      almacen: selectedAlmacen.DESCRICION,
      productoSalienteId: selectedSaliente.id,
      cantidadSalida: parseFloat(qtySalida),
      productoIngresoId: selectedIngreso.id,
      cantidadIngreso: parseFloat(qtyIngreso)
    });

    if (success) {
      showAlert.success('Conversión Registrada', 'La transformación de stock se ha realizado correctamente.');
      // Reset form
      setSelectedSaliente(null);
      setQtySalida('');
      setSelectedIngreso(null);
      setQtyIngreso('');
      // Switch tab to history to view the log
      setActiveTab(1);
      // Auto trigger search to include the new one
      setFilteredHistory(history);
      setHasSearched(false);
    }
  };

  // Search history log
  const handleSearchHistory = () => {
    let result = [...history];

    if (historyAlmacen) {
      result = result.filter(h => h.almacen.toLowerCase() === historyAlmacen.DESCRICION.toLowerCase());
    }

    if (startDate) {
      result = result.filter(h => {
        const hDate = dayjs(h.fechaRegistro, 'YYYY-MM-DD');
        return hDate.isAfter(startDate.subtract(1, 'day'), 'day');
      });
    }

    if (endDate) {
      result = result.filter(h => {
        const hDate = dayjs(h.fechaRegistro, 'YYYY-MM-DD');
        return hDate.isBefore(endDate.add(1, 'day'), 'day');
      });
    }

    setFilteredHistory(result);
    setHasSearched(true);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : '12px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'
          }
        }
      }}
    >
      {/* Header bar */}
      <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'primary.light' }}>
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-lg">published_with_changes</span>
          </div>
          <div>
            <Typography variant="subtitle2" sx={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'primary.light' }}>
              Operaciones de Almacén
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '15px', letterSpacing: '0.02em', mt: 0.2 }}>
              Conversión de Productos
            </Typography>
          </div>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'white/10', color: 'white', '&:hover': { bgcolor: 'white/20' } }}>
          <CloseIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Box>

      {/* Tabs Selector */}
      {/* <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': { height: 3, bgcolor: 'primary.main' },
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.08em',
              py: 1,
              color: 'zinc.400',
              '&.Mui-selected': { color: 'zinc.900' }
            }
          }}
        >
          <Tab label="CONVERTIR PRODUCTOS" icon={<span className="material-symbols-outlined text-lg">shuffle</span>} iconPosition="start" />
          <Tab label="HISTORIAL DE REGISTROS" icon={<span className="material-symbols-outlined text-lg">history</span>} iconPosition="start" />
        </Tabs>
      </Box> */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: '#fafafa'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': {
              height: 2,
              bgcolor: 'primary.main'
            },
            '& .MuiTab-root': {
              minHeight: 36,
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.08em',
              py: 0.3,
              px: 1,
              color: 'zinc.400',
              '&.Mui-selected': {
                color: 'zinc.900'
              }
            }
          }}
        >
          <Tab
            label="CONVERTIR PRODUCTOS"
            icon={
              <span className="material-symbols-outlined text-base">
                shuffle
              </span>
            }
            iconPosition="start"
          />

          <Tab
            label="HISTORIAL DE REGISTROS"
            icon={
              <span className="material-symbols-outlined text-base">
                history
              </span>
            }
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#fafafa', minHeight: '100px' }}>
        {activeTab === 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Warehouse Select */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Seleccionar Almacén de Origen/Destino</label>
              <Autocomplete
                options={almacenes}
                getOptionLabel={(o) => o.DESCRICION}
                value={selectedAlmacen}
                onChange={(_, nv) => setSelectedAlmacen(nv)}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Elegir almacén..." variant="outlined" size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc.50/50' } }}
                  />
                )}
              />
            </div>

            {/* In & Out Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Outgoing Product */}
              <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </span>
                    <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider">PRODUCTO SALIENTE (Materia Prima)</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Seleccionar Producto</label>
                      <Autocomplete
                        options={products}
                        getOptionLabel={(o) => `${o.name} (${o.sku})`}
                        value={selectedSaliente}
                        onChange={(_, nv) => setSelectedSaliente(nv)}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Buscar por nombre o SKU..." variant="outlined" size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                          />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Stock Disponible</p>
                        <p className="text-sm font-black text-zinc-900 mt-1">
                          {selectedSaliente ? selectedSaliente.stock : 0}
                        </p>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Unidad Medida</p>
                        <p className="text-sm font-black text-zinc-500 mt-1 uppercase">
                          {selectedSaliente ? selectedSaliente.medida : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-6">
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad de Salida (A Descontar)</label>
                  <TextField
                    fullWidth
                    type="number"
                    variant="outlined"
                    value={qtySalida}
                    onChange={(e) => setQtySalida(e.target.value)}
                    placeholder="0.00"
                    InputProps={{
                      inputProps: { min: 0, step: 'any' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        '& .MuiInputBase-input': { fontWeight: '900', textAlign: 'center', fontSize: '1.25rem', color: '#be123c', py: 1.5 }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Incoming Product */}
              <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </span>
                    <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider">PRODUCTO INGRESO (Pulpa / Procesado)</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Seleccionar Producto</label>
                      <Autocomplete
                        options={products}
                        getOptionLabel={(o) => `${o.name} (${o.sku})`}
                        value={selectedIngreso}
                        onChange={(_, nv) => setSelectedIngreso(nv)}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Buscar por nombre o SKU..." variant="outlined" size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                          />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Stock Actual</p>
                        <p className="text-sm font-black text-zinc-900 mt-1">
                          {selectedIngreso ? selectedIngreso.stock : 0}
                        </p>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Unidad Medida</p>
                        <p className="text-sm font-black text-zinc-500 mt-1 uppercase">
                          {selectedIngreso ? selectedIngreso.medida : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-6">
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cantidad de Ingreso (A Agregar)</label>
                  <TextField
                    fullWidth
                    type="number"
                    variant="outlined"
                    value={qtyIngreso}
                    onChange={(e) => setQtyIngreso(e.target.value)}
                    placeholder="0.00"
                    InputProps={{
                      inputProps: { min: 0, step: 'any' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        '& .MuiInputBase-input': { fontWeight: '900', textAlign: 'center', fontSize: '1.25rem', color: '#047857', py: 1.5 }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search Filter Panel */}
            <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">Filtros de Búsqueda de Historial</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Almacén</label>
                  <Autocomplete
                    options={almacenes}
                    getOptionLabel={(o) => o.DESCRICION}
                    value={historyAlmacen}
                    onChange={(_, nv) => setHistoryAlmacen(nv)}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Todos los almacenes" variant="outlined" size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Fecha Inicial</label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Fecha Final</label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                      }
                    }}
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSearchHistory}
                    fullWidth
                    variant="primary"
                    size="sm"
                    icon="search"
                    className="h-10 rounded-xl"
                  >
                    Buscar
                  </Button>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400 border-b border-zinc-200">
                      <th className="px-6 py-4">Almacén</th>
                      <th className="px-6 py-4">Producto Saliente</th>
                      <th className="px-6 py-4 text-center">Cant. Salida</th>
                      <th className="px-6 py-4">Producto Entrante</th>
                      <th className="px-6 py-4 text-center">Cant. Ingreso</th>
                      <th className="px-6 py-4">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-zinc-300">
                            <span className="material-symbols-outlined text-4xl mb-2">find_in_page</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">
                              {hasSearched ? 'Sin registros encontrados' : 'Realice una búsqueda para ver registros'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-zinc-700 uppercase">{item.almacen}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-zinc-950 uppercase leading-none">{item.productoSaliente}</p>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.medidaSalida}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-rose-600">-{item.cantidadSalida.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-zinc-950 uppercase leading-none">{item.productoIngreso}</p>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.medidaIngreso}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-emerald-600">+{item.cantidadIngreso.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-zinc-500">{dayjs(item.fechaRegistro).format('DD-MM-YYYY')}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1, px: 3, bgcolor: 'white', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="ghost" size="sm" className="!text-zinc-500">
          Cerrar
        </Button>
        {activeTab === 0 && (
          <Button onClick={handleConfirm} variant="primary" size="sm" icon="check_circle">
            Confirmar Conversión
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalConvertirProductos;

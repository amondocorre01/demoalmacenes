import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  InputAdornment,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';

const warehouses = ['BIZCOCHOS', 'CHEESECAKE', 'ESENCIAS', 'FRUTAS', 'DECORACIONES'];

const ProductosIntermedios: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredProductName, setRegisteredProductName] = useState('');
  const [registeredProductWarehouse, setRegisteredProductWarehouse] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openModal') === 'true') {
      setIsModalOpen(true);
      setRegistrationSuccess(false);
    }
  }, [location]);

  // Form State
  const [formData, setFormData] = useState({
    warehouse: null as string | null,
    name: '',
    measureDescription: '',
    durationDays: '',
    wastePercentage: '',
    isPrimary: false,
    hasProduction: true
  });

  const products = [
    { name: 'ACHACHAIRU-RI.', adjMeasure: '1 Unidad', stdMeasure: '1 Paquete', duration: '30 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'ASAI-RF', adjMeasure: '1 Unidad', stdMeasure: '1 Unidad', duration: '180 Dias', waste: '0.00 %', status: 'INHABILITADO', statusColor: 'bg-red-100 text-red-700' },
    { name: 'ASAI-RI', adjMeasure: '1 Unidad', stdMeasure: '1 Paquete', duration: '30 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'AZUCAR DE CREMERA-RF', adjMeasure: '1 Unidad', stdMeasure: '1 Unidad', duration: '180 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'AZUCAR DE CREMERA-RI', adjMeasure: '1 Unidad', stdMeasure: '1 Paquete', duration: '30 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'AZUCAR EN SACHET RF', adjMeasure: '1 Unidad', stdMeasure: '1 Unidad', duration: '120 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'AZUCAR MORENA 1KG RI', adjMeasure: '1 Kilogramo', stdMeasure: '1 Kilogramo', duration: '180 Dias', waste: '1.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
    { name: 'AZUCAR MORENA EN SACHET-RF', adjMeasure: '1 Unidad', stdMeasure: '1 Unidad', duration: '180 Dias', waste: '0.00 %', status: 'HABILITADO', statusColor: 'bg-green-100 text-green-700' },
  ];

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRegistrationSuccess(false);
    setFormData({
      warehouse: null,
      name: '',
      measureDescription: '',
      durationDays: '',
      wastePercentage: '',
      isPrimary: false,
      hasProduction: true
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.warehouse) {
      setSnackbar({ open: true, message: 'Por favor complete los campos obligatorios', severity: 'error' });
      return;
    }
    setRegisteredProductName(formData.name.toUpperCase());
    setRegisteredProductWarehouse(formData.warehouse.toUpperCase());
    setRegistrationSuccess(true);
    setSnackbar({ open: true, message: 'Producto registrado con éxito', severity: 'success' });
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-4 md:px-0">
        <div>
          <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase leading-none">Productos Intermedios</p>
          <p className="text-zinc-500 mt-2 font-medium max-w-xl text-sm">Gestión de masas, bases y concentrados para producción final.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary active:scale-95 transition-all shadow-xl hover:shadow-primary/20 uppercase text-[10px] tracking-widest"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-4 md:px-0">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full tracking-widest uppercase">+2 hoy</span>
          </div>
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Total Productos</p>
          <p className="text-3xl font-black text-zinc-900 mt-1 uppercase">124</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Productos Activos</p>
          <p className="text-3xl font-black text-zinc-900 mt-1 uppercase">116</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            </div>
          </div>
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Productos Inactivos</p>
          <p className="text-3xl font-black text-zinc-900 mt-1 uppercase">8</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden mx-4 md:mx-0">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-100">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Nombre del Producto</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Med. Adecuación</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Med. Estándar</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Duración</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">% Desperdicio</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Estado</td>
                <td className="px-8 py-6"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 text-sm">
              {products.map((p, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/30 transition-all group">
                  <td className="px-8 py-5"><p className="font-black text-zinc-900 uppercase text-xs tracking-tight">{p.name}</p></td>
                  <td className="px-8 py-5"><span className="text-[11px] font-bold text-zinc-500 uppercase">{p.adjMeasure}</span></td>
                  <td className="px-8 py-5"><span className="text-[11px] font-bold text-zinc-500 uppercase">{p.stdMeasure}</span></td>
                  <td className="px-8 py-5"><span className="text-[11px] font-bold text-zinc-500 uppercase">{p.duration}</span></td>
                  <td className="px-8 py-5"><span className="text-[11px] font-black text-zinc-900 uppercase">{p.waste}</span></td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.statusColor} shadow-sm`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <IconButton size="small" className="text-zinc-300 hover:text-zinc-900 transition-colors">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 bg-zinc-50/30 border-t border-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mostrando {products.length} de 124 productos registrados</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all shadow-sm">Anterior</button>
            <button className="w-10 h-10 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-200">1</button>
            <button className="w-10 h-10 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all shadow-sm">2</button>
            <button className="px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all shadow-sm">Siguiente</button>
          </div>
        </div>
      </div>

      {/* New Product Modal */}
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
              bgcolor: 'zinc.50/50'
            }
          }
        }}
      >
        <DialogTitle sx={{ p: 3, px: 4, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'zinc-50' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-2xl">{registrationSuccess ? 'done_all' : 'add_box'}</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{registrationSuccess ? 'Éxito en Registro' : 'Gestión de Almacén'}</p>
                <p className="text-2xl font-black text-zinc-900 uppercase tracking-tight">
                  {registrationSuccess ? '¡Registro Completado!' : 'Nuevo Producto Intermedio'}
                </p>
              </div>
            </div>
            <IconButton onClick={handleCloseModal} size="small" className="bg-zinc-50">
              <span className="material-symbols-outlined text-lg">close</span>
            </IconButton>
          </div>
        </DialogTitle>

        <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
          {registrationSuccess ? (
            <div className="flex flex-col items-center py-6 space-y-6 animate-in zoom-in-95 duration-300 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg border-4 border-emerald-50">
                <span className="material-symbols-outlined text-4xl font-black">done_all</span>
              </div>

              <div className="space-y-1">
                <p className="text-xl font-black text-zinc-900 uppercase tracking-tight">¡Producto Creado Correctamente!</p>
                <p className="text-zinc-500 font-medium text-xs max-w-md leading-relaxed">
                  El producto intermedio <strong className="text-zinc-900 uppercase">{registeredProductName}</strong> se registró exitosamente en el almacén de destino <strong className="text-zinc-900 uppercase">{registeredProductWarehouse}</strong>.
                </p>
              </div>

              <Divider className="w-full animate-in fade-in" />

              <div className="w-full text-left space-y-4">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Pasos Siguientes</p>
                  <p className="text-xs font-black text-zinc-800 uppercase tracking-tight mt-1">¿Qué deseas realizar a continuación?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Receta Intermedia */}
                  <div 
                    onClick={() => {
                      handleCloseModal();
                      navigate('/almacen/recetas-intermedias');
                    }}
                    className="bg-white hover:bg-zinc-50 p-5 rounded-2xl border border-zinc-150 hover:border-primary shadow-sm flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-xl">kitchen</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-900 uppercase group-hover:text-primary transition-colors">Registrar Receta Intermedia</p>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight leading-normal mt-0.5">
                        Elaborar la receta intermedia para producir este concentrado o base.
                      </p>
                    </div>
                  </div>

                  {/* Receta Final */}
                  <div 
                    onClick={() => {
                      handleCloseModal();
                      navigate('/almacen/crear-receta');
                    }}
                    className="bg-white hover:bg-zinc-50 p-5 rounded-2xl border border-zinc-150 hover:border-primary shadow-sm flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-900 uppercase group-hover:text-primary transition-colors">Registrar Receta Final</p>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight leading-normal mt-0.5">
                        Definir la receta comercial final utilizando este nuevo ingrediente intermedio.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Identificación y Contexto</p>
                
                <Autocomplete
                  options={warehouses}
                  value={formData.warehouse}
                  onChange={(_, v) => setFormData({...formData, warehouse: v})}
                  renderInput={(params) => <TextField {...params} label="Almacén de Destino" size="small" required />}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />

                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="EJ. BIZCOCHO DE VAINILLA..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />

                <TextField
                  fullWidth
                  label="Descripción de Medida"
                  size="small"
                  value={formData.measureDescription}
                  onChange={(e) => setFormData({...formData, measureDescription: e.target.value})}
                  placeholder="EJ. 1 KG / 1 UNIDAD..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
              </div>

              {/* Operational Metrics Section */}
              <div className="space-y-6">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Métricas Operativas</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Duración"
                    size="small"
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><span className="text-[9px] font-black uppercase text-zinc-400">Días</span></InputAdornment>,
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                  />
                  <TextField
                    label="Desperdicio"
                    size="small"
                    type="number"
                    value={formData.wastePercentage}
                    onChange={(e) => setFormData({...formData, wastePercentage: e.target.value})}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><span className="text-[9px] font-black uppercase text-zinc-400">%</span></InputAdornment>,
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                  />
                </div>

                <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-zinc-900 uppercase">Producto Primario</p>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Habilita vinculación directa</p>
                    </div>
                    <Switch 
                      checked={formData.isPrimary} 
                      onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'primary.main' }
                      }}
                    />
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-zinc-900 uppercase">Habilitar Producción</p>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Disponible en el módulo de producción</p>
                    </div>
                    <Switch 
                      checked={formData.hasProduction} 
                      onChange={(e) => setFormData({...formData, hasProduction: e.target.checked})}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'primary.main' }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 4, bgcolor: 'white', borderTop: '1px solid', borderColor: 'zinc-50' }}>
          {registrationSuccess ? (
            <button 
              onClick={handleCloseModal}
              className="h-12 px-10 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Cerrar Asistente
            </button>
          ) : (
            <>
              <Button 
                onClick={handleCloseModal} 
                sx={{ color: 'zinc-400', fontWeight: 900, fontSize: '10px', px: 4, letterSpacing: '0.1em' }}
              >
                Cancelar
              </Button>
              <button 
                onClick={handleSave}
                className="h-12 px-10 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 hover:bg-primary hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Registrar Producto
              </button>
            </>
          )}
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

export default ProductosIntermedios;

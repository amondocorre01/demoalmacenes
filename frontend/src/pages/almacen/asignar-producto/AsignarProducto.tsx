import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/common/Button';
import { Autocomplete, TextField, Switch, Chip, Tooltip, Zoom, Typography } from '@mui/material';

interface Product {
  name: string;
  code: string;
  enabled: boolean;
  category: string;
}

const AsignarProducto: React.FC = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [products, setProducts] = useState<Product[]>([
    { name: 'HARINA ESPECIAL', code: 'MAT-001', enabled: true, category: 'MATERIA PRIMA' },
    { name: 'AZUCAR BLANCA', code: 'MAT-002', enabled: true, category: 'MATERIA PRIMA' },
    { name: 'HUEVO DE GRANJA', code: 'MAT-003', enabled: true, category: 'MATERIA PRIMA' },
    { name: 'ALMENDRA ENTERA', code: 'MAT-004', enabled: true, category: 'FRUTOS SECOS' },
    { name: 'ACEITE VEGETAL', code: 'MAT-005', enabled: true, category: 'LÍQUIDOS' },
    { name: 'POLVO DE HORNEAR', code: 'MAT-006', enabled: true, category: 'ADITIVOS' },
    { name: 'MARGARINA S/N SAL', code: 'MAT-007', enabled: true, category: 'GRASAS' },
    { name: 'ZANAHORIA FRESCA', code: 'MAT-008', enabled: true, category: 'VEGETALES' },
  ]);

  const warehouses = [
    { id: 1, name: 'BIZCOCHOS', location: 'PLANTA ALTA' },
    { id: 2, name: 'CHEESECAKE', location: 'ÁREA FRÍA' },
    { id: 3, name: 'ESENCIAS', location: 'ALMACÉN QUÍMICO' },
    { id: 4, name: 'FRUTAS', location: 'CÁMARA REFRIGERADA' },
  ];

  const totals = useMemo(() => {
    const active = products.filter(p => p.enabled).length;
    const inactive = products.filter(p => !p.enabled).length;
    return { active, inactive };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && p.enabled) ||
        (statusFilter === 'inactive' && !p.enabled);
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const toggleProduct = (idx: number) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="max-w-[2000px] mx-auto w-full animate-in fade-in duration-700 pb-20 px-4 md:px-8">
      {/* 1. Header & Workflow Guide */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-10">
        <div className="max-w-1xl">
          <p className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none mb-1">Asignación de Stock</p>
          <p className="text-zinc-500 font-bold text-sm leading-relaxed">
            Habilite o inhabilite la disponibilidad de insumos para almacenes específicos. <br />
            Siga los pasos: <span className="text-zinc-900 underline decoration-primary decoration-2 underline-offset-4">1. Seleccione Almacén</span> y <span className="text-zinc-900 underline decoration-primary decoration-2 underline-offset-4">2. Gestione Productos</span>.
          </p>
        </div>

        {/* Step 1: Warehouse Picker Card */}
        <div className="bg-white p-3 rounded-[2.5rem] border border-zinc-200 shadow-2xl shadow-zinc-200/50 min-w-[400px] flex items-center gap-5 group hover:border-primary/30 transition-all">
          <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 text-white flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-3xl">account_tree</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Paso 1: Ubicación</label>
              {selectedWarehouse && <Chip label="SELECCIONADO" size="small" sx={{ height: 16, fontSize: '7px', fontWeight: '900', bgcolor: 'emerald.50', color: 'emerald.600', borderRadius: '4px' }} />}
            </div>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.name}
              value={selectedWarehouse}
              onChange={(_, newValue) => setSelectedWarehouse(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="ELEGIR ALMACÉN..."
                  size="small"
                  variant="standard"
                  InputProps={{ ...params.InputProps, disableUnderline: true }}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '14px',
                      fontWeight: '900',
                      color: 'zinc.900',
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase'
                    }
                  }}
                />
              )}
            />
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-1 ml-1">
              {selectedWarehouse?.location || 'SELECCIONE PARA COMENZAR'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Stats & Global Filter Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
        <div
          onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`cursor-pointer p-6 rounded-[2rem] border transition-all duration-300 flex items-center gap-6 group
            ${statusFilter === 'active' ? 'bg-emerald-600 border-emerald-700 shadow-xl shadow-emerald-200 scale-[1.02]' : 'bg-white border-zinc-100 hover:border-emerald-200'}`}
        >
          <div className={`w-14 h-14 rounded-2xl ${statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-500'} flex items-center justify-center transition-all`}>
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'active' ? 'text-white/70' : 'text-zinc-400'} mb-1`}>Activos</p>
            <p className={`text-4xl font-black ${statusFilter === 'active' ? 'text-white' : 'text-zinc-900'} tracking-tighter`}>{totals.active}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
          className={`cursor-pointer p-6 rounded-[2rem] border transition-all duration-300 flex items-center gap-6 group
            ${statusFilter === 'inactive' ? 'bg-rose-600 border-rose-700 shadow-xl shadow-rose-200 scale-[1.02]' : 'bg-white border-zinc-100 hover:border-rose-200'}`}
        >
          <div className={`w-14 h-14 rounded-2xl ${statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500'} flex items-center justify-center transition-all`}>
            <span className="material-symbols-outlined text-3xl">block</span>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'inactive' ? 'text-white/70' : 'text-zinc-400'} mb-1`}>Inactivos</p>
            <p className={`text-4xl font-black ${statusFilter === 'inactive' ? 'text-white' : 'text-zinc-900'} tracking-tighter`}>{totals.inactive}</p>
          </div>
        </div>

        {/* Search Input Integrated in Stats Row */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-zinc-100 p-2 flex items-center gap-4 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300">
            <span className="material-symbols-outlined">manage_search</span>
          </div>
          <input
            type="text"
            placeholder="BUSCAR PRODUCTO O CÓDIGO ESPECÍFICO..."
            className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-zinc-900 placeholder:text-zinc-300 px-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="h-12 px-6 bg-zinc-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-2 mr-1"
            >
              Limpiar Filtro
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Product List Area */}
      <div className="bg-zinc-50/40 rounded-[3.5rem] p-8 border border-zinc-100/50">
        {!selectedWarehouse ? (
          <div className="py-40 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center mb-10">
              <span className="material-symbols-outlined text-7xl text-zinc-200">dashboard_customize</span>
            </div>
            <p className="text-xl font-black text-zinc-400 uppercase tracking-widest mb-2">Paso 2: Gestión de Disponibilidad</p>
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Por favor, seleccione un almacén en la parte superior para comenzar.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 px-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <div>
                  <Typography variant="h5" sx={{ fontWeight: '900', color: 'zinc.900', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Lista de Insumos</Typography>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mostrando registros en</span>
                    <Chip label={selectedWarehouse.name} size="small" sx={{ height: 18, fontSize: '8px', fontWeight: '900', bgcolor: 'primary.main', color: 'white' }} />
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-100 flex items-center gap-3">
                <span className="text-2xl font-black text-primary">{filteredProducts.length}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Productos <br /> Filtrados</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredProducts.map((p, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-[2.5rem] p-7 border transition-all duration-500 group flex flex-col justify-between relative overflow-hidden
                    ${p.enabled ? 'border-zinc-100 hover:border-primary/40 hover:shadow-2xl hover:shadow-zinc-200' : 'border-rose-100 bg-zinc-50/50'}`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${p.enabled ? 'bg-primary' : 'bg-rose-400'}`}></div>

                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner 
                        ${p.enabled ? 'bg-zinc-50 text-zinc-400 group-hover:bg-primary group-hover:text-white group-hover:scale-110' : 'bg-zinc-100 text-zinc-300'}`}>
                        <span className="material-symbols-outlined text-2xl">package_2</span>
                      </div>

                      <Tooltip title={p.enabled ? 'Desactivar Producto' : 'Activar Producto'} TransitionComponent={Zoom} arrow>
                        <div className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all
                          ${p.enabled ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                          <span className={`text-[7px] font-black uppercase ${p.enabled ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {p.enabled ? 'Activo' : 'Baja'}
                          </span>
                          <Switch
                            size="small"
                            checked={p.enabled}
                            onChange={() => toggleProduct(idx)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'primary.main',
                                '& + .MuiSwitch-track': { backgroundColor: 'primary.main' },
                              },
                            }}
                          />
                        </div>
                      </Tooltip>
                    </div>

                    <div className="space-y-2 mb-10">
                      <Chip label={p.category} size="small" sx={{ height: 16, fontSize: '7px', fontWeight: '900', bgcolor: 'zinc.100', color: 'zinc.500', borderRadius: '4px', mb: 1 }} />
                      <p className={`font-black uppercase text-base tracking-tight leading-tight line-clamp-2 ${p.enabled ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {p.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-zinc-300">
                <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl opacity-10">search_off</span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest mt-4">No se encontraron resultados para su búsqueda</p>
                <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="mt-6 text-primary font-black text-[10px] uppercase underline underline-offset-4">Limpiar todos los filtros</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AsignarProducto;

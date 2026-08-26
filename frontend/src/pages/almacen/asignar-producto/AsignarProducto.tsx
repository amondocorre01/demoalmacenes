/**
 * AsignarProducto.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión de asignación y disponibilidad de productos e insumos por almacén.
 *    Permite habilitar o inhabilitar insumos para almacenes específicos en vista Tarjeta o Tabla.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/almacen/activos (Listar almacenes activos)
 *    - GET /v1/configuracion/producto-almacen/:idAlmacen/productos | POST /v1/almacen/listar_productosAlmacen (Obtener productos por almacén)
 *    - POST /v1/configuracion/producto-almacen/:idAlmacen/productos | POST /v1/almacen/asignar_productoAlmacen (Asignar/actualizar estado)
 * 
 * 3. Controles Clave:
 *    - Selector autocompletable de almacén en estricto cumplimiento con las directrices de AGENTS.md.
 *    - Alternancia de vista en tarjetas cuadrícula o tabla unificada con paginación.
 *    - Controles tipo píldora segmentada (CustomSwitch) para habilitar/deshabilitar disponibilidad.
 *    - Tarjetas de métricas compactas (Low Profile Stats) con filtro interactivo.
 *    - Cumplimiento estricto de diseño y tokens de color claro/oscuro de AGENTS.md.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { useAsignarProductoServices } from './services/useAsignarProducto';

interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  UBICACION?: string;
  ESTADO?: number;
}

interface ProductItem {
  ID_PRODUCTO?: number;
  id_producto?: number;
  name: string;
  code: string;
  enabled: boolean;
  category: string;
}

// Componente de Switch Segmentado (CustomSwitch) según directrices de AGENTS.md
const CustomSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  disabled?: boolean;
}> = ({ checked, onChange, trueLabel = "SI", falseLabel = "NO", disabled }) => {
  return (
    <div className="inline-flex items-center p-0.5 bg-surface-variant/60 rounded-2xl border border-outline-variant w-28 h-8 relative select-none shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`flex-1 h-full flex items-center justify-center text-[9px] font-black uppercase rounded-[12px] transition-all duration-200 cursor-pointer ${!checked
          ? 'bg-rose-600 text-white shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface'
          }`}
      >
        {falseLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`flex-1 h-full flex items-center justify-center text-[9px] font-black uppercase rounded-[12px] transition-all duration-200 cursor-pointer ${checked
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface'
          }`}
      >
        {trueLabel}
      </button>
    </div>
  );
};

export const AsignarProducto: React.FC = () => {
  const { loadApiGetAlmacenesActivos, loadApiGetProductosAlmacen, loadApiAsignarProductosAlmacen } = useAsignarProductoServices();

  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de paginación para la vista en tabla
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Cargar almacenes activos al montar
  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoading(true);
      const res = await loadApiGetAlmacenesActivos();
      if (Array.isArray(res)) {
        setWarehouses(res);
      } else {
        setWarehouses([]);
      }
      setIsLoading(false);
    };
    fetchWarehouses();
  }, []);

  // Función para cargar productos al hacer clic en el botón de búsqueda
  const handleFetchProducts = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Selección requerida', 'Por favor, seleccione un almacén para realizar la búsqueda.');
      return;
    }

    setIsLoading(true);
    const res = await loadApiGetProductosAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
    if (Array.isArray(res)) {
      const mapped = res.map((item: any, idx: number) => ({
        ID_PRODUCTO: item.ID_PRODUCTO || item.id_producto || idx + 1,
        name: (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toUpperCase(),
        code: item.CODIGO || item.code || '',
        enabled: item.ESTADO == 1 || item.enabled === true || item.asignado === 1,
        category: (item.CATEGORIA || item.category || 'GENERAL').toUpperCase(),
      }));
      setProducts(mapped);
    } else {
      setProducts([]);
    }
    setIsLoading(false);
    setPage(1);
  };

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

  // Paginación para vista en Tabla
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const toggleProduct = async (idxInProducts: number) => {
    if (!selectedWarehouse) return;

    // Encontrar el producto objetivo independientemente de la vista
    const target = filteredProducts[idxInProducts];
    if (!target) return;

    const originalIdx = products.findIndex(p => p.ID_PRODUCTO === target.ID_PRODUCTO);
    if (originalIdx === -1) return;

    const newStatus = !target.enabled;

    // Actualización optimista en UI
    setProducts(prev => prev.map((p, i) => i === originalIdx ? { ...p, enabled: newStatus } : p));

    // Llamada a la API
    const res = await loadApiAsignarProductosAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN, {
      id_producto: target.ID_PRODUCTO,
      estado: newStatus ? 1 : 0
    });

    if (res && res.success !== false) {
      showAlert.toast(`Producto ${newStatus ? 'activado' : 'desactivado'} en el almacén.`);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0">
      <LoadingOverlay show={isLoading} message="Cargando información de asignación..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Asignación de Productos por Almacén
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestión centralizada de disponibilidad e insumos autorizados por unidad de almacén.
          </p>
        </div>
      </div>

      {/* ── Paso 1: Selector de Almacén Estandarizado (AGENTS.md) ── */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
        <div className="flex bg-surface p-3.5 rounded-2xl border border-outline-variant shadow-sm gap-3 items-end flex-col sm:flex-row flex-1">
          <div className="w-full sm:flex-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén a Configurar
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Autocomplete
                  disableClearable
                  options={warehouses}
                  getOptionLabel={(option) => option.DESCRICION || ''}
                  value={selectedWarehouse}
                  onChange={(_, newValue) => {
                    setSelectedWarehouse(newValue);
                    setProducts([]);
                    setPage(1);
                  }}
                  isOptionEqualToValue={(option, value) => option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN}
                  fullWidth
                  noOptionsText="No hay almacenes disponibles"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: 'var(--input-bg, var(--surface))',
                      color: 'var(--on-surface)',
                      padding: '3px 8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline-variant)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary)',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'var(--on-surface-variant)',
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                  )}
                />
              </div>
              <button
                type="button"
                onClick={handleFetchProducts}
                title="Buscar Productos del Almacén"
                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </div>
          </div>

          {/* {selectedWarehouse && (
            <div className="flex items-center gap-2 pb-1.5 shrink-0">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">
                ID: #{selectedWarehouse.ID_PLANTA_ALMACEN}
              </span>
              <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ● Seleccionado
              </span>
            </div>
          )} */}
        </div>
      </div>

      {/* ── Paso 2: Filtros & Estadísticas Compactas (Low Profile Stats Grid) ── */}
      {selectedWarehouse && (
        <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
          <div className="flex flex-wrap gap-3 flex-1">

            {/* Stat Activos */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`cursor-pointer px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3 text-on-surface min-w-[180px] shadow-sm ${statusFilter === 'active'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-surface border-outline-variant hover:border-emerald-500/40'
                }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                <span className="material-symbols-outlined text-base">check_circle</span>
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${statusFilter === 'active' ? 'text-white/80' : 'text-on-surface-variant'}`}>
                  Activos
                </p>
                <p className="text-base font-black mt-1 leading-none">{totals.active}</p>
              </div>
            </div>

            {/* Stat Inactivos */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
              className={`cursor-pointer px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3 text-on-surface min-w-[180px] shadow-sm ${statusFilter === 'inactive'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-surface border-outline-variant hover:border-rose-500/40'
                }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <span className="material-symbols-outlined text-base">block</span>
              </div>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${statusFilter === 'inactive' ? 'text-white/80' : 'text-on-surface-variant'}`}>
                  Inactivos
                </p>
                <p className="text-base font-black mt-1 leading-none">{totals.inactive}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Área Principal de Lista de Productos ── */}
      <div className="bg-surface rounded-2xl p-4 border border-outline-variant shadow-sm">
        {!selectedWarehouse ? (
          <div className="py-24 flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-30">account_tree</span>
            <p className="text-sm font-black uppercase tracking-widest mb-1 font-headline">Paso 2: Gestión de Disponibilidad</p>
            <p className="text-xs font-bold uppercase tracking-wider">Por favor, seleccione un almacén en el selector superior para desplegar sus insumos.</p>
          </div>
        ) : (
          <>
            {/* Header del canvas con selector de vista (Tarjetas vs Tabla) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-2 border-b border-outline-variant gap-4">
              <div className="flex flex-wrap items-center gap-1 flex-1">
                <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                <h2 className="text-base font-bold text-on-surface uppercase font-headline whitespace-nowrap">
                  Insumos Asignados a {selectedWarehouse.DESCRICION} ({filteredProducts.length})
                </h2>

                {/* Buscador Píldora de Tabla (AGENTS.md) */}
                <div className="relative group w-48 sm:w-86 ml-1">
                  <input
                    type="text"
                    placeholder="BUSCAR PRODUCTO..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-outline-variant rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-on-surface transition-all uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    search
                  </span>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant hover:text-primary cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selector de Modo de Vista (Tarjetas / Tabla) */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-variant/40 border border-outline-variant rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Vista en Tarjetas"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${viewMode === 'cards'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Vista en Tabla"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${viewMode === 'table'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">table_rows</span>
                </button>
              </div>
            </div>

            {/* ── OPCIÓN A: Vista en Tarjetas ── */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className={`bg-surface rounded-2xl p-4 border transition-all flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-md ${p.enabled
                      ? 'border-outline-variant hover:border-primary/40'
                      : 'border-rose-500/20 bg-rose-500/5'
                      }`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${p.enabled ? 'bg-emerald-600' : 'bg-rose-500'}`}></div>

                    <div>
                      <div className="flex justify-between items-start mb-4 mt-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-variant text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-xl">inventory_2</span>
                        </div>

                        {/* Switch Segmentado Reutilizable CustomSwitch */}
                        <CustomSwitch
                          checked={p.enabled}
                          onChange={() => toggleProduct(idx)}
                          trueLabel="SI"
                          falseLabel="NO"
                        />
                      </div>

                      <div className="space-y-1 mb-4">
                        <Chip
                          label={p.name}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '14px',
                            fontWeight: '900',
                            borderRadius: '4px',
                            bgcolor: 'var(--surface-variant)',
                            color: 'var(--on-surface-variant)',
                            textTransform: 'uppercase'
                          }}
                        />
                        {/* <h3 className={`font-black uppercase text-xs tracking-tight line-clamp-2 mt-1 font-headline ${p.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {p.name}
                        </h3> */}
                        {/* <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-wider block">
                          CÓDIGO: {p.code}
                        </span> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── OPCIÓN B: Vista en Tabla Unificada (AGENTS.md) ── */
              <div className="bg-surface rounded-[1rem] border border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-outline-variant">
                        <th className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">N°</th>
                        <th className="pl-4 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Insumo / Producto</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">Disponibilidad (Asignación)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {paginatedProducts.map((p, pIdx) => {
                        const globalIdx = (page - 1) * pageSize + pIdx;
                        return (
                          <tr
                            key={pIdx}
                            className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors group"
                          >
                            <td className="pl-6 pr-2 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                              <span>{globalIdx + 1}</span>
                            </td>
                            <td className="pl-4 pr-2 py-1">
                              <span className={`text-xs font-bold uppercase ${p.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>{p.name}</span>
                            </td>
                            <td className="px-6 py-1 text-right whitespace-nowrap">
                              <div className="flex justify-end">
                                <CustomSwitch
                                  checked={p.enabled}
                                  onChange={() => toggleProduct(globalIdx)}
                                  trueLabel="SI"
                                  falseLabel="NO"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination (AGENTS.md) */}
                {filteredProducts.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 border-t border-outline-variant">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          Mostrar:
                        </span>
                        <select
                          value={pageSize === filteredProducts.length ? 'all' : pageSize}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'all') {
                              setPageSize(filteredProducts.length || 999999);
                            } else {
                              setPageSize(Number(val));
                            }
                            setPage(1);
                          }}
                          className="h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-350 px-2.5 outline-none shadow-sm cursor-pointer"
                        >
                          <option value={5}>5 filas</option>
                          <option value={10}>10 filas</option>
                          <option value={20}>20 filas</option>
                          <option value={50}>50 filas</option>
                          <option value="all">Todas</option>
                        </select>
                      </div>
                      <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                        Mostrando {filteredProducts.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredProducts.length)} de {filteredProducts.length} registros
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                      </button>
                      <span className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-2">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages || totalPages === 0}
                        className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">search_off</span>
                <p className="text-xs font-black uppercase tracking-wider">No se encontraron productos coincidentes</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPage(1); }}
                  className="mt-4 text-primary font-black text-[9px] uppercase underline underline-offset-4 cursor-pointer"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AsignarProducto;

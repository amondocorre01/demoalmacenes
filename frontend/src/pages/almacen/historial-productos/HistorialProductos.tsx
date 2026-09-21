/**
 * HistorialProductos.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Auditoría, trazabilidad, control y seguimiento cronológico de los movimientos
 *    de inventario (entradas de planta, salidas directas, transferencias, adecuaciones y
 *    descuentos) en los diferentes almacenes de la empresa. Permite realizar consultas
 *    avanzadas por almacén, producto específico y rango de fechas con desglose de lotes,
 *    unidades y usuarios responsables.
 *
 * 2. APIs Utilizadas:
 *    - GET /inventario/reportes/almacenes?id_planta_almacen=0 (loadApiGetAlmacenesUsuario - Almacenes autorizados)
 *    - GET /inventario/ajustes/stock?id_planta_almacen=:id (loadApiGetProductosStockAlmacen - Catálogo y stock de productos)
 *    - GET /inventario/reportes/historial (loadApiGetHistorialInventario - Historial de movimientos filtrable)
 *
 * 3. Controles Clave:
 *    - Selectores 100% autocompletables (MUI Autocomplete) con soporte de búsqueda en tiempo real.
 *    - Botón "Buscar" estandarizado (w-10 h-10 rounded-2xl bg-primary/10) para ejecutar la consulta de movimientos.
 *    - Filtros dinámicos por almacén, catálogo de producto e intervalo de fechas (DD/MM/YYYY).
 *    - Limpieza automática de la lista al cambiar de almacén hasta presionar el botón de búsqueda.
 *    - Métricas consolidadas en tiempo real (Total Movimientos, Entradas/Ingresos, Salidas/Egresos, Productos).
 *    - Tabla unificada compacta y responsiva conforme a AGENTS.md con buscador tipo píldora en la cabecera.
 *    - Paginación dinámica parametrizable (5, 10, 20, 50 registros por página).
 *    - Botón de acción tipo icono estandarizado para inspección detallada de movimientos y lotes.
 *    - Modal de detalle de movimiento en components/ModalDetalleHistorial.tsx.
 *    - Exportación de la consulta a formato CSV.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import {
  useHistorialProductosServices,
  AlmacenItem,
  ProductoStockItem,
  HistorialInventarioItem,
} from './services/useHistorialProductos';
import { ModalDetalleHistorial } from './components/ModalDetalleHistorial';

const formatDateDisplay = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const parts = dateString.includes('T') ? dateString.split('T') : dateString.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] ? parts[1].substring(0, 8) : '';
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}${timePart ? ` ${timePart}` : ''}`;
  } catch {
    return dateString;
  }
};

const formatDateOnly = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const cleanDate = dateString.split('T')[0].split(' ')[0];
    const [year, month, day] = cleanDate.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export const HistorialProductos: React.FC = () => {
  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetProductosStockAlmacen,
    loadApiGetHistorialInventario,
  } = useHistorialProductosServices();

  // Estados principales
  const [almacenes, setAlmacenes] = useState<AlmacenItem[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<AlmacenItem | null>(null);

  const [productosCatalogo, setProductosCatalogo] = useState<ProductoStockItem[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<ProductoStockItem | null>(null);

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const [historialList, setHistorialList] = useState<HistorialInventarioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtro de tabla interno (Buscador píldora)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modales
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedMovement, setSelectedMovement] = useState<HistorialInventarioItem | null>(null);

  // 1. Cargar almacenes del usuario al montar el componente
  useEffect(() => {
    const fetchAlmacenes = async () => {
      setIsLoading(true);
      try {
        const res = await loadApiGetAlmacenesUsuario(0);
        let list: AlmacenItem[] = [];
        if (res && res.success && Array.isArray(res.datos)) {
          list = res.datos;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        setAlmacenes(list);
        if (list.length > 0) {
          const defaultAlmacen = list[0];
          setSelectedAlmacen(defaultAlmacen);
          await loadProductosDeAlmacen(defaultAlmacen.ID_PLANTA_ALMACEN);
          await fetchHistorial(defaultAlmacen.ID_PLANTA_ALMACEN, null, dayjs().startOf('month'), dayjs());
        }
      } catch {
        setAlmacenes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlmacenes();
  }, []);

  // 2. Cargar catálogo de productos según el almacén seleccionado
  const loadProductosDeAlmacen = async (idAlmacen: number) => {
    try {
      const res = await loadApiGetProductosStockAlmacen(idAlmacen);
      let list: ProductoStockItem[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && res.success && Array.isArray(res.datos)) {
        list = res.datos;
      } else if (Array.isArray(res)) {
        list = res;
      }
      setProductosCatalogo(list);
    } catch {
      setProductosCatalogo([]);
    }
  };

  // 3. Ejecutar consulta del historial con filtros
  const fetchHistorial = async (
    idAlmacenTarget?: number,
    prodTarget?: ProductoStockItem | null,
    startTarget?: Dayjs | null,
    endTarget?: Dayjs | null
  ) => {
    const idAlmacen = idAlmacenTarget ?? selectedAlmacen?.ID_PLANTA_ALMACEN;
    if (!idAlmacen) {
      showAlert.error('Almacén Requerido', 'Debe seleccionar un almacén para consultar el historial.');
      setHistorialList([]);
      return;
    }

    const prod = prodTarget !== undefined ? prodTarget : selectedProducto;
    const start = startTarget !== undefined ? startTarget : startDate;
    const end = endTarget !== undefined ? endTarget : endDate;

    const fechaInicioStr = start ? start.format('YYYY-MM-DD') : '';
    const fechaFinStr = end ? end.format('YYYY-MM-DD') : '';

    setIsLoading(true);
    try {
      const res = await loadApiGetHistorialInventario({
        id_planta_almacen: idAlmacen,
        id_producto_detalle: prod?.ID_PRODUCTO_DETALLE || 0,
        id_producto_intermedio: prod?.ID_PRODUCTO_INTERMEDIO || 0,
        fecha_inicio: fechaInicioStr,
        fecha_fin: fechaFinStr,
      });

      let list: HistorialInventarioItem[] = [];
      if (res && res.success && Array.isArray(res.datos)) {
        list = res.datos;
      } else if (res && res.success && Array.isArray(res.productos)) {
        list = res.productos;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }

      setHistorialList(list);
      setPage(1);
    } catch {
      setHistorialList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de almacén
  const handleAlmacenChange = async (newValue: AlmacenItem | null) => {
    setSelectedAlmacen(newValue);
    setSelectedProducto(null);
    setHistorialList([]);
    if (newValue) {
      await loadProductosDeAlmacen(newValue.ID_PLANTA_ALMACEN);
    } else {
      setProductosCatalogo([]);
    }
  };

  // Filtrado interno en cliente por búsqueda de texto
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return historialList;
    const query = searchQuery.toLowerCase().trim();

    return historialList.filter((item) => {
      const prod = (item.PRODUCTO || item.NOMBRE || '').toLowerCase();
      const lote = (item.LOTE || '').toLowerCase();
      const user = (item.USUARIO || item.USUARIO_REGISTRO || item.NOMBRE_USUARIO || '').toLowerCase();
      const tipo = (item.TIPO_MOVIMIENTO || item.MOTIVO || '').toLowerCase();
      const cant = String(item.CANTIDAD || item.CANTIDAD_INGRESO || item.CANTIDAD_SALIDA || '');
      const fecha = (item.FECHA_REGISTRO || '').toLowerCase();

      return (
        prod.includes(query) ||
        lote.includes(query) ||
        user.includes(query) ||
        tipo.includes(query) ||
        cant.includes(query) ||
        fecha.includes(query)
      );
    });
  }, [historialList, searchQuery]);

  // Paginación
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, page, pageSize]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    let totalEntradas = 0;
    let totalSalidas = 0;
    const productosSet = new Set<string>();

    historialList.forEach((item) => {
      const isIngreso = Number(item.ESTADO_INGRESO) === 1;
      const cant = Math.abs(Number(item.CANTIDAD || item.CANTIDAD_INGRESO || item.CANTIDAD_SALIDA || 0));

      if (isIngreso) {
        totalEntradas += cant;
      } else {
        totalSalidas += cant;
      }

      const prodName = item.PRODUCTO || item.NOMBRE;
      if (prodName) {
        productosSet.add(prodName);
      }
    });

    return {
      totalMovimientos: historialList.length,
      totalEntradas,
      totalSalidas,
      totalProductos: productosSet.size,
    };
  }, [historialList]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      showAlert.error('Sin Datos', 'No hay registros en el historial para exportar.');
      return;
    }

    const headers = [
      'N°',
      'Almacén',
      'Producto',
      'Tipo Movimiento',
      'Estado Ingreso',
      'Cantidad',
      'Cant. Utilizada',
      'Unidad Medida',
      'Lote',
      'Fecha Registro',
      'Fecha Vencimiento',
      'Responsable',
    ];

    const rows = filteredData.map((item, idx) => {
      const isIngreso = Number(item.ESTADO_INGRESO) === 1;
      const cant = Number(item.CANTIDAD || item.CANTIDAD_INGRESO || item.CANTIDAD_SALIDA || 0);
      return [
        idx + 1,
        `"${item.ALMACEN || selectedAlmacen?.DESCRICION || ''}"`,
        `"${item.PRODUCTO || item.NOMBRE || ''}"`,
        `"${item.TIPO_MOVIMIENTO || item.MOTIVO || (isIngreso ? 'Entrada' : 'Salida')}"`,
        `"${isIngreso ? 'Ingreso' : 'Salida'}"`,
        cant,
        Number(item.CANTIDAD_UTILIZADA || 0),
        `"${item.UNIDAD_MEDIDA || ''}"`,
        `"${item.LOTE || ''}"`,
        `"${formatDateDisplay(item.FECHA_REGISTRO)}"`,
        `"${formatDateOnly(item.FECHA_VENCIMIENTO)}"`,
        `"${item.NOMBRE_USUARIO || item.USUARIO_REGISTRO || item.USUARIO || ''}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Historial_Inventario_${selectedAlmacen?.DESCRICION || 'Almacen'}_${dayjs().format('YYYYMMDD_HHmm')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.success('Exportación Exitosa', 'El archivo CSV ha sido generado correctamente.');
  };

  const handleOpenDetail = (item: HistorialInventarioItem) => {
    setSelectedMovement(item);
    setIsDetailModalOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-12 transition-colors">
        <LoadingOverlay isLoading={isLoading} message="Consultando historial de inventario..." />

        {/* ── Encabezado Principal ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
              HISTORIAL DE PRODUCTOS EN ALMACÉN
            </h1>
            <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
              Control cronológico, trazabilidad de movimientos y auditoría de entradas y salidas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon="download"
              onClick={handleExportCSV}
              disabled={filteredData.length === 0}
              className="!h-10 !px-6 shadow-lg shadow-primary/20 shrink-0"
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* ── Barra Superior de Filtros con MUI Autocomplete ── */}
        <div className="bg-surface dark:bg-zinc-900 p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
            {/* 1. Selector de Almacén */}
            <div className="w-full lg:w-1/4 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Seleccionar Almacén
              </label>
              <Autocomplete
                options={almacenes}
                getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
                value={selectedAlmacen}
                onChange={(_, newValue) => handleAlmacenChange(newValue)}
                isOptionEqualToValue={(option, value) =>
                  option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                }
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
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="SELECCIONAR ALMACÉN..."
                  />
                )}
              />
            </div>

            {/* 2. Selector de Producto / Insumo */}
            <div className="w-full lg:w-1/4 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Producto / Insumo (Opcional)
              </label>
              <Autocomplete
                options={productosCatalogo}
                getOptionLabel={(option) => option.PRODUCTO || option.NOMBRE || ''}
                value={selectedProducto}
                onChange={(_, newValue) => {
                  setSelectedProducto(newValue);
                  setHistorialList([]);
                }}
                isOptionEqualToValue={(option, value) => {
                  if (option.ID_PRODUCTO_DETALLE && value?.ID_PRODUCTO_DETALLE) {
                    return option.ID_PRODUCTO_DETALLE === value.ID_PRODUCTO_DETALLE;
                  }
                  if (option.ID_PRODUCTO_INTERMEDIO && value?.ID_PRODUCTO_INTERMEDIO) {
                    return option.ID_PRODUCTO_INTERMEDIO === value.ID_PRODUCTO_INTERMEDIO;
                  }
                  return option.ID_PRODUCTO === value?.ID_PRODUCTO;
                }}
                fullWidth
                noOptionsText="No hay productos disponibles"
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
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="TODOS LOS PRODUCTOS..."
                  />
                )}
              />
            </div>

            {/* 3. Fecha Inicio */}
            <div className="w-full lg:w-1/5 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Fecha Inicio
              </label>
              <DatePicker
                value={startDate}
                onChange={(newVal) => {
                  setStartDate(newVal);
                  setHistorialList([]);
                }}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
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
                        },
                      },
                    },
                  },
                }}
              />
            </div>

            {/* 4. Fecha Fin */}
            <div className="w-full lg:w-1/5 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Fecha Fin
              </label>
              <DatePicker
                value={endDate}
                onChange={(newVal) => {
                  setEndDate(newVal);
                  setHistorialList([]);
                }}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
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
                        },
                      },
                    },
                  },
                }}
              />
            </div>

            {/* 5. Botón de Búsqueda Estandarizado */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => fetchHistorial()}
                title="Buscar Historial"
                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Tarjetas de Métricas Consolidadas ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface dark:bg-zinc-900 p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">format_list_numbered</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Total Movimientos
              </p>
              <h3 className="text-xl font-black text-on-surface dark:text-zinc-100 tracking-tight leading-none">
                {metrics.totalMovimientos.toLocaleString('es-ES')}
              </h3>
            </div>
          </div>

          <div className="bg-surface dark:bg-zinc-900 p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Total Entradas / Ingresos
              </p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                +{metrics.totalEntradas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-surface dark:bg-zinc-900 p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_down</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Total Salidas / Egresos
              </p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                -{metrics.totalSalidas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-surface dark:bg-zinc-900 p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">category</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Variedad de Productos
              </p>
              <h3 className="text-xl font-black text-on-surface dark:text-zinc-100 tracking-tight leading-none">
                {metrics.totalProductos.toLocaleString('es-ES')}
              </h3>
            </div>
          </div>
        </div>

        {/* ── Main Data Canvas (Tabla Unificada y Compacta) ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Cabecera interna con buscador píldora */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">manage_search</span>
              </div>
              <span className="text-xs font-black uppercase text-on-surface dark:text-zinc-100 tracking-wider">
                Movimientos de Inventario ({filteredData.length})
              </span>
            </div>

            <div className="relative group w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="BUSCAR MOVIMIENTO..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none"
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-sm">
                search
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    N°
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Producto / Insumo
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                    Tipo / Estado
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">
                    Cant. Operada
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">
                    Cant. Utilizada
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                    Lote
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Fecha Registro
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60 text-xs">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">
                        inventory_2
                      </span>
                      <p className="text-xs font-black uppercase tracking-widest">
                        {isLoading
                          ? 'Cargando movimientos...'
                          : 'No se encontraron registros en el historial para los filtros seleccionados'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => {
                    const globalIdx = (page - 1) * pageSize + idx + 1;
                    const isIngreso = Number(item.ESTADO_INGRESO) === 1;
                    const cantVal = Math.abs(
                      Number(item.CANTIDAD || item.CANTIDAD_INGRESO || item.CANTIDAD_SALIDA || 0)
                    );
                    const cantUsed = Number(item.CANTIDAD_UTILIZADA || 0);

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* 1. N° */}
                        <td className="pl-6 pr-2 py-2.5 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                          <span>{globalIdx}</span>
                        </td>

                        {/* 2. Producto / Insumo */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isIngreso
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isIngreso ? 'arrow_downward' : 'arrow_upward'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <span className="font-black text-on-surface dark:text-zinc-100 uppercase block truncate max-w-[280px]">
                                {item.PRODUCTO || item.NOMBRE || 'SIN DESCRIPCIÓN'}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                                {item.PRESENTACION || item.UNIDAD_MEDIDA || 'UNIDAD'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Tipo / Estado */}
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isIngreso
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                              }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isIngreso ? 'login' : 'logout'}
                            </span>
                            {item.TIPO_MOVIMIENTO || item.MOTIVO || (isIngreso ? 'Entrada' : 'Salida')}
                          </span>
                        </td>

                        {/* 4. Cantidad Operada */}
                        <td className="px-4 py-2.5 text-right font-black whitespace-nowrap">
                          <span
                            className={
                              isIngreso
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isIngreso ? '+' : '-'}
                            {cantVal.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 ml-1 uppercase">
                            {item.UNIDAD_MEDIDA || ''}
                          </span>
                        </td>

                        {/* 5. Cantidad Utilizada */}
                        <td className="px-4 py-2.5 text-right font-bold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          <span>
                            {cantUsed.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* 6. Lote */}
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-[10px] uppercase">
                            {item.LOTE || 'S/L'}
                          </span>
                        </td>

                        {/* 7. Fecha Registro */}
                        <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 text-xs font-medium whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface dark:text-zinc-200">
                              {formatDateOnly(item.FECHA_REGISTRO)}
                            </span>
                            <span className="text-[9px] text-zinc-400">
                              {item.FECHA_REGISTRO?.includes('T')
                                ? item.FECHA_REGISTRO.split('T')[1]?.substring(0, 8)
                                : item.FECHA_REGISTRO?.includes(' ')
                                  ? item.FECHA_REGISTRO.split(' ')[1]
                                  : ''}
                            </span>
                          </div>
                        </td>

                        {/* 8. Responsable */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[8px] font-black uppercase">
                              {(item.NOMBRE_USUARIO || item.USUARIO_REGISTRO || item.USUARIO || 'U')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate max-w-[130px]">
                              {item.NOMBRE_USUARIO || item.USUARIO_REGISTRO || item.USUARIO || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* 9. Botón Acción Estandarizado */}
                        <td className="px-6 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            title="Ver Detalle del Movimiento"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px] sm:text-base">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table Footer / Pagination ── */}
          {!isLoading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Mostrar:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-350 px-2.5 outline-none shadow-sm cursor-pointer"
                  >
                    <option value={5}>5 filas</option>
                    <option value={10}>10 filas</option>
                    <option value={20}>20 filas</option>
                    <option value={50}>50 filas</option>
                  </select>
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Mostrando {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-
                  {Math.min(page * pageSize, totalItems)} de {totalItems} registros
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                </button>
                <span className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal de Detalle de Movimiento ── */}
        <ModalDetalleHistorial
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          movement={selectedMovement}
          warehouseName={selectedAlmacen?.DESCRICION}
        />
      </div>
    </LocalizationProvider>
  );
};

export default HistorialProductos;

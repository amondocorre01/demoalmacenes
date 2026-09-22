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
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf, TableColumnConfig } from '../../../utils/exportTableHelper';

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

// Utilidades para cálculo y formato de unidades de medida y adecuación
const getMedidaStd = (CANTIDAD: any, MEDIDA: any) => {
  if (!MEDIDA) return '';
  if (Number(CANTIDAD) > 1) {
    const lastChar = MEDIDA.slice(-1);
    const vowels = 'aeiouAEIOUáéíóúÁÉÍÓÚ';
    return vowels.indexOf(lastChar) !== -1 ? `${MEDIDA}s` : `${MEDIDA}es`;
  }
  return MEDIDA;
};

const getMedidaAdec = (CANTIDAD: any, MEDIDA: any, MEDIDA_A: any) => {
  if (MEDIDA && MEDIDA_A && MEDIDA !== MEDIDA_A && Number(CANTIDAD) > 0) {
    return ` Cada ${MEDIDA} de ${CANTIDAD} ${getMedidaStd(CANTIDAD, MEDIDA_A)}`;
  }
  return '';
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
      const prod = (item.PRODUCTO || item.PRODUCTO_DETALLE || item.NOMBRE || '').toLowerCase();
      const lote = (item.LOTE || '').toLowerCase();
      const user = (item.USUARIO || item.USUARIO_REGISTRO || item.USUARIO_REGISTRA || item.NOMBRE_USUARIO || '').toLowerCase();
      const tipo = (item.TIPO_MOVIMIENTO || item.MOTIVO || '').toLowerCase();
      const desc = (item.DESCRICION || '').toLowerCase();
      const cant = String(item.CANTIDAD || item.CANTIDAD_INGRESO || item.CANTIDAD_SALIDA || '');
      const fecha = (item.FECHA_REGISTRO || '').toLowerCase();

      return (
        prod.includes(query) ||
        lote.includes(query) ||
        user.includes(query) ||
        tipo.includes(query) ||
        desc.includes(query) ||
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

      const prodName = item.PRODUCTO || item.PRODUCTO_DETALLE || item.NOMBRE;
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

  const exportColumns: TableColumnConfig[] = [
    { header: 'N°', width: 45, align: 'center', type: 'number' },
    { header: 'Almacén', width: 140, align: 'left' },
    { header: 'Producto / Insumo', width: 220, align: 'left' },
    { header: 'Tipo Movimiento', width: 120, align: 'center' },
    { header: 'Cant. Ingreso', width: 90, align: 'right', type: 'number' },
    { header: 'Cant. Utilizada', width: 90, align: 'right', type: 'number' },
    { header: 'Cant. Disponible', width: 95, align: 'right', type: 'number' },
    { header: 'U. Medida', width: 70, align: 'center' },
    { header: 'Adecuación', width: 100, align: 'center' },
    { header: 'Lote', width: 90, align: 'center' },
    { header: 'Fecha Registro', width: 110, align: 'center' },
    { header: 'Fecha Vencimiento', width: 110, align: 'center' },
    { header: 'Usuario Responsable', width: 160, align: 'left' },
    { header: 'Descripción / Motivo', width: 200, align: 'left' },
  ];

  const getExportData = () => {
    return filteredData.map((item, idx) => {
      const isIngreso = Number(item.ESTADO_INGRESO) === 1;
      const cantIngreso = Number(item.CANTIDAD_INGRESO || (isIngreso ? item.CANTIDAD : 0) || 0);
      const cantUtilizada = Number(item.CANTIDAD_UTILIZADA || 0);
      const cantDisponible = item.CANTIDAD_DISPONIBLE !== undefined
        ? Number(item.CANTIDAD_DISPONIBLE)
        : Math.max(0, cantIngreso - cantUtilizada);

      const unidadMedida = item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA || '';
      const unidadMedidaAdec = item.UNIDAD_MEDIDA_A || '';
      const cantAdec = item.CANTIDAD_ADECUACION || '';
      const infoAdec = cantAdec ? `${cantAdec} ${unidadMedidaAdec}`.trim() : (item.PRESENTACION || '-');

      return [
        idx + 1,
        item.ALMACEN || selectedAlmacen?.DESCRICION || '-',
        item.PRODUCTO || item.PRODUCTO_DETALLE || item.NOMBRE || '-',
        item.TIPO_MOVIMIENTO || item.MOTIVO || (isIngreso ? 'Entrada' : 'Salida'),
        cantIngreso,
        cantUtilizada,
        cantDisponible,
        unidadMedida,
        infoAdec,
        item.LOTE || '-',
        formatDateDisplay(item.FECHA_REGISTRO),
        formatDateOnly(item.FECHA_VENCIMIENTO),
        item.NOMBRE_USUARIO || item.USUARIO_REGISTRO || item.USUARIO_REGISTRA || item.USUARIO || '-',
        item.DESCRICION || '-',
      ];
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'TODOS';
    const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
    const ff = endDate ? endDate.format('DD/MM/YYYY') : '';

    exportTableToExcel({
      title: 'HISTORIAL DE PRODUCTOS EN ALMACÉN',
      subtitle: `ALMACÉN: ${alm}   |   RANGO: ${fi} AL ${ff}   |   PRODUCTO: ${selectedProduct?.PRODUCTO || 'TODOS'}`,
      filename: `historial_${alm.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}`,
      columns: exportColumns,
      data,
    });
  };

  const handleExportPdf = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'TODOS';
    const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
    const ff = endDate ? endDate.format('DD/MM/YYYY') : '';

    exportTableToPdf({
      title: 'HISTORIAL DE PRODUCTOS EN ALMACÉN',
      subtitle: `ALMACÉN: ${alm}   |   RANGO: ${fi} AL ${ff}   |   PRODUCTO: ${selectedProduct?.PRODUCTO || 'TODOS'}`,
      columns: exportColumns,
      data,
    });
  };

  const handleOpenDetail = (item: HistorialInventarioItem) => {
    setSelectedMovement(item);
    setIsDetailModalOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <div className="max-w-[1600px] mx-auto w-full space-y-5 pb-12 transition-colors">
        <LoadingOverlay show={isLoading} message="Consultando historial de inventario..." />

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
            <ExportTableButtons
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              disabled={filteredData.length === 0}
            />
          </div>
        </div>

        {/* ── Barra Superior de Filtros con MUI Autocomplete ── */}
        <div className="bg-surface dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3.5 sm:gap-4">
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
            <div className="w-full lg:w-1/3 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Producto / Insumo (Opcional)
              </label>
              <Autocomplete
                options={productosCatalogo}
                getOptionLabel={(option) => option.PRODUCTO_DETALLE || option.PRODUCTO || option.NOMBRE || ''}
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
            <div className="w-full lg:w-1/6 space-y-1.5">
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
            <div className="w-full lg:w-1/6 space-y-1.5">
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
            <div className="flex items-center justify-end pb-0.5">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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

          <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Total Ingresos
              </p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                +{metrics.totalEntradas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">trending_down</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Total Utilizado
              </p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                -{metrics.totalSalidas.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">category</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Variedad Productos
              </p>
              <h3 className="text-xl font-black text-on-surface dark:text-zinc-100 tracking-tight leading-none">
                {metrics.totalProductos.toLocaleString('es-ES')}
              </h3>
            </div>
          </div>
        </div>

        {/* ── Main Data Canvas (Tabla Unificada y Compacta) ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Cabecera Superior del Producto Seleccionado */}
          {selectedProducto ? (
            <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest block font-headline">
                    Historial del Producto
                  </span>
                  <div className="text-xs sm:text-sm font-black text-on-surface dark:text-zinc-100 uppercase tracking-tight">
                    <strong>{(selectedProducto.PRODUCTO_DETALLE || selectedProducto.NOMBRE || selectedProducto.PRODUCTO) + ' '}</strong>
                    <span className="text-primary font-bold">
                      {'en: ' + getMedidaStd(2, selectedProducto.UNIDAD_MEDIDA_E || selectedProducto.UNIDAD_MEDIDA)}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300 font-semibold ml-1">
                      {getMedidaAdec(
                        selectedProducto.CANTIDAD_ADECUACION,
                        selectedProducto.UNIDAD_MEDIDA_E || selectedProducto.UNIDAD_MEDIDA,
                        selectedProducto.UNIDAD_MEDIDA_A
                      ) + '.'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedProducto.STOCK !== undefined && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Stock Actual:
                  </span>
                  <span className="text-xs font-black text-primary">
                    {Number(selectedProducto.STOCK).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    {selectedProducto.UNIDAD_MEDIDA_E || selectedProducto.UNIDAD_MEDIDA || 'UND'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-50/60 dark:bg-zinc-850/40 border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Visualización General de Historial en Almacén ({selectedAlmacen?.DESCRICION || 'Todos los Almacenes'})
              </span>
            </div>
          )}

          {/* Cabecera interna con buscador píldora */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">manage_search</span>
              </div>
              <span className="text-xs font-black uppercase text-on-surface dark:text-zinc-100 tracking-wider">
                Registros de Movimiento ({filteredData.length})
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
                placeholder="BUSCAR EN TABLA..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3.5 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-zinc-400 text-sm">
                search
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pl-4 pr-1 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap w-8">
                    N°
                  </th>
                  {!selectedProducto && (
                    <th className="px-2.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      Producto
                    </th>
                  )}
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                    <div className="leading-tight">
                      <span>CANT.</span>
                      <span className="block">INGRESO</span>
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                    <div className="leading-tight">
                      <span>CANT.</span>
                      <span className="block">UTILIZADA</span>
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                    <div className="leading-tight">
                      <span>CANT.</span>
                      <span className="block">DISPONIBLE</span>
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                    Medida
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                    <div className="leading-tight">
                      <span>CANT. MEDIDA</span>
                      <span className="block">/ UNIDAD</span>
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                    <div className="leading-tight">
                      <span>FECHA</span>
                      <span className="block">REGISTRO</span>
                    </div>
                  </th>
                  <th className="px-2 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                    <div className="leading-tight">
                      <span>FECHA</span>
                      <span className="block">VENC.</span>
                    </div>
                  </th>
                  <th className="px-2.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    Usuario
                  </th>
                  <th className="px-2.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    Descripción
                  </th>
                  <th className="pr-4 pl-1 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap w-12">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60 text-xs">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={selectedProducto ? 11 : 12} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
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
                  paginatedData.map((item: any, idx) => {
                    const globalIdx = (page - 1) * pageSize + idx + 1;
                    const isIngreso = Number(item.ESTADO_INGRESO) === 1;

                    // Cantidad Ingreso
                    const cantIngreso = Number(
                      item.CANTIDAD || (isIngreso ? item.CANTIDAD : 0) || 0
                    );

                    // Cantidad Utilizada
                    const cantUtilizada = Number(item.CANTIDAD_UTILIZADA || 0);

                    // Cantidad Disponible
                    const cantDisponible = item.CANTIDAD_DISPONIBLE !== undefined
                      ? Number(item.CANTIDAD_DISPONIBLE)
                      : Math.max(0, cantIngreso - cantUtilizada);

                    // Medida principal
                    const unidadMedida = item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA || '-';

                    // Cantidad Medida / Unidad Medida (adecuación o presentación)
                    const cantAdec = item.CANTIDAD_ADECUACION;
                    const unidadAdec = item.UNIDAD_MEDIDA_A;

                    // Fechas
                    const fechaReg = item.FECHA_REGISTRO;
                    const fechaVenc = item.FECHA_VENCIMIENTO;

                    // Usuario y Descripción
                    const usuarioNombre = item.NOMBRE_USUARIO || item.USUARIO_REGISTRA || item.USUARIO_REGISTRO || item.USUARIO || 'N/A';
                    const descripcionTxt = item.DESCRICION || item.TIPO_MOVIMIENTO || item.MOTIVO || '-';

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* 1. N° */}
                        <td className="pl-4 pr-1 py-2 font-black text-xs text-primary text-center tracking-tight whitespace-nowrap">
                          <span>{globalIdx}</span>
                        </td>

                        {/* Producto (solo si no hay filtro de producto único) */}
                        {!selectedProducto && (
                          <td className="px-2.5 py-2">
                            <span className="font-black text-on-surface dark:text-zinc-100 uppercase block whitespace-normal break-words leading-tight max-w-[180px]">
                              {item.PRODUCTO || item.PRODUCTO_DETALLE || item.NOMBRE || 'SIN DESCRIPCIÓN'}
                            </span>
                          </td>
                        )}

                        {/* 2. Cantidad Ingreso */}
                        <td className="px-2 py-2 text-right font-black whitespace-nowrap">
                          <span className={cantIngreso > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                            {cantIngreso > 0 ? `+${cantIngreso.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
                          </span>
                        </td>

                        {/* 3. Cantidad Utilizada */}
                        <td className="px-2 py-2 text-right font-black whitespace-nowrap">
                          <span className={cantUtilizada > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}>
                            {cantUtilizada > 0 ? `-${cantUtilizada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
                          </span>
                        </td>

                        {/* 4. Cantidad Disponible */}
                        <td className="px-2 py-2 text-right font-black whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] ${cantDisponible > 0
                            ? 'bg-primary/10 text-primary dark:text-red-400 font-black'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            }`}>
                            {cantDisponible.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* 5. Medida */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-[10px] uppercase">
                            {unidadMedida}
                          </span>
                        </td>

                        {/* 6. Cantidad Medida / Unidad Medida */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {cantAdec && Number(cantAdec) > 0 ? (
                            <div className="flex flex-col items-center leading-tight">
                              <span className="font-black text-xs text-on-surface dark:text-zinc-100">
                                {Number(cantAdec).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                                {unidadAdec || unidadMedida || ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                              {item.PRESENTACION || '-'}
                            </span>
                          )}
                        </td>

                        {/* 7. Fecha Registro */}
                        <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400 text-xs text-center whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-on-surface dark:text-zinc-200 leading-tight">
                              {formatDateOnly(fechaReg)}
                            </span>
                            <span className="text-[9px] text-zinc-400 leading-none mt-0.5">
                              {fechaReg?.includes('T')
                                ? fechaReg.split('T')[1]?.substring(0, 8)
                                : fechaReg?.includes(' ')
                                  ? fechaReg.split(' ')[1]?.substring(0, 8)
                                  : ''}
                            </span>
                          </div>
                        </td>

                        {/* 8. Fecha Vencimiento */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400">
                            {formatDateOnly(fechaVenc)}
                          </span>
                        </td>

                        {/* 9. Usuario */}
                        <td className="px-2.5 py-2">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase block whitespace-normal break-words leading-tight max-w-[120px]">
                            {usuarioNombre}
                          </span>
                        </td>

                        {/* 10. Descripción */}
                        <td className="px-2.5 py-2">
                          <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 uppercase block whitespace-normal break-words leading-tight max-w-[180px]">
                            {descripcionTxt}
                          </span>
                        </td>

                        {/* 11. Acciones */}
                        <td className="pr-4 pl-1 py-2 text-center whitespace-nowrap">
                          {item.DETALLE?.length > 0 ? (
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
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 text-xs font-black">-</span>
                          )}
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 sm:p-4 border-t border-zinc-100 dark:border-zinc-800/80">
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

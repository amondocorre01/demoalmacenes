/**
 * InventarioAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, control y monitoreo en tiempo real del inventario y existencias
 *    de materias primas, insumos y productos intermedios por almacén de la planta.
 *    Permite alternar entre productos activos (agrupados por fecha o por producto)
 *    y productos vencidos, distinguir en columna dedicada entre insumos y productos
 *    intermedios, visualizar cantidades de adecuación por unidad de medida, realizar
 *    conversiones y exportar reportes completos a Excel y PDF.
 *
 * 2. APIs Utilizadas:
 *    - GET /inventario/reportes/almacenes?id_planta_almacen=0 (loadApiGetAlmacenesUsuario - Almacenes autorizados)
 *    - GET /inventario/reportes/:idAlmacen/inventario?tipo_group=1|2 (loadApiGetInventarioAlmacen - Stock por fecha [1] o por producto [2])
 *    - GET /inventario/rep-desp/productos-vencidos?almacenes=X (loadApiGetProductosVencidos - Monitoreo de productos vencidos)
 *    - GET /inventario/reportes/:idAlmacen/productos (loadApiGetProductosAlmacen - Catálogo para conversión)
 *    - GET /inventario/reportes/:idAlmacen/productos-especiales (loadApiGetProductosEspeciales - Productos especiales de ingreso)
 *    - POST /inventario/reportes/:idAlmacen/depreciar (loadApiDepreciarProducto - Registrar conversión)
 *    - GET /inventario/reportes/:idAlmacen/depreciados (loadApiGetProductosDepreciados - Historial de transformaciones)
 *
 * 3. Controles Clave:
 *    - Selector de Almacén autocomputable con MUI Autocomplete y búsqueda en tiempo real.
 *    - Selector de Tipo de Consulta: "Activos" vs "Vencidos".
 *    - Selector dinámico de "Tipo de Agrupación" visible únicamente en modo "Activos" (1: Por Fecha, 2: Por Producto).
 *    - Cabeceras de tabla con división inteligente multilínea (función renderHeaderTitle).
 *    - Columna dedicada para clasificar "TIPO PRODUCTO" (INSUMO vs INTERMEDIO).
 *    - Columna "Cantidad Medida" formateada con la cantidad arriba y la unidad de medida (UNIDAD_MEDIDA_A) debajo.
 *    - Visualización u ocultación condicional de la columna "F. Vencimiento" según el tipo de agrupación.
 *    - Consulta automática y bajo demanda con botón "Buscar" estandarizado (lupa roja primario).
 *    - Tarjetas de métricas adaptadas dinámicamente según el tipo de consulta.
 *    - Tabla compacta y responsiva conforme a AGENTS.md con buscador tipo píldora y paginación.
 *    - Modal de inspección de ingresos y lotes con detalle desglosado.
 *    - Exportación a Excel y PDF con parametrización de filtros y columnas activas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Autocomplete, TextField } from '@mui/material';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import {
  useInventarioAlmacenesServices,
  AlmacenItem,
  InventarioItem,
} from './services/useInventarioAlmacen';
import { ModalConvertirProductos } from './components/ModalConvertirProductos';
import { ModalDetalleLotes } from './components/ModalDetalleLotes';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf, TableColumnConfig } from '../../../utils/exportTableHelper';

interface TipoProductoOption {
  id: 'ACTIVOS' | 'VENCIDOS';
  label: string;
}

interface TipoAgrupacionOption {
  id: number;
  label: string;
}

const TIPO_PRODUCTO_OPTIONS: TipoProductoOption[] = [
  { id: 'ACTIVOS', label: 'ACTIVOS' },
  { id: 'VENCIDOS', label: 'VENCIDOS' },
];

const TIPO_AGRUPACION_OPTIONS: TipoAgrupacionOption[] = [
  { id: 1, label: 'POR FECHA' },
  { id: 2, label: 'POR PRODUCTO' },
];

export const InventarioAlmacen: React.FC = () => {
  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetInventarioAlmacen,
    loadApiGetProductosVencidos,
  } = useInventarioAlmacenesServices();

  // Estados principales
  const [almacenes, setAlmacenes] = useState<AlmacenItem[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<AlmacenItem | null>(null);
  const [inventarioList, setInventarioList] = useState<InventarioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros superiores autocompletables
  const [selectedTipoProducto, setSelectedTipoProducto] = useState<TipoProductoOption>(TIPO_PRODUCTO_OPTIONS[0]);
  const [selectedTipoAgrupacion, setSelectedTipoAgrupacion] = useState<TipoAgrupacionOption>(TIPO_AGRUPACION_OPTIONS[0]);

  // Filtro de tabla interno (Buscador píldora)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modales
  const [isConversionModalOpen, setIsConversionModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventarioItem | null>(null);

  // Helper para dividir títulos de cabecera si tienen 2 o más palabras
  const renderHeaderTitle = (title: string, align: 'left' | 'center' | 'right' = 'left') => {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
      return <span>{title}</span>;
    }
    const alignClass =
      align === 'right'
        ? 'items-end text-right'
        : align === 'center'
          ? 'items-center text-center'
          : 'items-start text-left';

    return (
      <div className={`flex flex-col ${alignClass} leading-tight`}>
        <span>{words[0]}</span>
        <span>{words.slice(1).join(' ')}</span>
      </div>
    );
  };

  // 1. Cargar almacenes del usuario al montar el componente
  const fetchAlmacenes = async () => {
    setIsLoading(true);
    try {
      const res = await loadApiGetAlmacenesUsuario(0);
      let list: AlmacenItem[] = [];
      if (res && res.success && Array.isArray(res.datos)) {
        list = res.datos;
      } else if (res && res.success && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }

      setAlmacenes(list);
      if (list.length > 0) {
        setSelectedAlmacen(list[0]);
        await fetchInventario(list[0].ID_PLANTA_ALMACEN, selectedTipoProducto, selectedTipoAgrupacion);
      }
    } catch {
      setAlmacenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Cargar inventario del almacén seleccionado según tipo (Activos vs Vencidos)
  const fetchInventario = async (
    idAlmacen?: number,
    tipoProd = selectedTipoProducto,
    tipoAgrup = selectedTipoAgrupacion
  ) => {
    const targetId = idAlmacen || selectedAlmacen?.ID_PLANTA_ALMACEN;
    if (!targetId) {
      showAlert.error('Selección Requerida', 'Debe seleccionar un almacén para consultar el inventario.');
      setInventarioList([]);
      return;
    }

    setIsLoading(true);
    try {
      if (tipoProd.id === 'VENCIDOS') {
        // Llamada a la API de productos vencidos
        const res = await loadApiGetProductosVencidos(targetId);
        let list: any[] = [];
        if (res && res.success && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && res.success && Array.isArray(res.datos)) {
          list = res.datos;
        } else if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        }

        const mappedList: InventarioItem[] = list.map((item) => ({
          ...item,
          ID_PRODUCTO: item.ID_PRODUCTO || item.ID_PRODUCTO_DETALLE || 0,
          PRODUCTO: item.PRODUCTO || item.NOMBRE || 'Producto sin nombre',
          CANTIDAD: item.CANTIDAD !== undefined ? item.CANTIDAD : (item.STOCK !== undefined ? Number(item.STOCK) : 0),
          STOCK: item.CANTIDAD !== undefined ? item.CANTIDAD : (item.STOCK !== undefined ? item.STOCK : 0),
          UNIDAD_MEDIDA: item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA || 'UND',
          ESTADO: 'VENCIDO',
        }));

        setInventarioList(mappedList);
      } else {
        // Llamada a la API de productos activos con tipo_group (1: Por fecha, 2: Por producto)
        const res = await loadApiGetInventarioAlmacen(targetId, tipoAgrup.id);
        let list: any[] = [];
        if (res && res.success && Array.isArray(res.datos)) {
          list = res.datos;
        } else if (res && res.success && Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        const mappedList: InventarioItem[] = list.map((item) => ({
          ...item,
          CANTIDAD: item.CANTIDAD !== undefined ? item.CANTIDAD : (item.STOCK !== undefined ? Number(item.STOCK) : 0),
          STOCK: item.CANTIDAD !== undefined ? item.CANTIDAD : (item.STOCK !== undefined ? item.STOCK : 0),
        }));

        setInventarioList(mappedList);
      }
      setPage(1);
    } catch {
      setInventarioList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const isModoVencidos = selectedTipoProducto.id === 'VENCIDOS';
  // La columna de fecha se visualiza si es modo Vencidos o si es modo Activos Por Fecha (tipo_group = 1)
  const showFechaVencimiento = isModoVencidos || selectedTipoAgrupacion.id === 1;

  // Métricas calculadas
  const metrics = useMemo(() => {
    let enStock = 0;
    let stockBajo = 0;
    let sinStock = 0;
    let totalCantidad = 0;

    inventarioList.forEach((item) => {
      const cant = Number(item.CANTIDAD !== undefined ? item.CANTIDAD : item.STOCK) || 0;
      totalCantidad += cant;
      if (cant <= 0) {
        sinStock += 1;
      } else if (cant <= 10) {
        stockBajo += 1;
      } else {
        enStock += 1;
      }
    });

    return {
      total: inventarioList.length,
      enStock,
      stockBajo,
      sinStock,
      totalCantidad,
    };
  }, [inventarioList]);

  // Filtrado de inventario
  const filteredItems = useMemo(() => {
    return inventarioList.filter((item) => {
      const prodName = (item.PRODUCTO || item.NOMBRE || '').toLowerCase();
      const detalleName = (item.NOMBRE_DETALLE || '').toLowerCase();
      const sku = (item.SKU || item.CODIGO || '').toLowerCase();
      const cat = (item.CATEGORIA || item.SUB_CATEGORIA || '').toLowerCase();
      const term = searchQuery.toLowerCase().trim();

      return !term || prodName.includes(term) || detalleName.includes(term) || sku.includes(term) || cat.includes(term);
    });
  }, [inventarioList, searchQuery]);

  // Paginación de items
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Columnas para exportación dinámicas
  const exportColumns: TableColumnConfig[] = useMemo(() => {
    const cols: TableColumnConfig[] = [
      { header: 'N°', width: 45, align: 'center', type: 'number' },
      { header: 'Tipo Producto', width: 100, align: 'center' },
      { header: 'Producto / Insumo', width: 220, align: 'left' },
      { header: 'Detalle / Presentación', width: 180, align: 'left' },
      { header: isModoVencidos ? 'Cantidad Vencida' : 'Cantidad Disponible', width: 120, align: 'right', type: 'number' },
      { header: 'U. Medida', width: 80, align: 'center' },
      { header: 'Cantidad Medida', width: 120, align: 'right' },
    ];

    if (showFechaVencimiento) {
      cols.push({ header: 'F. Vencimiento', width: 110, align: 'center' });
    }

    return cols;
  }, [isModoVencidos, showFechaVencimiento]);

  const getExportData = () => {
    return filteredItems.map((item, idx) => {
      const cant = Number(item.CANTIDAD !== undefined ? item.CANTIDAD : item.STOCK || 0);
      const isIntermedio = Boolean(item.ID_PRODUCTO_INTERMEDIO && Number(item.ID_PRODUCTO_INTERMEDIO) > 0);
      const cantMedida =
        item.CANTIDAD_ADECUACION !== undefined && Number(item.CANTIDAD_ADECUACION) > 0
          ? `${Number(item.CANTIDAD_ADECUACION).toFixed(2)} ${item.UNIDAD_MEDIDA_A || ''}`.trim()
          : '-';

      const row = [
        idx + 1,
        isIntermedio ? 'INTERMEDIO' : 'INSUMO',
        item.PRODUCTO || item.NOMBRE || '-',
        item.NOMBRE_DETALLE || '-',
        cant,
        item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA || 'UND',
        cantMedida,
      ];

      if (showFechaVencimiento) {
        row.push(item.FECHA_VENCIMIENTO ? dayjs(item.FECHA_VENCIMIENTO).format('DD/MM/YYYY') : '-');
      }

      return row;
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'ALMACÉN';
    const totalStock = filteredItems.reduce(
      (acc, curr) => acc + Number(curr.CANTIDAD !== undefined ? curr.CANTIDAD : curr.STOCK || 0),
      0
    );
    const subtitle = isModoVencidos
      ? `ALMACÉN: ${alm}   |   TIPO: PRODUCTOS VENCIDOS`
      : `ALMACÉN: ${alm}   |   AGRUPACIÓN: ${selectedTipoAgrupacion.label}`;

    const totals = showFechaVencimiento
      ? ['', '', '', 'TOTAL', totalStock, '', '', '']
      : ['', '', '', 'TOTAL', totalStock, '', ''];

    exportTableToExcel({
      title: isModoVencidos ? 'REPORTE DE PRODUCTOS VENCIDOS' : 'INVENTARIO DE ALMACÉN',
      subtitle,
      filename: `inventario_${isModoVencidos ? 'vencidos_' : ''}${alm.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}`,
      columns: exportColumns,
      data,
      totals,
    });
  };

  const handleExportPdf = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'ALMACÉN';
    const totalStock = filteredItems.reduce(
      (acc, curr) => acc + Number(curr.CANTIDAD !== undefined ? curr.CANTIDAD : curr.STOCK || 0),
      0
    );
    const subtitle = isModoVencidos
      ? `ALMACÉN: ${alm}   |   TIPO: PRODUCTOS VENCIDOS`
      : `ALMACÉN: ${alm}   |   AGRUPACIÓN: ${selectedTipoAgrupacion.label}`;

    const totals = showFechaVencimiento
      ? ['', '', '', 'TOTAL', totalStock, '', '', '']
      : ['', '', '', 'TOTAL', totalStock, '', ''];

    exportTableToPdf({
      title: isModoVencidos ? 'REPORTE DE PRODUCTOS VENCIDOS' : 'INVENTARIO DE ALMACÉN',
      subtitle,
      columns: exportColumns,
      data,
      totals,
    });
  };

  const handleOpenDetailModal = (item: InventarioItem) => {
    setSelectedItemDetail(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay show={isLoading} message="Cargando existencias de inventario..." />

      {/* ── Cabecera Principal de Página ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            Inventario de Almacén
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Gestione y supervise las existencias, lotes y conversiones de insumos de planta.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredItems.length === 0}
          />

          <Button
            variant="primary"
            size="sm"
            icon="published_with_changes"
            onClick={() => setIsConversionModalOpen(true)}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Convertir Productos
          </Button>
        </div>
      </div>

      {/* ── Tarjetas de Métricas de Inventario ── */}
      {isModoVencidos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 font-headline">
                Productos Vencidos
              </p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-headline">
                {metrics.total}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">event_busy</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 font-headline">
                Cantidad Total Vencida
              </p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-headline">
                {metrics.totalCantidad.toFixed(2)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">production_quantity_limits</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant font-headline">
                Almacén Seleccionado
              </p>
              <h3 className="text-base font-black text-on-surface mt-1 font-headline uppercase truncate max-w-[200px]">
                {selectedAlmacen?.DESCRICION || 'NO SELECCIONADO'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">store</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant font-headline">
                Total Ítems
              </p>
              <h3 className="text-xl font-black text-on-surface mt-1 font-headline">
                {metrics.total}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">category</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-headline">
                En Stock
              </p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-headline">
                {metrics.enStock}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 font-headline">
                Stock Bajo
              </p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-headline">
                {metrics.stockBajo}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 font-headline">
                Sin Stock
              </p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 font-headline">
                {metrics.sinStock}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Selector de Almacén y Filtros Estandarizados (AGENTS.md) ── */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
        <div className="flex bg-surface p-3.5 rounded-2xl border border-outline-variant shadow-sm gap-3 items-end flex-wrap flex-1">
          {/* 1. Selector de Almacén */}
          <div className="w-full sm:w-64 space-y-2 flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén
            </label>
            <Autocomplete
              options={almacenes}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
              value={selectedAlmacen}
              onChange={(_, newValue) => {
                setSelectedAlmacen(newValue);
                setInventarioList([]);
              }}
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

          {/* 2. Selector de Tipo de Producto (Activos / Vencidos) */}
          <div className="w-full sm:w-44 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Tipo de Consulta
            </label>
            <Autocomplete
              options={TIPO_PRODUCTO_OPTIONS}
              getOptionLabel={(option) => option.label}
              value={selectedTipoProducto}
              onChange={(_, newValue) => {
                const val = newValue || TIPO_PRODUCTO_OPTIONS[0];
                setSelectedTipoProducto(val);
                setInventarioList([]);
              }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              disableClearable
              fullWidth
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
                  placeholder="ESTADO..."
                />
              )}
            />
          </div>

          {/* 3. Selector de Tipo de Agrupación (Solo se visualiza si se selecciona ACTIVOS) */}
          {selectedTipoProducto.id === 'ACTIVOS' && (
            <div className="w-full sm:w-48 space-y-2 animate-fadeIn">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Tipo de Agrupación
              </label>
              <Autocomplete
                options={TIPO_AGRUPACION_OPTIONS}
                getOptionLabel={(option) => option.label}
                value={selectedTipoAgrupacion}
                onChange={(_, newValue) => {
                  const val = newValue || TIPO_AGRUPACION_OPTIONS[0];
                  setSelectedTipoAgrupacion(val);
                  setInventarioList([]);
                }}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                disableClearable
                fullWidth
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
                    placeholder="AGRUPACIÓN..."
                  />
                )}
              />
            </div>
          )}

          {/* Botón Buscar Exacto */}
          <button
            type="button"
            onClick={() => fetchInventario(selectedAlmacen?.ID_PLANTA_ALMACEN, selectedTipoProducto, selectedTipoAgrupacion)}
            title="Buscar Existencias"
            className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
          >
            <span className="material-symbols-outlined text-2xl font-bold">search</span>
          </button>
        </div>
      </div>

      {/* ── Main Data Canvas: Tabla Unificada de Inventario ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Cabecera interna con Buscador tipo Píldora */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              {isModoVencidos ? 'event_busy' : 'format_list_bulleted'}
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-headline">
              {isModoVencidos ? 'Listado de Productos Vencidos' : 'Listado de Insumos y Productos'}
            </h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {filteredItems.length}
            </span>
          </div>

          {/* Buscador Píldora */}
          <div className="relative group w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="BUSCAR PRODUCTO..."
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <th className="pl-6 pr-1 py-3 whitespace-nowrap">
                  {renderHeaderTitle('N°', 'left')}
                </th>
                <th className="pl-4 pr-1 py-3">
                  {renderHeaderTitle('PRODUCTO / INSUMO', 'left')}
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  {renderHeaderTitle('TIPO PRODUCTO', 'center')}
                </th>
                <th className="px-4 pr-0.5 py-3 text-right whitespace-nowrap">
                  {renderHeaderTitle(isModoVencidos ? 'CANTIDAD VENCIDA' : 'CANTIDAD DISPONIBLE', 'right')}
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  {renderHeaderTitle('U. MEDIDA', 'left')}
                </th>
                <th className="px-4 pr-0.5 py-3 text-right whitespace-nowrap">
                  {renderHeaderTitle('CANTIDAD MEDIDA', 'right')}
                </th>
                {showFechaVencimiento && (
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    {renderHeaderTitle('FECHA VENCIMIENTO', 'center')}
                  </th>
                )}
                <th className="pl-2 pr-1 py-3 text-right whitespace-nowrap">
                  {renderHeaderTitle('ACCIONES', 'right')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={showFechaVencimiento ? 8 : 7} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-3xl mb-1 opacity-40">
                        {isModoVencidos ? 'event_busy' : 'inventory'}
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {selectedAlmacen
                          ? isModoVencidos
                            ? 'No se encontraron productos vencidos en este almacén.'
                            : 'No se encontraron productos en el inventario para los filtros seleccionados.'
                          : 'Seleccione un almacén y presione Buscar para consultar las existencias.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const itemIndex = (page - 1) * pageSize + idx + 1;
                  const cant = Number(item.CANTIDAD !== undefined ? item.CANTIDAD : item.STOCK || 0);
                  const isIntermedio = Boolean(item.ID_PRODUCTO_INTERMEDIO && Number(item.ID_PRODUCTO_INTERMEDIO) > 0);
                  const cantAdecuacion = Number(item.CANTIDAD_ADECUACION || 0);

                  return (
                    <tr
                      key={item.ID_PRODUCTO || item.ID_PRODUCTO_DETALLE || idx}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors group"
                    >
                      {/* N° */}
                      <td className="pl-6 pr-2 py-2 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemIndex}</span>
                      </td>

                      {/* Producto / Insumo */}
                      <td className="pl-4 pr-1 py-2">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none">
                              {item.NOMBRE_DETALLE || item.NOMBRE || 'Producto sin nombre'}
                            </p>
                            {item.PRODUCTO ? (
                              <p className="text-[10px] font-bold text-primary uppercase tracking-tight mt-0.5">
                                {item.PRODUCTO}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Columna Tipo Producto (Insumo vs Intermedio) */}
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isIntermedio
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/40'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/40'
                            }`}
                        >
                          {isIntermedio ? 'INTERMEDIO' : 'INSUMO'}
                        </span>
                      </td>

                      {/* Stock / Cantidad Disponible */}
                      <td
                        className={`px-4 pr-0.5 py-2 text-right font-black text-[10px] font-headline whitespace-nowrap ${isModoVencidos ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                      >
                        {cant.toFixed(2)}
                      </td>

                      {/* Unidad de Medida */}
                      <td className="px-4 pr-0.5 py-2 font-bold text-[10px] text-zinc-500 dark:text-zinc-400 uppercase whitespace-nowrap">
                        {item.UNIDAD_MEDIDA_E || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA || 'UND'}
                      </td>

                      {/* Cantidad Medida (Cantidad arriba, UNIDAD_MEDIDA_A debajo) */}
                      <td className="px-4 pr-0.5 py-2 text-right whitespace-nowrap">
                        {cantAdecuacion > 0 ? (
                          <div className="flex flex-col items-end leading-tight">
                            <span className="font-headline font-black text-[10px] text-zinc-900 dark:text-zinc-100">
                              {cantAdecuacion.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">
                              {item.UNIDAD_MEDIDA_A || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>

                      {/* F. Vencimiento (Solo visible cuando corresponde) */}
                      {showFechaVencimiento && (
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          {item.FECHA_VENCIMIENTO ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isModoVencidos
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                              {isModoVencidos && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                              {dayjs(item.FECHA_VENCIMIENTO).format('DD/MM/YYYY')}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
                        </td>
                      )}

                      {/* Botones de Acción */}
                      <td className="pl-2 pr-6 py-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(item)}
                            title="Ver Detalle de Lotes"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px] sm:text-base">
                              visibility
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination ── */}
        {!isLoading && filteredItems.length > 0 && (
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
              <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 px-2">
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

      {/* ── Modales ── */}
      <ModalConvertirProductos
        open={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        almacenes={almacenes}
        currentAlmacen={selectedAlmacen}
        onSuccess={() => fetchInventario(selectedAlmacen?.ID_PLANTA_ALMACEN, selectedTipoProducto, selectedTipoAgrupacion)}
      />

      <ModalDetalleLotes
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={selectedItemDetail}
        almacenNombre={selectedAlmacen?.DESCRICION || 'ALMACÉN'}
      />
    </div>
  );
};

export default InventarioAlmacen;

/**
 * InventarioAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, control y monitoreo en tiempo real del inventario y existencias
 *    de materias primas, insumos y productos intermedios por almacén de la planta.
 *    Permite realizar conversiones/depreciaciones de productos (materia prima a
 *    procesados), consultar detalles de lotes y fechas de vencimiento, y exportar
 *    el balance de existencias.
 *
 * 2. APIs Utilizadas:
 *    - GET /inventario/reportes/almacenes?id_planta_almacen=0 (loadApiGetAlmacenesUsuario - Almacenes autorizados)
 *    - GET /inventario/reportes/:idAlmacen/inventario?tipo_group=1 (loadApiGetInventarioAlmacen - Stock e inventario)
 *    - GET /inventario/reportes/:idAlmacen/productos (loadApiGetProductosAlmacen - Catálogo para conversión)
 *    - GET /inventario/reportes/:idAlmacen/productos-especiales (loadApiGetProductosEspeciales - Productos especiales de ingreso)
 *    - POST /inventario/reportes/:idAlmacen/depreciar (loadApiDepreciarProducto - Registrar conversión)
 *    - GET /inventario/reportes/:idAlmacen/depreciados (loadApiGetProductosDepreciados - Historial de transformaciones)
 *    - GET /inventario/rep-desp/productos-vencidos (loadApiGetProductosVencidos - Monitoreo de caducidad)
 *
 * 3. Controles Clave:
 *    - Selectores 100% autocompletables (MUI Autocomplete) con soporte de búsqueda en tiempo real.
 *    - Botón "Buscar" estandarizado (w-10 h-10 rounded-2xl bg-primary/10) para consultar el inventario del almacén.
 *    - Limpieza automática de la lista al cambiar de almacén hasta presionar Buscar.
 *    - Tarjetas de métricas consolidadas (Total de Ítems, En Stock, Stock Bajo y Sin Stock).
 *    - Tabla unificada compacta y responsiva conforme a AGENTS.md con buscador tipo píldora.
 *    - Paginación dinámica parametrizable (5, 10, 20, 50 registros por página).
 *    - Botón estandarizado de acción tipo icono para inspección de lotes y fechas de vencimiento.
 *    - Modal de transformación/conversión de materias primas con validaciones de saldo e historial integrado.
 *    - Exportación de existencias a formato CSV.
 */

import React, { useState, useEffect, useMemo } from 'react';
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

interface StatusOption {
  id: string;
  label: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'TODOS', label: 'TODOS LOS ESTADOS' },
  { id: 'EN_STOCK', label: 'EN STOCK' },
  { id: 'STOCK_BAJO', label: 'STOCK BAJO' },
  { id: 'SIN_STOCK', label: 'SIN STOCK' },
];

export const InventarioAlmacen: React.FC = () => {
  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetInventarioAlmacen,
  } = useInventarioAlmacenesServices();

  // Estados principales
  const [almacenes, setAlmacenes] = useState<AlmacenItem[]>([]);
  const [selectedAlmacen, setSelectedAlmacen] = useState<AlmacenItem | null>(null);
  const [inventarioList, setInventarioList] = useState<InventarioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros superiores autocompletables
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<string>('TODAS LAS CATEGORÍAS');
  const [selectedStatusOption, setSelectedStatusOption] = useState<StatusOption>(STATUS_OPTIONS[0]);

  // Filtro de tabla interno (Buscador píldora)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modales
  const [isConversionModalOpen, setIsConversionModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventarioItem | null>(null);

  // 1. Cargar almacenes del usuario al montar el componente
  const fetchAlmacenes = async () => {
    setIsLoading(true);
    try {
      const res = await loadApiGetAlmacenesUsuario(0);
      let list: AlmacenItem[] = [];
      if (res && res.success && Array.isArray(res.datos)) {
        list = res.datos;
      } else if (Array.isArray(res)) {
        list = res;
      }

      setAlmacenes(list);
      if (list.length > 0) {
        setSelectedAlmacen(list[0]);
        await fetchInventario(list[0].ID_PLANTA_ALMACEN);
      }
    } catch {
      setAlmacenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Cargar inventario del almacén seleccionado al presionar Buscar
  const fetchInventario = async (idAlmacen?: number) => {
    const targetId = idAlmacen || selectedAlmacen?.ID_PLANTA_ALMACEN;
    if (!targetId) {
      showAlert.error('Selección Requerida', 'Debe seleccionar un almacén para consultar el inventario.');
      setInventarioList([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await loadApiGetInventarioAlmacen(targetId, 1);
      if (res && res.success && Array.isArray(res.datos)) {
        setInventarioList(res.datos);
      } else if (Array.isArray(res)) {
        setInventarioList(res);
      } else {
        setInventarioList([]);
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

  // Obtener categorías únicas disponibles para el Autocomplete
  const categoryOptions = useMemo(() => {
    const setCat = new Set<string>();
    inventarioList.forEach((item) => {
      const cat = item.CATEGORIA || item.SUB_CATEGORIA;
      if (cat && cat.trim() !== '') {
        setCat.add(cat.trim().toUpperCase());
      }
    });
    return ['TODAS LAS CATEGORÍAS', ...Array.from(setCat).sort()];
  }, [inventarioList]);

  // Determinar estado de stock
  const getItemStatus = (stockValue: number | string) => {
    const stock = Number(stockValue) || 0;
    if (stock <= 0) return 'Sin Stock';
    if (stock <= 10) return 'Stock Bajo';
    return 'En Stock';
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    let enStock = 0;
    let stockBajo = 0;
    let sinStock = 0;

    inventarioList.forEach((item) => {
      const st = Number(item.STOCK) || 0;
      if (st <= 0) {
        sinStock += 1;
      } else if (st <= 10) {
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
    };
  }, [inventarioList]);

  // Filtrado de inventario
  const filteredItems = useMemo(() => {
    return inventarioList.filter((item) => {
      const prodName = (item.PRODUCTO || item.NOMBRE || '').toLowerCase();
      const sku = (item.SKU || item.CODIGO || '').toLowerCase();
      const cat = (item.CATEGORIA || item.SUB_CATEGORIA || '').toLowerCase();
      const term = searchQuery.toLowerCase().trim();

      const matchesSearch = !term || prodName.includes(term) || sku.includes(term) || cat.includes(term);

      const itemCategory = (item.CATEGORIA || item.SUB_CATEGORIA || '').toUpperCase();
      const matchesCategory =
        !selectedCategoryOption ||
        selectedCategoryOption === 'TODAS LAS CATEGORÍAS' ||
        itemCategory === selectedCategoryOption.toUpperCase();

      const itemStatus = getItemStatus(item.STOCK);
      const matchesStatus =
        !selectedStatusOption ||
        selectedStatusOption.id === 'TODOS' ||
        (selectedStatusOption.id === 'EN_STOCK' && itemStatus === 'En Stock') ||
        (selectedStatusOption.id === 'STOCK_BAJO' && itemStatus === 'Stock Bajo') ||
        (selectedStatusOption.id === 'SIN_STOCK' && itemStatus === 'Sin Stock');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventarioList, searchQuery, selectedCategoryOption, selectedStatusOption]);

  // Paginación de items
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const exportColumns: TableColumnConfig[] = [
    { header: 'N°', width: 45, align: 'center', type: 'number' },
    { header: 'Producto / Insumo', width: 220, align: 'left' },
    { header: 'SKU / Código', width: 110, align: 'center' },
    { header: 'Categoría', width: 140, align: 'left' },
    { header: 'Stock Actual', width: 95, align: 'right', type: 'number' },
    { header: 'Unidad', width: 70, align: 'center' },
    { header: 'Estado', width: 100, align: 'center' },
  ];

  const getExportData = () => {
    return filteredItems.map((item, idx) => [
      idx + 1,
      item.PRODUCTO || item.NOMBRE || '-',
      item.SKU || item.CODIGO || '-',
      item.CATEGORIA || item.SUB_CATEGORIA || '-',
      Number(item.STOCK || 0),
      item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_A || 'UND',
      getItemStatus(item.STOCK),
    ]);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'ALMACÉN';
    const totalStock = filteredItems.reduce((acc, curr) => acc + Number(curr.STOCK || 0), 0);

    exportTableToExcel({
      title: 'INVENTARIO DE ALMACÉN',
      subtitle: `ALMACÉN: ${alm}   |   CATEGORÍA: ${selectedCategoryOption}   |   ESTADO: ${selectedStatusOption.label}`,
      filename: `inventario_${alm.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}`,
      columns: exportColumns,
      data,
      totals: ['', '', '', 'TOTAL STOCK', totalStock, '', ''],
    });
  };

  const handleExportPdf = () => {
    const data = getExportData();
    const alm = selectedAlmacen?.DESCRICION || 'ALMACÉN';
    const totalStock = filteredItems.reduce((acc, curr) => acc + Number(curr.STOCK || 0), 0);

    exportTableToPdf({
      title: 'INVENTARIO DE ALMACÉN',
      subtitle: `ALMACÉN: ${alm}   |   CATEGORÍA: ${selectedCategoryOption}   |   ESTADO: ${selectedStatusOption.label}`,
      columns: exportColumns,
      data,
      totals: ['', '', '', 'TOTAL STOCK', totalStock, '', ''],
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant font-headline">
              Total Productos
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

      {/* ── Selector de Almacén y Filtros Estandarizado (AGENTS.md) ── */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
        <div className="flex bg-surface p-3.5 rounded-2xl border border-outline-variant shadow-sm gap-3 items-end flex-col sm:flex-row flex-1">
          {/* Selector de Almacén */}
          <div className="w-full sm:flex-1 space-y-2">
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

          {/* Selector de Categoría */}
          <div className="w-full sm:w-64 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Categoría
            </label>
            <Autocomplete
              options={categoryOptions}
              value={selectedCategoryOption}
              onChange={(_, newValue) => {
                setSelectedCategoryOption(newValue || 'TODAS LAS CATEGORÍAS');
                setPage(1);
              }}
              noOptionsText="Sin categorías"
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
                  placeholder="FILTRAR POR CATEGORÍA..."
                />
              )}
            />
          </div>

          {/* Selector de Estado */}
          <div className="w-full sm:w-60 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Estado de Stock
            </label>
            <Autocomplete
              options={STATUS_OPTIONS}
              getOptionLabel={(option) => option.label}
              value={selectedStatusOption}
              onChange={(_, newValue) => {
                setSelectedStatusOption(newValue || STATUS_OPTIONS[0]);
                setPage(1);
              }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              noOptionsText="Sin opciones"
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
                  placeholder="FILTRAR POR ESTADO..."
                />
              )}
            />
          </div>

          {/* Botón Buscar Exacto */}
          <button
            type="button"
            onClick={() => fetchInventario(selectedAlmacen?.ID_PLANTA_ALMACEN)}
            title="Buscar Inventario"
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
            <span className="material-symbols-outlined text-primary text-lg">format_list_bulleted</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-headline">
              Listado de Insumos y Productos
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
              placeholder="BUSCAR PRODUCTO O SKU..."
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  N°
                </th>
                <th className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto / Insumo
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Categoría
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                  Stock Disponible
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  U. Medida
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                  Estado
                </th>
                <th className="pl-2 pr-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-3xl mb-1 opacity-40">
                        inventory
                      </span>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {selectedAlmacen
                          ? 'No se encontraron productos en el inventario para los filtros seleccionados.'
                          : 'Seleccione un almacén y presione Buscar para consultar las existencias.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const itemIndex = (page - 1) * pageSize + idx + 1;
                  const status = getItemStatus(item.STOCK);

                  return (
                    <tr
                      key={item.ID_PRODUCTO || item.ID_PRODUCTO_DETALLE || idx}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors group"
                    >
                      {/* N° */}
                      <td className="pl-6 pr-2 py-2 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemIndex}</span>
                      </td>

                      {/* Producto */}
                      <td className="pl-6 pr-2 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm">package_2</span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none">
                              {item.PRODUCTO || item.NOMBRE || 'Producto sin nombre'}
                            </p>
                            {(item.SKU || item.CODIGO) && (
                              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                                SKU: {item.SKU || item.CODIGO}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-2 font-bold text-xs text-zinc-600 dark:text-zinc-350 uppercase whitespace-nowrap">
                        {item.CATEGORIA || item.SUB_CATEGORIA || '-'}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-2 text-right font-black text-xs text-zinc-900 dark:text-zinc-100 font-headline whitespace-nowrap">
                        {Number(item.STOCK || 0).toFixed(2)}
                      </td>

                      {/* Unidad de Medida */}
                      <td className="px-4 py-2 font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase whitespace-nowrap">
                        {item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA_D || item.UNIDAD_MEDIDA_E || '-'}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${status === 'En Stock'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40'
                            : status === 'Stock Bajo'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${status === 'En Stock'
                              ? 'bg-emerald-500'
                              : status === 'Stock Bajo'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                              }`}
                          />
                          {status}
                        </span>
                      </td>

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
        onSuccess={() => fetchInventario()}
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

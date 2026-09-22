/**
 * ProductosProducidos.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Productos Producidos (Historial y Registro de Producción)
 *
 * Propósito de la vista:
 * Visualizar el historial de lotes y productos producidos (intermedios y finales),
 * filtrando por almacén y rango de fechas, y permitir el registro de nuevas órdenes
 * de producción con cálculo dinámico de inventario e insumos requeridos.
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                             │ Descripción                                             │
 * ├─────┼────────┼──────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/inventario/produccion/almacenes-usuario              │ Listar almacenes asignados al usuario logueado          │
 * │  2  │ GET    │ /v1/inventario/produccion/areas                          │ Listar áreas habilitadas para el usuario                │
 * │  3  │ GET    │ /v1/inventario/produccion/productos-producidos           │ Consultar historial de producción con filtros de fechas │
 * │  4  │ GET    │ /v1/inventario/produccion/almacenes/:id/recetas?tipo=X   │ Recetas y stock de insumos por almacén                  │
 * │  5  │ POST   │ /v1/inventario/produccion/registrar-productos            │ Registrar lote o masivo de producción                   │
 * └─────┴────────┴──────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de fechas en formato ISO (YYYY-MM-DD) al consultar al backend y visualización DD/MM/YYYY.
 * - Buscador interno en tiempo real para filtrar por nombre de producto, usuario o almacén.
 * - Paginador dinámico con selector de tamaño de página.
 * - Modal estandarizado para registro masivo de producción con análisis de insumos.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Autocomplete, TextField } from '@mui/material';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import {
  useProductosProducidosServices,
  AlmacenItem,
  AreaItem,
  ProductoProducidoItem,
} from './services/useProductosProducidos';
import { ModalNuevoProductoProducido } from './components/ModalNuevoProductoProducido';

export const ProductosProducidos: React.FC = () => {
  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetAreas,
    loadApiGetProductosProducidos,
  } = useProductosProducidosServices();

  // Estados de catálogos y filtros
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(15, 'days'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Estados de datos y paginación
  const [productsList, setProductsList] = useState<ProductoProducidoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Formatear fechas para visualización en frontend (DD/MM/YYYY)
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const formatTimeDisplay = (dateStr?: string, horaStr?: string) => {
    if (horaStr) return horaStr;
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      const timePart = dateStr.split('T')[1];
      return timePart.split('.')[0].replace('Z', '');
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[1].split('.')[0];
    }
    return '';
  };

  // Carga inicial de almacenes y áreas
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [resWh, resAreas] = await Promise.all([
          loadApiGetAlmacenesUsuario(),
          loadApiGetAreas(),
        ]);

        let whItems: AlmacenItem[] = [];
        if (Array.isArray(resWh)) {
          whItems = resWh;
        } else if (resWh?.almacenes || resWh?.data) {
          whItems = resWh.almacenes || resWh.data;
        }

        let areaItems: AreaItem[] = [];
        if (Array.isArray(resAreas)) {
          areaItems = resAreas;
        } else if (resAreas?.areas || resAreas?.data) {
          areaItems = resAreas.areas || resAreas.data;
        }

        setWarehouses(whItems);
        setAreas(areaItems);

        if (whItems.length > 0) {
          const defaultWh = whItems[0];
          setSelectedWarehouse(defaultWh);
          fetchHistory(defaultWh.ID_PLANTA_ALMACEN);
        }
      } catch {
        // Manejado por interceptor
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const fetchHistory = async (idAlmacen?: number | string) => {
    const targetWhId = idAlmacen || selectedWarehouse?.ID_PLANTA_ALMACEN;
    if (!targetWhId) {
      setProductsList([]);
      return;
    }

    setIsLoading(true);
    try {
      const fi = startDate ? startDate.format('YYYY-MM-DD') : '';
      const ff = endDate ? endDate.format('YYYY-MM-DD') : '';

      const res = await loadApiGetProductosProducidos({
        id_planta_almacen: targetWhId,
        fecha_inicio: fi,
        fecha_fin: ff,
      });

      let items: ProductoProducidoItem[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res?.productos || res?.data) {
        items = res.productos || res.data;
      }

      setProductsList(items);
      setPage(1);
    } catch {
      setProductsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtro de búsqueda interno
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return productsList;
    const query = searchTerm.toLowerCase().trim();

    return productsList.filter((item) => {
      const matchProduct = (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toLowerCase().includes(query);
      const matchUser = (item.USUARIO || item.NOMBRE_USUARIO || '').toLowerCase().includes(query);
      const matchWh = (item.ALMACEN || '').toLowerCase().includes(query);
      const matchArea = (item.AREA || '').toLowerCase().includes(query);
      return matchProduct || matchUser || matchWh || matchArea;
    });
  }, [productsList, searchTerm]);

  // Paginación
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'FECHA REGISTRO', key: 'fechaReg', width: 16 },
      { header: 'HORA', key: 'horaReg', width: 12 },
      { header: 'PRODUCTO / RECETA', key: 'receta', width: 30 },
      { header: 'TIPO', key: 'tipo', width: 14, align: 'center' as const },
      { header: 'ALMACÉN', key: 'almacen', width: 22 },
      { header: 'ÁREA', key: 'area', width: 20 },
      { header: 'CANTIDAD PRODUCIDA', key: 'cantidad', width: 18, align: 'right' as const, format: 'number' as const },
      { header: 'UNIDAD', key: 'unidad', width: 10, align: 'center' as const },
      { header: 'MERMA / DESPERDICIO', key: 'merma', width: 18, align: 'right' as const, format: 'number' as const },
      { header: 'USUARIO', key: 'usuario', width: 22 },
    ];

    const rows = filteredProducts.map((item, idx) => {
      const isIntermedio =
        item.TIPO === 'Intermedio' ||
        (item.ID_PRODUCTO_INTERMEDIO && item.ID_PRODUCTO_INTERMEDIO > 0);

      return {
        index: idx + 1,
        fechaReg: formatDateDisplay(item.FECHA_REGISTRO),
        horaReg: formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO) || '-',
        receta: item.RECETA_INTERMEDIO || item.RECETA || '-',
        tipo: isIntermedio ? 'Intermedio' : 'Final',
        almacen: item.ALMACEN || selectedWarehouse?.DESCRICION || '-',
        area: item.AREA || '-',
        cantidad: Number(item.CANTIDAD_PRODUCIDA ?? 0),
        unidad: item.UNIDAD_MEDIDA || '',
        merma: Number(item.CANTIDAD_DESPERDICIO ?? 0),
        usuario: item.USUARIO || item.NOMBRE_USUARIO || '-',
      };
    });

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Productos_Producidos_${selectedWarehouse?.DESCRICION || 'Almacen'}_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'Produccion',
      title: 'HISTORIAL DE PRODUCTOS PRODUCIDOS',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'HISTORIAL DE PRODUCTOS PRODUCIDOS',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
      orientation: 'landscape',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0">
      <LoadingOverlay show={isLoading} message="Cargando registros de productos producidos..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            PRODUCTOS PRODUCIDOS
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Historial de producción y control de inventario de recetas
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredProducts.length === 0}
          />
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => setIsNewModalOpen(true)}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Registrar Producción
          </Button>
        </div>
      </div>

      {/* ── Filtros Superiores ── */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          {/* Almacén */}
          <div className="flex-1 min-w-[240px] space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Almacén de Consulta <span className="text-primary">*</span>
            </label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                if (newValue) {
                  //fetchHistory(newValue.ID_PLANTA_ALMACEN);
                } else {
                  setProductsList([]);
                }
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

          {/* Fecha Inicio */}
          <div className="w-full sm:w-48 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Fecha Inicio
            </label>
            <DatePicker
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                setProductsList([]);
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: 'var(--input-bg, var(--surface))',
                      color: 'var(--on-surface)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline-variant)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary)',
                      },
                    },
                  },
                },
              }}
            />
          </div>

          {/* Fecha Fin */}
          <div className="w-full sm:w-48 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Fecha Fin
            </label>
            <DatePicker
              value={endDate}
              onChange={(v) => {
                setEndDate(v);
                setProductsList([]);
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: 'var(--input-bg, var(--surface))',
                      color: 'var(--on-surface)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline-variant)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--outline)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--primary)',
                      },
                    },
                  },
                },
              }}
            />
          </div>

          {/* Botón Consultar */}
          <button
            type="button"
            onClick={() => fetchHistory()}
            title="Consultar Historial"
            className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
          >
            <span className="material-symbols-outlined text-2xl font-bold">search</span>
          </button>
        </div>
      </div>

      {/* ── Main Data Canvas (Tabla Unificada) ── */}
      <div className="bg-surface rounded-[1rem] border border-outline-variant dark:border-zinc-800 shadow-sm overflow-hidden mb-0">
        {/* Cabecera Superior de la Tabla */}
        <div className="p-3 sm:p-2 border-b border-outline-variant dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-variant/30 dark:bg-zinc-850/60">
          <div>
            <p className="text-[11px] font-black text-on-surface dark:text-zinc-100 uppercase tracking-widest font-headline">
              Historial de Producción ({totalItems})
            </p>
          </div>

          {/* Buscador Interno */}
          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="BUSCAR..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <td className="pl-4 pr-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 whitespace-nowrap w-8">
                  N°
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 whitespace-nowrap">
                  Fecha / Hora
                </td>
                <td className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 min-w-[150px] sm:min-w-[150px]">
                  Producto / Receta
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center whitespace-nowrap">
                  Tipo
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 whitespace-nowrap">
                  Almacén
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center whitespace-nowrap">
                  Cant. Producida
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center whitespace-nowrap">
                  Merma
                </td>
                <td className="pr-4 pl-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center whitespace-nowrap">
                  Usuario
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
                      precision_manufacturing
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider">
                      No se encontraron registros de producción
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                      Seleccione un almacén y consulte el rango de fechas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item, idx) => {
                  const itemNumber = (page - 1) * pageSize + idx + 1;
                  const isIntermedio =
                    item.TIPO === 'Intermedio' ||
                    (item.ID_PRODUCTO_INTERMEDIO && item.ID_PRODUCTO_INTERMEDIO > 0);

                  return (
                    <tr
                      key={item.ID_PRODUCCION || idx}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* N° */}
                      <td className="pl-4 pr-1 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemNumber}</span>
                      </td>

                      {/* Fecha / Hora */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                          {formatDateDisplay(item.FECHA_REGISTRO)}
                        </span>
                        {formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO) && (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">
                            {formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO)}
                          </span>
                        )}
                      </td>

                      {/* Producto */}
                      <td className="px-3 py-1 min-w-[150px] sm:min-w-[150px]">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-tight block">
                          {item.RECETA_INTERMEDIO || item.RECETA || '-'}
                        </span>
                        {item.AREA && (
                          <span className="text-[9px] text-zinc-400 font-bold block">
                            Área: {item.AREA}
                          </span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="px-2 py-1 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isIntermedio
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                        >
                          {isIntermedio ? 'Intermedio' : 'Final'}
                        </span>
                      </td>

                      {/* Almacén */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="font-black text-xs text-primary uppercase tracking-tight">
                          {item.ALMACEN || selectedWarehouse?.DESCRICION || '-'}
                        </span>
                      </td>

                      {/* Cantidad Producida */}
                      <td className="px-2 py-1 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                          {item.CANTIDAD_PRODUCIDA ?? 0} {item.UNIDAD_MEDIDA || ''}
                        </span>
                      </td>

                      {/* Merma */}
                      <td className="px-2 py-1 text-center whitespace-nowrap">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                          {item.CANTIDAD_DESPERDICIO ?? 0}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td className="pr-4 pl-2 py-1 text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {item.USUARIO || item.NOMBRE_USUARIO || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación Estándar Inferior ── */}
        {!isLoading && productsList.length > 0 && (
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

      {/* ── Modal Nueva Producción ── */}
      <ModalNuevoProductoProducido
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        warehouses={warehouses}
        areas={areas}
        defaultWarehouse={selectedWarehouse}
        onSaveSuccess={() => {
          if (selectedWarehouse) {
            fetchHistory(selectedWarehouse.ID_PLANTA_ALMACEN);
          }
        }}
      />
    </div>
  );
};

export default ProductosProducidos;

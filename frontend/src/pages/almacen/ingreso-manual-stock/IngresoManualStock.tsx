/**
 * IngresoManualStock.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, control y auditoría de ingresos manuales de stock en almacén.
 *    Permite a los administradores registrar entradas directas de insumos y
 *    productos con fechas de vencimiento y lotes, así como consultar el
 *    historial de productos agregados filtrado por almacén y rango de fechas.
 *
 * 2. APIs Utilizadas:
 *    - GET /inventario/declaracion/almacenes?id_planta_almacen=0 (loadApiGetAlmacenes - Almacenes del usuario)
 *    - GET /inventario/ajustes/stock?id_planta_almacen=X (loadApiGetStockAlmacen - Catálogo de productos y stock)
 *    - GET /inventario/ajustes/agregados?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z (loadApiGetProductosAgregados - Historial de ingresos)
 *    - POST /inventario/ajustes/agregar (loadApiAgregarStock - Registrar nuevo ingreso manual)
 *
 * 3. Controles Clave:
 *    - Filtro por almacén mediante Autocomplete de MUI con estilos oficiales de AGENTS.md.
 *    - Filtro por rango de fechas (Fecha Inicio y Fecha Fin) con DatePicker en español.
 *    - Botón de búsqueda estandarizado con icono search.
 *    - Modal estructurado en components/ (ModalNuevoIngresoManual) para ingresar nuevos insumos.
 *    - Tabla unificada compacta y responsiva con buscador interno tipo píldora.
 *    - Componente LoadingOverlay centralizado para estados de carga.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import { showAlert } from '../../../config/alerts';
import {
  useIngresoManualStockServices,
  AlmacenItem,
  HistorialIngresoItem,
} from './services/useIngresoManualStock';
import { ModalNuevoIngresoManual } from './components/ModalNuevoIngresoManual';

export const IngresoManualStock: React.FC = () => {
  const {
    loadApiGetAlmacenes,
    loadApiGetProductosAgregados,
  } = useIngresoManualStockServices();

  // Estados de datos
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [historialList, setHistorialList] = useState<HistorialIngresoItem[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros de tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carga inicial
  useEffect(() => {
    const fetchAlmacenes = async () => {
      setIsLoading(true);
      const res = await loadApiGetAlmacenes();
      let loadedWh: AlmacenItem[] = [];
      if (res && res.success && Array.isArray(res.datos)) {
        loadedWh = res.datos;
      } else if (Array.isArray(res)) {
        loadedWh = res;
      }
      setWarehouses(loadedWh);

      if (loadedWh.length > 0) {
        const firstWh = loadedWh[0];
        setSelectedWarehouse(firstWh);
        fetchHistorialData(firstWh, startDate, endDate);
      } else {
        setIsLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  // Consultar historial de ingresos manuales
  const fetchHistorialData = async (
    warehouse: AlmacenItem | null,
    start: Dayjs | null,
    end: Dayjs | null
  ) => {
    if (!warehouse) {
      showAlert.warning('Seleccione un Almacén', 'Debe seleccionar un almacén para consultar los ingresos.');
      return;
    }
    const fi = start ? start.format('YYYY-MM-DD') : dayjs().startOf('month').format('YYYY-MM-DD');
    const ff = end ? end.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

    setIsLoading(true);
    const res = await loadApiGetProductosAgregados(warehouse.ID_PLANTA_ALMACEN, fi, ff);
    setIsLoading(false);

    if (res && res.success && Array.isArray(res.data)) {
      setHistorialList(res.data);
      setPage(1);
    } else if (Array.isArray(res)) {
      setHistorialList(res);
      setPage(1);
    } else {
      setHistorialList([]);
    }
  };

  // Filtrado interno en tabla
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return historialList;
    const term = searchTerm.toLowerCase();
    return historialList.filter((item) => {
      const prod = (item.PRODUCTO || '').toLowerCase();
      const det = (item.PRODUCTO_DETALLE || '').toLowerCase();
      const user = (item.USUARIO_REGISTRA || '').toLowerCase();
      return prod.includes(term) || det.includes(term) || user.includes(term);
    });
  }, [historialList, searchTerm]);

  // Paginación
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Estadísticas KPI
  const stats = useMemo(() => {
    const totalQty = historialList.reduce((acc, curr) => acc + (Number(curr.CANTIDAD) || 0), 0);
    return [
      {
        label: 'Total Registros de Ingreso',
        value: historialList.length.toString(),
        icon: 'format_list_bulleted',
        color: 'bg-primary',
      },
      {
        label: 'Volumen Total Ingresado',
        value: totalQty.toFixed(2),
        icon: 'input',
        color: 'bg-emerald-600',
      },
    ];
  }, [historialList]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.split('T')[0];
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
  };

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'PRODUCTO / INSUMO', key: 'producto', width: 28 },
      { header: 'DETALLE PRODUCTO', key: 'detalle', width: 25 },
      { header: 'CANT. INGRESADA', key: 'cantidad', width: 16, align: 'right' as const, format: 'number' as const },
      { header: 'UNIDAD MEDIDA', key: 'unidad', width: 14, align: 'center' as const },
      { header: 'VENCIMIENTO', key: 'vencimiento', width: 16, align: 'center' as const },
      { header: 'REGISTRADO POR', key: 'usuario', width: 22 },
    ];

    const rows = filteredItems.map((item, idx) => ({
      index: idx + 1,
      producto: item.PRODUCTO || '-',
      detalle: item.PRODUCTO_DETALLE || item.PRODUCTO || '-',
      cantidad: Number(item.CANTIDAD || 0),
      unidad: item.UNIDAD_MEDIDA || '-',
      vencimiento: formatDate(item.FECHA_VENCIMIENTO),
      usuario: item.USUARIO_REGISTRA || 'SISTEMA',
    }));

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Ingresos_Manuales_${selectedWarehouse?.DESCRICION || 'Almacen'}_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'Ingresos',
      title: 'HISTORIAL DE INGRESOS MANUALES DE STOCK',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'HISTORIAL DE INGRESOS MANUALES DE STOCK',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
      orientation: 'landscape',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      {/* Componente Centralizado LoadingOverlay */}
      <LoadingOverlay show={isLoading} message="Consultando ingresos manuales de stock..." />

      {/* Cabecera Estándar de Página (AGENTS.md Layout) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-on-surface font-headline">
                Ingreso Manual de Stock
              </h1>
            </div>
          </div>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Gestión y registro de entradas manuales directas de insumos al inventario del almacén.
          </p>
        </div>

        {/* Botón de Acción Principal en Cabecera */}
        <div className="flex items-center gap-2">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredItems.length === 0}
          />
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Nuevo Ingreso
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-surface dark:bg-zinc-900 p-4 sm:p-5 rounded-3xl border border-outline-variant/60 dark:border-zinc-800 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-md shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface tracking-tight font-headline">
                {stat.value}
              </p>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra Superior de Filtros (Estándar Oficial AGENTS.md) */}
      <div className="bg-surface dark:bg-zinc-900 rounded-3xl p-5 border border-outline-variant/60 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          {/* Selector de Almacén */}
          <div className="w-full sm:flex-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén
            </label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || option.NOMBRE || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                setHistorialList([]);
                if (newValue) {
                  fetchHistorialData(newValue, startDate, endDate);
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

          {/* Fecha Inicio */}
          <div className="w-full sm:w-48 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Fecha Inicio
            </label>
            <DatePicker
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                setHistorialList([]);
              }}
              format="DD/MM/YYYY"
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
          <div className="w-full sm:w-48 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Fecha Fin
            </label>
            <DatePicker
              value={endDate}
              onChange={(v) => {
                setEndDate(v);
                setHistorialList([]);
              }}
              format="DD/MM/YYYY"
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

          {/* Botón de Búsqueda Estandarizado */}
          <button
            type="button"
            onClick={() => fetchHistorialData(selectedWarehouse, startDate, endDate)}
            title="Buscar Ingresos"
            className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
          >
            <span className="material-symbols-outlined text-2xl font-bold">search</span>
          </button>
        </div>
      </div>

      {/* Main Data Canvas / Diseño de Tablas Unificado (AGENTS.md) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Cabecera Superior de Tabla con Buscador tipo Píldora */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">history</span>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-headline">
              Historial de Ingresos ({historialList.length} registros)
            </span>
          </div>

          {/* Buscador de Tabla Interno Estandarizado */}
          <div className="relative group w-full sm:w-48 sm:ml-2">
            <input
              type="text"
              placeholder="BUSCAR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Tabla Compacta y Responsiva */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-850/50">
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  N°
                </td>
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  PRODUCTO / INSUMO
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  DETALLE PRODUCTO
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                  CANT. INGRESADA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  UNIDAD MEDIDA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  VENCIMIENTO
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  REGISTRADO POR
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {paginatedItems.map((item, idx) => {
                const globalIdx = (page - 1) * pageSize + idx;

                return (
                  <tr
                    key={`${item.ID_PRODUCTO}-${item.ID_PRODUCTO_DETALLE}-${item.ID_PRODUCTO_INTERMEDIO}-${idx}`}
                    className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/30 transition-colors group"
                  >
                    <td className="pl-6 pr-2 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                      <span>{globalIdx + 1}</span>
                    </td>
                    <td className="pl-6 pr-2 py-1 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {item.PRODUCTO || '-'}
                    </td>
                    <td className="px-4 py-1 text-xs text-zinc-600 dark:text-zinc-350 font-medium">
                      {item.PRODUCTO_DETALLE || item.PRODUCTO || '-'}
                    </td>
                    <td className="px-4 py-1 text-right font-black text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{(Number(item.CANTIDAD) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-1 text-zinc-600 dark:text-zinc-400 uppercase text-[11px] font-medium whitespace-nowrap">
                      {item.UNIDAD_MEDIDA || '-'}
                    </td>
                    <td className="px-4 py-1 text-zinc-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {formatDate(item.FECHA_VENCIMIENTO)}
                    </td>
                    <td className="px-4 py-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-zinc-400">person</span>
                        <span>{item.USUARIO_REGISTRA || 'SISTEMA'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-zinc-400">history_toggle_off</span>
                    <p className="text-sm font-bold">No se encontraron registros de ingreso manual en el rango seleccionado.</p>
                    <p className="text-xs text-zinc-400 mt-1">Seleccione otro almacén o rango de fechas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination (Estándar Oficial AGENTS.md) */}
        {!isLoading && totalItems > 0 && (
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
                  <option value={100}>100 filas</option>
                </select>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Mostrando {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalItems)} de {totalItems} registros
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

      {/* Modal Nuevo Ingreso */}
      <ModalNuevoIngresoManual
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        warehouses={warehouses}
        initialWarehouse={selectedWarehouse}
        onSuccess={() => {
          if (selectedWarehouse) {
            fetchHistorialData(selectedWarehouse, startDate, endDate);
          }
        }}
      />
    </div>
  );
};

export default IngresoManualStock;

/**
 * DevolucionAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, control y registro de devoluciones de productos e inventario
 *    hacia los almacenes de la planta. Permite consultar el historial de operaciones
 *    filtradas por almacén y rango de fechas, validar el stock disponible en tiempo real
 *    y registrar devoluciones con cantidades y detalles exactos.
 *
 * 2. APIs Utilizadas:
 *    - GET /v1/devolucion-producto/areas (loadApiGetAreas - Áreas habilitadas)
 *    - GET /v1/devolucion-producto/almacenes (loadApiGetAlmacenes - Almacenes asignados al usuario)
 *    - GET /v1/devolucion-producto/almacenes/activos (loadApiGetAlmacenesActivos - Catálogo de almacenes)
 *    - GET /v1/devolucion-producto/productos-stock (loadApiGetProductosStock - Stock disponible para devolución)
 *    - POST /v1/devolucion-producto/devoluciones (loadApiRegistrarDevolucion - Registrar devolución)
 *    - GET /v1/devolucion-producto/devoluciones (loadApiGetDevoluciones - Historial de devoluciones)
 *
 * 3. Controles Clave:
 *    - Tabla unificada compacta y responsiva según el estándar oficial de AGENTS.md.
 *    - Buscador tipo píldora en la cabecera superior derecha de la tabla.
 *    - Filtro compuesto por almacén y rango de fechas con botón estandarizado de búsqueda con icono.
 *    - Limpieza automática de la lista al cambiar de almacén o fechas hasta presionar Buscar.
 *    - Paginación dinámica con selector de filas por página (5, 10, 20, 50).
 *    - Botones de acción tipo icono estandarizados con paleta corporativa para ver detalle.
 *    - Modales ubicados en components/ (ModalNuevaDevolucion y ModalDetalleDevolucion).
 *    - Formato de fechas DD/MM/YYYY sin desfase de zona horaria.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import {
  useDevolucionAlmacenesServices,
  DevolucionItem,
} from './services/useDevolucionAlmacen';
import { ModalNuevaDevolucion } from './components/ModalNuevaDevolucion';
import { ModalDetalleDevolucion } from './components/ModalDetalleDevolucion';

export const DevolucionAlmacen: React.FC = () => {
  const {
    loadApiGetAreas,
    loadApiGetAlmacenes,
    loadApiGetDevoluciones,
  } = useDevolucionAlmacenesServices();

  // Estados principales
  const [devolucionesList, setDevolucionesList] = useState<DevolucionItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros superiores
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Búsqueda en tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingDevolucion, setViewingDevolucion] = useState<DevolucionItem | null>(null);

  // Cargar catálogos iniciales
  const fetchInitialData = async () => {
    setIsLoading(true);
    const [whRes, areasRes] = await Promise.all([
      loadApiGetAlmacenes(),
      loadApiGetAreas(),
    ]);

    let loadedWh: any[] = [];
    if (whRes && whRes.success && Array.isArray(whRes.data)) {
      loadedWh = whRes.data;
    } else if (Array.isArray(whRes)) {
      loadedWh = whRes;
    }
    setWarehouses(loadedWh);

    let loadedAreas: any[] = [];
    if (areasRes && areasRes.success && Array.isArray(areasRes.areas)) {
      loadedAreas = areasRes.areas;
    } else if (Array.isArray(areasRes)) {
      loadedAreas = areasRes;
    }
    setAreas(loadedAreas);

    const initialWh = loadedWh.length > 0 ? loadedWh[0] : null;
    setSelectedWarehouse(initialWh);

    if (initialWh) {
      await fetchDevoluciones(initialWh);
    }
    setIsLoading(false);
  };

  const fetchDevoluciones = async (wh = selectedWarehouse) => {
    if (!wh?.ID_PLANTA_ALMACEN) {
      setDevolucionesList([]);
      return;
    }
    setIsLoading(true);
    try {
      const fechaInicioStr = startDate && startDate.isValid() ? startDate.format('YYYY-MM-DD') : '';
      const fechaFinStr = endDate && endDate.isValid() ? endDate.format('YYYY-MM-DD') : '';

      const res = await loadApiGetDevoluciones({
        id_planta_almacen: wh.ID_PLANTA_ALMACEN,
        fecha_inicio: fechaInicioStr,
        fecha_fin: fechaFinStr,
      });

      if (res && res.success && Array.isArray(res.productos)) {
        setDevolucionesList(res.productos);
      } else if (Array.isArray(res)) {
        setDevolucionesList(res);
      } else {
        setDevolucionesList([]);
      }
      setPage(1);
    } catch {
      setDevolucionesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const formatTimeDisplay = (dateStr?: string, fallbackHour?: string) => {
    const target = (dateStr && (dateStr.includes('T') || dateStr.includes(' '))) ? dateStr : fallbackHour;
    if (!target) return '';
    if (target.includes('T')) {
      const timePart = target.split('T')[1];
      return timePart.split('.')[0].replace('Z', '');
    }
    if (target.includes(' ')) {
      return target.split(' ')[1].split('.')[0];
    }
    if (target.includes(':')) {
      return target.split('.')[0];
    }
    return '';
  };

  // Filtrado por buscador tipo píldora
  const filteredDevoluciones = useMemo(() => {
    if (!searchTerm.trim()) return devolucionesList;
    const query = searchTerm.toLowerCase().trim();

    return devolucionesList.filter((item) => {
      const almacen = (item.ALMACEN || item.NOMBRE_ALMACEN || '').toLowerCase();
      const area = (item.AREA || item.NOMBRE_AREA || '').toLowerCase();
      const usuario = (item.USUARIO || item.NOMBRE_USUARIO || '').toLowerCase();
      const motivo = (item.MOTIVO || '').toLowerCase();
      const id = String(item.ID_DOCUMENTO_DEVOLUCION || item.ID_DEVOLUCION || '');

      return (
        almacen.includes(query) ||
        area.includes(query) ||
        usuario.includes(query) ||
        motivo.includes(query) ||
        id.includes(query)
      );
    });
  }, [devolucionesList, searchTerm]);

  // Paginación
  const totalItems = filteredDevoluciones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedDevoluciones = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDevoluciones.slice(start, start + pageSize);
  }, [filteredDevoluciones, page, pageSize]);

  const handleOpenDetail = (item: DevolucionItem) => {
    setViewingDevolucion(item);
    setIsDetailModalOpen(true);
  };

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'FECHA REGISTRO', key: 'fecha', width: 16 },
      { header: 'HORA', key: 'hora', width: 12 },
      { header: 'ÁREA', key: 'area', width: 25 },
      { header: 'USUARIO', key: 'usuario', width: 25 },
    ];

    const rows = filteredDevoluciones.map((item, idx) => ({
      index: idx + 1,
      fecha: formatDateDisplay(item.FECHA_REGISTRO),
      hora: formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO) || '-',
      area: item.AREA || item.NOMBRE_AREA || '-',
      usuario: item.USUARIO || item.NOMBRE_USUARIO || '-',
    }));

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Devoluciones_${selectedWarehouse?.DESCRICION || 'Almacen'}_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'Devoluciones',
      title: 'HISTORIAL DE DEVOLUCIONES DE ALMACÉN',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'HISTORIAL DE DEVOLUCIONES DE ALMACÉN',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      orientation: 'portrait',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0 ">
      <LoadingOverlay show={isLoading} message="Cargando registros de devolución de almacén..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Devolución de Almacén
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestión y registro de retornos de inventario y productos hacia los almacenes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredDevoluciones.length === 0}
          />
          <Button
            variant="primary"
            size="sm"
            icon="add_circle"
            onClick={() => setIsNewModalOpen(true)}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Registrar Devolución
          </Button>
        </div>
      </div>

      {/* ── Selector de Almacén y Fechas Estandarizado (AGENTS.md) ── */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
        <div className="flex bg-surface p-3.5 rounded-2xl border border-outline-variant shadow-sm gap-3 items-end flex-col sm:flex-row flex-1">
          {/* Selector de Almacén */}
          <div className="w-full sm:flex-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén
            </label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                setDevolucionesList([]);
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
                setDevolucionesList([]);
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
                      }
                    }
                  }
                }
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
                setDevolucionesList([]);
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
                      }
                    }
                  }
                }
              }}
            />
          </div>

          {/* Botón Buscar Exacto */}
          <button
            type="button"
            onClick={() => fetchDevoluciones(selectedWarehouse)}
            title="Buscar Devoluciones"
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
              Historial de Devoluciones ({totalItems})
            </p>
          </div>

          {/* Buscador de Tabla Interno tipo píldora */}
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
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 whitespace-nowrap">
                  N°
                </td>
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200">
                  Fecha / Hora
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200">
                  Área
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200">
                  Usuario
                </td>
                <td className="pr-6 pl-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-right whitespace-nowrap">
                  Acciones
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginatedDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
                      assignment_return
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider">
                      No se encontraron devoluciones registradas
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                      Seleccione un almacén y consulte el rango de fechas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDevoluciones.map((item, idx) => {
                  const itemNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.ID_DOCUMENTO_DEVOLUCION || item.ID_DEVOLUCION || idx}
                      className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/30 transition-colors group"
                    >
                      <td className="pl-6 pr-2 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemNumber}</span>
                      </td>
                      <td className="pl-6 pr-2 py-1 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                          {formatDateDisplay(item.FECHA_REGISTRO)}
                        </span>
                        {formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO) && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                            {formatTimeDisplay(item.FECHA_REGISTRO, item.HORA_REGISTRO)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-1">
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">
                          {item.AREA || item.NOMBRE_AREA || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-1">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {item.USUARIO || item.NOMBRE_USUARIO || '-'}
                        </span>
                      </td>
                      <td className="pr-6 pl-4 py-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            title="Ver Detalle de Devolución"
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

        {/* ── Paginación Estándar Inferior ── */}
        {!isLoading && devolucionesList?.length > 0 && (
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

      {/* ── Modal Nueva Devolución ── */}
      <ModalNuevaDevolucion
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        warehouses={warehouses}
        areas={areas}
        defaultWarehouse={selectedWarehouse}
        onSaveSuccess={() => fetchDevoluciones(selectedWarehouse)}
      />

      {/* ── Modal Detalle Devolución ── */}
      <ModalDetalleDevolucion
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingDevolucion(null);
        }}
        item={viewingDevolucion}
      />
    </div>
  );
};

export default DevolucionAlmacen;

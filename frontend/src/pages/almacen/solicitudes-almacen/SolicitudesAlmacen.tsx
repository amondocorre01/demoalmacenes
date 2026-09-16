/**
 * SolicitudesAlmacen.tsx
 * 
 * 1. Propósito de la vista:
 *    Gestión, registro y seguimiento de solicitudes de pedidos internos de insumos y materiales
 *    entre áreas de producción y almacenes de la planta. Permite consultar el historial de pedidos
 *    filtrados por almacén y rango de fechas, registrar nuevas solicitudes validando stock real
 *    y visualizar el desglose detallado de cada pedido.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/pedidos/almacenes (loadApiGetAlmacenesUsuario - Listar almacenes del usuario)
 *    - GET /v1/inventario/produccion/areas (loadApiGetAreasUsuario - Listar áreas habilitadas)
 *    - GET /v1/pedidos/pedidos-almacen (loadApiGetPedidosAlmacen - Listar solicitudes con filtros)
 *    - GET /v1/pedidos/productos-planta-almacen (loadApiGetProductosPlantaAlmacen - Catálogo y stock de almacén)
 *    - GET /v1/pedidos/inventario-planta (loadApiGetInventarioPlanta - Inventario disponible en planta)
 *    - POST /v1/pedidos/solicitudes (loadApiEnviarSolicitud - Registrar nueva solicitud)
 *    - PUT /v1/pedidos/solicitudes (loadApiEditarSolicitud - Modificar cantidades de solicitud)
 * 
 * 3. Controles Clave:
 *    - Tabla unificada compacta y responsiva según las directrices oficiales de AGENTS.md.
 *    - Buscador tipo píldora en la cabecera superior derecha de la tabla.
 *    - Filtro compuesto por almacén y rango de fechas con botón estandarizado de búsqueda con icono.
 *    - Paginación dinámica con control de tamaño de página (5, 10, 20, 50 filas).
 *    - Botones de acción tipo icono estandarizados con paleta corporativa para ver detalle y editar.
 *    - Modales ubicados en components/ (ModalNuevaSolicitud y ModalDetalleSolicitud).
 *    - Manejo estricto de fechas en formato DD/MM/YYYY sin desfase de zona horaria.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import {
  useSolicitudesAlmacenServices,
  SolicitudAlmacenItem,
} from './services/useSolicitudesAlmacen';
import { ModalNuevaSolicitud } from './components/ModalNuevaSolicitud';
import { ModalDetalleSolicitud } from './components/ModalDetalleSolicitud';
import ConsoleLogMessage from '../../../config/console';

export const SolicitudesAlmacen: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetAreasUsuario,
    loadApiGetPedidosAlmacen,
  } = useSolicitudesAlmacenServices();

  // Estados de datos principales
  const [requestsList, setRequestsList] = useState<SolicitudAlmacenItem[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtros superiores
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Búsqueda en tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estados de modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SolicitudAlmacenItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<SolicitudAlmacenItem | null>(null);

  // Carga inicial de catálogos
  const fetchInitialData = async () => {
    setIsLoading(true);
    const [almacenesRes, areasRes] = await Promise.all([
      loadApiGetAlmacenesUsuario(),
      loadApiGetAreasUsuario(),
    ]);
    ConsoleLogMessage("almacenes usuario", almacenesRes)
    let loadedWarehouses: any[] = [];
    if (Array.isArray(almacenesRes)) {
      loadedWarehouses = almacenesRes;
    } else if (almacenesRes?.almacenes || almacenesRes?.data) {
      loadedWarehouses = almacenesRes.almacenes || almacenesRes.data;
    }
    setWarehousesList(loadedWarehouses);

    let loadedAreas: any[] = [];
    if (Array.isArray(areasRes)) {
      loadedAreas = areasRes;
    } else if (areasRes?.areas || areasRes?.data) {
      loadedAreas = areasRes.areas || areasRes.data;
    }
    setAreasList(loadedAreas);

    // Cargar pedidos iniciales
    await fetchPedidos(selectedWarehouse);
    setIsLoading(false);
  };

  // Carga de solicitudes con filtros
  const fetchPedidos = async (wh = selectedWarehouse) => {
    setIsLoading(true);
    try {
      const fechaInicioStr = startDate && startDate.isValid() ? startDate.format('YYYY-MM-DD') : '';
      const fechaFinStr = endDate && endDate.isValid() ? endDate.format('YYYY-MM-DD') : '';

      const res = await loadApiGetPedidosAlmacen({
        id_planta_almacen: wh?.ID_PLANTA_ALMACEN || undefined,
        almacenes: wh?.ID_PLANTA_ALMACEN ? String(wh.ID_PLANTA_ALMACEN) : '',
        fecha_inicio: fechaInicioStr,
        fecha_fin: fechaFinStr,
      });

      if (Array.isArray(res)) {
        setRequestsList(res);
      } else if (res?.pedidos || res?.data) {
        setRequestsList(res.pedidos || res.data);
      } else {
        setRequestsList([]);
      }
      setPage(1);
    } catch (err) {
      setRequestsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Formatear fechas para visualización sin desfase de zona horaria
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  // Formatear hora para visualización extrayendo solo el tiempo (evitando 1970-01-01T...)
  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1];
      return timePart.split('.')[0].replace('Z', '');
    }
    return timeStr.split('.')[0];
  };

  // Filtrado de solicitudes por buscador interno tipo píldora
  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) return requestsList;
    const query = searchTerm.toLowerCase().trim();

    return requestsList.filter((req) => {
      const warehouse = (req.ALMACEN || '').toLowerCase();
      const user = (req.NOMBRE_USUARIO || '').toLowerCase();
      const area = (req.NOMBRE_AREA || '').toLowerCase();
      const id = String(req.ID_PLANTA_ALMACEN_DOCUMENTO || '');
      const status = String(req.ESTADO || '').toLowerCase();

      return (
        warehouse.includes(query) ||
        user.includes(query) ||
        area.includes(query) ||
        id.includes(query) ||
        status.includes(query)
      );
    });
  }, [requestsList, searchTerm]);

  // Paginación
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  // Abrir modal de detalle
  const handleOpenDetail = (item: SolicitudAlmacenItem) => {
    setViewingRequest(item);
    setIsDetailModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEdit = (item: SolicitudAlmacenItem) => {
    setEditingRequest(item);
    setIsNewModalOpen(true);
  };

  // Abrir modal de nueva solicitud
  const handleOpenNew = () => {
    setEditingRequest(null);
    setIsNewModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0">
      <LoadingOverlay show={isLoading} message="Cargando solicitudes..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Solicitudes de Almacén
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestione y rastree los pedidos internos de insumos entre áreas y almacenes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="add_circle"
          onClick={handleOpenNew}
          className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
        >
          Nueva Solicitud
        </Button>
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
              options={warehousesList}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                setRequestsList([]);
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
                <TextField {...params} variant="outlined" size="small" placeholder="TODOS LOS ALMACENES" />
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
                setRequestsList([]);
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
                setRequestsList([]);
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
            onClick={() => fetchPedidos(selectedWarehouse)}
            title="Buscar Solicitudes"
            className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
          >
            <span className="material-symbols-outlined text-2xl font-bold">search</span>
          </button>
        </div>
      </div>

      {/* ── Main Data Canvas (Tabla Unificada) ── */}
      <div className="bg-surface rounded-[1rem] border border-outline-variant shadow-sm overflow-hidden mb-4">
        {/* Cabecera Superior de la Tabla */}
        <div className="p-3 sm:p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-variant/20">
          <div>
            <p className="text-[11px] font-black text-on-surface uppercase tracking-widest font-headline">
              Historial de Solicitudes
            </p>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
              Total encontrados: {totalItems} registros
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
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-850/40 border-b border-outline-variant">
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  N°
                </td>
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Almacén Destino
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Fecha Registro
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Solicitado Por
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Fecha Entrega
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Área Solicitante
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                  Estado
                </td>
                <td className="pr-6 pl-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">
                  Acciones
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
                      inbox
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider">
                      No se encontraron solicitudes registradas
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                      Intente ajustar los filtros de almacén o fechas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req, idx) => {
                  const itemNumber = (page - 1) * pageSize + idx + 1;
                  const isDelivered =
                    req.ESTADO === 1 || req.ESTADO === '1' || req.ESTADO === 'ENTREGADO';

                  return (
                    <tr
                      key={req.ID_PLANTA_ALMACEN_DOCUMENTO || idx}
                      className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/30 transition-colors group"
                    >
                      <td className="pl-6 pr-2 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemNumber}</span>
                      </td>
                      <td className="pl-6 pr-2 py-1">
                        <span className="font-black text-xs text-on-surface uppercase tracking-tight">
                          {req.ALMACEN || `Almacén #${req.ID_PLANTA_ALMACEN || '-'}`}
                        </span>
                      </td>
                      <td className="px-4 py-1 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                          {formatDateDisplay(req.FECHA_REGISTRO)}
                        </span>
                        {req.HORA_REGISTRO && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                            {formatTimeDisplay(req.HORA_REGISTRO)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-1">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {req.NOMBRE_USUARIO || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-1 whitespace-nowrap">
                        <span className="text-[11px] font-black text-primary uppercase">
                          {formatDateDisplay(req.FECHA_A_ENTREGAR)}
                        </span>
                      </td>
                      <td className="px-4 py-1">
                        <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {req.AREA || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isDelivered
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                        >
                          {isDelivered ? 'ENTREGADO' : 'SOLICITADO'}
                        </span>
                      </td>
                      <td className="pr-6 pl-4 py-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(req)}
                            title="Ver Detalle de Solicitud"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px] sm:text-base">
                              visibility
                            </span>
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(req)}
                            title="Editar Solicitud"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px] sm:text-base">
                              edit
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
        {!isLoading && requestsList.length > 0 && (
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

      {/* ── Modal Nueva / Editar Solicitud ── */}
      <ModalNuevaSolicitud
        open={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingRequest(null);
        }}
        warehouses={warehousesList}
        areas={areasList}
        onSaveSuccess={() => fetchPedidos(selectedWarehouse)}
        editItem={editingRequest}
      />

      {/* ── Modal Detalle Solicitud ── */}
      <ModalDetalleSolicitud
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingRequest(null);
        }}
        item={viewingRequest}
      />
    </div>
  );
};

export default SolicitudesAlmacen;

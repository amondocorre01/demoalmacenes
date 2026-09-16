/**
 * TransferenciaInsumos.tsx
 * 
 * 1. Propósito de la vista:
 *    Gestión, control y registro de movimientos de transferencia de Insumos y Materias Primas
 *    entre los almacenes y centros de acopio de la planta. Permite consultar el historial de operaciones
 *    filtradas por almacén y rango de fechas, consultar el stock real en almacén de origen y registrar
 *    transferencias con descuento de inventario en origen y registro de entrada en destino.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/transferencia/usuarios/almacenes (loadApiGetAlmacenesUsuario - Almacenes autorizados)
 *    - GET /v1/transferencia/almacenes-activos (loadApiGetAlmacenesActivos - Catálogo de almacenes destino)
 *    - GET /v1/transferencia/insumos/transferencias (loadApiGetTransferenciasInsumos - Historial de transferencias)
 *    - GET /v1/transferencia/insumos/stock (loadApiGetStockInsumos - Stock de insumos por almacén)
 *    - POST /v1/transferencia/registrar-transferencia (loadApiRegistrarTransferencia - Registrar transferencia)
 * 
 * 3. Controles Clave:
 *    - Tabla unificada compacta y responsiva según el estándar oficial de AGENTS.md.
 *    - Buscador tipo píldora en la cabecera superior derecha de la tabla.
 *    - Filtro compuesto por almacén y rango de fechas con botón estandarizado de búsqueda con icono.
 *    - Paginación dinámica con selector de filas por página (5, 10, 20, 50).
 *    - Botones de acción tipo icono estandarizados con paleta corporativa para ver detalle.
 *    - Modales ubicados en components/ (ModalNuevaTransferenciaInsumos y ModalDetalleTransferenciaInsumos).
 *    - Formato de fechas DD/MM/YYYY sin desfase de zona horaria.
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
  useTransferenciaAlmacenInsumosServices,
  TransferenciaInsumoItem,
} from './services/useTransferenciaInsumos';
import { ModalNuevaTransferenciaInsumos } from './components/ModalNuevaTransferenciaInsumos';
import { ModalDetalleTransferenciaInsumos } from './components/ModalDetalleTransferenciaInsumos';

export const TransferenciaInsumos: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetAlmacenesActivos,
    loadApiGetTransferenciasInsumos,
  } = useTransferenciaAlmacenInsumosServices();

  // Estados principales
  const [transfersList, setTransfersList] = useState<TransferenciaInsumoItem[]>([]);
  const [userWarehouses, setUserWarehouses] = useState<any[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<any[]>([]);
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
  const [viewingTransfer, setViewingTransfer] = useState<TransferenciaInsumoItem | null>(null);

  // Cargar catálogos iniciales
  const fetchInitialData = async () => {
    setIsLoading(true);
    const [userWhRes, allWhRes] = await Promise.all([
      loadApiGetAlmacenesUsuario(),
      loadApiGetAlmacenesActivos(),
    ]);

    let loadedUserWh: any[] = [];
    if (userWhRes && userWhRes.success && Array.isArray(userWhRes.data)) {
      loadedUserWh = userWhRes.data;
    } else if (Array.isArray(userWhRes)) {
      loadedUserWh = userWhRes;
    }
    setUserWarehouses(loadedUserWh);

    let loadedAllWh: any[] = [];
    if (allWhRes && allWhRes.success && Array.isArray(allWhRes.data)) {
      loadedAllWh = allWhRes.data;
    } else if (Array.isArray(allWhRes)) {
      loadedAllWh = allWhRes;
    }
    setAllWarehouses(loadedAllWh);

    const initialWh = loadedUserWh.length > 0 ? loadedUserWh[0] : null;
    setSelectedWarehouse(initialWh);

    if (initialWh) {
      await fetchTransferencias(initialWh);
    }
    setIsLoading(false);
  };

  const fetchTransferencias = async (wh = selectedWarehouse) => {
    if (!wh?.ID_PLANTA_ALMACEN) {
      setTransfersList([]);
      return;
    }
    setIsLoading(true);
    try {
      const fechaInicioStr = startDate && startDate.isValid() ? startDate.format('YYYY-MM-DD') : '';
      const fechaFinStr = endDate && endDate.isValid() ? endDate.format('YYYY-MM-DD') : '';

      const res = await loadApiGetTransferenciasInsumos({
        id_planta_almacen: wh.ID_PLANTA_ALMACEN,
        fecha_inicio: fechaInicioStr,
        fecha_fin: fechaFinStr,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setTransfersList(res.data);
      } else if (Array.isArray(res)) {
        setTransfersList(res);
      } else {
        setTransfersList([]);
      }
      setPage(1);
    } catch (err) {
      setTransfersList([]);
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

  const renderEstadoBadge = (estado?: number | string) => {
    const estadoNum = Number(estado);
    if (estadoNum === 4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          TRANSFERIDO
        </span>
      );
    }
    if (estadoNum === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          EN CAMINO
        </span>
      );
    }
    if (estadoNum === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          STOCK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        {estado ? `ESTADO ${estado}` : '-'}
      </span>
    );
  };

  const renderOperacionBadge = (envio?: number | string) => {
    const envioNum = Number(envio);
    if (envioNum === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Recibido
        </span>
      );
    }
    if (envioNum === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
          Enviado
        </span>
      );
    }
    if (envioNum === 2) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          En Camino
        </span>
      );
    }
    if (envioNum === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        -
      </span>
    );
  };

  // Filtrado por buscador tipo píldora
  const filteredTransfers = useMemo(() => {
    if (!searchTerm.trim()) return transfersList;
    const query = searchTerm.toLowerCase().trim();

    return transfersList.filter((item) => {
      const origen = (item.ORIGEN || item.ALMACEN_ORIGEN || '').toLowerCase();
      const destino = (item.DESTINO || item.ALMACEN_DESTINO || '').toLowerCase();
      const user = (item.USUARIO || item.NOMBRE_USUARIO || '').toLowerCase();
      const id = String(item.ID_DOCUMENTO_TRANSFERENCIA || '');

      return (
        origen.includes(query) ||
        destino.includes(query) ||
        user.includes(query) ||
        id.includes(query)
      );
    });
  }, [transfersList, searchTerm]);

  // Paginación
  const totalItems = filteredTransfers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTransfers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, page, pageSize]);

  const handleOpenDetail = (item: TransferenciaInsumoItem) => {
    setViewingTransfer(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0">
      <LoadingOverlay show={isLoading} message="Cargando transferencias de insumos..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-1">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Transferencia de Insumos
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestión y registro de movimientos de materia prima e insumos entre almacenes.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="swap_horiz"
          onClick={() => setIsNewModalOpen(true)}
          className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
        >
          Nueva Transferencia
        </Button>
      </div>

      {/* ── Selector de Almacén y Fechas Estandarizado (AGENTS.md) ── */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-2">
        <div className="flex bg-surface p-3.5 rounded-2xl border border-outline-variant shadow-sm gap-3 items-end flex-col sm:flex-row flex-1">
          {/* Selector de Almacén */}
          <div className="w-full sm:flex-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén Origen
            </label>
            <Autocomplete
              options={userWarehouses}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                setTransfersList([]);
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

          {/* Fecha Inicio */}
          <div className="w-full sm:w-48 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Fecha Inicio
            </label>
            <DatePicker
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                setTransfersList([]);
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
                setTransfersList([]);
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
            onClick={() => fetchTransferencias(selectedWarehouse)}
            title="Buscar Transferencias"
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
              Historial de Transferencias
            </p>
            <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
              Total encontrados: {totalItems} movimientos
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
                  Fecha / Hora
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Almacén Destino
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Usuario
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                  Operación
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
              {paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
                      swap_horiz
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider">
                      No se encontraron transferencias de insumos registradas
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                      Seleccione un almacén origen y consulte el rango de fechas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map((item, idx) => {
                  const itemNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={item.ID_DOCUMENTO_TRANSFERENCIA || idx}
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
                        <span className="font-black text-xs text-primary uppercase tracking-tight">
                          {item.DESTINO || item.ALMACEN_DESTINO || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-1">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          {item.USUARIO || item.NOMBRE_USUARIO || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-center">
                        {renderOperacionBadge(item.ENVIO)}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {renderEstadoBadge(item.ESTADO)}
                      </td>
                      <td className="pr-6 pl-4 py-1 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            title="Ver Detalle de Transferencia"
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
        {!isLoading && transfersList.length > 0 && (
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

      {/* ── Modal Nueva Transferencia Insumos ── */}
      <ModalNuevaTransferenciaInsumos
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        userWarehouses={userWarehouses}
        allWarehouses={allWarehouses}
        defaultOriginWarehouse={selectedWarehouse}
        onSaveSuccess={() => fetchTransferencias(selectedWarehouse)}
      />

      {/* ── Modal Detalle Transferencia Insumos ── */}
      <ModalDetalleTransferenciaInsumos
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingTransfer(null);
        }}
        item={viewingTransfer}
      />
    </div>
  );
};

export default TransferenciaInsumos;

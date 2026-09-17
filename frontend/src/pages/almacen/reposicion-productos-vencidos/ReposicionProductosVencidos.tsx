/**
 * ReposicionProductosVencidos.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión y auditoría de reposición de productos e insumos vencidos en almacenes.
 *    Permite visualizar los registros de desperdicio generados por expiración y
 *    asignar o modificar el usuario responsable que asume el costo del producto.
 *
 * 2. APIs Utilizadas:
 *    - GET /v1/inventario/declaracion/almacenes?id_planta_almacen=0 (loadApiGetAlmacenes - Almacenes permitidos)
 *    - GET /v1/inventario/rep-desp/desperdicios (loadApiGetDesperdicios - Listado de desperdicios con filtros)
 *    - POST /v1/inventario/rep-desp/asignar-responsable-desperdicio (loadApiAsignarResponsableDesperdicio - Asignar usuario)
 *
 * 3. Controles Clave y Reglas de Negocio:
 *    - Regla de Restricción de Fecha para Responsable:
 *      * Perfiles 'Encargado de Almacén' y 'Supervisor Almacén': Solo pueden modificar/asignar
 *        responsable si el registro corresponde al MES ACTUAL. Si corresponde al MES ANTERIOR,
 *        solo se permite durante los PRIMEROS 5 DÍAS del mes en curso.
 *      * Perfiles 'Global', 'Sistemas' o 'Administrador': Pueden modificar/asignar sin ninguna
 *        restricción temporal.
 *    - Filtro por Almacén mediante Autocomplete de MUI con opción para todos los almacenes.
 *    - Filtro por rango de fechas (Fecha Inicio y Fecha Fin) y estado.
 *    - Métricas interactivas y visualización compacta y responsiva estandarizada.
 *    - Modal estandarizado para selección y asignación de usuario responsable.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Autocomplete, TextField, Tooltip, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  useReposicionProductosVencidosServices,
  AlmacenItem,
  DesperdicioItem,
  UsuarioItem,
} from './services/useReposicionProductosVencidos';
import { ModalAsignarResponsable } from './components/ModalAsignarResponsable';
import { ModalSeleccionarAlmacenes } from './components/ModalSeleccionarAlmacenes';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';

interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export interface EstadoFiltroItem {
  id: number;
  nombre: string;
}

export const ESTADOS_FILTRO: EstadoFiltroItem[] = [
  { id: 0, nombre: 'TODOS' },
  { id: 1, nombre: 'POR VENCIMIENTO' },
  { id: 2, nombre: 'POR DESCUADRE' },
];

const ALL_WAREHOUSES_OPTION: AlmacenItem = {
  ID_PLANTA_ALMACEN: 0,
  DESCRICION: 'TODOS LOS ALMACENES',
};

/**
 * Valida si el usuario en sesión tiene permisos para editar/asignar el responsable
 * según la fecha de registro y su perfil/rol.
 */
export const checkEditResponsablePermission = (
  fechaRegistroStr?: string,
  userProfile?: any
): PermissionCheck => {
  if (!fechaRegistroStr) {
    return { allowed: false, reason: 'Fecha de registro no disponible' };
  }

  // Detectar roles / perfil del usuario
  const role = (
    userProfile?.PERFIL ||
    userProfile?.perfil ||
    userProfile?.ROLES ||
    userProfile?.roles ||
    userProfile?.cargo ||
    userProfile?.CARGO ||
    userProfile?.rol ||
    userProfile?.ROL ||
    userProfile?.nombre_perfil ||
    userProfile?.NOMBRE_PERFIL ||
    ''
  ).toString().toUpperCase();

  // Si es perfil global, sistemas o administrador, no tiene restricción
  const isGlobalOrAdmin =
    role.includes('SISTEMA') ||
    role.includes('ADMIN') ||
    role.includes('GLOBAL') ||
    role.includes('DESARROLLADOR') ||
    role.includes('DEVELOPER');

  if (isGlobalOrAdmin) {
    return { allowed: true };
  }

  // Parsear fecha registro limpia
  const cleanDateStr = fechaRegistroStr.split('T')[0].split(' ')[0];
  const regDate = dayjs(cleanDateStr);
  if (!regDate.isValid()) {
    return { allowed: false, reason: 'Fecha de registro inválida' };
  }

  const now = dayjs();

  // 1. Mismo mes y mismo año
  const isSameMonth = regDate.isSame(now, 'month') && regDate.isSame(now, 'year');
  if (isSameMonth) {
    return { allowed: true };
  }

  // 2. Mes inmediatamente anterior
  const prevMonth = now.subtract(1, 'month');
  const isPrevMonth = regDate.isSame(prevMonth, 'month') && regDate.isSame(prevMonth, 'year');

  if (isPrevMonth) {
    const currentDay = now.date();
    if (currentDay <= 5) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Solo se permite modificar registros del mes anterior hasta el día 5 del mes actual (hoy es día ${currentDay}).`,
    };
  }

  // 3. Meses más antiguos
  return {
    allowed: false,
    reason: 'Solo se pueden modificar registros del mes en curso o los primeros 5 días del mes si corresponden al mes anterior.',
  };
};

export const ReposicionProductosVencidos: React.FC = () => {
  const {
    loadApiGetAlmacenes,
    loadApiGetDesperdicios,
    loadApiAsignarResponsableDesperdicio,
  } = useReposicionProductosVencidosServices();

  // Usuario en sesión
  const [userProfile, setUserProfile] = useState<any>(null);

  // Estados de datos
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<AlmacenItem[]>([
    ALL_WAREHOUSES_OPTION,
  ]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('month'));
  const [selectedEstado, setSelectedEstado] = useState<EstadoFiltroItem>(ESTADOS_FILTRO[0]);

  const [itemsList, setItemsList] = useState<DesperdicioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAssigningId, setIsAssigningId] = useState<number | null>(null);

  // Control para pruebas: true = valida restricción de fecha, false = visualiza y permite editar normal
  const [controlarRestriccionFecha, setControlarRestriccionFecha] = useState<boolean>(false);

  // Modal Selección Almacenes
  const [modalAlmacenesOpen, setModalAlmacenesOpen] = useState<boolean>(false);

  // Modal Asignación
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<DesperdicioItem | null>(null);

  // Filtros de tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [kpiFilter, setKpiFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserProfile(parsed);
      } catch (e) {
        console.error('Error parseando usuario de localStorage:', e);
      }
    }
  }, []);

  // Cargar almacenes disponibles
  useEffect(() => {
    const fetchAlmacenes = async () => {
      setIsLoading(true);
      const res = await loadApiGetAlmacenes();
      const list = Array.isArray(res) ? res : ((res as any)?.datos || (res as any)?.data || []);
      if (list && list.length > 0) {
        setWarehouses(list);
      }
      setIsLoading(false);
    };
    fetchAlmacenes();
  }, []);

  // Consultar desperdicios (Solo cuando se presiona el botón Buscar)
  const handleFetchDesperdicios = useCallback(async () => {
    setIsLoading(true);
    try {
      const fi = startDate ? startDate.format('YYYY-MM-DD') : '';
      const ff = endDate ? endDate.format('YYYY-MM-DD') : '';

      // Si está seleccionado "TODOS LOS ALMACENES" o la lista está vacía, se envía un array vacío []
      const isAll =
        selectedWarehouses.length === 0 ||
        selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0);

      const almacenesParam = isAll
        ? []
        : selectedWarehouses.map((w) => w.ID_PLANTA_ALMACEN);

      const data = await loadApiGetDesperdicios({
        almacenes: almacenesParam,
        fecha_inicio: fi,
        fecha_fin: ff,
        id_estado: selectedEstado?.id ?? 0,
      });

      setItemsList(data || []);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedWarehouses, selectedEstado]);

  // Asignar responsable directamente en la tabla
  const handleInlineAssignResponsible = async (
    item: DesperdicioItem,
    newUser: UsuarioItem | null
  ) => {
    if (!newUser) return;
    const idDesperdicio =
      item.ID_PLANTA_DESPERDICIO_ALMACEN ||
      item.ID_DESPERDICIO_ALMACEN ||
      item.ID_DESPERDICIO ||
      0;

    if (!idDesperdicio) {
      showAlert.error('Error', 'No se pudo identificar el registro de desperdicio.');
      return;
    }

    setIsAssigningId(Number(idDesperdicio));
    const success = await loadApiAsignarResponsableDesperdicio({
      id_desperdicio_alamcen: Number(idDesperdicio),
      id_usuario: Number(newUser.ID_USUARIO),
    });
    setIsAssigningId(null);

    if (success) {
      setItemsList((prev) =>
        prev.map((row) => {
          const rowId =
            row.ID_PLANTA_DESPERDICIO_ALMACEN ||
            row.ID_DESPERDICIO_ALMACEN ||
            row.ID_DESPERDICIO;
          if (rowId === idDesperdicio) {
            return {
              ...row,
              ID_USUARIO_ASUMIDO: newUser.ID_USUARIO,
              USUARIO_ASUMIDO: newUser.NOMBRE_COMPLETO,
              USUARIO: newUser.NOMBRE_COMPLETO,
            };
          }
          return row;
        })
      );
      showAlert.success(
        'Responsable Asignado',
        `Se asignó a ${newUser.NOMBRE_COMPLETO} correctamente.`
      );
    }
  };

  // Abrir modal de asignación
  const handleOpenAssignModal = (item: DesperdicioItem) => {
    const perm = controlarRestriccionFecha
      ? checkEditResponsablePermission(item.FECHA_REGISTRO, userProfile)
      : { allowed: true };
    if (!perm.allowed) {
      return;
    }
    setSelectedItemForModal(item);
    setModalOpen(true);
  };

  // Filtrado interno en tabla (búsqueda y filtro interactivo por métricas)
  const filteredItems = useMemo(() => {
    return itemsList.filter((item) => {
      const userName = item.USUARIO_ASUMIDO || item.USUARIO || '';
      const hasResponsible =
        (item.ID_USUARIO_ASUMIDO && item.ID_USUARIO_ASUMIDO > 0) ||
        (userName.trim() !== '' && userName !== 'Sin asignar');

      // Filtrado por KPI seleccionado
      if (kpiFilter === 'assigned' && !hasResponsible) return false;
      if (kpiFilter === 'unassigned' && hasResponsible) return false;

      // Filtrado por buscador de texto
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const prod = (item.PRODUCTO || item.NOMBRE_PRODUCTO || item.NOMBRE_DETALLE || '').toLowerCase();
      const alm = (item.ALMACEN || item.DESCRICION || '').toLowerCase();
      const user = userName.toLowerCase();
      return prod.includes(term) || alm.includes(term) || user.includes(term);
    });
  }, [itemsList, kpiFilter, searchTerm]);

  // Paginación
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Métricas
  const totalAssumedCost = useMemo(() => {
    return itemsList.reduce((acc, curr) => acc + (Number(curr.TOTAL_ASUMIDO ?? curr.TOTAL ?? 0) || 0), 0);
  }, [itemsList]);

  const assignedCount = useMemo(() => {
    return itemsList.filter(
      (item) => (item.ID_USUARIO_ASUMIDO && item.ID_USUARIO_ASUMIDO > 0) || (item.USUARIO_ASUMIDO && item.USUARIO_ASUMIDO.trim() !== '' && item.USUARIO_ASUMIDO !== 'Sin asignar')
    ).length;
  }, [itemsList]);

  const unassignedCount = useMemo(() => {
    return itemsList.length - assignedCount;
  }, [itemsList.length, assignedCount]);

  // Formato seguro de fecha DD/MM/YYYY sin desfase horario
  const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const clean = dateString.split('T')[0].split(' ')[0];
      const [year, month, day] = clean.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Formato seguro de fecha y hora DD/MM/YYYY con HH:mm:ss
  const formatDateTimeDisplay = (dateString?: string): { date: string; time: string } => {
    if (!dateString) return { date: '-', time: '' };
    try {
      let datePart = '';
      let timePart = '';

      if (dateString.includes('T')) {
        const [d, t] = dateString.split('T');
        datePart = d;
        timePart = t.replace('Z', '').split('.')[0];
      } else if (dateString.includes(' ')) {
        const [d, t] = dateString.split(' ');
        datePart = d;
        timePart = t.split('.')[0];
      } else {
        datePart = dateString;
      }

      const [year, month, day] = datePart.split('-');
      const formattedDate = year && month && day ? `${day}/${month}/${year}` : datePart;
      return { date: formattedDate, time: timePart };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-2 p-2 sm:p-0 animate-in fade-in duration-300">
      <LoadingOverlay show={isLoading} message="Cargando reposición de productos..." />

      {/* ── Encabezado Principal ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-0">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            REPOSICIÓN DE PRODUCTOS VENCIDOS
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Auditoría de mermas, control de expiración y asignación de responsabilidades
          </p>
        </div>

        {/* Badge Informativo de Rol / Restricción */}
        {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-850 border border-outline-variant dark:border-zinc-800 shadow-sm self-start sm:self-auto">
          <span className="material-symbols-outlined text-primary text-base">info</span>
          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-350 uppercase tracking-wide">
            Modificación: Mes en curso (o primeros 5 días para mes anterior)
          </span>
        </div> */}
      </div>

      {/* ── Barra Superior de Filtros ── */}
      <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4">
        <Grid container spacing={1} alignItems="flex-end">
          {/* 1. Almacén (Selector con Modal) */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <div className="w-full space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Almacén
              </label>
              <div
                onClick={() => setModalAlmacenesOpen(true)}
                className="w-full h-[40px] px-3.5 bg-surface dark:bg-zinc-950 border border-outline-variant dark:border-zinc-800 hover:border-primary/60 dark:hover:border-primary/60 rounded-[15px] flex items-center justify-between cursor-pointer transition-all shadow-sm group select-none"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">
                    store
                  </span>
                  <span className="text-xs font-bold text-on-surface uppercase truncate">
                    {selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
                      ? 'TODOS LOS ALMACENES'
                      : selectedWarehouses.length === 1
                        ? (selectedWarehouses[0].DESCRICION || selectedWarehouses[0].nombre || '1 ALMACÉN')
                        : `${selectedWarehouses.length} ALMACENES SELECCIONADOS`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                    {selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
                      ? `TODOS (${warehouses.length})`
                      : `${selectedWarehouses.length}`}
                  </span>
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary text-base transition-colors">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </Grid>

          {/* 2. Fecha Inicio */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <div className="w-full space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Fecha Inicio
              </label>
              <DatePicker
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  setItemsList([]);
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
          </Grid>

          {/* 3. Fecha Fin */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <div className="w-full space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Fecha Fin
              </label>
              <DatePicker
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                  setItemsList([]);
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
          </Grid>

          {/* 4. Estado */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <div className="w-full space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Estado
              </label>
              <Autocomplete
                options={ESTADOS_FILTRO}
                getOptionLabel={(option) => option.nombre || ''}
                value={selectedEstado}
                onChange={(_, newValue) => {
                  setSelectedEstado(newValue || ESTADOS_FILTRO[0]);
                  setItemsList([]);
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                fullWidth
                noOptionsText="No hay estados disponibles"
                disableClearable
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
                    placeholder="SELECCIONAR ESTADO..."
                  />
                )}
              />
            </div>
          </Grid>

          {/* 5. Botón de Búsqueda Estandarizado */}
          <Grid size={{ xs: 12, sm: 6, md: 1 }} sx={{ paddingTop: { xs: '0px', sm: '22px', md: '22px' } }}>
            <div className="flex justify-start pb-0.5">
              <button
                type="button"
                onClick={handleFetchDesperdicios}
                title="Buscar Desperdicios"
                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* ── Tarjetas de Resumen y Métricas (Centradas e Interactivas) ── */}
      <div className="flex justify-center w-full my-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 max-w-4xl w-full gap-3 sm:gap-4">
          {/* 1. Total Registros */}
          <div
            onClick={() => {
              setKpiFilter('all');
              setPage(1);
            }}
            title="Ver todos los registros"
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'all'
              ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]'
              : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-primary/40 hover:scale-[1.01]'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'all'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-primary/10 text-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">inventory_2</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Total Registros
                </p>
                <p className="text-lg font-black text-zinc-900 dark:text-white leading-tight font-headline">
                  {itemsList.length}
                </p>
              </div>
            </div>
            {kpiFilter === 'all' && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-white tracking-widest">
                ACTIVO
              </span>
            )}
          </div>

          {/* 2. Con Responsable */}
          <div
            onClick={() => {
              setKpiFilter((prev) => (prev === 'assigned' ? 'all' : 'assigned'));
              setPage(1);
            }}
            title="Filtrar registros con responsable asignado"
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'assigned'
              ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
              : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-emerald-500/40 hover:scale-[1.01]'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'assigned'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Con Responsable
                </p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight font-headline">
                  {assignedCount}
                </p>
              </div>
            </div>
            {kpiFilter === 'assigned' && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white tracking-widest">
                ACTIVO
              </span>
            )}
          </div>

          {/* 3. Sin Asignar */}
          <div
            onClick={() => {
              setKpiFilter((prev) => (prev === 'unassigned' ? 'all' : 'unassigned'));
              setPage(1);
            }}
            title="Filtrar registros pendientes sin responsable"
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'unassigned'
              ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30 shadow-md scale-[1.02]'
              : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-rose-500/40 hover:scale-[1.01]'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'unassigned'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">person_alert</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Sin Asignar
                </p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 leading-tight font-headline">
                  {unassignedCount}
                </p>
              </div>
            </div>
            {kpiFilter === 'unassigned' && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-widest">
                ACTIVO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Data Canvas ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Cabecera interna de tabla con Buscador Tipo Píldora */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
            <p className="font-black text-zinc-900 dark:text-white uppercase text-xs tracking-wider font-headline">
              PRODUCTOS PARA REPOSICIÓN ({filteredItems.length})
              {kpiFilter === 'assigned' && (
                <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                  (CON RESPONSABLE)
                </span>
              )}
              {kpiFilter === 'unassigned' && (
                <span className="text-rose-600 dark:text-rose-400 ml-1.5 font-bold">
                  (SIN ASIGNAR)
                </span>
              )}
            </p>
          </div>

          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              placeholder="BUSCAR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-zinc-400 text-sm">search</span>
          </div>
        </div>

        {/* Tabla Compacta */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-100 dark:border-zinc-800">
                <td className="w-1 pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">N°</td>
                <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Almacén</td>
                <td className="w-20 max-w-[150px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Tipo
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Fecha</span>
                  <span className="block">Registro</span>
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Fecha</span>
                  <span className="block">Vencimiento</span>
                </td>
                <td className="w-48 max-w-[200px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto
                </td>
                <td className="w-1 px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">Cantidad</td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap leading-tight">
                  <span>P. Consumo</span>
                  <span className="block">Int.</span>
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap leading-tight">
                  <span>Total</span>
                  <span className="block">Asumido</span>
                </td>
                <td className="w-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Usuario</span>
                  <span className="block">Responsable</span>
                </td>
                {/* <td className="w-1 px-3 pr-4 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">Acciones</td> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl block mb-1 text-zinc-300 dark:text-zinc-600">inventory_2</span>
                    <span className="text-xs font-bold uppercase tracking-wider">No se encontraron productos vencidos</span>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item: any, idx) => {
                  const itemIndex = (page - 1) * pageSize + idx + 1;
                  const perm = controlarRestriccionFecha
                    ? checkEditResponsablePermission(item.FECHA_REGISTRO, userProfile)
                    : { allowed: true };
                  const userName = item.USUARIO_ASUMIDO || item.USUARIO || '';
                  const hasResponsible = (item.ID_USUARIO_ASUMIDO && item.ID_USUARIO_ASUMIDO > 0) || (userName.trim() !== '' && userName !== 'Sin asignar');
                  const idDesp = item.ID_PLANTA_DESPERDICIO_ALMACEN || item.ID_DESPERDICIO_ALMACEN || item.ID_DESPERDICIO || idx;
                  const regDateTime = formatDateTimeDisplay(item.FECHA_REGISTRO);
                  const productName = item.PRODUCTO || item.NOMBRE_PRODUCTO || (item.NOMBRE_DETALLE ? item.NOMBRE_DETALLE : '-');
                  const hasDetailSubtitle = Boolean(
                    item.NOMBRE_DETALLE &&
                    item.NOMBRE_DETALLE.trim() !== '' &&
                    item.NOMBRE_DETALLE.trim().toUpperCase() !== (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').trim().toUpperCase()
                  );

                  return (
                    <tr
                      key={idDesp}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="w-1 pl-4 pr-2 py-1.5 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        {itemIndex}
                      </td>
                      <td className="w-1 px-3 py-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap">
                        {item.ALMACEN || item.DESCRICION || '-'}
                      </td>
                      <td className="w-20 max-w-[150px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {item.DESCRIPCION_ESTADO}
                        </span>
                      </td>
                      <td className="w-1 px-2 py-1.5 whitespace-nowrap">
                        <span className="block text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          {regDateTime.date}
                        </span>
                        {regDateTime.time ? (
                          <span className="block font-mono text-[9px] text-zinc-400 dark:text-zinc-500 font-bold leading-tight">
                            {regDateTime.time}
                          </span>
                        ) : null}
                      </td>
                      <td className="w-1 px-2 py-1.5 font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                        {formatDateDisplay(item.FECHA_VENCIMIENTO)}
                      </td>
                      <td className="w-48 max-w-[200px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {item.NOMBRE_DETALLE}
                        </span>
                        <span className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                          {productName}
                        </span>
                        {/* {hasDetailSubtitle && (
                          <span className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                            {productName}
                          </span>
                        )} */}
                      </td>
                      <td className="w-1 px-2 py-1.5 text-center whitespace-nowrap">
                        <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-[10px]">
                          {Number(item.CANTIDAD || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="block text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[10px] leading-tight mt-0.5">
                          {item.UNIDAD_MEDIDA || item.MEDIDA || '-'}
                        </span>
                      </td>
                      <td className="w-1 px-2 py-1.5 font-bold text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap text-[11px]">
                        Bs. {Number(item.PRECIO_PRODUCTO ?? item.PRECIO ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="w-1 px-2 py-1.5 font-black text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap text-[11px]">
                        Bs. {Number(item.PRECIO_ASUMIDO_EMPLEADO ?? item.TOTAL ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-1">
                        <div className="relative min-w-[220px] max-w-[280px]">
                          <Autocomplete
                            options={item.USUARIOS || []}
                            getOptionLabel={(u) => u.NOMBRE_COMPLETO || u.USUARIO || ''}
                            value={
                              (item.USUARIOS || []).find(
                                (u) =>
                                  (item.ID_USUARIO_ASUMIDO && u.ID_USUARIO === item.ID_USUARIO_ASUMIDO) ||
                                  (u.NOMBRE_COMPLETO && u.NOMBRE_COMPLETO.toUpperCase() === (item.USUARIO_ASUMIDO || item.USUARIO || '').toUpperCase()) ||
                                  (u.USUARIO && u.USUARIO.toUpperCase() === (item.USUARIO_ASUMIDO || item.USUARIO || '').toUpperCase())
                              ) || null
                            }
                            onChange={(_, newValue) => {
                              if (newValue) {
                                handleInlineAssignResponsible(item, newValue);
                              }
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option.ID_USUARIO === value?.ID_USUARIO
                            }
                            disabled={!perm.allowed || isAssigningId === Number(idDesp)}
                            noOptionsText="No hay usuarios disponibles"
                            size="small"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: 'var(--input-bg, var(--surface))',
                                color: 'var(--on-surface)',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: hasResponsible
                                    ? 'var(--outline-variant)'
                                    : 'rgba(239, 68, 68, 0.4)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'var(--outline)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'var(--primary)',
                                },
                                '& .MuiSvgIcon-root': {
                                  color: 'var(--on-surface-variant)',
                                  fontSize: '18px',
                                },
                                '& .MuiAutocomplete-input': {
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '4px 4px !important',
                                },
                              },
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                placeholder="SELECCIONAR RESPONSABLE..."
                              />
                            )}
                            renderOption={(props, option) => (
                              <li
                                {...props}
                                key={option.ID_USUARIO}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex flex-col items-start border-b border-zinc-100 dark:border-zinc-800 text-xs"
                              >
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                                  {option.NOMBRE_COMPLETO}
                                </span>
                              </li>
                            )}
                          />
                          {isAssigningId === Number(idDesp) && (
                            <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center z-10 pointer-events-none">
                              <span className="material-symbols-outlined text-primary text-sm animate-spin">
                                progress_activity
                              </span>
                            </div>
                          )}
                          {/* {!perm.allowed && (
                            <Tooltip title={perm.reason || 'Edición restringida por fecha'} arrow>
                              <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center cursor-not-allowed text-zinc-400 z-10">
                                <span className="material-symbols-outlined text-xs">lock</span>
                              </div>
                            </Tooltip>
                          )} */}
                        </div>
                      </td>
                      {/* <td className="px-3 pr-4 py-1.5 text-center whitespace-nowrap">
                        {perm.allowed ? (
                          <Tooltip title={hasResponsible ? "Modificar Responsable en Modal" : "Asignar Responsable en Modal"} arrow>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(item)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer inline-flex"
                            >
                              <span className="material-symbols-outlined text-[15px] sm:text-base">
                                {hasResponsible ? 'manage_accounts' : 'person_add'}
                              </span>
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip title={perm.reason || "Edición restringida por fecha"} arrow>
                            <span className="inline-block cursor-not-allowed">
                              <button
                                type="button"
                                disabled
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center opacity-50 cursor-not-allowed inline-flex pointer-events-none"
                              >
                                <span className="material-symbols-outlined text-[15px] sm:text-base">lock</span>
                              </button>
                            </span>
                          </Tooltip>
                        )}
                      </td> */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {!isLoading && itemsList.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-2 border-t border-zinc-100 dark:border-zinc-800/80">
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
              <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 px-2">
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

      {/* ── Modal Asignación de Responsable ── */}
      <ModalAsignarResponsable
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItemForModal(null);
        }}
        item={selectedItemForModal}
        onSuccess={handleFetchDesperdicios}
      />

      {/* ── Modal Selección de Almacenes ── */}
      <ModalSeleccionarAlmacenes
        open={modalAlmacenesOpen}
        onClose={() => setModalAlmacenesOpen(false)}
        warehouses={warehouses}
        selectedWarehouses={selectedWarehouses}
        onApply={(newSelected) => {
          setSelectedWarehouses(newSelected);
          setItemsList([]);
        }}
      />
    </div>
  );
};

export default ReposicionProductosVencidos;

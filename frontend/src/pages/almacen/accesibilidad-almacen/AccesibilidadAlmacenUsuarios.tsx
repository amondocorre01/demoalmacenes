/**
 * =========================================================================================
 * VISTA: Accesibilidad de Almacenes por Usuario (AccesibilidadAlmacenUsuarios.tsx)
 * =========================================================================================
 * 1. PROPÓSITO DE LA VISTA:
 *    Permite a los administradores gestionar, visualizar y modificar los permisos de acceso 
 *    que tiene cada usuario sobre los distintos almacenes de la empresa.
 * 
 * 2. APIS UTILIZADAS:
 *    - GET  /v1/almacen/activos                 : Carga la lista completa de todos los almacenes activos.
 *    - GET  /v1/seguridad/accesibilidad-almacen : Carga el listado de usuarios con sus almacenes asignados en la BD.
 *    - POST /v1/seguridad/acceso-almacen        : Asigna (estado = 1) o revoca (estado = 0) el permiso de un almacén a un usuario.
 * 
 * 3. CONTROLES CLAVE:
 *    - Vista híbrida: Tarjetas amigables y táctiles para celulares (< md) y Tabla compacta para pantallas mayores (>= md).
 *    - Acordeón / Collapse por fila o tarjeta para desplegar almacenes con acceso.
 *    - Modal interactivo de asignación optimista e instantánea sin bloqueos de carga.
 * =========================================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import {
  ModalAsignacionAlmacenUsuario,
  getAlmacenId,
  getAlmacenNombre,
} from './components/ModalAsignacionAlmacenUsuario';
import {
  AlmacenItem,
  UsuarioAccesibilidadAlmacen,
  useAccesibilidadAlmacenUsuario,
} from './services/useAccesibilidadAlmacenUsuario';

const AccesibilidadAlmacenUsuarios: React.FC = () => {
  const { getAlmacenesActivos, getAccesibilidadAlmacenes } = useAccesibilidadAlmacenUsuario();

  // Estados principales
  const [usuarios, setUsuarios] = useState<UsuarioAccesibilidadAlmacen[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Búsqueda por texto (Nombre/ID)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filas colapsables (IDs de usuarios expandidos)
  const [expandedUserIds, setExpandedUserIds] = useState<Set<number>>(new Set());

  // Modal de Asignación
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioAccesibilidadAlmacen | null>(null);

  // Paginación
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Carga inicial de datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [almacenesRes, usuariosRes] = await Promise.all([
        getAlmacenesActivos(),
        getAccesibilidadAlmacenes(),
      ]);

      if (almacenesRes) setAlmacenes(almacenesRes);
      if (usuariosRes) setUsuarios(usuariosRes);
    } catch (error) {
      console.error('Error al cargar datos de accesibilidad de almacenes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Alternar colapso individual
  const toggleUserExpand = (userId: number) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Expandir o Colapsar todos
  const toggleAllExpand = () => {
    if (expandedUserIds.size === paginatedUsuarios.length) {
      setExpandedUserIds(new Set());
    } else {
      const allIds = new Set(paginatedUsuarios.map((u) => u.ID_USUARIO));
      setExpandedUserIds(allIds);
    }
  };

  // Filtrado de usuarios por texto
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      return (
        (u.NOMBRE_COMPLETO || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(u.ID_USUARIO).includes(searchQuery)
      );
    });
  }, [usuarios, searchQuery]);

  // Reset de página al buscar
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Paginación de usuarios
  const paginatedUsuarios = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredUsuarios.slice(startIdx, startIdx + limit);
  }, [filteredUsuarios, page, limit]);

  const totalItems = filteredUsuarios.length;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  // Estadísticas rápidas
  const totalUsuarios = usuarios.length;
  const usuariosConAccesos = useMemo(() => {
    return usuarios.filter(
      (u) => Array.isArray(u.ALMACENES) && u.ALMACENES.some((a) => a.ESTADO !== 0)
    ).length;
  }, [usuarios]);
  const totalAlmacenesCount = almacenes.length;

  const handleOpenModal = (usuario: UsuarioAccesibilidadAlmacen) => {
    setSelectedUsuario(usuario);
    setModalOpen(true);
  };

  // Actualización local instantánea en tiempo real sin pantalla de carga
  const handleToggleAlmacen = (idUsuario: number, almacen: AlmacenItem, estado: number) => {
    const targetAlmacenId = getAlmacenId(almacen);
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.ID_USUARIO !== idUsuario) return u;
        const currentAlmacenes = Array.isArray(u.ALMACENES) ? [...u.ALMACENES] : [];
        const index = currentAlmacenes.findIndex((a) => getAlmacenId(a) === targetAlmacenId);

        if (index >= 0) {
          currentAlmacenes[index] = { ...currentAlmacenes[index], ESTADO: estado };
        } else if (estado === 1) {
          currentAlmacenes.push({ ...almacen, ESTADO: 1 });
        }

        return { ...u, ALMACENES: currentAlmacenes };
      })
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 px-2 sm:px-1">
      <LoadingOverlay show={loading} message="Cargando Accesibilidad de Almacenes..." />

      {/* Header Section */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-headline">
            Accesibilidad de Almacenes por Usuario
          </h1>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-400 font-medium text-xs -mt-0.5 sm:-mt-1 max-w-2xl">
            Asigna y gestiona los permisos de acceso a los distintos almacenes operativos para los usuarios del sistema.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Controls & Stats Top Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">

          {/* Stats Cards - Low Profile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="bg-surface dark:bg-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2.5 sm:gap-3 text-on-surface min-w-0 sm:min-w-[170px] flex-1 sm:flex-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-sm sm:text-base">group</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none truncate">Total Usuarios</p>
                <p className="text-base sm:text-lg font-black mt-1 leading-none">{totalUsuarios}</p>
              </div>
            </div>

            <div className="bg-surface dark:bg-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2.5 sm:gap-3 text-on-surface min-w-0 sm:min-w-[170px] flex-1 sm:flex-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-sm sm:text-base">verified_user</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none truncate">Con Accesos</p>
                <p className="text-base sm:text-lg font-black mt-1 leading-none">{usuariosConAccesos}</p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-surface dark:bg-zinc-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2.5 sm:gap-3 text-on-surface min-w-0 sm:min-w-[170px] flex-1 sm:flex-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md shrink-0">
                <span className="material-symbols-outlined text-sm sm:text-base">warehouse</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest leading-none truncate">Total Almacenes</p>
                <p className="text-base sm:text-lg font-black mt-1 leading-none">{totalAlmacenesCount}</p>
              </div>
            </div>
          </div>
          {/* Botones Rápidos de Refresco y Despliegue */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={loadData}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner hover:bg-primary/20 transition-all cursor-pointer shrink-0"
              title="Actualizar información"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">refresh</span>
            </button>
          </div>

        </div>

        {/* Main Data Canvas */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-primary rounded-full"></div>

              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {filteredUsuarios.length} Total
              </span>
            </div>

            {/* Búsqueda por Nombre de Usuario */}
            <div className="relative group w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-base">
                search
              </span>
              <input
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 sm:py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none"
                placeholder="BUSCAR USUARIO..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredUsuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
              <span className="material-symbols-outlined text-4xl sm:text-5xl mb-2 text-zinc-300 dark:text-zinc-700">
                person_off
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                No se encontraron usuarios coincidentes
              </span>
            </div>
          ) : (
            <>
              {/* ================= VISTA MÓVIL: TARJETAS (< md) ================= */}
              <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {paginatedUsuarios.map((u, idx) => {
                  const activeAlmacenes = Array.isArray(u.ALMACENES)
                    ? u.ALMACENES.filter((a) => a.ESTADO !== 0)
                    : [];
                  const isExpanded = expandedUserIds.has(u.ID_USUARIO);

                  return (
                    <div
                      key={u.ID_USUARIO}
                      className={`p-3.5 space-y-2.5 transition-colors ${isExpanded ? 'bg-zinc-50/70 dark:bg-zinc-950/40' : 'bg-white dark:bg-zinc-900'
                        }`}
                    >
                      {/* Cabecera de Tarjeta Usuario */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-black text-xs text-primary shrink-0">
                            #{(page - 1) * limit + idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center font-bold shrink-0">
                            <span className="material-symbols-outlined text-base">person</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">
                              {u.NOMBRE_COMPLETO}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {/* <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                                ID: {u.ID_USUARIO}
                              </span> */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${activeAlmacenes.length > 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                  }`}
                              >
                                {activeAlmacenes.length} {activeAlmacenes.length === 1 ? 'Almacén' : 'Almacenes'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botón de Acción Móvil (Únicamente Collapse) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleUserExpand(u.ID_USUARIO)}
                            title={isExpanded ? 'Ocultar almacenes' : 'Ver almacenes'}
                            className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center font-bold cursor-pointer ${isExpanded
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border-primary/20 dark:border-primary/10 hover:bg-primary'
                              }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Panel desplegable en Móvil */}
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-primary">warehouse</span>
                              Detalle de Almacenes Habilitados:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenModal(u)}
                              className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 underline"
                            >
                              Editar Permisos
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeAlmacenes.length === 0 ? (
                              <span className="text-[9px] text-zinc-400 italic">No tiene almacenes asignados</span>
                            ) : (
                              activeAlmacenes.map((almacen) => (
                                <div
                                  key={getAlmacenId(almacen)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[9px] font-black uppercase"
                                >
                                  <span className="material-symbols-outlined text-xs">warehouse</span>
                                  <span>{getAlmacenNombre(almacen)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ================= VISTA ESCRITORIO / TABLET: TABLA (>= md) ================= */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800/80">
                      <th className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-12">
                        N°
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-64">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 min-w-[240px]">
                        Almacenes Asignados
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center w-28 whitespace-nowrap">
                        Total Accesos
                      </th>
                      <th className="pr-6 pl-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right w-28 whitespace-nowrap">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {paginatedUsuarios.map((u, idx) => {
                      const activeAlmacenes = Array.isArray(u.ALMACENES)
                        ? u.ALMACENES.filter((a) => a.ESTADO !== 0)
                        : [];
                      const isExpanded = expandedUserIds.has(u.ID_USUARIO);

                      return (
                        <React.Fragment key={u.ID_USUARIO}>
                          <tr
                            className={`hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors group ${isExpanded ? 'bg-zinc-50/50 dark:bg-zinc-950/30' : ''
                              }`}
                          >
                            {/* N° */}
                            <td className="pl-6 pr-2 py-1.5 font-black text-xs text-primary whitespace-nowrap">
                              {(page - 1) * limit + idx + 1}
                            </td>

                            {/* Usuario */}
                            <td className="px-4 py-1.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors font-bold shrink-0">
                                  <span className="material-symbols-outlined text-lg">person</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">
                                    {u.NOMBRE_COMPLETO}
                                  </p>
                                  {/* <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold tracking-widest mt-0.5">
                                    ID: {u.ID_USUARIO}
                                  </p> */}
                                </div>
                              </div>
                            </td>

                            {/* Almacenes Asignados (Insignias Chips) */}
                            <td className="px-4 py-1.5">
                              <div className="flex flex-wrap gap-1.5 items-center max-w-xl">
                                {activeAlmacenes.length === 0 ? (
                                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 italic">
                                    Sin almacenes asignados
                                  </span>
                                ) : (
                                  activeAlmacenes.slice(0, 4).map((almacen) => (
                                    <span
                                      key={getAlmacenId(almacen)}
                                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">warehouse</span>
                                      {getAlmacenNombre(almacen)}
                                    </span>
                                  ))
                                )}
                                {activeAlmacenes.length > 4 && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                    +{activeAlmacenes.length - 4} más
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Total Accesos */}
                            <td className="px-4 py-1.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${activeAlmacenes.length > 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                  }`}
                              >
                                {activeAlmacenes.length} {activeAlmacenes.length === 1 ? 'Almacén' : 'Almacenes'}
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="pr-6 pl-4 py-1.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleUserExpand(u.ID_USUARIO)}
                                  title={isExpanded ? 'Ocultar detalle de almacenes' : 'Desplegar almacenes asignados'}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center font-bold cursor-pointer hover:text-white hover:shadow-md ${isExpanded
                                    ? 'bg-primary text-white border-primary hover:bg-primary-dark'
                                    : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border-primary/20 dark:border-primary/10 hover:bg-primary'
                                    }`}
                                >
                                  <span className="material-symbols-outlined text-[14px] sm:text-base">
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(u)}
                                  title="Asignar o Modificar Permisos de Almacén"
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[14px] sm:text-base">
                                    edit
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Fila Desplegable */}
                          {isExpanded && (
                            <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-200">
                              <td colSpan={5} className="px-6 py-3">
                                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="material-symbols-outlined text-base text-primary">warehouse</span>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                        Almacenes con acceso para: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{u.NOMBRE_COMPLETO}</span>
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenModal(u)}
                                      className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-xs">edit</span>
                                      Gestionar Permisos
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {activeAlmacenes.length === 0 ? (
                                      <p className="text-[10px] text-zinc-400 italic">No tiene almacenes asignados actualmente.</p>
                                    ) : (
                                      activeAlmacenes.map((almacen) => (
                                        <div
                                          key={getAlmacenId(almacen)}
                                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider"
                                        >
                                          <span className="material-symbols-outlined text-xs">warehouse</span>
                                          <span>{getAlmacenNombre(almacen)}</span>
                                          <span className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 font-bold">
                                            (ID: {getAlmacenId(almacen)})
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Table Footer / Pagination */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 sm:p-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                    Mostrar:
                  </span>
                  <select
                    value={limit === totalItems ? 'all' : limit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setLimit(totalItems || 999999);
                      } else {
                        setLimit(Number(val));
                      }
                      setPage(1);
                    }}
                    className="h-7 sm:h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[9px] sm:text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-350 px-2 outline-none shadow-sm cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">Todas</option>
                  </select>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Mostrando {totalItems > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalItems)} de {totalItems} usuarios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-black">chevron_left</span>
                </button>
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-1 sm:px-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-black">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Asignación de Accesos */}
      <ModalAsignacionAlmacenUsuario
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        usuario={selectedUsuario}
        allAlmacenes={almacenes}
        onToggleAlmacen={handleToggleAlmacen}
      />
    </div>
  );
};

export default AccesibilidadAlmacenUsuarios;

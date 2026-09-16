/**
 * ConfigDeclaracion.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión y configuración de las unidades de medida oficiales para la declaración de inventario
 *    de productos por grupo y detalle en el almacén de planta. Permite alternar y definir si la
 *    declaración se realiza en la unidad estándar o en la unidad de adecuación.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/configuracion/declaracion/productos (Listar productos y sus unidades de medida)
 *    - PUT /v1/configuracion/declaracion/:idProductoDetalle/unidad-medida (Actualizar unidad de medida de declaración)
 *    - GET /v1/configuracion/producto-almacen/almacenes (Listado auxiliar de almacenes)
 * 
 * 3. Controles Clave:
 *    - Cajas de métricas interactivas para filtrado rápido por estado (Todos, Con Declaración, Sin Declaración).
 *    - Visualización directa del valor de `UNIDAD_MEDIDA_D` en el selector de cada fila.
 *    - Selector dinámico de opciones con `UNIDAD_MEDIDA_E` y `UNIDAD_MEDIDA_A` (sin duplicados si son iguales).
 *    - Sincronización inmediata con la API PUT y feedback visual mediante `showAlert`.
 *    - Buscador integrado tipo píldora con filtrado instantáneo por grupo, producto o unidades.
 *    - Paginación estandarizada y compatibilidad completa de temas (claro/oscuro) según AGENTS.md.
 */

import React, { useState, useEffect, useMemo } from 'react';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import {
  useConfiguracionDeclaracionServices,
  ProductoDeclaracionItem
} from './services/useConfiguracionDeclaracion';

const ConfigDeclaracion: React.FC = () => {
  const { loadApiGetProductosDeclaracion, loadApiActualizarUnidadMedida } = useConfiguracionDeclaracionServices();

  const [products, setProducts] = useState<ProductoDeclaracionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'pending'>('all');

  // Paginación estandarizada
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Cargar productos al montar
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await loadApiGetProductosDeclaracion();
      setProducts(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrado de productos por término de búsqueda y filtro de métricas
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Filtro interactivo de estado
      const isConfigured = Boolean(item.UNIDAD_MEDIDA_D || item.ID_UNIDAD_MEDIDA_DECLARACION);
      if (statusFilter === 'configured' && !isConfigured) return false;
      if (statusFilter === 'pending' && isConfigured) return false;

      // Filtro de búsqueda por texto
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const groupName = (item.PRODUCTO || '').toLowerCase();
      const detailName = (item.NOMBRE_DETALLE || '').toLowerCase();
      const unitE = (item.UNIDAD_MEDIDA_E || '').toLowerCase();
      const unitA = (item.UNIDAD_MEDIDA_A || '').toLowerCase();
      const unitD = (item.UNIDAD_MEDIDA_D || item.UNIDAD_DECLARACION || '').toLowerCase();
      return (
        groupName.includes(term) ||
        detailName.includes(term) ||
        unitE.includes(term) ||
        unitA.includes(term) ||
        unitD.includes(term)
      );
    });
  }, [products, searchTerm, statusFilter]);

  // Paginación calculada
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  // Obtener opciones de unidad (UNIDAD_MEDIDA_E y UNIDAD_MEDIDA_A sin duplicados)
  const getUnitOptions = (item: ProductoDeclaracionItem) => {
    const options: { id: number; label: string }[] = [];

    const stdId = item.ID_UNIDAD_MEDIDA_ESTANDAR;
    const stdName = (item.UNIDAD_MEDIDA_E || '').trim();

    const adecId = item.ID_UNIDAD_MEDIDA_ADECUACION;
    const adecName = (item.UNIDAD_MEDIDA_A || '').trim();

    // Verificar si son iguales por ID o por nombre
    const areEqual =
      (stdId && adecId && stdId === adecId) ||
      (stdName && adecName && stdName.toUpperCase() === adecName.toUpperCase());

    if (stdId && stdName) {
      options.push({
        id: stdId,
        label: stdName
      });
    }

    if (adecId && adecName && !areEqual) {
      options.push({
        id: adecId,
        label: adecName
      });
    }

    return options;
  };

  // Manejar cambio de unidad de medida
  const handleUnitChange = async (item: ProductoDeclaracionItem, newUnitId: number) => {
    if (!newUnitId || newUnitId === item.ID_UNIDAD_MEDIDA_DECLARACION) return;

    setUpdatingId(item.ID_PRODUCTO_DETALLE);
    const result = await loadApiActualizarUnidadMedida(item.ID_PRODUCTO_DETALLE, newUnitId, item.NOTA || '');
    setUpdatingId(null);

    if (result.status) {
      showAlert.success(
        'Unidad Actualizada',
        `Se actualizó la unidad de declaración para "${item.NOMBRE_DETALLE || item.PRODUCTO}".`
      );
      // Actualizar estado local inmediatamente
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.ID_PRODUCTO_DETALLE === item.ID_PRODUCTO_DETALLE) {
            let unitName = '';
            if (newUnitId === prod.ID_UNIDAD_MEDIDA_ESTANDAR) {
              unitName = prod.UNIDAD_MEDIDA_E;
            } else if (newUnitId === prod.ID_UNIDAD_MEDIDA_ADECUACION) {
              unitName = prod.UNIDAD_MEDIDA_A;
            } else {
              unitName = prod.UNIDAD_MEDIDA_D || prod.UNIDAD_DECLARACION || '';
            }
            return {
              ...prod,
              ID_UNIDAD_MEDIDA_DECLARACION: newUnitId,
              UNIDAD_MEDIDA_D: unitName,
              UNIDAD_DECLARACION: unitName
            };
          }
          return prod;
        })
      );
    } else {
      showAlert.error('Error al Actualizar', result.message || 'No se pudo actualizar la unidad de medida.');
    }
  };

  // Métricas rápidas (calculadas sobre todos los productos)
  const stats = useMemo(() => {
    const total = products.length;
    const configuredCount = products.filter(
      (p) => Boolean(p.UNIDAD_MEDIDA_D || p.ID_UNIDAD_MEDIDA_DECLARACION)
    ).length;
    const pendingCount = total - configuredCount;
    return { total, configuredCount, pendingCount };
  }, [products]);

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-6">
      {/* Loading Overlay */}
      <LoadingOverlay show={loading} message="Cargando configuración de declaración..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Configuración Declaración
          </h1>
          <p className="text-xs font-black text-on-surface-variant mt-1 font-body">
            Gestión de unidades de medida para la declaración de productos por grupo.
          </p>
        </div>
      </div>

      {/* ── Tarjetas de Métricas Interactivas con Filtro (AGENTS.md) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Total */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between text-left transition-all cursor-pointer ${statusFilter === 'all'
            ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-2 ring-primary/20 shadow-md'
            : 'bg-surface border-outline-variant hover:border-primary/40 hover:bg-surface-variant/40'
            }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${statusFilter === 'all' ? 'text-primary' : 'text-on-surface-variant'
              }`}>
              Total Productos
            </p>
            <p className="text-2xl font-black text-on-surface mt-2 leading-none">
              {stats.total}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${statusFilter === 'all'
            ? 'bg-primary text-white shadow-md'
            : 'bg-primary/10 text-primary'
            }`}>
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
        </button>

        {/* Card 2: Con Unidad Declaración */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter((prev) => (prev === 'configured' ? 'all' : 'configured'));
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between text-left transition-all cursor-pointer ${statusFilter === 'configured'
            ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
            : 'bg-surface border-outline-variant hover:border-emerald-500/40 hover:bg-surface-variant/40'
            }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${statusFilter === 'configured' ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant'
              }`}>
              Con Declaración Asignada
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 leading-none">
              {stats.configuredCount}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${statusFilter === 'configured'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}>
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
        </button>

        {/* Card 3: Sin Asignar */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending'));
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between text-left transition-all cursor-pointer ${statusFilter === 'pending'
            ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
            : 'bg-surface border-outline-variant hover:border-amber-500/40 hover:bg-surface-variant/40'
            }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${statusFilter === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface-variant'
              }`}>
              Sin Declaración Asignada
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 leading-none">
              {stats.pendingCount}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${statusFilter === 'pending'
            ? 'bg-amber-600 text-white shadow-md'
            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}>
            <span className="material-symbols-outlined text-xl">help_outline</span>
          </div>
        </button>
      </div>

      {/* ── Main Data Canvas / Tabla Unificada (AGENTS.md) ── */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Header Superior con Buscador Tipo Píldora */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-outline-variant gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-on-surface uppercase font-headline">
              Listado de Declaración de Productos ({totalItems})
            </h2>

            {/* Badge de Filtro Activo */}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider ml-1">
                Filtro: {statusFilter === 'configured' ? 'Con Declaración' : 'Sin Declaración'}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  title="Quitar Filtro"
                  className="hover:text-red-700 cursor-pointer flex items-center ml-0.5"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}
          </div>

          {/* Buscador Píldora de Tabla Estándar */}
          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              placeholder="BUSCAR PRODUCTO..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-surface dark:bg-zinc-950 border border-outline-variant rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-on-surface transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none shadow-sm"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/30 border-b border-outline-variant">
                <td className="pl-4 pr-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap w-8">
                  N°
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Categoría
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Unidad Estándar
                </td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Unidad Adecuación
                </td>
                <td className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap w-56">
                  Unidad Declaración
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((item, idx) => {
                  const itemIndex = (page - 1) * pageSize + idx + 1;
                  const isUpdating = updatingId === item.ID_PRODUCTO_DETALLE;
                  const unitOptions = getUnitOptions(item);

                  // Obtener ID seleccionado actual a partir de ID_UNIDAD_MEDIDA_DECLARACION o UNIDAD_MEDIDA_D
                  let selectedUnitId: number | string = item.ID_UNIDAD_MEDIDA_DECLARACION || '';
                  if (!selectedUnitId && item.UNIDAD_MEDIDA_D) {
                    const matchedOption = unitOptions.find(
                      (opt) =>
                        opt.label.toUpperCase() === item.UNIDAD_MEDIDA_D!.toUpperCase() ||
                        (item.UNIDAD_MEDIDA_E && item.UNIDAD_MEDIDA_D === item.UNIDAD_MEDIDA_E && opt.id === item.ID_UNIDAD_MEDIDA_ESTANDAR) ||
                        (item.UNIDAD_MEDIDA_A && item.UNIDAD_MEDIDA_D === item.UNIDAD_MEDIDA_A && opt.id === item.ID_UNIDAD_MEDIDA_ADECUACION)
                    );
                    if (matchedOption) {
                      selectedUnitId = matchedOption.id;
                    }
                  }

                  return (
                    <tr
                      key={item.ID_PRODUCTO_DETALLE || idx}
                      className="hover:bg-surface-variant/30 transition-colors group"
                    >
                      {/* N° */}
                      <td className="pl-4 pr-1 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{itemIndex}</span>
                      </td>

                      {/* Grupo */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="text-xs font-black uppercase tracking-tight text-on-surface font-headline block">
                          {item.PRODUCTO || 'SIN GRUPO'}
                        </span>
                      </td>

                      {/* Producto / Detalle */}
                      <td className="px-2 py-1">
                        <span className="text-xs font-bold text-on-surface uppercase block leading-tight">
                          {item.NOMBRE_DETALLE || item.PRODUCTO}
                        </span>
                      </td>

                      {/* Unidad Estándar */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase">
                          <span className="material-symbols-outlined text-[13px]">straighten</span>
                          {item.UNIDAD_MEDIDA_E || 'N/A'}
                        </span>
                      </td>

                      {/* Unidad Adecuación */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                          <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
                          {item.UNIDAD_MEDIDA_A || 'N/A'}
                        </span>
                      </td>

                      {/* Unidad Declaración (Select Dinámico con valor de UNIDAD_MEDIDA_D) */}
                      <td className="px-3 py-1">
                        <div className="relative max-w-[220px]">
                          <select
                            disabled={isUpdating}
                            value={selectedUnitId || ''}
                            onChange={(e) => handleUnitChange(item, Number(e.target.value))}
                            className="w-full bg-surface border border-outline-variant hover:border-primary/40 focus:border-primary rounded-lg text-[11px] font-bold uppercase text-on-surface py-1 px-2 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <option value="">
                              -- SELECCIONAR --
                            </option>
                            {unitOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {isUpdating && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
                              <span className="material-symbols-outlined text-primary text-sm animate-spin">
                                progress_activity
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                        inventory_2
                      </span>
                      <p className="text-xs font-black uppercase tracking-wider">
                        {searchTerm || statusFilter !== 'all'
                          ? 'No se encontraron productos coincidentes con los filtros'
                          : 'No hay productos disponibles'}
                      </p>
                      {(searchTerm || statusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setPage(1);
                          }}
                          className="text-[10px] font-black uppercase text-primary hover:underline mt-1 cursor-pointer"
                        >
                          Restablecer Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Pagination (Estándar AGENTS.md) ── */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 border-t border-outline-variant">
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
                type="button"
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
                type="button"
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
    </div>
  );
};

export default ConfigDeclaracion;

/**
 * ProductosIntermedios.tsx
 * 
 * 1. Propósito de la vista:
 *    Gestión integral, consulta y registro de Productos Intermedios (bases, concentrados, masas y rellenos).
 *    Permite administrar parámetros operativos como días de duración, porcentaje de desperdicio,
 *    producto primario, requerimiento de loteo y vinculación con almacenes activos.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/productos-intermedios/usuarios/almacenes (loadApiGetAlmacenesUsuario - Listar almacenes del usuario)
 *    - GET /v1/productos-intermedios/unidades-medida (loadApiGetUnidadesMedida - Listar catálogo de medidas)
 *    - GET /v1/productos-intermedios (loadApiGetProductosIntermedios - Listar productos intermedios)
 *    - GET /v1/productos-intermedios/recetas?id_sub_2=X (loadApiGetRecetasBySub2 - Recetas por subcategoría)
 *    - GET /v1/productos-intermedios/almacenes/:id/recetas (loadApiGetRecetasByAlmacen - Recetas por almacén)
 *    - GET /v1/productos-intermedios/receta-intermedio/:id (loadApiGetRecetaIntermedio - Receta completa de PI)
 *    - POST /v1/productos-intermedios (loadApiCrearProductoIntermedio - Crear nuevo PI)
 *    - PUT /v1/productos-intermedios/:id (loadApiEditarProductoIntermedio - Actualizar datos de PI)
 *    - PATCH /v1/productos-intermedios/recetas-almacen/estado (loadApiUpdateEstadoRecetaAlmacen - Estado receta/almacén)
 * 
 * 3. Controles Clave:
 *    - Tabla unificada compacta y responsiva según especificación oficial de AGENTS.md.
 *    - Buscador tipo píldora en la cabecera superior derecha de la tabla.
 *    - Paginación dinámica y control de filas visibles por página.
 *    - Botones de acción tipo icono estandarizados con paleta de color corporativa.
 *    - Modal estandarizado de registro y edición en components/ModalNuevoProductoIntermedio.tsx.
 *    - Notificaciones centralizadas mediante showAlert y manejo de errores con handleApiError.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import { showAlert } from '../../../config/alerts';
import { useProductosIntermediosServices } from './services/useProductosIntermedios';
import { ModalNuevoProductoIntermedio } from './components/ModalNuevoProductoIntermedio';
import dayjs from 'dayjs';

export const ProductosIntermedios: React.FC = () => {
  const location = useLocation();
  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetProductosIntermedios,
    loadApiUpdateEstadoRecetaAlmacen
  } = useProductosIntermediosServices();

  const [productsList, setProductsList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filtro de búsqueda interno y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Cargar datos iniciales desde backend Node.js
  const fetchAllData = async () => {
    setIsLoading(true);
    const [almacenesRes, productosRes] = await Promise.all([
      loadApiGetAlmacenesUsuario(),
      loadApiGetProductosIntermedios()
    ]);

    if (Array.isArray(almacenesRes)) {
      setWarehousesList(almacenesRes);
    } else if (almacenesRes?.almacenes || almacenesRes?.data) {
      setWarehousesList(almacenesRes.almacenes || almacenesRes.data);
    }

    if (Array.isArray(productosRes)) {
      setProductsList(productosRes);
    } else if (productosRes?.productos || productosRes?.data) {
      setProductsList(productosRes.productos || productosRes.data);
    } else {
      setProductsList([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Abrir modal automáticamente si se pasa el query param ?openModal=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openModal') === 'true') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [location]);

  // Lista filtrada en cliente por buscador tipo píldora
  const filteredProducts = useMemo(() => {
    return productsList.filter((item) => {
      const name = (item.NOMBRE || item.nombre || '').toLowerCase();
      const note = (item.NOTA || item.nota || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || note.includes(term);
    });
  }, [productsList, searchTerm]);

  // Paginación de tabla
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  // Manejar cambio de estado de receta / almacén
  const handleToggleState = async (item: any) => {
    const currentState = item.ESTADO ?? item.estado ?? 1;
    const newState = currentState === 1 ? 0 : 1;

    const confirmed = await showAlert.confirm(
      '¿Cambiar estado?',
      `El producto "${item.NOMBRE || item.nombre}" pasará a estar ${newState === 1 ? 'ACTIVO' : 'INACTIVO'}.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    const res = await loadApiUpdateEstadoRecetaAlmacen({
      id_almacen_producto_intermedio: item.ID_PRODUCTO_INTERMEDIO || item.id,
      estado: newState
    });
    setIsLoading(false);

    if (res && res.success !== false) {
      showAlert.toast(`Estado actualizado a ${newState === 1 ? 'ACTIVO' : 'INACTIVO'}.`);
      fetchAllData();
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Contadores para tarjetas de métricas
  const totalCount = productsList.length;
  const activeCount = productsList.filter(p => (p.ESTADO ?? p.estado ?? 1) === 1).length;
  const inactiveCount = totalCount - activeCount;

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'NOMBRE DEL PRODUCTO', key: 'nombre', width: 30 },
      { header: 'NOTA / DETALLE', key: 'nota', width: 25 },
      { header: 'DURACIÓN (DÍAS)', key: 'duracion', width: 16, align: 'right' as const, format: 'number' as const },
      { header: '% DESPERDICIO', key: 'desperdicio', width: 16, align: 'right' as const, format: 'number' as const },
      { header: 'PRODUCTO PRIMARIO', key: 'primario', width: 18, align: 'center' as const },
      { header: 'ESTADO', key: 'estado', width: 16, align: 'center' as const },
    ];

    const rows = filteredProducts.map((item, idx) => {
      const isActivo = (item.ESTADO ?? item.estado ?? 1) == 1;
      return {
        index: idx + 1,
        nombre: item.NOMBRE || item.nombre || '-',
        nota: item.NOTA || item.nota || '-',
        duracion: Number(item.DURACION ?? item.duracion ?? 0),
        desperdicio: Number(item.PORCENTAJE_DESPERDICIO ?? item.porcentaje_desperdicio ?? 0),
        primario: (item.PROD_PRIMARIO || item.producto_primario || item.PRODUCTO_PRIMARIO) ? 'SÍ' : 'NO',
        estado: isActivo ? 'HABILITADO' : 'INHABILITADO',
      };
    });

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Productos_Intermedios_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'ProdIntermedios',
      title: 'CATÁLOGO DE PRODUCTOS INTERMEDIOS',
      subtitle: `Total registros: ${rows.length}`,
      columns,
      rows,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'CATÁLOGO DE PRODUCTOS INTERMEDIOS',
      subtitle: `Total registros: ${rows.length}`,
      columns,
      rows,
      orientation: 'landscape',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-0">
      <LoadingOverlay show={isLoading} message="Cargando productos intermedios..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Productos Intermedios
          </h1>
          <p className="text-xs font-black text-on-surface-variant mt-1 font-body">
            Gestión de masas, bases y concentrados para producción final.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredProducts.length === 0}
          />
          <Button
            variant="primary"
            size="md"
            icon="add_circle"
            onClick={handleCreateNew}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* ── Tarjetas de Métricas Compactas (AGENTS.md) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* Card 1: Total */}
        <div className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
              Total Productos
            </p>
            <p className="text-2xl font-black text-on-surface mt-2 leading-none">
              {totalCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
        </div>

        {/* Card 2: Activos */}
        <div className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
              Productos Activos
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 leading-none">
              {activeCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
        </div>

        {/* Card 3: Inactivos */}
        <div className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
              Productos Inactivos
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 leading-none">
              {inactiveCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">cancel</span>
          </div>
        </div>
      </div>

      {/* ── Main Data Canvas / Tabla Unificada (AGENTS.md) ── */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">

        {/* Header Superior con Buscador Tipo Píldora */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-outline-variant gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-on-surface uppercase font-headline">
              Listado de Productos Intermedios ({totalItems})
            </h2>
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
                onClick={() => setSearchTerm('')}
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
                <td className="pl-4 pr-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap w-8">N°</td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Nombre del Producto</td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Duración (Días)</td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">% Desperdicio</td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Primario</td>
                <td className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Estado</td>
                <td className="pr-4 pl-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((item, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx + 1;
                  const isActivo = (item.ESTADO ?? item.estado ?? 1) == 1;

                  return (
                    <tr key={idx} className="hover:bg-surface-variant/30 transition-colors group">
                      <td className="pl-4 pr-1 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        <span>{globalIdx}</span>
                      </td>

                      <td className="px-2 py-1">
                        <div className="flex flex-col">
                          <span className="font-black text-on-surface uppercase text-xs tracking-tight font-headline">
                            {item.NOMBRE || item.nombre}
                          </span>
                          {item.NOTA && (
                            <span className="text-[9px] text-on-surface-variant font-medium truncate max-w-xs">
                              {item.NOTA}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="text-xs font-bold text-on-surface font-mono">
                          {item.DURACION ?? item.duracion ?? 0} DÍAS
                        </span>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className="text-xs font-bold text-on-surface font-mono">
                          {item.PORCENTAJE_DESPERDICIO ?? item.porcentaje_desperdicio ?? 0} %
                        </span>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${(item.PRODUCTO_PRIMARIO || item.producto_primario)
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                          {(item.PROD_PRIMARIO || item.producto_primario) ? 'SÍ' : 'NO'}
                        </span>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isActivo
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                          {isActivo ? 'HABILITADO' : 'INHABILITADO'}
                        </span>
                      </td>

                      {/* Columna Acciones con Botones Estandarizados (AGENTS.md) */}
                      <td className="pr-4 pl-2 py-1 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Editar Producto Intermedio"
                            className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>

                          {/* Botón Cambiar Estado */}
                          <button
                            type="button"
                            onClick={() => handleToggleState(item)}
                            title={isActivo ? 'Inhabilitar Producto' : 'Habilitar Producto'}
                            className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center font-bold cursor-pointer ${isActivo
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isActivo ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-30">inventory_2</span>
                    <p className="text-xs font-black uppercase tracking-wider">No se encontraron productos intermedios</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination (AGENTS.md) */}
        {totalItems > 0 && (
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
                  className="h-8 rounded-xl bg-surface border border-outline-variant text-[10px] font-black uppercase text-on-surface px-2.5 outline-none shadow-sm cursor-pointer"
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
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-xl bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
              </button>
              <span className="text-[10px] font-black uppercase text-on-surface-variant px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Estandarizado de Registro y Edición */}
      <ModalNuevoProductoIntermedio
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        warehouses={warehousesList}
        onSaveSuccess={fetchAllData}
        editItem={editingItem}
      />
    </div>
  );
};

export default ProductosIntermedios;

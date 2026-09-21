/**
 * ListaGeneralRecetas.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión jerárquica y consulta centralizada de la lista general de recetas por almacén.
 *    Permite visualizar estructuras en árbol / cascada de insumos, materias primas y productos intermedios,
 *    así como alternar disponibilidad y asignar nuevas recetas a almacenes específicos.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/recetas-intermedias/usuarios/almacenes (loadApiListarAlmacen - Listar almacenes del usuario)
 *    - GET /v1/recetas-intermedias/almacenes/:id/recetas (loadApiListarProductosSegunAlmacen - Recetas por almacén)
 *    - GET /v1/recetas-intermedias/recetas (loadApiListarRecetasGenerales - Lista general en cascada)
 *    - GET /v1/recetas-intermedias/productos-receta (loadApiListarProductosForReceta - Catálogo de productos)
 *    - PATCH /v1/almacen-receta/recetas-almacen/estado (loadApiCambioEstadoAlmacenProducto - Cambiar estado)
 *    - POST /v1/almacen-receta/recetas (loadApiAgregarRecetaAlmacen - Asignar receta a almacén)
 * 
 * 3. Controles Clave:
 *    - Selector autocompletable MUI de Almacén y Producto con soporte dinámico de modo claro/oscuro.
 *    - Búsqueda diferida mediante botón "BUSCAR" según requerimiento funcional.
 *    - Invocación reactiva de loadApiListarProductosSegunAlmacen al seleccionar almacén para filtrar por producto.
 *    - Árbol jerárquico expandible con animación suave de chevrons e indicadores visuales de nivel.
 *    - Botones e iconos estandarizados conforme a directrices de AGENTS.md.
 *    - Modal estandarizado de asignación en components/ModalAgregarReceta.tsx.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, Chip, Tooltip } from '@mui/material';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import { useListaGeneralRecetasServices } from './services/useListaGeneralRecetas';
//import { ModalAgregarReceta } from './components/ModalAgregarReceta';

interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
}

interface TreeItemProps {
  label: string;
  qty: string;
  unit: string;
  code?: string;
  enabled?: boolean;
  onToggleStatus?: () => void;
  initialOpen?: boolean;
  children?: React.ReactNode;
  isRoot?: boolean;
}

const TreeItemNode: React.FC<TreeItemProps> = ({
  label,
  qty,
  unit,
  code,
  enabled = true,
  onToggleStatus,
  initialOpen = false,
  children,
  isRoot = false
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className={`transition-all ${isOpen ? 'bg-surface-variant/20 dark:bg-zinc-850/20' : ''}`}>
      <div
        className={`grid grid-cols-12 gap-3 px-4 sm:px-6 py-3.5 items-center transition-colors border-b border-outline-variant/30 ${isRoot
          ? 'bg-surface dark:bg-zinc-900 hover:bg-surface-variant/30 font-bold'
          : 'hover:bg-surface-variant/20 text-sm'
          }`}
      >
        <div
          className="col-span-12 sm:col-span-6 flex items-center gap-2.5 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {children ? (
            <span
              className={`material-symbols-outlined text-lg transition-transform duration-200 ${isOpen ? 'rotate-90 text-primary' : 'text-on-surface-variant'
                }`}
            >
              chevron_right
            </span>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <div className="flex flex-col">
            <span className={`${isRoot ? 'font-black text-on-surface text-xs sm:text-sm' : 'font-bold text-on-surface-variant text-xs'} uppercase font-headline tracking-tight`}>
              {label}
            </span>
            {code && (
              <span className="text-[8px] font-black text-on-surface-variant/70 uppercase tracking-widest">
                CÓD: {code}
              </span>
            )}
          </div>
        </div>

        <div className="col-span-4 sm:col-span-2 text-right font-mono font-black text-xs text-on-surface">
          {qty}
        </div>

        <div className="col-span-4 sm:col-span-2">
          <Chip
            label={unit}
            size="small"
            sx={{
              height: 18,
              fontSize: '8px',
              fontWeight: '900',
              borderRadius: '6px',
              bgcolor: 'var(--surface-variant)',
              color: 'var(--on-surface-variant)',
              textTransform: 'uppercase'
            }}
          />
        </div>

        <div className="col-span-4 sm:col-span-2 flex justify-end items-center gap-2">
          {onToggleStatus && isRoot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus();
              }}
              title={enabled ? 'Desactivar Receta' : 'Activar Receta'}
              className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center font-bold cursor-pointer ${enabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-600 hover:text-white'
                }`}
            >
              <span className="material-symbols-outlined text-sm">
                {enabled ? 'check_circle' : 'block'}
              </span>
            </button>
          )}
        </div>
      </div>

      {isOpen && children && (
        <div className="pl-6 sm:pl-10 relative divide-y divide-outline-variant/20 border-l-2 border-primary/20 ml-4 sm:ml-6 my-1">
          {children}
        </div>
      )}
    </div>
  );
};

export const ListaGeneralRecetas: React.FC = () => {
  const {
    loadApiListarAlmacen,
    loadApiListarProductosSegunAlmacen,
    loadApiListarRecetasGenerales,
    loadApiListarProductosForReceta,
    loadApiCambioEstadoAlmacenProducto,
    loadApiAgregarRecetaAlmacen
  } = useListaGeneralRecetasServices();

  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);

  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const [recipesList, setRecipesList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Cargar almacenes activos al montar la vista
  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoading(true);
      const almacenesRes = await loadApiListarAlmacen();
      if (Array.isArray(almacenesRes)) setWarehouses(almacenesRes);
      setIsLoading(false);
    };

    fetchWarehouses();
  }, []);

  // Cargar las opciones del select "Filtrar por Producto / Receta" llamando a loadApiListarProductosSegunAlmacen según el almacén seleccionado
  useEffect(() => {
    const fetchProductosForSelect = async () => {
      setSelectedProduct(null);
      if (selectedWarehouse) {
        setIsLoading(true);
        const res = await loadApiListarProductosSegunAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
        if (Array.isArray(res)) {
          setMasterProducts(res);
        } else {
          setMasterProducts([]);
        }
        setIsLoading(false);
      } else {
        // Restaurar catálogo general de productos cuando no hay almacén seleccionado
        setIsLoading(true);
        const res = await loadApiListarProductosForReceta();
        if (Array.isArray(res)) {
          setMasterProducts(res);
        } else {
          setMasterProducts([]);
        }
        setIsLoading(false);
      }
    };

    fetchProductosForSelect();
  }, [selectedWarehouse]);

  // Función para ejecutar búsqueda de recetas principales
  const handleSearch = async () => {
    setIsLoading(true);
    let res: any[] = [];

    if (selectedWarehouse) {
      res = await loadApiListarProductosSegunAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
    } else {
      res = await loadApiListarRecetasGenerales();
    }

    if (Array.isArray(res)) {
      setRecipesList(res);
    } else {
      setRecipesList([]);
    }

    setIsLoading(false);
  };

  // Filtrado reactivo en UI por texto o producto seleccionado
  const filteredRecipes = useMemo(() => {
    return recipesList.filter(item => {
      const name = (item.NOMBRE_PRODUCTO || item.DESCRIPCION || item.NOMBRE || item.name || '').toLowerCase();
      const code = (item.CODIGO || item.code || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || code.includes(search);
      const targetProdId = selectedProduct?.ID_PRODUCTO || selectedProduct?.id_producto || selectedProduct?.ID_RECETA || selectedProduct?.id;
      const itemProdId = item.ID_PRODUCTO || item.id_producto || item.ID_RECETA || item.id;

      const matchesProduct = !selectedProduct ||
        (targetProdId && itemProdId && targetProdId === itemProdId) ||
        name.includes((selectedProduct?.NOMBRE_PRODUCTO || selectedProduct?.DESCRIPCION || selectedProduct?.NOMBRE || '').toLowerCase());

      return matchesSearch && matchesProduct;
    });
  }, [recipesList, searchTerm, selectedProduct]);

  // Cambiar estado activo/inactivo de receta
  const handleToggleStatus = async (recipe: any) => {
    if (!selectedWarehouse) {
      showAlert.warning('Selección requerida', 'Por favor, seleccione un almacén para cambiar el estado de disponibilidad.');
      return;
    }

    const newStatus = recipe.ESTADO === 1 || recipe.enabled ? 0 : 1;
    const res = await loadApiCambioEstadoAlmacenProducto({
      id_receta: recipe.ID_RECETA || recipe.id,
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      estado: newStatus
    });

    if (res && res.success !== false) {
      showAlert.toast(`Receta ${newStatus === 1 ? 'activada' : 'desactivada'} en el almacén.`);
      handleSearch();
    }
  };

  // Guardar nueva asignación de receta
  const handleSaveRecipeAssignment = async (data: { id_almacen: number; id_producto: number }) => {
    setIsLoading(true);
    const res = await loadApiAgregarRecetaAlmacen(data);
    if (res && res.success !== false) {
      showAlert.success('Asignación Correcta', 'La receta ha sido vinculada exitosamente al almacén.');
      handleSearch();
    }
    setIsLoading(false);
  };

  const selectSx = {
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
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500 pb-4">
      <LoadingOverlay show={isLoading} message="Cargando información de recetas..." />

      {/* ── Cabecera Principal Estandarizada (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Lista General de Recetas Almacenes
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestión jerárquica de insumos, materias primas y productos elaborados por almacén.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="add"
          onClick={() => setIsAddModalOpen(true)}
          //className="!py-2 !px-5 shadow-lg shadow-primary/20"
          className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
        >
          Asignar Receta
        </Button>
      </div>

      {/* ── Panel de Filtros & Búsqueda Estandarizado (AGENTS.md) ── */}
      <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

          {/* Selector de Almacén */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén
            </label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(o) => o.DESCRICION || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => setSelectedWarehouse(newValue)}
              isOptionEqualToValue={(option, value) => option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN}
              fullWidth
              noOptionsText="No hay almacenes disponibles"
              sx={selectSx}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" size="small" placeholder="TODOS LOS ALMACENES..." />
              )}
            />
          </div>

          {/* Selector de Producto Final */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Filtrar por Producto / Receta
            </label>
            <Autocomplete
              options={masterProducts}
              getOptionLabel={(o) => o.NOMBRE_PRODUCTO || o.DESCRIPCION || o.NOMBRE || o.name || ''}
              value={selectedProduct}
              onChange={(_, newValue) => setSelectedProduct(newValue)}
              isOptionEqualToValue={(option, value) => (option.ID_PRODUCTO || option.ID_RECETA || option.id) === (value?.ID_PRODUCTO || value?.ID_RECETA || value?.id)}
              fullWidth
              noOptionsText="No hay productos disponibles"
              sx={selectSx}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" size="small" placeholder="TODOS LOS PRODUCTOS..." />
              )}
            />
          </div>

          {/* Botón Buscar */}
          {/* <div className="md:col-span-2">
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon="search"
              onClick={handleSearch}
              className="!h-10 uppercase text-xs font-black shadow-md"
            >
              Buscar
            </Button>
          </div> */}
          <div className="flex items-center gap-3 shrink-0">
            <Tooltip title="Buscar Receta del Producto Intermedio">
              <button
                type="button"
                onClick={handleSearch}
                disabled={isLoading || !selectedWarehouse || !selectedProduct}
                className={`w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-400 border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-inner ${isLoading || !selectedWarehouse || !selectedProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── Área Principal de Tabla / Árbol ── */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-6">

        {/* Cabecera de Tabla Unificada */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-outline-variant gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-on-surface uppercase font-headline">
              Estructura Jerárquica de Recetas ({filteredRecipes.length})
            </h2>
          </div>

          {/* Buscador Píldora de Tabla */}
          <div className="relative group w-full sm:w-72">
            <input
              type="text"
              placeholder="BUSCAR INSUMO O CÓDIGO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-on-surface transition-all uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Encabezado Columnas de Árbol */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-surface-variant/30 border-b border-outline-variant text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          <div className="col-span-12 sm:col-span-6">Descripción del Insumo / Producto</div>
          <div className="col-span-4 sm:col-span-2 text-right">Cantidad</div>
          <div className="col-span-4 sm:col-span-2">Unidad Medida</div>
          <div className="col-span-4 sm:col-span-2 text-right">Acción</div>
        </div>

        {/* Lista de Nodos */}
        <div className="divide-y divide-outline-variant/30">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((r: any, idx: number) => (
              <TreeItemNode
                key={idx}
                label={r.NOMBRE_PRODUCTO || r.DESCRIPCION || r.NOMBRE || r.name || `RECETA #${idx + 1}`}
                qty={r.CANTIDAD || r.qty || '1.000'}
                unit={r.UNIDAD_MEDIDA || r.unit || 'UNIDAD'}
                code={r.CODIGO || r.code}
                enabled={r.ESTADO === 1 || r.enabled}
                onToggleStatus={() => handleToggleStatus(r)}
                isRoot={true}
                initialOpen={idx === 0}
              >
                {/* Sub-componentes o ingredientes si existen en respuesta */}
                {Array.isArray(r.ingredientes || r.componentes) &&
                  (r.ingredientes || r.componentes).map((ing: any, subIdx: number) => (
                    <TreeItemNode
                      key={subIdx}
                      label={ing.NOMBRE || ing.DESCRIPCION || ing.name || `INGREDIENTE #${subIdx + 1}`}
                      qty={ing.CANTIDAD || ing.qty || '0.000'}
                      unit={ing.UNIDAD_MEDIDA || ing.unit || 'KILO'}
                      code={ing.CODIGO || ing.code}
                      isRoot={false}
                    />
                  ))}
              </TreeItemNode>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant opacity-60">
              <span className="material-symbols-outlined text-5xl mb-3 opacity-30">menu_book</span>
              <p className="text-xs font-black uppercase tracking-wider">No se encontraron recetas registradas</p>
              <p className="text-[10px] text-on-surface-variant/70 uppercase mt-1">
                Haga clic en "BUSCAR" o ajuste los filtros de selección.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Métricas Compactas Estandarizadas (AGENTS.md) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Metric 1 */}
        <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
              Total Recetas Cargadas
            </p>
            <p className="text-lg font-black text-on-surface mt-1 leading-none">
              {filteredRecipes.length}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">store</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
              Almacenes Disponibles
            </p>
            <p className="text-lg font-black text-on-surface mt-1 leading-none">
              {warehouses.length}
            </p>
          </div>
        </div>

        {/* Metric 3 / Sincronización */}
        <div className="sm:col-span-2 bg-zinc-900 dark:bg-zinc-800 text-white p-4 rounded-2xl border border-zinc-800 flex justify-between items-center shadow-md">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Almacén Activo Seleccionado
            </p>
            <p className="text-sm font-black uppercase tracking-tight text-white mt-0.5 font-headline">
              {selectedWarehouse ? selectedWarehouse.DESCRICION : 'TODOS LOS ALMACENES'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSearch}
            icon="sync"
            className="!h-8 !px-4 bg-white/10 hover:bg-white/20 text-white border-0 !rounded-xl"
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Modal Estandarizado de Asignación */}
      {/* <ModalAgregarReceta
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        warehousesList={warehouses}
        masterProductsList={masterProducts}
        onSave={handleSaveRecipeAssignment}
        isLoading={isLoading}
      /> */}
    </div>
  );
};

export default ListaGeneralRecetas;

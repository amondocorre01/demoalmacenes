/**
 * ListaGeneralRecetas.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión jerárquica y consulta centralizada de la lista general de recetas por almacén.
 *    Permite visualizar estructuras en árbol / cascada hasta el último nivel que devuelve la API
 *    (insumos, materias primas y productos intermedios anidados), métricas de producción
 *    (duración, merma, rendimiento estándar y de adecuación) y asignación de recetas a almacenes.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/recetas-intermedias/usuarios/almacenes (loadApiListarAlmacen - Listar almacenes autorizados)
 *    - GET /v1/recetas-intermedias/almacenes/:id/recetas (loadApiListarProductosSegunAlmacen - Recetas por almacén)
 *    - GET /v1/recetas-intermedias/recetas (loadApiListarRecetasGenerales - Lista general de recetas)
 *    - GET /v1/recetas-intermedias/productos-receta (loadApiListarProductosForReceta - Catálogo de productos)
 *    - PATCH /v1/almacen-receta/recetas-almacen/estado (loadApiCambioEstadoAlmacenProducto - Cambiar estado de receta en almacén)
 *    - POST /v1/recetas-intermedias/asignar-almacen (loadApiRelacionarAlmacenProductosIntermedios - Asignar receta a almacén)
 * 
 * 3. Controles Clave:
 *    - Selector autocompletable MUI de Almacén y Producto con Grid responsivo y tokens dark/light.
 *    - Búsqueda diferida mediante botón estandarizado de lupa.
 *    - Árbol multinivel expandible con apertura suave, desglose hasta el último nivel y botón "Expandir Todo / Colapsar Todo".
 *    - Ficha técnica modal con detalle completo de parámetros de producción y composición de insumos.
 *    - Modal de asignación de recetas a almacenes específicos.
 *    - Botones de acción con iconos estandarizados según directrices de AGENTS.md.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Tooltip,
  Grid,
} from '@mui/material';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import { useListaGeneralRecetasServices } from './services/useListaGeneralRecetas';
import { ModalDetalleReceta, RecetaCompletaItem, ProductoRecetaItem } from './components/ModalDetalleReceta';
import { ModalAsignarReceta } from './components/ModalAsignarReceta';

interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
}

// Componente recursivo para renderizar nodos de ingredientes / subrecetas (hasta el último nivel)
interface IngredientNodeProps {
  item: ProductoRecetaItem;
  level: number;
  index: number;
  recipeMap: Map<number, RecetaCompletaItem>;
  allExpanded: boolean | null;
}

const IngredientNode: React.FC<IngredientNodeProps> = ({
  item,
  level,
  index,
  recipeMap,
  allExpanded,
}) => {
  // Verificar si este ingrediente corresponde a una sub-receta intermedia en el mapa
  const subReceta =
    (item.ID_PRODUCTO_INTERMEDIO_ANTECESOR && recipeMap.get(item.ID_PRODUCTO_INTERMEDIO_ANTECESOR)) ||
    (Number(item.ID_PRODUCTO) === 0 && item.ID_PRODUCTO_INTERMEDIO && recipeMap.get(item.ID_PRODUCTO_INTERMEDIO)) ||
    null;

  const hasChildren = subReceta && Array.isArray(subReceta.PRODUCTOS_RECETA) && subReceta.PRODUCTOS_RECETA.length > 0;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (allExpanded !== null && hasChildren) {
      setIsOpen(allExpanded);
    }
  }, [allExpanded, hasChildren]);

  const isActivo = item.ESTADO === 1 || item.ESTADO === true;
  const isSubReceta = Boolean(subReceta) || (item.ID_PRODUCTO_INTERMEDIO_ANTECESOR && item.ID_PRODUCTO_INTERMEDIO_ANTECESOR > 0) || Number(item.ID_PRODUCTO) === 0;

  return (
    <div className={`transition-all ${isOpen ? 'bg-surface-variant/20 dark:bg-zinc-850/20' : ''}`}>
      <div
        className={`grid grid-cols-12 gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 items-center transition-colors border-b border-outline-variant/30 hover:bg-surface-variant/25 ${level > 1 ? 'bg-surface-variant/10' : ''
          }`}
      >
        {/* Descripción e Icono Jerárquico */}
        <div
          className={`col-span-12 sm:col-span-6 flex items-center gap-2 ${hasChildren ? 'cursor-pointer' : ''}`}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          style={{ paddingLeft: `${(level - 1) * 16}px` }}
        >
          {hasChildren ? (
            <span
              className={`material-symbols-outlined text-base transition-transform duration-200 text-primary ${isOpen ? 'rotate-90' : ''
                }`}
            >
              chevron_right
            </span>
          ) : (
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </span>
          )}

          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs ${isSubReceta
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isSubReceta ? 'schema' : 'inventory_2'}
              </span>
            </span>

            <div className="min-w-0">
              <p className="font-bold text-on-surface uppercase text-xs truncate">
                {item.PRODUCTO || `INSUMO #${index + 1}`}
              </p>
              {isSubReceta && (
                <span className="text-[8px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Sub-receta {subReceta?.NUM_RECETA ? `(v#${subReceta.NUM_RECETA})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cantidad */}
        <div className="col-span-4 sm:col-span-2 text-right font-mono font-black text-xs text-on-surface">
          {Number(item.CANTIDAD || 0).toLocaleString('es-BO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
          })}
        </div>

        {/* Unidad de Medida */}
        <div className="col-span-4 sm:col-span-2">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-surface-variant text-on-surface-variant border border-outline-variant/60">
            {item.UNIDAD_MEDIDA || 'UNIDAD'}
          </span>
        </div>

        {/* Estado / Nivel */}
        <div className="col-span-4 sm:col-span-2 flex justify-end items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isActivo
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
              }`}
          >
            {isActivo ? 'Activo' : 'Opcional'}
          </span>
          <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500">
            N{level}
          </span>
        </div>
      </div>

      {/* Renderizado de Sub-nivel recursivo si existe */}
      {isOpen && hasChildren && subReceta && (
        <div className="border-l-2 border-primary/20 ml-4 sm:ml-8 pl-1">
          {subReceta.PRODUCTOS_RECETA?.map((subItem, subIdx) => (
            <IngredientNode
              key={subItem.ID_RECETA_INTERMEDIO || subIdx}
              item={subItem}
              level={level + 1}
              index={subIdx}
              recipeMap={recipeMap}
              allExpanded={allExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de Tarjeta / Fila de Receta Principal (Nivel Raíz)
interface RecipeCardNodeProps {
  recipe: RecetaCompletaItem;
  index: number;
  recipeMap: Map<number, RecetaCompletaItem>;
  onToggleStatus: (r: RecetaCompletaItem) => void;
  onViewDetail: (r: RecetaCompletaItem) => void;
  allExpanded: boolean | null;
}

const RecipeCardNode: React.FC<RecipeCardNodeProps> = ({
  recipe,
  index,
  recipeMap,
  onToggleStatus,
  onViewDetail,
  allExpanded,
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const ingredientes = Array.isArray(recipe.PRODUCTOS_RECETA) ? recipe.PRODUCTOS_RECETA : [];
  const hasIngredients = ingredientes.length > 0;
  const isActivo = recipe.ESTADO === true || Number(recipe.ESTADO) === 1;

  useEffect(() => {
    if (allExpanded !== null) {
      setIsOpen(allExpanded);
    }
  }, [allExpanded]);

  return (
    <div className="bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 overflow-hidden shadow-xs transition-all mb-3">
      {/* ── Cabecera de Receta (Nivel 1) ── */}
      <div
        className={`p-3.5 sm:p-4 transition-colors ${isOpen
            ? 'bg-zinc-50/80 dark:bg-zinc-850/60 border-b border-outline-variant/40'
            : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-850/30'
          }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Lado Izquierdo: Chevron + Título de la Receta + Badges */}
          <div
            className="flex items-start sm:items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <button
              type="button"
              className={`w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''
                }`}
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-on-surface uppercase font-headline tracking-tight truncate">
                  {recipe.NOMBRE}
                </span>

                {recipe.NUM_RECETA && (
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                    Receta #{recipe.NUM_RECETA}
                  </span>
                )}

                {recipe.PROD_PRIMARIO && (
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    ⭐ Primario
                  </span>
                )}
              </div>

              {/* Parámetros Clave Resumidos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">scale</span>
                  Rendimiento:{' '}
                  <strong className="text-on-surface font-black">
                    {recipe.CANTIDAD_ESTANDAR ?? 1} {recipe.UNIDAD_MEDIDA_E || 'Kg'}
                  </strong>
                </span>

                {recipe.DURACION !== undefined && recipe.DURACION !== null && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                    Duración: <strong className="text-on-surface font-black">{recipe.DURACION} min</strong>
                  </span>
                )}

                {recipe.PORCENTAJE_DESPERDICIO !== undefined && recipe.PORCENTAJE_DESPERDICIO !== null && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-500">trending_down</span>
                    Merma: <strong className="text-amber-600 dark:text-amber-400 font-black">{recipe.PORCENTAJE_DESPERDICIO}%</strong>
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">format_list_bulleted</span>
                  Insumos:{' '}
                  <strong className="text-primary font-black">
                    {ingredientes.length} {ingredientes.length === 1 ? 'ítem' : 'ítems'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Acciones Estandarizadas */}
          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
            {/* Botón Ver Ficha Técnica / Detalle */}
            <Tooltip title="Ver Ficha Técnica Completa">
              <button
                type="button"
                onClick={() => onViewDetail(recipe)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-400 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-base">visibility</span>
              </button>
            </Tooltip>

            {/* Botón Cambiar Estado (Activar / Desactivar) */}
            <Tooltip title={isActivo ? 'Desactivar Receta en Almacén' : 'Activar Receta en Almacén'}>
              <button
                type="button"
                onClick={() => onToggleStatus(recipe)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center font-bold cursor-pointer ${isActivo
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white'
                  }`}
              >
                <span className="material-symbols-outlined text-[14px] sm:text-base">
                  {isActivo ? 'check_circle' : 'block'}
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ── Cuerpo / Lista de Ingredientes Multinivel ── */}
      {isOpen && (
        <div className="bg-surface dark:bg-zinc-950/60 animate-in fade-in duration-200">
          {hasIngredients ? (
            <div>
              {/* Encabezado de columnas de ingredientes */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 px-3 sm:px-6 py-2 bg-zinc-100/50 dark:bg-zinc-900/50 border-b border-outline-variant/30 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <div className="col-span-12 sm:col-span-6">Insumo / Materia Prima / Sub-receta</div>
                <div className="col-span-4 sm:col-span-2 text-right">Cantidad Requerida</div>
                <div className="col-span-4 sm:col-span-2">Unidad Medida</div>
                <div className="col-span-4 sm:col-span-2 text-right">Estado / Nivel</div>
              </div>

              {/* Renderizado recursivo de ingredientes */}
              <div className="divide-y divide-outline-variant/20">
                {ingredientes.map((item, idx) => (
                  <IngredientNode
                    key={item.ID_RECETA_INTERMEDIO || idx}
                    item={item}
                    level={1}
                    index={idx}
                    recipeMap={recipeMap}
                    allExpanded={allExpanded}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Esta receta no cuenta con ingredientes o materias primas asociadas.
            </div>
          )}
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
    loadApiRelacionarAlmacenProductosIntermedios,
  } = useListaGeneralRecetasServices();

  // Estados de Catálogo y Filtros
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);

  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Lista de Recetas principales y Mapa para subrecetas recursivas
  const [recipesList, setRecipesList] = useState<RecetaCompletaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecetaCompletaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Cargar almacenes autorizados al montar
  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoading(true);
      const almacenesRes = await loadApiListarAlmacen();
      if (Array.isArray(almacenesRes) && almacenesRes.length > 0) {
        setWarehouses(almacenesRes);
        setSelectedWarehouse(almacenesRes[0]);
      }
      setIsLoading(false);
    };

    fetchWarehouses();
  }, []);

  // 2. Cargar productos y recetas del almacén seleccionado
  useEffect(() => {
    const fetchProductosForSelect = async () => {
      setSelectedProduct(null);
      if (selectedWarehouse) {
        setIsLoading(true);
        const res = await loadApiListarProductosSegunAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
        if (Array.isArray(res)) {
          setMasterProducts(res);
          setRecipesList(res);
        } else {
          setMasterProducts([]);
          setRecipesList([]);
        }
        setIsLoading(false);
      } else {
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

    if (selectedWarehouse) {
      fetchProductosForSelect();
    }
  }, [selectedWarehouse]);

  // 3. Ejecutar búsqueda explícita
  const handleSearch = useCallback(async () => {
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
  }, [selectedWarehouse, loadApiListarProductosSegunAlmacen, loadApiListarRecetasGenerales]);

  // 4. Construir Mapa de Recetas por ID_PRODUCTO_INTERMEDIO para resolución recursiva
  const recipeMap = useMemo(() => {
    const map = new Map<number, RecetaCompletaItem>();
    recipesList.forEach((r) => {
      if (r.ID_PRODUCTO_INTERMEDIO) {
        map.set(r.ID_PRODUCTO_INTERMEDIO, r);
      }
    });
    return map;
  }, [recipesList]);

  // 5. Filtrado reactivo en UI por buscador de texto y selector de producto
  const filteredRecipes = useMemo(() => {
    return recipesList.filter((item) => {
      const name = (item.NOMBRE || '').toLowerCase();
      const note = (item.NOTA || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      // Buscar también dentro de los nombres de los ingredientes de la receta
      const matchInIngredients = Array.isArray(item.PRODUCTOS_RECETA) &&
        item.PRODUCTOS_RECETA.some((p) => (p.PRODUCTO || '').toLowerCase().includes(search));

      const matchesSearch = !search || name.includes(search) || note.includes(search) || matchInIngredients;

      const targetProdId = selectedProduct?.ID_PRODUCTO_INTERMEDIO || selectedProduct?.ID_PRODUCTO || selectedProduct?.id;
      const itemProdId = item.ID_PRODUCTO_INTERMEDIO;

      const matchesProduct =
        !selectedProduct ||
        (targetProdId && itemProdId && Number(targetProdId) === Number(itemProdId)) ||
        name.includes((selectedProduct?.NOMBRE || selectedProduct?.PRODUCTO || '').toLowerCase());

      return matchesSearch && matchesProduct;
    });
  }, [recipesList, searchTerm, selectedProduct]);

  // 6. Cambiar estado activo/inactivo de receta
  const handleToggleStatus = async (recipe: RecetaCompletaItem) => {
    if (!selectedWarehouse) {
      showAlert.warning('Selección requerida', 'Por favor seleccione un almacén para cambiar el estado.');
      return;
    }

    const currentStatus = recipe.ESTADO === true || Number(recipe.ESTADO) === 1;
    const newStatus = currentStatus ? 0 : 1;

    const res = await loadApiCambioEstadoAlmacenProducto({
      id_receta: recipe.ID_PLANTA_RI_PI || recipe.ID_PRODUCTO_INTERMEDIO,
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      estado: newStatus,
    });

    if (res && res.success !== false) {
      showAlert.toast(`Receta ${newStatus === 1 ? 'activada' : 'desactivada'} exitosamente.`);
      handleSearch();
    }
  };

  // 7. Guardar nueva asignación de receta a almacén
  const handleSaveRecipeAssignment = async (data: { id_planta_almacen: number; id_producto_intermedio: number }) => {
    setIsLoading(true);
    const res = await loadApiRelacionarAlmacenProductosIntermedios(data);
    if (res && res.success !== false) {
      showAlert.success('Asignación Exitosa', 'La receta ha sido vinculada al almacén correctamente.');
      handleSearch();
    }
    setIsLoading(false);
  };

  // 8. Abrir Modal de Detalle
  const handleOpenDetail = (recipe: RecetaCompletaItem) => {
    setSelectedRecipeDetail(recipe);
    setIsDetailModalOpen(true);
  };

  // Métricas agregadas
  const totalInsumos = useMemo(() => {
    return filteredRecipes.reduce((acc, r) => acc + (Array.isArray(r.PRODUCTOS_RECETA) ? r.PRODUCTOS_RECETA.length : 0), 0);
  }, [filteredRecipes]);

  const totalPrimarias = useMemo(() => {
    return filteredRecipes.filter((r) => r.PROD_PRIMARIO).length;
  }, [filteredRecipes]);

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
      },
    },
  };

  return (
    <div className="space-y-4 font-body animate-in fade-in duration-300">
      <LoadingOverlay show={isLoading} message="Consultando información de recetas..." />

      {/* ── Encabezado Principal Estandarizado (AGENTS.md) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            LISTA GENERAL DE RECETAS DE ALMACÉN
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Estructura jerárquica multinivel de insumos, materias primas, productos intermedios y formulaciones
          </p>
        </div>

        {/* Acciones a la derecha */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon="add_link"
            onClick={() => setIsAddModalOpen(true)}
            className="!h-10 !px-6 shadow-lg shadow-primary/20 shrink-0"
          >
            Asignar Receta
          </Button>
        </div>
      </div>

      {/* ── Barra Superior de Filtros Estandarizada (AGENTS.md) ── */}
      <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <Grid container spacing={1.5} alignItems="flex-end">
          {/* 1. Selector de Almacén */}
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <div className="w-full space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Seleccionar Almacén
              </label>
              <Autocomplete
                options={warehouses}
                getOptionLabel={(option) => option.DESCRICION || ''}
                value={selectedWarehouse}
                onChange={(_, newValue) => setSelectedWarehouse(newValue)}
                isOptionEqualToValue={(option, value) =>
                  option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                }
                fullWidth
                disableClearable
                noOptionsText="No hay almacenes disponibles"
                sx={selectSx}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                )}
              />
            </div>
          </Grid>

          {/* 2. Selector de Receta / Producto */}
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <div className="w-full space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Filtrar por Receta / Producto Intermedio
              </label>
              <Autocomplete
                options={masterProducts}
                getOptionLabel={(option) =>
                  option.NOMBRE || option.PRODUCTO || option.NOMBRE_PRODUCTO || option.DESCRIPCION || ''
                }
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                isOptionEqualToValue={(option, value) =>
                  (option.ID_PRODUCTO_INTERMEDIO || option.ID_PRODUCTO) ===
                  (value?.ID_PRODUCTO_INTERMEDIO || value?.ID_PRODUCTO)
                }
                fullWidth
                noOptionsText="No hay recetas disponibles"
                sx={selectSx}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" placeholder="TODAS LAS RECETAS..." />
                )}
              />
            </div>
          </Grid>

          {/* 3. Botón de Búsqueda Estandarizado */}
          <Grid size={{ xs: 12, sm: 6, md: 1 }} sx={{ paddingTop: { xs: '0px', sm: '22px', md: '22px' } }}>
            <div className="flex justify-start pb-0.5">
              <button
                type="button"
                onClick={handleSearch}
                title="Buscar Recetas del Almacén"
                disabled={isLoading || !selectedWarehouse}
                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* ── KPIs Rápidos de Información ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="bg-surface dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">menu_book</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Total Recetas
            </p>
            <p className="text-lg font-black text-on-surface mt-0.5 leading-none font-headline">
              {filteredRecipes.length}
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Insumos & Componentes
            </p>
            <p className="text-lg font-black text-on-surface mt-0.5 leading-none font-headline">
              {totalInsumos}
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Productos Primarios
            </p>
            <p className="text-lg font-black text-on-surface mt-0.5 leading-none font-headline">
              {totalPrimarias}
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">store</span>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Almacén Activo
            </p>
            <p className="text-xs font-black text-on-surface mt-0.5 leading-none font-headline truncate">
              {selectedWarehouse ? selectedWarehouse.DESCRICION : 'TODOS'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Árbol Multinivel de Recetas (Canvas Principal) ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Barra Superior del Canvas con Buscador Píldora y Botones de Expansión */}
        <div className="px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-headline">
              ESTRUCTURA DE RECETAS ({filteredRecipes.length} REGISTROS)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Expandir / Colapsar Todo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAllExpanded(true)}
                title="Expandir todas las recetas"
                className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-surface dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary border border-outline-variant hover:border-primary/40 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-xs font-black">unfold_more</span>
                Expandir Todo
              </button>

              <button
                type="button"
                onClick={() => setAllExpanded(false)}
                title="Colapsar todas las recetas"
                className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-surface dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-primary border border-outline-variant hover:border-primary/40 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-xs font-black">unfold_less</span>
                Colapsar Todo
              </button>
            </div>

            {/* Buscador Píldora */}
            <div className="relative group w-48 sm:w-60">
              <input
                type="text"
                placeholder="BUSCAR RECETA O INSUMO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                search
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Listado de Nodos de Receta */}
        <div className="p-3 sm:p-4">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, idx) => (
              <RecipeCardNode
                key={recipe.ID_PRODUCTO_INTERMEDIO || recipe.ID_PLANTA_RI_PI || idx}
                recipe={recipe}
                index={idx}
                recipeMap={recipeMap}
                onToggleStatus={handleToggleStatus}
                onViewDetail={handleOpenDetail}
                allExpanded={allExpanded}
              />
            ))
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl text-zinc-400">menu_book</span>
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                No se encontraron recetas registradas
              </p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">
                Seleccione un almacén o asigne una nueva receta para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Detalle / Ficha Técnica ── */}
      <ModalDetalleReceta
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        receta={selectedRecipeDetail}
        almacenNombre={selectedWarehouse?.DESCRICION}
      />

      {/* ── Modal de Asignación de Receta a Almacén ── */}
      <ModalAsignarReceta
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        warehousesList={warehouses}
        masterProductsList={masterProducts}
        selectedWarehouseDefault={selectedWarehouse}
        onSave={handleSaveRecipeAssignment}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ListaGeneralRecetas;

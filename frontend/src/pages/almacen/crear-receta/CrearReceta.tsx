/**
 * CrearReceta.tsx
 * 
 * 1. Propósito de la Vista:
 *    Definición y configuración de recetas de producción para productos asignados por almacén.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/almacen-receta/usuarios/almacenes (Listar almacenes asignados al usuario)
 *    - GET /v1/almacen-receta/almacenes/:id/recetas (Verificar productos/recetas asignados a ese almacén)
 *    - GET /v1/almacen-receta/productos-categoria-2 (Obtener productos catálogo categoría 2)
 *    - GET /v1/almacen-receta/productos-receta?codigo_tipo=X (Listar insumos / materias primas)
 *    - GET /v1/almacen-receta/productos-intermedios-activos (Listar productos intermedios)
 *    - GET /v1/almacen-receta/recetas?id_sub_2=X (Obtener detalle de receta existente)
 *    - POST /v1/almacen-receta/recetas (Guardar / actualizar componentes de la receta)
 * 
 * 3. Controles Clave:
 *    - Verificación estricta de asignación de productos al almacén seleccionado usando loadApiGetRecetaByAlmacen.
 *    - Alertas de confirmación cuando el usuario selecciona productos no relacionados.
 *    - Modal de vinculación (LinkingModal) en components/ para relacionar productos a almacenes.
 *    - Ocultamiento de botón de búsqueda para productos no relacionados.
 *    - Cumplimiento estricto de diseño y tokens claro/oscuro de AGENTS.md.
 */

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { showAlert } from '../../../config/alerts';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { useNewRecetaAlmacenesServices } from './services/useCrearReceta';
import { LinkingModal } from './components/LinkingModal';

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{label}</span>
  </div>
);

const CrearReceta: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetProductosCategoria2,
    loadApiGetProductosForReceta,
    loadApiGetRecetas,
    loadApiGetProductosIntermediosActivos,
    loadApiGetRecetaByAlmacen,
    loadApiSaveReceta
  } = useNewRecetaAlmacenesServices();

  // API Data States
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [productsCategoria2, setProductsCategoria2] = useState<any[]>([]);
  const [insumosList, setInsumosList] = useState<any[]>([]);
  const [intermediosList, setIntermediosList] = useState<any[]>([]);

  // Selection States
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [assignedWarehouseProducts, setAssignedWarehouseProducts] = useState<any[]>([]);
  const [targetProduct, setTargetProduct] = useState<any>(null);

  // Linker Modal State
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<any>(null);

  // Adder State
  const [ingType, setIngType] = useState<'insumo' | 'intermedio'>('insumo');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [quantity, setQuantity] = useState<string | number>('');

  // Recipe State
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [initialIngredientKeys, setInitialIngredientKeys] = useState<string[]>([]);
  const [hasExistingRecipe, setHasExistingRecipe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load Initial Lists
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const resAlmacenes = await loadApiGetAlmacenesUsuario();
      if (resAlmacenes && resAlmacenes.success) {
        setAlmacenes(resAlmacenes.data || []);
      }

      const resCat2 = await loadApiGetProductosCategoria2();
      if (resCat2 && resCat2.success) {
        setProductsCategoria2(resCat2.data || []);
      }

      const resInsumos = await loadApiGetProductosForReceta(1);
      if (resInsumos && resInsumos.success) {
        setInsumosList(
          (resInsumos.data || []).map((i: any) => ({
            id: i.ID_PRODUCTO,
            name: i.NOMBRE,
            unit: i.UNIDAD_MEDIDA,
            type: 'insumo',
            id_unidad_medida: i.ID_UNIDAD_MEDIDA,
            icon: 'bakery_dining'
          }))
        );
      }

      const resIntermedios = await loadApiGetProductosIntermediosActivos();
      if (resIntermedios && resIntermedios.success) {
        setIntermediosList(
          (resIntermedios.data || []).map((i: any) => ({
            id: i.ID_PRODUCTO_INTERMEDIO,
            name: i.NOMBRE,
            unit: i.UNIDAD_MEDIDA || 'Unidad',
            type: 'intermedio',
            id_unidad_medida: i.ID_UNIDAD_MEDIDA || 1,
            icon: 'water_drop'
          }))
        );
      }

      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  // Fetch Assigned Products for Selected Warehouse using loadApiGetRecetaByAlmacen
  useEffect(() => {
    if (!selectedWarehouse) {
      setAssignedWarehouseProducts([]);
      setTargetProduct(null);
      return;
    }

    const fetchAssignedWarehouseProducts = async () => {
      setIsLoading(true);
      const res = await loadApiGetRecetaByAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
      if (res && res.success && Array.isArray(res.data)) {
        setAssignedWarehouseProducts(res.data);
      } else if (Array.isArray(res)) {
        setAssignedWarehouseProducts(res);
      } else {
        setAssignedWarehouseProducts([]);
      }
      setIsLoading(false);
    };

    fetchAssignedWarehouseProducts();
    setTargetProduct(null);
  }, [selectedWarehouse]);

  // Verificar si un producto está asignado/relacionado con el almacén seleccionado
  const isProductAssigned = (prod: any) => {
    if (!selectedWarehouse || !prod) return false;
    if (!assignedWarehouseProducts || assignedWarehouseProducts.length === 0) return false;

    return assignedWarehouseProducts.some((ap: any) => {
      const apSub2 = ap.ID_SUB_CATEGORIA_2 || ap.id_sub_categoria_2;
      const prodSub2 = prod.ID_SUB_CATEGORIA_2 || prod.id_sub_categoria_2;
      if (apSub2 && prodSub2 && Number(apSub2) === Number(prodSub2)) return true;

      const apName = (ap.PRODUCTO || ap.DESCRIPCION || ap.NOMBRE || '').trim().toUpperCase();
      const prodName = (prod.PRODUCTO || prod.DESCRIPCION || prod.name || '').trim().toUpperCase();
      if (apName && prodName && apName === prodName) return true;

      return false;
    });
  };

  // Manejador al seleccionar un producto en "Producto a Definir"
  const handleTargetProductChange = async (v: any) => {
    // Borrar inmediatamente los datos de receta anteriormente visualizados
    setRecipeItems([]);
    setHasExistingRecipe(false);
    setInitialIngredientKeys([]);

    if (!v) {
      setTargetProduct(null);
      return;
    }

    const assigned = isProductAssigned(v);
    if (!assigned) {
      setTargetProduct(null);
      // Alerta de confirmación informando al usuario sobre la falta de relación
      const confirmLink = await showAlert.confirm(
        'Producto No Relacionado al Almacén',
        `El producto "${v.PRODUCTO || v.name}" NO está asignado al almacén "${selectedWarehouse?.DESCRICION}". ¿Desea relacionar este producto a este almacén para realizar la receta?`
      );

      if (confirmLink) {
        setSelectedGlobalProduct(v);
        setIsLinkingModalOpen(true);
      }
      return;
    }

    setTargetProduct(v);
  };

  // Buscar / Cargar la Receta del producto asignado al presionar el botón de Lupa
  const handleSearchRecipe = async () => {
    if (!targetProduct || !isProductAssigned(targetProduct)) return;

    setIsLoading(true);
    const res = await loadApiGetRecetas(targetProduct.ID_SUB_CATEGORIA_2);
    if (res && res.success && res.data && res.data.length > 0) {
      const mapped = res.data.map((item: any) => ({
        id: item.ID_PRODUCTO || item.ID_PRODUCTO_INTERMEDIO,
        name: item.PRODUCTO || item.PRODUCTO_INTERMEDIO,
        unit: item.UNIDAD_MEDIDA || 'U',
        type: item.ID_PRODUCTO ? 'insumo' : 'intermedio',
        icon: item.ID_PRODUCTO ? 'bakery_dining' : 'water_drop',
        qty: item.CANTIDAD,
        tempId: item.ID_PLANTA_PRODUCTO_RECETA || Math.random(),
        id_unidad_medida: item.ID_UNIDAD_MEDIDA || 1,
        id_producto: item.ID_PRODUCTO,
        id_producto_intermedio: item.ID_PRODUCTO_INTERMEDIO
      }));
      setRecipeItems(mapped);
      setHasExistingRecipe(true);

      const keys = res.data.map((item: any) => `${item.ID_PRODUCTO || 0}-${item.ID_PRODUCTO_INTERMEDIO || 0}`);
      setInitialIngredientKeys(keys);
    } else {
      setRecipeItems([]);
      setHasExistingRecipe(false);
      setInitialIngredientKeys([]);
      showAlert.toast('No se encontró una receta registrada para este producto. Puede crear una nueva receta.');
    }
    setIsLoading(false);
  };

  const filteredIngredients = ingType === 'insumo' ? insumosList : intermediosList;

  const handleAddItem = () => {
    if (!selectedIngredient || !quantity) return;

    const exists = recipeItems.find(item =>
      (selectedIngredient.type === 'insumo' && item.id_producto === selectedIngredient.id) ||
      (selectedIngredient.type === 'intermedio' && item.id_producto_intermedio === selectedIngredient.id)
    );
    if (exists) {
      showAlert.error('Duplicado', 'El producto ya existe en la tabla');
      return;
    }

    const newItem = {
      id: selectedIngredient.id,
      name: selectedIngredient.name,
      unit: selectedIngredient.unit || 'U',
      type: selectedIngredient.type,
      icon: selectedIngredient.icon || (selectedIngredient.type === 'insumo' ? 'bakery_dining' : 'water_drop'),
      qty: Number(quantity),
      tempId: Date.now(),
      id_unidad_medida: selectedIngredient.id_unidad_medida || 1,
      id_producto: selectedIngredient.type === 'insumo' ? selectedIngredient.id : 0,
      id_producto_intermedio: selectedIngredient.type === 'intermedio' ? selectedIngredient.id : 0
    };

    setRecipeItems([newItem, ...recipeItems]);
    setSelectedIngredient(null);
    setQuantity('');
  };

  const handleRemoveItem = (tempId: number) => {
    setRecipeItems(recipeItems.filter(item => item.tempId !== tempId));
  };

  const handleLinkProduct = async () => {
    if (!selectedGlobalProduct || !selectedWarehouse) return;

    // Vincular y actualizar estado de productos asignados al almacén
    setAssignedWarehouseProducts(prev => [...prev, selectedGlobalProduct]);
    setTargetProduct(selectedGlobalProduct);
    setIsLinkingModalOpen(false);
    setSelectedGlobalProduct(null);

    showAlert.success(
      'Producto Relacionado',
      `El producto "${selectedGlobalProduct.PRODUCTO}" se ha vinculado correctamente con el almacén "${selectedWarehouse.DESCRICION}".`
    );
  };

  const handleSaveRecipe = async () => {
    if (!targetProduct || !selectedWarehouse || recipeItems.length === 0) {
      showAlert.error('Error', 'Complete los datos y agregue al menos un ingrediente');
      return;
    }

    setIsLoading(true);

    const activeProducts = recipeItems.map(item => ({
      id_producto: item.id_producto || 0,
      id_producto_intermedio: item.id_producto_intermedio || 0,
      cantidad: Number(item.qty),
      id_unidad_medida: item.id_unidad_medida || 1,
      estado: 1
    }));

    const deletedProducts = initialIngredientKeys
      .filter(key => !recipeItems.some(item => `${item.id_producto || 0}-${item.id_producto_intermedio || 0}` === key))
      .map(key => {
        const [id_producto, id_producto_intermedio] = key.split('-').map(Number);
        return {
          id_producto,
          id_producto_intermedio,
          cantidad: 0,
          id_unidad_medida: 1,
          estado: 0
        };
      });

    const payload = {
      nombre: targetProduct.PRODUCTO || targetProduct.name || "",
      id_sub_categoria_2: targetProduct.ID_SUB_CATEGORIA_2,
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      productos: [...activeProducts, ...deletedProducts]
    };

    const res = await loadApiSaveReceta(payload);
    setIsLoading(false);

    if (res && res.success) {
      showAlert.success('¡Éxito!', 'Receta guardada correctamente');
      handleReset();
    }
  };

  const handleReset = () => {
    setTargetProduct(null);
    setRecipeItems([]);
    setIngType('insumo');
    setSelectedIngredient(null);
    setQuantity('');
  };

  const selectSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '15px',
      backgroundColor: 'var(--surface-variant)',
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

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '15px',
      backgroundColor: 'var(--input-bg)',
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
    },
    '& .MuiInputBase-input': {
      fontSize: '11px',
      py: '12px !important'
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-2 px-4 md:px-0 text-on-surface">
      <LoadingOverlay show={isLoading} message="Procesando datos de receta..." />

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-on-background uppercase font-headline">
            Configuración de Receta
          </h1>
          <p className="text-[10px] text-on-surface-variant font-medium mt-1 font-body">
            Defina los componentes y cantidades exactas para la producción central.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Configuration */}
        <div className="lg:col-span-8 space-y-10">

          {/* STEP 01: Producto Objetivo */}
          <div className="bg-surface dark:bg-zinc-900 p-3 md:p-4 rounded-3xl border border-outline-variant dark:border-zinc-800 shadow-sm">
            <StepBadge num="01" label="Producto Objetivo" />
            <div className="grid grid-cols-1 gap-1 mt-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Almacén Propietario</label>
                <Autocomplete
                  options={almacenes}
                  getOptionLabel={(o: any) => o.DESCRICION || ''}
                  value={selectedWarehouse}
                  onChange={(_, v) => { setSelectedWarehouse(v); }}
                  isOptionEqualToValue={(option, value) => option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN}
                  sx={selectSx}
                  renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Seleccionar almacén..." />}
                />
              </div>

              <div className={`space-y-2 transition-all ${!selectedWarehouse ? 'opacity-30 pointer-events-none' : ''} flex-1`}>
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Producto a Definir</label>
                  {targetProduct && isProductAssigned(targetProduct) && (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md animate-in fade-in zoom-in duration-300 ${hasExistingRecipe ? 'bg-amber-500/20 text-amber-600 dark:text-amber-450' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-450'}`}>
                      {hasExistingRecipe ? '📝 Receta Existente' : '✨ Nueva Receta'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Autocomplete
                      options={productsCategoria2}
                      getOptionLabel={(o: any) => {
                        if (!o) return '';
                        const assigned = isProductAssigned(o);
                        return assigned ? (o.PRODUCTO || '') : `${o.PRODUCTO || ''} (⚠️ NO RELACIONADO AL ALMACÉN)`;
                      }}
                      value={targetProduct}
                      fullWidth
                      onChange={(_, v) => handleTargetProductChange(v)}
                      isOptionEqualToValue={(option, value) => option.ID_SUB_CATEGORIA_2 === value?.ID_SUB_CATEGORIA_2}
                      sx={selectSx}
                      renderOption={(props, option) => {
                        const assigned = isProductAssigned(option);
                        return (
                          <li
                            {...props}
                            key={option.ID_SUB_CATEGORIA_2}
                            className="flex justify-between items-center py-2 px-3 hover:bg-surface-variant cursor-pointer text-xs font-bold uppercase border-b border-outline-variant/20"
                          >
                            <span className={assigned ? 'text-on-surface font-black' : 'text-rose-500 font-black'}>
                              {option.PRODUCTO}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${assigned
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                              {assigned ? '● Asignado' : '⚠️ No Relacionado'}
                            </span>
                          </li>
                        );
                      }}
                      renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto..." />}
                    />
                  </div>

                  {/* Si el producto está asignado → Muestra Botón de Búsqueda de Receta con icono de Lupa */}
                  {targetProduct && isProductAssigned(targetProduct) && (
                    <Tooltip title="Buscar Receta del Producto">
                      <button
                        type="button"
                        onClick={handleSearchRecipe}
                        className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">search</span>
                      </button>
                    </Tooltip>
                  )}

                  {/* Si NO hay producto asignado seleccionado → Muestra Botón de Vinculación / Relación */}
                  {(!targetProduct || !isProductAssigned(targetProduct)) && (
                    <Tooltip title="Relacionar producto a este almacén">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGlobalProduct(targetProduct || null);
                          setIsLinkingModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">link</span>
                      </button>
                    </Tooltip>
                  )}
                </div>

                {!targetProduct && selectedWarehouse && (
                  <p className="text-[8px] text-on-surface-variant font-black uppercase tracking-tighter mt-1 ml-1 animate-pulse">
                    Seleccione un producto asignado (●) o presione el botón de enlace para relacionar un producto al almacén.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 02: Quick Adder */}
          <div className={`bg-surface dark:bg-zinc-900 p-3 md:p-4 rounded-3xl border border-outline-variant dark:border-zinc-800 shadow-sm transition-all ${!targetProduct ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
            <StepBadge num="02" label="Agregar Componentes" />

            <div className="space-y-4 mt-4">
              {/* Type Switcher */}
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-outline-variant pb-6">
                <ToggleButtonGroup
                  value={ingType}
                  exclusive
                  onChange={(_, v) => { if (v) { setIngType(v); setSelectedIngredient(null); } }}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: '12px',
                      px: 3,
                      border: '1px solid var(--outline-variant)',
                      textTransform: 'none',
                      fontWeight: 900,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'var(--on-surface-variant)',
                      '&.Mui-selected': {
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'var(--primary-container)'
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="insumo" className="uppercase">🍎 Materia Prima</ToggleButton>
                  <ToggleButton value="intermedio" className="uppercase">⚙️ P. Intermedio</ToggleButton>
                </ToggleButtonGroup>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase italic">* Puede mezclar ambos tipos en una misma receta</p>
              </div>

              {/* Adder Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6 space-y-2">
                  <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Ingrediente</label>
                  <Autocomplete
                    options={filteredIngredients}
                    getOptionLabel={(o: any) => o.name || o.NOMBRE || ''}
                    value={selectedIngredient}
                    onChange={(_, v) => setSelectedIngredient(v)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    sx={selectSx}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar..." />}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="block text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Cantidad {selectedIngredient ? `(${selectedIngredient.unit})` : ''}</label>
                  <TextField
                    fullWidth
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                    size="small"
                    placeholder="0.00"
                    sx={inputSx}
                  />
                </div>
                <div className="md:col-span-3">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={handleAddItem}
                    disabled={!selectedIngredient || !quantity}
                    icon="add"
                    className="!py-2"
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 03: Recipe Table */}
          <div className={`bg-surface dark:bg-zinc-900 rounded-3xl border border-outline-variant dark:border-zinc-800 shadow-sm overflow-hidden transition-all ${recipeItems.length === 0 ? 'opacity-30' : 'animate-in fade-in slide-in-from-bottom-4'}`}>
            <div className="px-4 py-4 border-b border-outline-variant bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
              <StepBadge num="03" label="Componentes Definidos" />
              {recipeItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setRecipeItems([])} className="!text-rose-500 !px-4 !py-1">Limpiar Todo</Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                    <td className="pl-6 pr-2 py-3">Componente</td>
                    <td className="px-4 py-3 text-center">Tipo</td>
                    <td className="px-4 py-3 text-center">Cantidad</td>
                    <td className="pr-6 pl-2 py-3 text-right">Acción</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/35">
                  {recipeItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <span className="material-symbols-outlined text-4xl">receipt_long</span>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay ingredientes en la receta</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recipeItems.map((item) => (
                      <tr key={item.tempId} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors group">
                        <td className="pl-6 pr-2 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            </div>
                            <div>
                              <p className="font-black text-on-surface uppercase text-xs tracking-tight">{item.name}</p>
                              <p className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">{item.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.type === 'insumo' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-450' : 'bg-blue-500/20 text-blue-600 dark:text-blue-450'}`}>
                            {item.type === 'insumo' ? 'M. Prima' : 'Intermedio'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center font-black text-on-surface text-xs">{item.qty}</td>
                        <td className="pr-6 pl-2 py-2 text-right">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.tempId)}
                              className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-450 shadow-inner hover:bg-rose-500/20 transition-all cursor-pointer"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <div className="bg-primary/5 dark:bg-zinc-900 rounded-3xl p-2 md:p-4 text-on-surface shadow-sm border border-outline-variant overflow-hidden relative">
              <StepBadge num="✓" label="Resumen de Receta" />

              <div className="space-y-3 mt-3">
                <div className="p-4 bg-surface dark:bg-zinc-950/40 rounded-2xl border border-outline-variant shadow-sm">
                  <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Total Componentes</p>
                  <p className="text-2xl font-black text-on-surface">{recipeItems.length} <span className="text-[10px] text-on-surface-variant uppercase font-normal">ítems</span></p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest border-b border-outline-variant pb-2.5">
                    <span className="text-on-surface-variant">Materias Primas</span>
                    <span className="text-on-surface">{recipeItems.filter(i => i.type === 'insumo').length}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest border-b border-outline-variant pb-2.5">
                    <span className="text-on-surface-variant">Prod. Intermedios</span>
                    <span className="text-on-surface">{recipeItems.filter(i => i.type === 'intermedio').length}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant={hasExistingRecipe ? "secondary" : "primary"}
                    size="sm"
                    fullWidth
                    onClick={handleSaveRecipe}
                    icon={hasExistingRecipe ? "history_edu" : "auto_fix_high"}
                    className="!h-12 shadow-lg shadow-primary/20"
                  >
                    {hasExistingRecipe ? 'Actualizar Receta' : 'Guardar Receta'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={handleReset}
                    className="mt-3 !text-on-surface-variant"
                  >
                    Cancelar Edición
                  </Button>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 flex gap-4">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">info</span>
              <p className="text-[9px] text-amber-700 dark:text-amber-450 font-bold leading-relaxed uppercase">
                Consejo: Puede presionar <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">Enter</span> después de escribir la cantidad para añadir rápidamente el ingrediente a la lista.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Vinculación en components/LinkingModal.tsx */}
      <LinkingModal
        open={isLinkingModalOpen}
        onClose={() => setIsLinkingModalOpen(false)}
        selectedWarehouse={selectedWarehouse}
        productsCategoria2={productsCategoria2}
        selectedGlobalProduct={selectedGlobalProduct}
        setSelectedGlobalProduct={setSelectedGlobalProduct}
        handleLinkProduct={handleLinkProduct}
        selectSx={selectSx}
      />

      {/* Global Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CrearReceta;

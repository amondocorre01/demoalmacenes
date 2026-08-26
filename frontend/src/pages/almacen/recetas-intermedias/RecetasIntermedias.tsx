/**
 * RecetasIntermedias.tsx
 * 
 * 1. Propósito de la Vista:
 *    Gestión jerárquica de recetas e insumos para productos intermedios por almacén.
 * 
 * 2. APIs Utilizadas:
 *    - GET /v1/recetas-intermedias/usuarios/almacenes (Listar almacenes asignados al usuario)
 *    - GET /v1/recetas-intermedias/unidades-medida (Listar unidades de medida del sistema)
 *    - GET /v1/recetas-intermedias/productos-receta?codigo_tipo=1 (Listar insumos / materias primas)
 *    - GET /v1/recetas-intermedias/receta-intermedio/:id (Obtener recetas y medidas de un producto intermedio)
 *    - GET /v1/recetas-intermedias/almacenes/productos?id_planta_almacen=:id (Listar productos intermedios asignados al almacén)
 *    - GET /v1/recetas-intermedias/productos-intermedios (Listar catálogo de productos intermedios activos)
 *    - POST /v1/recetas-intermedias/recetas-intermedias (Crear nueva medida / cabecera de receta intermedia)
 *    - PUT /v1/recetas-intermedias/recetas-intermedias/:id (Editar cabecera de receta intermedia)
 *    - POST /v1/recetas-intermedias/recetas-intermedias/productos (Guardar/actualizar ingredientes de receta intermedia)
 *    - POST /v1/recetas-intermedias/asignar-almacen (Vincular producto intermedio a almacén)
 * 
 * 3. Controles Clave:
 *    - Selección dinámica de almacén y filtrado de productos intermedios asociados.
 *    - Modales desacoplados en carpeta components/ (NuevaMedidaModal, VincularIntermedioModal).
 *    - Control de estados de carga con LoadingOverlay.
 *    - Autocompletado MUI en selectores y campos de entrada numéricos limpios sin '0' por defecto.
 *    - Cumplimiento estricto de diseño y tokens de tema claro/oscuro de AGENTS.md.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Switch,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { showAlert } from '../../../config/alerts';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { useRecetasIntermediasServices } from './services/useRecetasIntermedias';
import { NuevaMedidaModal } from './components/NuevaMedidaModal';
import { VincularIntermedioModal } from './components/VincularIntermedioModal';

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">{label}</span>
  </div>
);

const RecetasIntermedias: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const {
    loadApiGetAlmacenesUsuario,
    loadApiGetUnidadesMedida,
    loadApiGetProductosForReceta,
    loadApiGetRecetaIntermedio,
    loadApiGetProductosIntermediosByAlmacen,
    loadApiGetProductosIntermediosActivos,
    loadApiSaveRecetaIntermedio,
    loadApiEditarRecetaIntermedio,
    loadApiAgregarProductosRI,
    loadApiAsignarProductoIntAlmacen
  } = useRecetasIntermediasServices();

  // API Lists
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [masterProductList, setMasterProductList] = useState<any[]>([]);
  const [insumosList, setInsumosList] = useState<any[]>([]);
  const [intermediosList, setIntermediosList] = useState<any[]>([]);

  // Selection States
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Linking State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Measures State
  const [measures, setMeasures] = useState<any[]>([]);
  const [selectedMeasureId, setSelectedMeasureId] = useState<number | string | null>(null);
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);

  // Recipe Adder State
  const [ingType, setIngType] = useState<'insumo' | 'intermedio'>('insumo');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [quantity, setQuantity] = useState<string>('');

  // UI Control
  const [isLoading, setIsLoading] = useState(false);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 1. Initial Load of Global Catalogs
  useEffect(() => {
    const loadInitialCatalogs = async () => {
      setIsLoading(true);

      const [resAlmacenes, resUnidades, resInsumos, resIntermedios] = await Promise.all([
        loadApiGetAlmacenesUsuario(),
        loadApiGetUnidadesMedida(),
        loadApiGetProductosForReceta(1),
        loadApiGetProductosIntermediosActivos()
      ]);

      if (resAlmacenes && resAlmacenes.success) {
        setAlmacenes(resAlmacenes.data || []);
      }
      if (resUnidades && resUnidades.success) {
        setUnitsList(resUnidades.data || []);
      }
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
      if (resIntermedios && resIntermedios.success) {
        const master = resIntermedios.data || [];
        setMasterProductList(master);
        setIntermediosList(
          master.map((i: any) => ({
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

    loadInitialCatalogs();
  }, []);

  // 2. Fetch Products Assigned to Selected Warehouse
  useEffect(() => {
    if (!selectedWarehouse) {
      setAvailableProducts([]);
      setSelectedProduct(null);
      setIsDataVisible(false);
      setMeasures([]);
      setSelectedMeasureId(null);
      return;
    }

    const fetchWarehouseProducts = async () => {
      setIsLoading(true);
      const res = await loadApiGetProductosIntermediosByAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
      if (res && res.success) {
        setAvailableProducts(res.data || []);
      } else {
        setAvailableProducts([]);
      }
      setSelectedProduct(null);
      setIsDataVisible(false);
      setMeasures([]);
      setSelectedMeasureId(null);
      setIsLoading(false);
    };

    fetchWarehouseProducts();
  }, [selectedWarehouse]);

  // Active measure lookup
  const activeMeasure = measures.find(m => m.id === selectedMeasureId);

  // 3. Search & Fetch Recipe / Measures for Selected Product Intermedio
  const handleSearch = async () => {
    if (!selectedWarehouse || !selectedProduct) {
      setSnackbar({ open: true, message: 'Seleccione almacén y producto primero', severity: 'error' });
      return;
    }

    setIsLoading(true);
    const prodId = selectedProduct.ID_PRODUCTO_INTERMEDIO || selectedProduct.id;
    const res = await loadApiGetRecetaIntermedio(prodId);

    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      const mappedMeasures = res.data.map((m: any, idx: number) => {
        const rawProducts = Array.isArray(m.PRODUCTOS) ? m.PRODUCTOS : [];
        const recipeList = rawProducts.map((rp: any) => ({
          tempId: rp.ID_RECETA_INTERMEDIO || Math.random(),
          id: rp.ID_PRODUCTO || rp.ID_PRODUCTO_INTERMEDIO_ANTECESOR,
          name: rp.PRODUCTO || rp.PRODUCTO_INTERMEDIO_ANTECESOR || 'Componente',
          unit: rp.UNIDAD_MEDIDA || 'U',
          type: rp.ID_PRODUCTO ? 'insumo' : 'intermedio',
          icon: rp.ID_PRODUCTO ? 'bakery_dining' : 'water_drop',
          qty: rp.CANTIDAD,
          id_unidad_medida: rp.ID_UNIDAD_MEDIDA,
          id_producto: rp.ID_PRODUCTO || 0,
          id_producto_intermedio_antecesor: rp.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0,
          estado: rp.ESTADO ?? 1
        }));

        return {
          id: m.ID_PLANTA_RI_PI || idx + 1,
          id_planta_ri_pi: m.ID_PLANTA_RI_PI,
          num_receta: m.NUM_RECETA,
          label: `Lote ${m.NUM_RECETA || idx + 1} (${m.CANTIDAD_ESTANDAR} ${m.UNIDAD_ESTANDAR || 'Unidades'})`,
          stdQty: m.CANTIDAD_ESTANDAR,
          stdUnit: m.UNIDAD_ESTANDAR || 'Unidad',
          id_unidad_medida_e: m.ID_UNIDAD_MEDIDA_ESTANDAR,
          adeqQty: m.CANTIDAD_ADECUACION,
          adeqUnit: m.UNIDAD_ADECUACION || 'Unidad',
          id_unidad_medida_a: m.ID_UNIDAD_MEDIDA_ADECUACION,
          enabled: m.ESTADO === 1,
          recipe: recipeList
        };
      });

      setMeasures(mappedMeasures);
      const activeOne = mappedMeasures.find((m: any) => m.enabled) || mappedMeasures[0];
      setSelectedMeasureId(activeOne ? activeOne.id : null);
      setIsDataVisible(true);
      setSnackbar({ open: true, message: 'Datos de receta cargados correctamente', severity: 'success' });
    } else {
      setMeasures([]);
      setSelectedMeasureId(null);
      setIsDataVisible(true);
      showAlert.toast('No se encontraron recetas definidas para este producto. Puede crear una nueva medida.');
    }

    setIsLoading(false);
  };

  // 4. Toggle Measure Active State
  const handleToggleMeasure = async (measureId: number | string) => {
    const updated = measures.map(m => ({
      ...m,
      enabled: m.id === measureId
    }));
    setMeasures(updated);
    setSnackbar({ open: true, message: 'Estado de medida actualizado localmente', severity: 'success' });
  };

  // 5. Link Product Intermedio to Warehouse via API
  const handleLinkProduct = async (productToLink: any) => {
    if (!productToLink || !selectedWarehouse) return;

    setIsLoading(true);
    const payload = {
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      id_producto_intermedio: productToLink.ID_PRODUCTO_INTERMEDIO || productToLink.id,
      estado: 1
    };

    const res = await loadApiAsignarProductoIntAlmacen(payload);
    setIsLoading(false);

    if (res && (res.success || res.message)) {
      showAlert.success('¡Producto Vinculado!', `Se vinculó "${productToLink.NOMBRE || productToLink.name}" a "${selectedWarehouse.DESCRICION}".`);
      // Reload warehouse products list
      const resProducts = await loadApiGetProductosIntermediosByAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN);
      if (resProducts && resProducts.success) {
        setAvailableProducts(resProducts.data || []);
      }
      setSelectedProduct(productToLink);
    }
  };

  // 6. Add New Measure via API
  const handleSaveNewMeasure = async (data: {
    label: string;
    stdQty: string | number;
    stdUnitId: number | string;
    adeqQty: string | number;
    adeqUnitId: number | string;
  }) => {
    if (!selectedProduct) return;

    setIsLoading(true);
    const payload = {
      id_producto_intermedio: selectedProduct.ID_PRODUCTO_INTERMEDIO || selectedProduct.id,
      cantidad_e: Number(data.stdQty),
      id_unidad_medida_e: Number(data.stdUnitId),
      cantidad_a: Number(data.adeqQty),
      id_unidad_medida_a: Number(data.adeqUnitId)
    };

    const res = await loadApiSaveRecetaIntermedio(payload);
    setIsLoading(false);

    if (res && res.success) {
      showAlert.success('¡Éxito!', 'Nueva unidad de medida guardada correctamente');
      // Reload recipe measures from server
      handleSearch();
    }
  };

  // 7. Add Ingredient to Active Measure (Local)
  const handleAddIngredient = () => {
    if (!selectedProduct || !selectedMeasureId || !selectedIngredient || !quantity) return;

    const exists = activeMeasure?.recipe.some(
      (item: any) =>
        (selectedIngredient.type === 'insumo' && item.id_producto === selectedIngredient.id) ||
        (selectedIngredient.type === 'intermedio' && item.id_producto_intermedio_antecesor === selectedIngredient.id)
    );

    if (exists) {
      showAlert.error('Duplicado', 'El ingrediente ya se encuentra en la receta');
      return;
    }

    const newItem = {
      tempId: Date.now(),
      id: selectedIngredient.id,
      name: selectedIngredient.name,
      unit: selectedIngredient.unit || 'U',
      type: selectedIngredient.type,
      icon: selectedIngredient.icon || (selectedIngredient.type === 'insumo' ? 'bakery_dining' : 'water_drop'),
      qty: Number(quantity),
      id_unidad_medida: selectedIngredient.id_unidad_medida || 1,
      id_producto: selectedIngredient.type === 'insumo' ? selectedIngredient.id : 0,
      id_producto_intermedio_antecesor: selectedIngredient.type === 'intermedio' ? selectedIngredient.id : 0,
      estado: 1
    };

    const updatedMeasures = measures.map(m => {
      if (m.id === selectedMeasureId) {
        return {
          ...m,
          recipe: [newItem, ...m.recipe]
        };
      }
      return m;
    });

    setMeasures(updatedMeasures);
    setSelectedIngredient(null);
    setQuantity('');
  };

  // 8. Remove Ingredient from Active Measure (Local)
  const handleRemoveIngredient = (tempId: number) => {
    if (!selectedProduct || !selectedMeasureId) return;

    const updatedMeasures = measures.map(m => {
      if (m.id === selectedMeasureId) {
        return { ...m, recipe: m.recipe.filter((i: any) => i.tempId !== tempId) };
      }
      return m;
    });

    setMeasures(updatedMeasures);
  };

  // 9. Save Entire Recipe Composition via API
  const handleSaveRecipe = async () => {
    if (!selectedProduct || !activeMeasure) {
      showAlert.error('Error', 'Seleccione un producto y una medida válida');
      return;
    }

    if (!activeMeasure.id_planta_ri_pi) {
      showAlert.error('Error', 'Guarde la unidad de medida en el sistema antes de asignar ingredientes');
      return;
    }

    setIsLoading(true);
    const productosPayload = activeMeasure.recipe.map((item: any) => ({
      id_producto: item.id_producto || 0,
      id_producto_intermedio: item.id_producto_intermedio_antecesor || 0,
      id_unidad_medida: item.id_unidad_medida || 1,
      cantidad: Number(item.qty),
      num_receta: activeMeasure.num_receta || 1,
      estado: item.estado ?? 1
    }));

    const payload = {
      id_planta_ri_pi: activeMeasure.id_planta_ri_pi,
      productos: productosPayload
    };

    const res = await loadApiAgregarProductosRI(payload);
    setIsLoading(false);

    if (res && (res.success || res.message)) {
      setSnackbar({ open: true, message: 'Receta intermedia guardada con éxito', severity: 'success' });
      setIsSuccessDialogOpen(true);
    }
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
      backgroundColor: 'var(--surface-variant)',
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

  const filteredIngredients = ingType === 'insumo' ? insumosList : intermediosList;

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0 text-on-surface">
      {/* Header Section */}
      <div className="-mt-2 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-2xl font-black text-on-background tracking-tight uppercase font-headline">
            Recetas Intermedias
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Gestión jerárquica de medidas y composiciones base.
          </p>
        </div>
        <Tooltip title="Vincular nuevo producto intermedio a un almacén">
          {selectedWarehouse && (
            <div className="shrink-0 flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => {
                  if (!selectedWarehouse) {
                    //showAlert.toast('Seleccione un almacén primero para vincular un producto.');
                    return;
                  }
                  setIsLinkModalOpen(true);
                }}
                variant="primary"
                size="sm"
                icon="link"
                className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
              >
                Vincular Producto
              </Button>
            </div>)}
        </Tooltip>
      </div>

      {/* Header Filters Box */}
      <div className="mb-3 p-3 md:p-3 bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto flex-1">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Almacén
              </label>
              <Autocomplete
                options={almacenes}
                getOptionLabel={(o: any) => o.DESCRICION || o.NOMBRE || ''}
                value={selectedWarehouse}
                onChange={(_, v) => {
                  setSelectedWarehouse(v);
                  setSelectedProduct(null);
                  setSelectedMeasureId(null);
                  setIsDataVisible(false);
                }}
                isOptionEqualToValue={(o, v) => (o.ID_PLANTA_ALMACEN || o.id) === (v.ID_PLANTA_ALMACEN || v.id)}
                sx={selectSx}
                renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Seleccionar almacén..." />}
              />
            </div>
            <div className={`space-y-1 transition-all ${!selectedWarehouse ? 'opacity-30 pointer-events-none' : ''}`}>
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                Producto Intermedio
              </label>
              <Autocomplete
                options={availableProducts}
                getOptionLabel={(o: any) => o.NOMBRE || o.name || ''}
                value={selectedProduct}
                onChange={(_, v) => {
                  setSelectedProduct(v);
                  setSelectedMeasureId(null);
                  setIsDataVisible(false);
                }}
                isOptionEqualToValue={(o, v) => (o.ID_PRODUCTO_INTERMEDIO || o.id) === (v.ID_PRODUCTO_INTERMEDIO || v.id)}
                sx={selectSx}
                renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar producto..." />}
              />
              {!selectedProduct && selectedWarehouse && (
                <p className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tighter mt-1 ml-1 animate-pulse">
                  ¿No encuentras el producto? Usa el botón "Vincular Producto" arriba.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Tooltip title="Buscar Receta del Producto Intermedio">
              <button
                type="button"
                onClick={handleSearch}
                disabled={isLoading || !selectedWarehouse || !selectedProduct}
                className={`w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-400 border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-inner ${isLoading || !selectedWarehouse || !selectedProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <span className="material-symbols-outlined text-2xl font-bold">search</span>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <LoadingOverlay show={isLoading} message="Cargando recetas e ingredientes..." />

      {!isDataVisible ? (
        <div className="flex flex-col items-center justify-center py-28 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-3xl bg-surface-variant/50 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-outline-variant/40 shadow-inner">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">manage_search</span>
          </div>
          <p className="text-sm font-black text-on-surface uppercase tracking-tight font-headline">Esperando búsqueda...</p>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.15em] mt-1 max-w-[320px] text-center leading-relaxed font-body">
            Selecciona un almacén y producto para visualizar sus recetas y medidas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Left Column: Measures List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-center">
              <StepBadge num="01" label="Unidades de Medida" />
              <Button
                variant="primary"
                size="sm"
                icon="add" className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
                onClick={() => setIsMeasureModalOpen(true)}
              >
                Nueva Medida
              </Button>
            </div>

            <div className="space-y-3 -mt-2">
              {measures.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-outline-variant/50 dark:border-zinc-800 rounded-3xl text-center space-y-3 bg-surface/50 dark:bg-zinc-900/50">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">straighten</span>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                    No hay medidas definidas
                  </p>
                </div>
              ) : (
                measures.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeasureId(m.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${selectedMeasureId === m.id
                      ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                      : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-outline text-on-surface shadow-sm'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className={`font-black text-xs uppercase tracking-tight font-headline ${selectedMeasureId === m.id ? 'text-white' : 'text-on-surface'}`}>
                        {m.label}
                      </p>
                      <div className="flex flex-col items-end gap-1">
                        <Switch
                          checked={m.enabled}
                          size="small"
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleMeasure(m.id);
                          }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: selectedMeasureId === m.id ? '#fff' : 'var(--primary)'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: selectedMeasureId === m.id ? 'rgba(255,255,255,0.4)' : 'var(--primary)'
                            }
                          }}
                        />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${m.enabled
                          ? (selectedMeasureId === m.id ? 'text-white' : 'text-emerald-600 dark:text-emerald-400')
                          : (selectedMeasureId === m.id ? 'text-white/50' : 'text-on-surface-variant')
                          }`}>
                          {m.enabled ? 'Habilitado' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2.5 rounded-2xl ${selectedMeasureId === m.id ? 'bg-white/20' : 'bg-surface-variant/50 dark:bg-zinc-800/50'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${selectedMeasureId === m.id ? 'text-white/70' : 'text-on-surface-variant'}`}>
                          Estándar
                        </p>
                        <p className="text-xs font-black">{m.stdQty} {m.stdUnit}</p>
                      </div>
                      <div className={`p-2.5 rounded-2xl ${selectedMeasureId === m.id ? 'bg-white/20' : 'bg-surface-variant/50 dark:bg-zinc-800/50'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${selectedMeasureId === m.id ? 'text-white/70' : 'text-on-surface-variant'}`}>
                          Adecuación
                        </p>
                        <p className="text-xs font-black">{m.adeqQty} {m.adeqUnit}</p>
                      </div>
                    </div>

                    {selectedMeasureId === m.id && (
                      <div className="absolute top-1/2 -right-3 w-3 h-7 bg-primary rounded-r-md hidden lg:flex items-center justify-center border-l border-white/20">
                        <span className="material-symbols-outlined text-white text-[12px]">chevron_right</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Recipe Component Editor */}
          <div className={`lg:col-span-8 space-y-6 transition-all ${!activeMeasure ? 'opacity-30 blur-[2px] pointer-events-none' : 'animate-in fade-in slide-in-from-right-6'}`}>
            <div className="flex justify-between items-center">
              <StepBadge num="02" label={`Composición: ${activeMeasure?.label || ''}`} />
              <Button
                variant="primary"
                size="sm"
                icon="save"
                onClick={handleSaveRecipe}
                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
              >
                Guardar Receta
              </Button>
            </div>

            {/* Quick Adder Card */}
            <div className="p-4 md:p-5 bg-surface dark:bg-zinc-900 rounded-3xl border border-outline-variant dark:border-zinc-800 shadow-sm space-y-4 -mt-3">
              <div className="flex flex-col sm:flex-row gap-4 items-center border-b border-outline-variant/40 pb-4">
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
                        '&:hover': { backgroundColor: 'var(--primary-container)' }
                      }
                    }
                  }}
                >
                  <ToggleButton value="insumo" className="uppercase">🍎 Materia Prima</ToggleButton>
                  <ToggleButton value="intermedio" className="uppercase">⚙️ P. Intermedio</ToggleButton>
                </ToggleButtonGroup>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase italic">* Puede agregar sub-recetas intermedias</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Ingrediente</label>
                  <Autocomplete
                    options={filteredIngredients}
                    getOptionLabel={(o: any) => o.name || o.NOMBRE || ''}
                    value={selectedIngredient}
                    onChange={(_, v) => setSelectedIngredient(v)}
                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                    sx={selectSx}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="Buscar ingrediente..." />}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
                    Cantidad {selectedIngredient?.unit ? `(${selectedIngredient.unit})` : ''}
                  </label>
                  <TextField
                    fullWidth
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddIngredient(); }}
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
                    onClick={handleAddIngredient}
                    disabled={!selectedIngredient || !quantity}
                    icon="add"
                    className="!py-2"
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            </div>

            {/* Ingredient Table (Compact Standard) */}
            <div className="bg-surface dark:bg-zinc-900 rounded-3xl border border-outline-variant dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/40">
                      <td className="pl-6 pr-2 py-3">Componente</td>
                      <td className="px-4 py-3 text-center">Tipo</td>
                      <td className="px-4 py-3 text-center">Cantidad</td>
                      <td className="pr-6 pl-2 py-3 text-right">Acción</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {!activeMeasure || activeMeasure.recipe.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center opacity-40">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Esta medida no tiene receta definida</p>
                        </td>
                      </tr>
                    ) : (
                      activeMeasure.recipe.map((item: any) => (
                        <tr key={item.tempId} className="hover:bg-surface-variant/30 dark:hover:bg-zinc-800/30 transition-colors group">
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
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.type === 'insumo'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              }`}>
                              {item.type === 'insumo' ? 'M. Prima' : 'Intermedio'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center font-black text-on-surface text-xs">{item.qty}</td>
                          <td className="pr-6 pl-2 py-2 text-right">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(item.tempId)}
                                title="Eliminar ingrediente"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px] sm:text-base">delete</span>
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
        </div>
      )}

      {/* Modal: Nueva Medida */}
      <NuevaMedidaModal
        open={isMeasureModalOpen}
        onClose={() => setIsMeasureModalOpen(false)}
        unitsList={unitsList}
        onSave={handleSaveNewMeasure}
        isLoading={isLoading}
        selectSx={selectSx}
      />

      {/* Modal: Vincular Producto Intermedio */}
      <VincularIntermedioModal
        open={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        warehouseName={selectedWarehouse?.DESCRICION || ''}
        masterProductList={masterProductList}
        onLink={handleLinkProduct}
        isLoading={isLoading}
        selectSx={selectSx}
      />

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

      {/* Success Dialog / Next Step */}
      <Dialog
        open={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        slotProps={{
          paper: {
            className: 'bg-surface dark:bg-zinc-900 rounded-3xl p-2 max-w-[450px] border border-outline-variant dark:border-zinc-800 text-on-surface'
          }
        }}
      >
        <DialogContent className="flex flex-col items-center py-6 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg border-4 border-emerald-500/10 animate-bounce">
            <span className="material-symbols-outlined text-4xl font-black">done_all</span>
          </div>

          <div className="space-y-1">
            <p className="text-xl font-black text-on-surface uppercase tracking-tight font-headline">¡Receta Intermedia Guardada!</p>
            <p className="text-on-surface-variant font-medium text-xs leading-relaxed">
              La receta intermedia para <strong className="text-primary uppercase">{selectedProduct?.NOMBRE || selectedProduct?.name}</strong> se ha guardado y consolidado con éxito.
            </p>
          </div>

          <div className="w-full border-t border-outline-variant dark:border-zinc-800" />

          <div className="space-y-4 w-full">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none">Siguiente Paso Sugerido</p>
            <p className="text-xs font-black text-on-surface uppercase tracking-tight">¿Deseas registrar la Receta Final ahora?</p>

            <Button
              variant="primary"
              size="md"
              fullWidth
              icon="restaurant_menu"
              onClick={() => {
                setIsSuccessDialogOpen(false);
                navigate('/almacen/crear-receta');
              }}
            >
              Sí, Registrar Receta Final
            </Button>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSuccessDialogOpen(false)}
          >
            No por ahora, salir
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RecetasIntermedias;

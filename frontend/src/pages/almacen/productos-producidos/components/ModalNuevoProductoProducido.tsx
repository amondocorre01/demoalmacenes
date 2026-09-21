import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  useTheme,
  useMediaQuery,
  Zoom,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  useProductosProducidosServices,
  AlmacenItem,
  AreaItem,
  RecetaProduccionItem,
  RegistrarProduccionPayload,
  ProductoProduccionPayloadItem,
} from '../services/useProductosProducidos';

interface ModalNuevoProductoProducidoProps {
  open: boolean;
  onClose: () => void;
  warehouses: AlmacenItem[];
  areas: AreaItem[];
  onSaveSuccess: () => void;
  defaultWarehouse?: AlmacenItem | null;
}

interface ProductionListItem {
  id: string | number;
  receta: RecetaProduccionItem;
  cantidadProducida: number;
  cantidadDesperdicio: number;
  detalle: string;
  isIntermediate: boolean;
}

export const ModalNuevoProductoProducido: React.FC<ModalNuevoProductoProducidoProps> = ({
  open,
  onClose,
  warehouses,
  areas,
  onSaveSuccess,
  defaultWarehouse = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetRecetasByAlmacen, loadApiRegistrarProductosProducidos } =
    useProductosProducidosServices();

  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  // Filtro de recetas por tipo: null = Todos, 0 = Intermedios, 1 = Finales
  const [recipeTypeFilter, setRecipeTypeFilter] = useState<'all' | '0' | '1'>('all');
  const [availableRecetas, setAvailableRecetas] = useState<RecetaProduccionItem[]>([]);
  const [isLoadingRecetas, setIsLoadingRecetas] = useState(false);

  // Estados del selector para añadir producto
  const [selectedReceta, setSelectedReceta] = useState<RecetaProduccionItem | null>(null);
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [wasteInput, setWasteInput] = useState<string>('0');
  const [detailInput, setDetailInput] = useState<string>('');

  // Lista de productos a producir en esta orden
  const [productionItems, setProductionItems] = useState<ProductionListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Inicialización al abrir
  useEffect(() => {
    if (open) {
      const initialWh = defaultWarehouse || (warehouses.length > 0 ? warehouses[0] : null);
      const initialArea = areas.length > 0 ? areas[0] : null;

      setSelectedWarehouse(initialWh);
      setSelectedArea(initialArea);
      setRecipeTypeFilter('all');
      setSelectedReceta(null);
      setQtyInput('1');
      setWasteInput('0');
      setDetailInput('');
      setProductionItems([]);

      if (initialWh) {
        fetchRecetas(initialWh.ID_PLANTA_ALMACEN, null);
      }
    }
  }, [open, defaultWarehouse, warehouses, areas]);

  const fetchRecetas = async (idAlmacen: number | string, tipo: number | null) => {
    if (!idAlmacen) {
      setAvailableRecetas([]);
      return;
    }
    setIsLoadingRecetas(true);
    const res = await loadApiGetRecetasByAlmacen(idAlmacen, tipo);
    if (res && res.success && Array.isArray(res.recetas)) {
      setAvailableRecetas(res.recetas);
    } else {
      setAvailableRecetas([]);
    }
    setIsLoadingRecetas(false);
  };

  const handleWarehouseChange = (newWh: AlmacenItem | null) => {
    setSelectedWarehouse(newWh);
    setSelectedReceta(null);
    setProductionItems([]);
    if (newWh) {
      const tipo = recipeTypeFilter === 'all' ? null : parseInt(recipeTypeFilter, 10);
      fetchRecetas(newWh.ID_PLANTA_ALMACEN, tipo);
    } else {
      setAvailableRecetas([]);
    }
  };

  const handleTypeFilterChange = (newType: 'all' | '0' | '1') => {
    if (!newType) return;
    setRecipeTypeFilter(newType);
    setSelectedReceta(null);
    if (selectedWarehouse) {
      const tipo = newType === 'all' ? null : parseInt(newType, 10);
      fetchRecetas(selectedWarehouse.ID_PLANTA_ALMACEN, tipo);
    }
  };

  // Cálculo consolidado de insumos requeridos en tiempo real
  const aggregatedStockReport = useMemo(() => {
    const requirements: Record<
      string,
      {
        name: string;
        required: number;
        available: number;
        unit: string;
      }
    > = {};

    // 1. Insumos de los productos ya añadidos a la lista
    productionItems.forEach((pItem) => {
      const ingredientes = pItem.receta.PRODUCTOS || [];
      ingredientes.forEach((ing) => {
        const key = `${ing.ID_PRODUCTO || 0}_${ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0}_${ing.PRODUCTO || ''}`;
        const reqQty = (ing.CANTIDAD || 0) * pItem.cantidadProducida;
        if (!requirements[key]) {
          requirements[key] = {
            name: ing.PRODUCTO || 'Insumo',
            required: 0,
            available: ing.stock ?? 0,
            unit: ing.UNIDAD_MEDIDA || 'uds',
          };
        }
        requirements[key].required += reqQty;
      });
    });

    // 2. Vista previa del producto en edición
    if (selectedReceta && Number(qtyInput) > 0) {
      const qtyNum = parseFloat(qtyInput) || 0;
      const ingredientes = selectedReceta.PRODUCTOS || [];
      ingredientes.forEach((ing) => {
        const key = `${ing.ID_PRODUCTO || 0}_${ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0}_${ing.PRODUCTO || ''}`;
        const reqQty = (ing.CANTIDAD || 0) * qtyNum;
        if (!requirements[key]) {
          requirements[key] = {
            name: ing.PRODUCTO || 'Insumo',
            required: 0,
            available: ing.stock ?? 0,
            unit: ing.UNIDAD_MEDIDA || 'uds',
          };
        }
        requirements[key].required += reqQty;
      });
    }

    return Object.values(requirements).map((item) => ({
      ...item,
      sufficient: item.available >= item.required,
      deficit: Math.max(0, item.required - item.available),
    })).sort((a, b) => {
      if (a.sufficient !== b.sufficient) return a.sufficient ? 1 : -1;
      return b.deficit - a.deficit;
    });
  }, [productionItems, selectedReceta, qtyInput]);

  const hasMissingStock = aggregatedStockReport.some((r) => !r.sufficient);

  // Añadir producto a la orden
  const handleAddProduct = () => {
    if (!selectedReceta) {
      showAlert.warning('Seleccionar Producto', 'Por favor seleccione una receta o producto.');
      return;
    }

    const qty = parseFloat(qtyInput);
    if (isNaN(qty) || qty <= 0) {
      showAlert.warning('Cantidad Inválida', 'La cantidad a producir debe ser mayor a 0.');
      return;
    }

    const waste = parseFloat(wasteInput) || 0;
    if (waste < 0) {
      showAlert.warning('Merma Inválida', 'La cantidad de desperdicio no puede ser negativa.');
      return;
    }

    // Verificar si ya está en la lista
    const isDuplicate = productionItems.some(
      (item) => item.receta.ID_PLANTA_RECETA === selectedReceta.ID_PLANTA_RECETA &&
        item.receta.ID_PRODUCTO_INTERMEDIO === selectedReceta.ID_PRODUCTO_INTERMEDIO
    );

    if (isDuplicate) {
      showAlert.warning(
        'Producto Ya Añadido',
        'Este producto ya se encuentra en la lista de producción. Modifique la cantidad directamente en la tabla si lo requiere.'
      );
      return;
    }

    const isIntermediate = (selectedReceta.ID_PLANTA_RECETA === 0 || !selectedReceta.ID_PLANTA_RECETA) &&
      (Number(selectedReceta.ID_PRODUCTO_INTERMEDIO) > 0);

    const newItem: ProductionListItem = {
      id: `${selectedReceta.ID_PLANTA_RECETA}_${selectedReceta.ID_PRODUCTO_INTERMEDIO}_${Date.now()}`,
      receta: selectedReceta,
      cantidadProducida: qty,
      cantidadDesperdicio: waste,
      detalle: detailInput.trim(),
      isIntermediate,
    };

    setProductionItems((prev) => [...prev, newItem]);
    setSelectedReceta(null);
    setQtyInput('1');
    setWasteInput('0');
    setDetailInput('');
  };

  const handleQtyChange = (id: string | number, val: string) => {
    if (val === '') {
      setProductionItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, cantidadProducida: 0 } : i))
      );
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setProductionItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidadProducida: num } : i))
    );
  };

  const handleWasteChange = (id: string | number, val: string) => {
    if (val === '') {
      setProductionItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, cantidadDesperdicio: 0 } : i))
      );
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setProductionItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidadDesperdicio: num } : i))
    );
  };

  const handleRemoveItem = (id: string | number) => {
    setProductionItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Guardar orden de producción
  const handleSave = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Campo Requerido', 'Por favor seleccione el almacén productor.');
      return;
    }

    if (productionItems.length === 0) {
      showAlert.warning('Sin Productos', 'Debe agregar al menos un producto a la orden de producción.');
      return;
    }

    // Validar si algún item no tiene cantidad válida
    const invalidItem = productionItems.find((i) => i.cantidadProducida <= 0);
    if (invalidItem) {
      showAlert.warning(
        'Cantidad Inválida',
        `El producto ${invalidItem.receta.PRODUCTO || invalidItem.receta.NOMBRE} debe tener una cantidad mayor a 0.`
      );
      return;
    }

    // Confirmación
    const confirmed = await showAlert.confirm(
      '¿Confirmar Registro de Producción?',
      `Se registrará la producción de ${productionItems.length} producto(s) en el almacén ${selectedWarehouse.DESCRICION || selectedWarehouse.nombre}.`
    );

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const payload: RegistrarProduccionPayload = {
        id_area: selectedArea ? Number(selectedArea.ID_AREA) : 0,
        productos: productionItems.map((item): ProductoProduccionPayloadItem => ({
          id_planta_almacen: Number(selectedWarehouse.ID_PLANTA_ALMACEN),
          id_planta_receta: Number(item.receta.ID_PLANTA_RECETA || 0),
          id_producto_intermedio: Number(item.receta.ID_PRODUCTO_INTERMEDIO || 0),
          id_sub_categoria_2: Number(item.receta.ID_SUB_CATEGORIA_2 || 0),
          cantidad_producida: item.cantidadProducida,
          cantidad_desperdicio: item.cantidadDesperdicio,
          detalle: item.detalle || '',
          producto: item.receta.PRODUCTO || item.receta.NOMBRE || '',
          cant_AE: Number(item.receta.CANTIDAD_ADECUACION || 1),
          imagen: '',
          idEstado: 4,
        })),
      };

      const res = await loadApiRegistrarProductosProducidos(payload);
      if (res && res.success) {
        showAlert.success(
          'Producción Registrada',
          res.message || 'La orden de producción fue procesada y registrada exitosamente.'
        );
        onSaveSuccess();
        onClose();
      }
    } catch {
      // Error manejado globalmente
    } finally {
      setIsSaving(false);
    }
  };

  const totalProducido = useMemo(() => {
    return productionItems.reduce((acc, i) => acc + (i.cantidadProducida || 0), 0);
  }, [productionItems]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 0 : 2,
            borderRadius: isMobile ? '1rem' : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)',
          },
        },
      }}
    >
      {/* ── Encabezado Estándar ── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 3,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                PRODUCCIÓN DE ALMACÉN
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                REGISTRAR NUEVA PRODUCCIÓN
              </h2>
            </div>
          </div>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Modal ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4">
          {/* Tarjeta 1: Parámetros de Selección (Almacén y Área) */}
          <div className="p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-1.5 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-1.5">
              <span className="material-symbols-outlined text-base">tune</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                DATOS DE ORIGEN Y DESTINO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Almacén Productor */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Almacén Productor <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={warehouses}
                  getOptionLabel={(o) => o.DESCRICION || o.nombre || ''}
                  value={selectedWarehouse}
                  onChange={(_, val) => handleWarehouseChange(val)}
                  isOptionEqualToValue={(option, value) =>
                    option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                  }
                  fullWidth
                  noOptionsText="No hay almacenes autorizados"
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
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                  )}
                />
              </div>

              {/* Área de Destino */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Área de Destino (Opcional)
                </label>
                <Autocomplete
                  options={areas}
                  getOptionLabel={(o) => o.NOMBRE || ''}
                  value={selectedArea}
                  onChange={(_, val) => setSelectedArea(val)}
                  isOptionEqualToValue={(option, value) => option.ID_AREA === value?.ID_AREA}
                  fullWidth
                  noOptionsText="No hay áreas disponibles"
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
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ÁREA..." />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Selección y Adición de Receta/Producto */}
          <div className="p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/40 dark:border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  AÑADIR RECETA / PRODUCTO A LA ORDEN ({availableRecetas.length} disponibles)
                </span>
              </div>

              {/* Filtro de Tipo */}
              <ToggleButtonGroup
                value={recipeTypeFilter}
                exclusive
                onChange={(_, v) => handleTypeFilterChange(v)}
                size="small"
                sx={{
                  height: 30,
                  '& .MuiToggleButton-root': {
                    borderRadius: '10px',
                    px: 1.5,
                    py: 0.5,
                    border: '1px solid var(--outline-variant)',
                    textTransform: 'none',
                    fontWeight: 900,
                    fontSize: '9px',
                    letterSpacing: '0.05em',
                    color: 'var(--on-surface-variant)',
                    '&.Mui-selected': {
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'var(--primary)',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="all">Todos</ToggleButton>
                <ToggleButton value="0">Intermedios</ToggleButton>
                <ToggleButton value="1">Finales</ToggleButton>
              </ToggleButtonGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Selector de Receta */}
              <div className="md:col-span-5 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Receta / Producto <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={availableRecetas}
                  getOptionLabel={(r) => {
                    const name = r.PRODUCTO || r.DESCRIPCION || 'Receta';
                    const stock = r.stock ?? 0;
                    const maxProducible = r.CANTIDAD ?? 0;
                    return `${name} (Stock: ${stock} | Producible: ${maxProducible} ${r.UNIDAD_MEDIDA || ''})`;
                  }}
                  value={selectedReceta}
                  onChange={(_, val) => setSelectedReceta(val)}
                  loading={isLoadingRecetas}
                  disabled={!selectedWarehouse || isLoadingRecetas}
                  fullWidth
                  noOptionsText={isLoadingRecetas ? 'Cargando recetas...' : 'No hay recetas disponibles en este almacén'}
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
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="BUSCAR RECETA O PRODUCTO..." />
                  )}
                />
              </div>

              {/* Cantidad a Producir */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Cant. Producir <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  placeholder="1"
                  className="w-full h-9 px-3 text-center text-xs font-black rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Merma / Desperdicio */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Desperdicio / Merma
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={wasteInput}
                  onChange={(e) => setWasteInput(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 text-center text-xs font-black rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Botón Añadir */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedReceta || !qtyInput || parseFloat(qtyInput) <= 0}
                  className="w-full h-9 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Añadir a la Orden
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Layout Doble - Lista de Producción y Balance de Insumos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Tabla de Productos a Producir */}
            <div className="lg:col-span-7 p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between items-center border-b border-outline-variant/40 dark:border-zinc-800 pb-1.5">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base">list_alt</span>
                  <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                    PRODUCTOS EN ESTA ORDEN ({productionItems.length})
                  </span>
                </div>
                {productionItems.length > 0 && (
                  <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                    Total: <strong className="text-primary">{totalProducido}</strong>
                  </span>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full scrollbar-thin max-h-[300px]">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="sticky top-0 z-20 bg-zinc-100/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <td className="pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 w-8">
                          N°
                        </td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200">
                          Receta / Producto
                        </td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center">
                          Tipo
                        </td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center">
                          Cant. Producir
                        </td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-center">
                          Merma
                        </td>
                        <td className="pr-4 pl-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-200 text-right">
                          Acción
                        </td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {productionItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                            <span className="material-symbols-outlined text-2xl mb-1 block opacity-40">
                              soup_kitchen
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider block">
                              No hay productos añadidos a la orden
                            </span>
                          </td>
                        </tr>
                      ) : (
                        productionItems.map((item, idx) => (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors"
                          >
                            <td className="pl-4 pr-2 py-2 font-black text-xs text-primary whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight block">
                                {item.receta.PRODUCTO || item.receta.DESCRIPCION}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-bold">
                                {item.receta.UNIDAD_MEDIDA || 'Unidad'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.isIntermediate
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  }`}
                              >
                                {item.isIntermediate ? 'Intermedio' : 'Final'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0.01}
                                step="any"
                                value={item.cantidadProducida}
                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                className="w-16 h-7 text-center text-xs font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-all"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={item.cantidadDesperdicio}
                                onChange={(e) => handleWasteChange(item.id, e.target.value)}
                                className="w-14 h-7 text-center text-xs font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-all"
                              />
                            </td>
                            <td className="pr-4 pl-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                title="Quitar de la lista"
                                className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/10 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center font-bold cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Análisis y Validación de Insumos */}
            <div className="lg:col-span-5 p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-zinc-800 pb-1.5">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base">inventory</span>
                  <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                    BALANCE DE INSUMOS REQUERIDOS
                  </span>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${hasMissingStock
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                >
                  {hasMissingStock ? 'Insumos Insuficientes' : 'Stock Disponible'}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-y-auto max-h-[300px] p-2 space-y-2 scrollbar-thin">
                  {aggregatedStockReport.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      <span className="text-[10px] font-black uppercase tracking-wider block">
                        Añada productos para calcular los insumos necesarios
                      </span>
                    </div>
                  ) : (
                    aggregatedStockReport.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all ${item.sufficient
                          ? 'bg-zinc-50/70 dark:bg-zinc-850/40 border-zinc-200/60 dark:border-zinc-800'
                          : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase">
                            {item.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase ${item.sufficient
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {item.sufficient ? 'check_circle' : 'warning'}
                            </span>
                            {item.sufficient ? 'OK' : 'Falta'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                          <div>
                            Requerido:{' '}
                            <strong className="text-zinc-900 dark:text-zinc-100">
                              {item.required.toFixed(2)} {item.unit}
                            </strong>
                          </div>
                          <div className="text-right">
                            Disponible:{' '}
                            <strong
                              className={
                                item.sufficient
                                  ? 'text-zinc-900 dark:text-zinc-100'
                                  : 'text-rose-600 dark:text-rose-400 font-black'
                              }
                            >
                              {item.available.toFixed(2)} {item.unit}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ── Pie del Modal Estándar ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'var(--background, #fafafa)',
          borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          disabled={isSaving}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || productionItems.length === 0}
          loading={isSaving}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSaving ? 'Registrando...' : 'Registrar Producción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

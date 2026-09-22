import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  Zoom,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import LoadingOverlay from '../../../../components/common/LoadingOverlay';
import { showAlert } from '../../../../config/alerts';
import {
  AlmacenItem,
  ProductoStockItem,
  FechaStockItem,
  useReposicionUsuarioAlmacenServices,
} from '../services/useReposicionUsuarioAlmacen';

interface SelectedReposicionRow {
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO: string;
  FECHA_VENCIMIENTO: string;
  STOCK: number;
  CANTIDAD: number | '';
  CANTIDAD_ADECUACION: number;
  PROD_PRIMARIO: number;
  UNIDAD_MEDIDA: string;
  DETALLE: string;
}

interface ModalRegistrarReposicionProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  almacenes: AlmacenItem[];
}

export const ModalRegistrarReposicion: React.FC<ModalRegistrarReposicionProps> = ({
  open,
  onClose,
  onSuccess,
  almacenes,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loadApiGetProductosStock, loadApiRegistrarReposicion } =
    useReposicionUsuarioAlmacenServices();

  // Filtrar almacenes válidos (excluyendo "TODOS LOS ALMACENES" con ID 0)
  const validWarehouses = useMemo(() => {
    return almacenes.filter((w) => w.ID_PLANTA_ALMACEN !== 0);
  }, [almacenes]);

  // Estados de formulario
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [stockProducts, setStockProducts] = useState<ProductoStockItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductoStockItem | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<FechaStockItem | null>(null);
  const [cantidadInput, setCantidadInput] = useState<number | ''>('');
  const [motivoInput, setMotivoInput] = useState<string>('');
  const [loadingStock, setLoadingStock] = useState<boolean>(false);

  // Lista de productos a reponer
  const [productList, setProductList] = useState<SelectedReposicionRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Formato seguro de fecha DD/MM/YYYY
  const formatDateDisplay = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
      const clean = dateStr.split('T')[0].split(' ')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Cargar productos con stock al seleccionar almacén
  useEffect(() => {
    if (selectedWarehouse && selectedWarehouse.ID_PLANTA_ALMACEN > 0) {
      setLoadingStock(true);
      loadApiGetProductosStock(selectedWarehouse.ID_PLANTA_ALMACEN).then((res) => {
        setStockProducts(res || []);
        setLoadingStock(false);
      });
    } else {
      setStockProducts([]);
    }
  }, [selectedWarehouse, loadApiGetProductosStock]);

  // Resetear al abrir modal
  useEffect(() => {
    if (open) {
      const defaultWh = validWarehouses.length > 0 ? validWarehouses[0] : null;
      setSelectedWarehouse(defaultWh);
      setSelectedProduct(null);
      setSelectedFecha(null);
      setCantidadInput('');
      setMotivoInput('');
      setProductList([]);
    }
  }, [open, validWarehouses]);

  // Cuando cambia el producto, auto-seleccionar primera fecha si existe
  const handleProductChange = (newProd: ProductoStockItem | null) => {
    setSelectedProduct(newProd);
    setCantidadInput('');
    if (newProd && Array.isArray(newProd.FECHAS) && newProd.FECHAS.length > 0) {
      setSelectedFecha(newProd.FECHAS[0]);
    } else {
      setSelectedFecha(null);
    }
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setSelectedFecha(null);
    setCantidadInput('');
    setMotivoInput('');
  };

  // Fechas disponibles para el producto seleccionado
  const fechasDisponibles = useMemo<FechaStockItem[]>(() => {
    if (!selectedProduct || !Array.isArray(selectedProduct.FECHAS)) {
      return [];
    }
    return selectedProduct.FECHAS;
  }, [selectedProduct]);

  // Stock disponible según fecha seleccionada o total del producto
  const availableStock = useMemo<number>(() => {
    if (selectedFecha) {
      return Number(selectedFecha.STOCK || 0);
    }
    if (selectedProduct) {
      return Number(selectedProduct.STOCK ?? selectedProduct.CANTIDAD ?? 0);
    }
    return 0;
  }, [selectedFecha, selectedProduct]);

  // Unidad de medida visible
  const selectedUnit = useMemo<string>(() => {
    if (!selectedProduct) return '';
    return (
      selectedProduct.UNIDAD_MEDIDA_E ||
      selectedProduct.UNIDAD_MEDIDA ||
      selectedProduct.UNIDAD_MEDIDA_A ||
      selectedProduct.MEDIDA ||
      'Unidad'
    );
  }, [selectedProduct]);

  // Agregar producto a la lista
  const handleAddProduct = () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén Requerido', 'Debe seleccionar un almacén.');
      return;
    }

    if (!selectedProduct) {
      showAlert.warning('Seleccione un producto', 'Debe elegir un producto con stock disponible.');
      return;
    }

    const qty = typeof cantidadInput === 'number' ? cantidadInput : parseFloat(String(cantidadInput));
    if (!qty || isNaN(qty) || qty <= 0) {
      showAlert.warning('Cantidad no válida', 'Ingrese una cantidad mayor a 0.');
      return;
    }

    if (qty > availableStock) {
      showAlert.warning(
        'Stock insuficiente',
        `La cantidad a reponer (${qty}) supera el stock disponible (${availableStock} ${selectedUnit}).`
      );
      return;
    }

    // Determinar fecha de vencimiento final
    let fechaVenc = '';
    if (selectedFecha?.FECHA_VENCIMIENTO) {
      fechaVenc = selectedFecha.FECHA_VENCIMIENTO.split('T')[0];
    } else if (selectedProduct.FECHA_VENCIMIENTO) {
      fechaVenc = selectedProduct.FECHA_VENCIMIENTO.split('T')[0];
    } else {
      fechaVenc = new Date().toISOString().split('T')[0];
    }

    const idDetalle = Number(
      selectedFecha?.ID_PRODUCTO_DETALLE ?? selectedProduct.ID_PRODUCTO_DETALLE ?? 0
    );
    const idProd = Number(selectedFecha?.ID_PRODUCTO ?? selectedProduct.ID_PRODUCTO ?? 0);
    const idIntermedio = Number(
      selectedFecha?.ID_PRODUCTO_INTERMEDIO ?? selectedProduct.ID_PRODUCTO_INTERMEDIO ?? 0
    );

    const exists = productList.some(
      (p) =>
        p.ID_PRODUCTO_DETALLE === idDetalle &&
        p.ID_PRODUCTO === idProd &&
        p.ID_PRODUCTO_INTERMEDIO === idIntermedio &&
        p.FECHA_VENCIMIENTO === fechaVenc
    );

    if (exists) {
      showAlert.warning('Lote duplicado', 'Este producto con esa fecha de vencimiento ya fue agregado a la lista.');
      return;
    }

    const prodNombre =
      selectedProduct.PRODUCTO ||
      selectedProduct.NOMBRE_PRODUCTO ||
      selectedProduct.NOMBRE_DETALLE ||
      'Producto';

    const newRow: SelectedReposicionRow = {
      ID_PRODUCTO_DETALLE: idDetalle,
      ID_PRODUCTO: idProd,
      ID_PRODUCTO_INTERMEDIO: idIntermedio,
      PRODUCTO: prodNombre,
      FECHA_VENCIMIENTO: fechaVenc,
      STOCK: availableStock,
      CANTIDAD: qty,
      CANTIDAD_ADECUACION: Number(
        selectedFecha?.CANTIDAD_ADECUACION ?? selectedProduct.CANTIDAD_ADECUACION ?? 1
      ),
      PROD_PRIMARIO: Number(selectedFecha?.PROD_PRIMARIO ?? selectedProduct.PROD_PRIMARIO ?? 0),
      UNIDAD_MEDIDA: selectedUnit,
      DETALLE: motivoInput.trim(),
    };

    setProductList((prev) => [...prev, newRow]);
    resetProductForm();
  };

  // Eliminar producto de la lista
  const handleRemoveProduct = (index: number) => {
    setProductList((prev) => prev.filter((_, idx) => idx !== index));
  };


  // Guardar reposición
  const handleSave = async () => {
    if (!selectedWarehouse || selectedWarehouse.ID_PLANTA_ALMACEN <= 0) {
      showAlert.warning('Seleccione un almacén', 'Debe indicar el almacén para registrar la reposición.');
      return;
    }

    if (productList.length === 0) {
      showAlert.warning('Lista vacía', 'Debe agregar al menos un producto a la lista de reposición.');
      return;
    }

    for (const prod of productList) {
      const q = typeof prod.CANTIDAD === 'number' ? prod.CANTIDAD : parseFloat(String(prod.CANTIDAD));
      if (!q || isNaN(q) || q <= 0) {
        showAlert.warning('Cantidad inválida', `El producto "${prod.PRODUCTO}" tiene una cantidad no válida.`);
        return;
      }
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Reposición?',
      `Se registrarán ${productList.length} producto(s) en ${selectedWarehouse.DESCRICION || selectedWarehouse.nombre
      }.`
    );

    if (!confirmed) return;

    const payload = {
      id_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      productos: productList.map((p) => ({
        ID_PRODUCTO_DETALLE: p.ID_PRODUCTO_DETALLE,
        ID_PRODUCTO: p.ID_PRODUCTO,
        ID_PRODUCTO_INTERMEDIO: p.ID_PRODUCTO_INTERMEDIO,
        PRODUCTO: p.PRODUCTO,
        FECHA_VENCIMIENTO: p.FECHA_VENCIMIENTO ? p.FECHA_VENCIMIENTO.split('T')[0] : '',
        CANTIDAD: typeof p.CANTIDAD === 'number' ? p.CANTIDAD : parseFloat(String(p.CANTIDAD)),
        CANTIDAD_ADECUACION: p.CANTIDAD_ADECUACION || 1,
        PROD_PRIMARIO: p.PROD_PRIMARIO || 0,
        DETALLE: p.DETALLE || '',
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await loadApiRegistrarReposicion(payload);
      if (res.success) {
        showAlert.success('Reposición Registrada', res.message || 'Se guardó correctamente la reposición.');
        onSuccess();
        onClose();
      } else {
        showAlert.error('Error al registrar', res.message || 'No se pudo guardar la reposición.');
      }
    } catch (error) {
      console.error('Error al registrar reposición:', error);
      showAlert.error('Error', 'Ocurrió un fallo al registrar la reposición.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : undefined,
            m: isMobile ? 0 : 2,
            borderRadius: isMobile ? 0 : '1.75rem',
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
          px: { xs: 2, sm: 3 },
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                GESTIÓN DE REPOSICIÓN DE PRODUCTOS
              </p>
              <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                REGISTRAR NUEVA REPOSICIÓN
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

      {/* ── Contenido del Modal ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-4 font-body">
          {/* SECCIÓN 1: Selección de Almacén */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">store</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                ALMACÉN DE REPOSICIÓN *
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Almacén
              </label>
              <Autocomplete
                options={validWarehouses}
                getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
                value={selectedWarehouse}
                onChange={(_, newValue) => {
                  setSelectedWarehouse(newValue);
                  setProductList([]);
                  resetProductForm();
                }}
                isOptionEqualToValue={(option, value) =>
                  option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                }
                fullWidth
                disableClearable
                noOptionsText="Sin almacenes disponibles"
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                )}
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
              />
            </div>
          </div>

          {/* SECCIÓN 2: Selección de Producto con Stock y Fechas de Vencimiento */}
          <div className="p-4 sm:p-5 bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  PRODUCTO CON STOCK EN ALMACÉN
                </span>
              </div>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  Limpiar selección
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* 2.1 Selector Principal de Producto */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Buscar Producto con Stock *
                  </label>
                  {stockProducts.length > 0 && (
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                      {stockProducts.length} productos disponibles
                    </span>
                  )}
                </div>
                <Autocomplete
                  options={stockProducts}
                  getOptionLabel={(option) =>
                    option.PRODUCTO || option.NOMBRE_PRODUCTO || option.NOMBRE_DETALLE || ''
                  }
                  value={selectedProduct}
                  loading={loadingStock}
                  onChange={(_, newValue) => handleProductChange(newValue)}
                  isOptionEqualToValue={(option, value) =>
                    option.ID_PRODUCTO_DETALLE === value?.ID_PRODUCTO_DETALLE &&
                    option.ID_PRODUCTO === value?.ID_PRODUCTO &&
                    option.ID_PRODUCTO_INTERMEDIO === value?.ID_PRODUCTO_INTERMEDIO
                  }
                  disabled={!selectedWarehouse || loadingStock}
                  fullWidth
                  noOptionsText={
                    loadingStock
                      ? 'Cargando catálogo de stock...'
                      : 'No hay productos con stock en este almacén'
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      size="small"
                      placeholder={
                        loadingStock
                          ? 'Cargando stock...'
                          : stockProducts.length === 0
                            ? 'Sin productos con stock en este almacén'
                            : 'ESCRIBA PARA BUSCAR UN PRODUCTO...'
                      }
                    />
                  )}
                  renderOption={(props, option) => {
                    const prodName =
                      option.PRODUCTO || option.NOMBRE_PRODUCTO || option.NOMBRE_DETALLE || 'Producto';
                    const hasSub =
                      option.NOMBRE_DETALLE &&
                      option.NOMBRE_DETALLE.trim() !== '' &&
                      option.NOMBRE_DETALLE.trim().toUpperCase() !== prodName.trim().toUpperCase();
                    const stockTotal = Number(option.STOCK ?? option.CANTIDAD ?? 0);
                    const unit =
                      option.UNIDAD_MEDIDA_E ||
                      option.UNIDAD_MEDIDA ||
                      option.UNIDAD_MEDIDA_A ||
                      option.MEDIDA ||
                      '';
                    const lotesCount = Array.isArray(option.FECHAS) ? option.FECHAS.length : 0;

                    return (
                      <li
                        {...props}
                        key={`${option.ID_PRODUCTO}-${option.ID_PRODUCTO_DETALLE}-${option.ID_PRODUCTO_INTERMEDIO}`}
                        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 text-xs transition-colors"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase truncate">
                            {prodName}
                          </span>
                          {hasSub && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                              {option.NOMBRE_DETALLE}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {lotesCount > 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[9px] font-black uppercase whitespace-nowrap">
                              {lotesCount} Lotes
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[10px] whitespace-nowrap">
                            Stock: {stockTotal.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {unit}
                          </span>
                        </div>
                      </li>
                    );
                  }}
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
                />
              </div>

              {/* 2.3 Formulario de Configuración (Fecha, Cantidad, Motivo, Botón) */}
              {selectedProduct && (
                <div className="space-y-3 pt-1">
                  <Grid container spacing={2} alignItems="flex-end">
                    {/* Selector de Fecha de Vencimiento / Lote (Ancho Ampliado) */}
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <div className="w-full space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                          Fecha Vencimiento / Lote *
                        </label>
                        {fechasDisponibles.length > 1 ? (
                          <Autocomplete
                            options={fechasDisponibles}
                            getOptionLabel={(option) =>
                              `${formatDateDisplay(option.FECHA_VENCIMIENTO)} — (Stock: ${Number(option.STOCK || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${selectedUnit})`
                            }
                            value={selectedFecha}
                            onChange={(_, newValue) => {
                              setSelectedFecha(newValue);
                              setCantidadInput('');
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option.FECHA_VENCIMIENTO === value?.FECHA_VENCIMIENTO
                            }
                            fullWidth
                            disableClearable
                            noOptionsText="Sin fechas registradas"
                            renderOption={(props, option) => (
                              <li
                                {...props}
                                key={option.FECHA_VENCIMIENTO}
                                className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                                  <span className="font-mono font-bold text-primary text-xs">
                                    {formatDateDisplay(option.FECHA_VENCIMIENTO)}
                                  </span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                                  Stock: {Number(option.STOCK || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {selectedUnit}
                                </span>
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                placeholder="SELECCIONAR VENCIMIENTO..."
                              />
                            )}
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
                          />
                        ) : (
                          <div className="w-full h-10 px-3.5 bg-surface dark:bg-zinc-950 border border-outline-variant dark:border-zinc-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                              <span className="text-xs font-mono font-bold text-primary">
                                {formatDateDisplay(
                                  selectedFecha?.FECHA_VENCIMIENTO || selectedProduct.FECHA_VENCIMIENTO
                                )}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                              Stock: {Number(availableStock).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {selectedUnit}
                            </span>
                          </div>
                        )}
                      </div>
                    </Grid>

                    {/* Cantidad a Reponer */}
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <div className="w-full space-y-1">
                        <div className="flex justify-between items-center ml-1">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Cantidad a Reponer *
                          </label>
                          <span className="text-[10px] font-bold text-primary">
                            (Máx: {Number(availableStock).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={availableStock || undefined}
                          step={Boolean(selectedProduct?.PEDIDO_DECIMAL === true || Number(selectedProduct?.PEDIDO_DECIMAL) === 1) ? 'any' : '1'}
                          value={cantidadInput}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          onKeyDown={(e) => {
                            const isDecimalAllowed = Boolean(selectedProduct?.PEDIDO_DECIMAL === true || Number(selectedProduct?.PEDIDO_DECIMAL) === 1);
                            if (!isDecimalAllowed && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isDecimalAllowed = Boolean(selectedProduct?.PEDIDO_DECIMAL === true || Number(selectedProduct?.PEDIDO_DECIMAL) === 1);
                            if (val === '') {
                              setCantidadInput('');
                            } else {
                              if (!isDecimalAllowed) {
                                const cleanVal = val.split('.')[0].split(',')[0];
                                const parsed = parseInt(cleanVal, 10);
                                setCantidadInput(isNaN(parsed) ? '' : parsed);
                              } else {
                                const parsed = parseFloat(val);
                                setCantidadInput(isNaN(parsed) ? '' : parsed);
                              }
                            }
                          }}
                          placeholder={Boolean(selectedProduct?.PEDIDO_DECIMAL === true || Number(selectedProduct?.PEDIDO_DECIMAL) === 1) ? '0.00' : '0'}
                          className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </Grid>

                    {/* Motivo / Observación inicial */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <div className="w-full space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                          Motivo / Observación (Opcional)
                        </label>
                        <input
                          type="text"
                          value={motivoInput}
                          onChange={(e) => setMotivoInput(e.target.value)}
                          placeholder="EJ: CONSUMO EN TURNO, MERMA, DAÑADO..."
                          className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </Grid>
                  </Grid>

                  {/* Botón Agregar a Lista alineado a la derecha */}
                  <div className="flex justify-end w-full pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      icon="playlist_add"
                      onClick={handleAddProduct}
                      className="w-full sm:w-auto !h-10 !px-6 shadow-md shadow-primary/20 shrink-0"
                    >
                      Añadir a Lista
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Lista de Productos a Reponer con Edición de Observación */}
          {productList.length > 0 && (
            <div className="bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="p-3 bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-outline-variant/40 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary font-headline">
                  PRODUCTOS A REPONER ({productList.length})
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  Total Cantidad:{' '}
                  <strong className="text-primary font-black ml-1">
                    {productList
                      .reduce((acc, curr) => acc + Number(curr.CANTIDAD || 0), 0)
                      .toLocaleString('es-BO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </strong>
                </span>
              </div>

              <div className="overflow-x-auto max-h-[260px] custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/70 dark:bg-zinc-850/70 border-b border-outline-variant/40 sticky top-0 z-10">
                      <td className="pl-4 pr-2 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        N°
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        Producto
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                        F. Vencimiento
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                        Stock Disp.
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                        Cant. a Reponer
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        Observación
                      </td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap w-16">
                        Acción
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {productList.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* N° */}
                        <td className="pl-4 pr-2 py-2 font-black text-xs text-primary whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* Producto */}
                        <td className="px-3 py-2 text-xs font-black text-on-surface uppercase">
                          {item.PRODUCTO}
                        </td>

                        {/* Fecha Vencimiento */}
                        <td className="px-3 py-2 text-center font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                          {formatDateDisplay(item.FECHA_VENCIMIENTO)}
                        </td>

                        {/* Stock Disponible */}
                        <td className="px-3 py-2 text-center text-xs font-bold text-zinc-500 whitespace-nowrap">
                          {item.STOCK} {item.UNIDAD_MEDIDA}
                        </td>

                        {/* Cantidad a Reponer */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className="font-black text-xs text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 rounded-lg border border-primary/20">
                            {Number(item.CANTIDAD || 0).toLocaleString('es-BO', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {item.UNIDAD_MEDIDA}
                          </span>
                        </td>

                        {/* Observación (Directamente editable en la celda sin ser un input) */}
                        <td className="px-3 py-1.5 text-xs">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            data-placeholder="AGREGAR OBSERVACIÓN..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (e.target as HTMLElement).blur();
                              }
                            }}
                            onBlur={(e) => {
                              const newText = (e.currentTarget.textContent || '').trim();
                              setProductList((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, DETALLE: newText } : row
                                )
                              );
                            }}
                            className="min-h-[30px] min-w-[160px] max-w-[280px] px-2.5 py-1.5 rounded-xl bg-surface dark:bg-zinc-950 border border-outline-variant/60 dark:border-zinc-800 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 empty:before:font-medium empty:before:italic cursor-text"
                          >
                            {item.DETALLE}
                          </div>
                        </td>

                        {/* Acción Eliminar */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(idx)}
                            title="Eliminar ítem"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center font-bold cursor-pointer mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* ── Pie de Modal Estándar ── */}
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
          disabled={isSubmitting}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSubmitting || productList.length === 0}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSubmitting
            ? 'Guardando...'
            : `Confirmar Reposición (${productList.length})`}
        </Button>
      </DialogActions>

      {/* Loading Overlays */}
      <LoadingOverlay show={loadingStock} message="Cargando productos con stock..." />
      <LoadingOverlay show={isSubmitting} message="Registrando reposición..." />
    </Dialog>
  );
};

export default ModalRegistrarReposicion;

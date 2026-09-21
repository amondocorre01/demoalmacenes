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
} from '@mui/material';
import dayjs from 'dayjs';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  useDevolucionAlmacenesServices,
  ProductoStockDevolucion,
  FechaStockDevolucion,
  RegistrarDevolucionPayload,
} from '../services/useDevolucionAlmacen';

interface ModalNuevaDevolucionProps {
  open: boolean;
  onClose: () => void;
  warehouses: any[];
  areas: any[];
  onSaveSuccess: () => void;
  defaultWarehouse?: any | null;
}

interface ReturnItemState {
  id: string | number;
  product: ProductoStockDevolucion;
  fecha: FechaStockDevolucion;
  cantidad: string;
}

export const ModalNuevaDevolucion: React.FC<ModalNuevaDevolucionProps> = ({
  open,
  onClose,
  warehouses,
  areas,
  onSaveSuccess,
  defaultWarehouse = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetProductosStock, loadApiRegistrarDevolucion } = useDevolucionAlmacenesServices();

  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);

  // Catálogo de stock disponible
  const [availableProducts, setAvailableProducts] = useState<ProductoStockDevolucion[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del selector para añadir producto
  const [selectedProduct, setSelectedProduct] = useState<ProductoStockDevolucion | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<FechaStockDevolucion | null>(null);
  const [cantidadInput, setCantidadInput] = useState<string>('');

  // Lista de items agregados a la devolución
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  // Inicialización al abrir
  useEffect(() => {
    if (open) {
      const initialWh = defaultWarehouse || (warehouses.length > 0 ? warehouses[0] : null);
      const initialArea = areas.length > 0 ? areas[0] : null;

      setSelectedWarehouse(initialWh);
      setSelectedArea(initialArea);
      setSelectedProduct(null);
      setSelectedFecha(null);
      setCantidadInput('');
      setReturnItems([]);
      setAvailableProducts([]);

      if (initialWh && initialArea) {
        fetchStockProducts(initialWh.ID_PLANTA_ALMACEN, initialArea.ID_AREA);
      }
    }
  }, [open, defaultWarehouse, warehouses, areas]);

  const fetchStockProducts = async (idWarehouse: number | string, idArea: number | string) => {
    if (!idWarehouse || !idArea) {
      setAvailableProducts([]);
      return;
    }
    setIsLoadingStock(true);
    try {
      const res = await loadApiGetProductosStock(idWarehouse, idArea);
      let items: any[] = [];

      if (Array.isArray(res)) {
        items = res;
      } else if (res?.productos || res?.data) {
        items = res.productos || res.data;
      }

      const mapped: ProductoStockDevolucion[] = items.map((p: any) => {
        const rawFechas: FechaStockDevolucion[] =
          Array.isArray(p.FECHAS) && p.FECHAS.length > 0
            ? p.FECHAS.map((f: any) => ({
              ID_PRODUCTO: f.ID_PRODUCTO ?? p.ID_PRODUCTO,
              CANTIDAD: Number(f.CANTIDAD ?? 0),
              FECHA_VENCIMIENTO: f.FECHA_VENCIMIENTO || '',
            }))
            : [
              {
                ID_PRODUCTO: p.ID_PRODUCTO,
                CANTIDAD: Number(p.CANTIDAD ?? p.STOCK ?? 0),
                FECHA_VENCIMIENTO: p.FECHA_VENCIMIENTO || dayjs().format('YYYY-MM-DD'),
              },
            ];

        return {
          ...p,
          FECHAS: rawFechas,
        };
      });

      setAvailableProducts(mapped);
    } catch {
      setAvailableProducts([]);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleWarehouseChange = (newWh: any | null) => {
    setSelectedWarehouse(newWh);
    setSelectedProduct(null);
    setSelectedFecha(null);
    setCantidadInput('');
    setReturnItems([]);
    if (newWh && selectedArea) {
      fetchStockProducts(newWh.ID_PLANTA_ALMACEN, selectedArea.ID_AREA);
    } else {
      setAvailableProducts([]);
    }
  };

  const handleAreaChange = (newArea: any | null) => {
    setSelectedArea(newArea);
    setSelectedProduct(null);
    setSelectedFecha(null);
    setCantidadInput('');
    setReturnItems([]);
    if (selectedWarehouse && newArea) {
      fetchStockProducts(selectedWarehouse.ID_PLANTA_ALMACEN, newArea.ID_AREA);
    } else {
      setAvailableProducts([]);
    }
  };

  // Manejar cambio de producto seleccionado en el selector
  const handleProductSelect = (product: ProductoStockDevolucion | null) => {
    setSelectedProduct(product);
    setCantidadInput('');
    if (product && product.FECHAS && product.FECHAS.length > 0) {
      // Seleccionar automáticamente la primera fecha con stock disponible o la primera de la lista
      const defaultDate = product.FECHAS.find((f) => f.CANTIDAD > 0) || product.FECHAS[0];
      setSelectedFecha(defaultDate);
    } else {
      setSelectedFecha(null);
    }
  };

  // Añadir producto con su fecha a la tabla de detalle
  const handleAddProduct = () => {
    if (!selectedProduct) {
      showAlert.warning('Seleccionar Producto', 'Por favor seleccione un producto del catálogo.');
      return;
    }

    if (!selectedFecha) {
      showAlert.warning('Seleccionar Fecha', 'Por favor seleccione la fecha de vencimiento/lote del producto.');
      return;
    }

    const availableStock = selectedFecha.CANTIDAD ?? 0;
    if (availableStock <= 0) {
      showAlert.warning('Sin Stock', 'El lote o fecha seleccionada no cuenta con stock disponible.');
      return;
    }

    if (!cantidadInput || cantidadInput.trim() === '') {
      showAlert.warning('Cantidad Requerida', 'Por favor ingrese la cantidad a devolver.');
      return;
    }

    const qty = parseFloat(cantidadInput);
    if (isNaN(qty) || qty <= 0) {
      showAlert.warning('Cantidad Inválida', 'La cantidad a devolver debe ser un número mayor a 0.');
      return;
    }

    if (qty > availableStock) {
      showAlert.warning(
        'Stock Insuficiente',
        `La cantidad a devolver (${qty}) supera el stock disponible (${availableStock}) para este lote.`
      );
      return;
    }

    // Verificar si ya fue agregado el mismo producto con la misma fecha
    const isDuplicate = returnItems.some(
      (item) =>
        item.product.ID_PRODUCTO_DETALLE === selectedProduct.ID_PRODUCTO_DETALLE &&
        item.fecha.FECHA_VENCIMIENTO === selectedFecha.FECHA_VENCIMIENTO
    );

    if (isDuplicate) {
      showAlert.warning(
        'Producto y Fecha Ya Agregados',
        'Este producto con la misma fecha de vencimiento ya se encuentra en el detalle. Modifique la cantidad directamente en la tabla si lo requiere.'
      );
      return;
    }

    const newItem: ReturnItemState = {
      id: `${selectedProduct.ID_PRODUCTO_DETALLE}_${selectedFecha.FECHA_VENCIMIENTO}_${Date.now()}`,
      product: selectedProduct,
      fecha: selectedFecha,
      cantidad: cantidadInput,
    };

    setReturnItems((prev) => [...prev, newItem]);
    // Resetear campos de entrada
    setSelectedProduct(null);
    setSelectedFecha(null);
    setCantidadInput('');
  };

  // Modificar cantidad en la tabla
  const handleQtyChange = (itemId: string | number, value: string, maxStock: number) => {
    if (value === '') {
      setReturnItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, cantidad: '' } : i))
      );
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    if (num > maxStock) {
      showAlert.warning(
        'Stock insuficiente',
        `La cantidad a devolver no puede superar el stock disponible de este lote (${maxStock}).`
      );
      setReturnItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, cantidad: maxStock.toString() } : i))
      );
      return;
    }

    setReturnItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, cantidad: value } : i))
    );
  };

  // Eliminar fila de la tabla
  const handleRemoveItem = (itemId: string | number) => {
    setReturnItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Guardar / Registrar devolución
  const handleSave = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Almacén.');
      return;
    }
    if (!selectedArea) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Área.');
      return;
    }
    if (returnItems.length === 0) {
      showAlert.warning(
        'Sin productos',
        'Debe agregar al menos un producto con su fecha de vencimiento a la lista de devolución.'
      );
      return;
    }

    const invalidItem = returnItems.find(
      (item) => !item.cantidad || parseFloat(item.cantidad) <= 0
    );
    if (invalidItem) {
      const prodName = [invalidItem.product.PRODUCTO, invalidItem.product.NOMBRE_DETALLE || invalidItem.product.NOMBRE]
        .filter(Boolean)
        .join(' - ');
      showAlert.warning(
        'Cantidad inválida',
        `Ingrese una cantidad válida mayor a 0 para ${prodName || 'el producto'}.`
      );
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Devolución?',
      `Se registrará la devolución de ${returnItems.length} producto(s)/lote(s) al almacén.`
    );

    if (!confirmed) return;

    setIsSaving(true);
    try {
      const payload: RegistrarDevolucionPayload = {
        id_planta_almacen: Number(selectedWarehouse.ID_PLANTA_ALMACEN),
        id_area: Number(selectedArea.ID_AREA),
        productos: returnItems.map((item) => {
          const prodName = [
            item.product.PRODUCTO,
            item.product.NOMBRE_DETALLE || item.product.NOMBRE,
          ]
            .filter(Boolean)
            .join(' - ');

          return {
            id_producto: Number(item.product.ID_PRODUCTO),
            id_producto_detalle: Number(item.product.ID_PRODUCTO_DETALLE),
            cantidad_adecuacion: Number(item.product.CANTIDAD_ADECUACION || 1),
            cantidad: parseFloat(item.cantidad),
            fecha: item.fecha.FECHA_VENCIMIENTO
              ? item.fecha.FECHA_VENCIMIENTO.split('T')[0]
              : dayjs().format('YYYY-MM-DD'),
            producto: prodName || item.product.PRODUCTO || '',
          };
        }),
      };

      const res = await loadApiRegistrarDevolucion(payload);
      if (res && (res.success || res.status === 200 || res.status === 'success' || !res.error)) {
        showAlert.success('Devolución Registrada', 'La devolución de productos fue procesada con éxito.');
        onSaveSuccess();
        onClose();
      }
    } catch {
      // Error centralizado
    } finally {
      setIsSaving(false);
    }
  };

  const totalDevueltos = useMemo(() => {
    return returnItems.reduce((acc, item) => acc + (parseFloat(item.cantidad) || 0), 0);
  }, [returnItems]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
              <span className="material-symbols-outlined text-xl">assignment_return</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                DEVOLUCIÓN DE ALMACÉN
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                REGISTRAR NUEVA DEVOLUCIÓN
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

      {/* ── Cuerpo del Formulario ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-3">
          {/* Tarjeta 1: Parámetros de Selección */}
          <div className="p-2 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-1 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-0">
              <span className="material-symbols-outlined text-[10px]">tune</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                DATOS DE ORIGEN Y DESTINO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Almacén */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Almacén <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={warehouses}
                  getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
                  value={selectedWarehouse}
                  onChange={(_, newValue) => handleWarehouseChange(newValue)}
                  isOptionEqualToValue={(option, value) =>
                    option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                  }
                  fullWidth
                  noOptionsText="No hay almacenes disponibles"
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
                      placeholder="SELECCIONAR ALMACÉN..."
                    />
                  )}
                />
              </div>

              {/* Área */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Área <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={areas}
                  getOptionLabel={(option) => option.NOMBRE || option.nombre || ''}
                  value={selectedArea}
                  onChange={(_, newValue) => handleAreaChange(newValue)}
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
                      placeholder="SELECCIONAR ÁREA..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Selector para Añadir Producto con Fecha */}
          <div className="p-2 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-1 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-0">
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                AÑADIR PRODUCTO A LA DEVOLUCIÓN ({availableProducts.length} disponibles en stock)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Selector de Producto */}
              <div className="md:col-span-5 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto en Stock <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={availableProducts}
                  getOptionLabel={(p) => {
                    const name = [p.PRODUCTO, p.NOMBRE_DETALLE || p.NOMBRE].filter(Boolean).join(' - ');
                    const totalStock =
                      (p.FECHAS || []).reduce((sum, f) => sum + (f.CANTIDAD || 0), 0) ||
                      (p.CANTIDAD ?? p.STOCK ?? 0);
                    const unit = p.UNIDAD_MEDIDA_E || p.UNIDAD_MEDIDA || '';
                    return `${name}`; //(Stock: ${totalStock} ${unit})
                  }}
                  value={selectedProduct}
                  onChange={(_, val) => handleProductSelect(val)}
                  loading={isLoadingStock}
                  disabled={!selectedWarehouse || !selectedArea || isLoadingStock}
                  fullWidth
                  noOptionsText={isLoadingStock ? 'Cargando stock...' : 'No hay productos con stock disponibles'}
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
                    <TextField
                      {...params}
                      variant="outlined"
                      size="small"
                      placeholder="BUSCAR Y SELECCIONAR PRODUCTO..."
                    />
                  )}
                />
              </div>

              {/* Selector de Fecha de Vencimiento / Lote */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Fecha Vencimiento / Lote <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={selectedProduct?.FECHAS || []}
                  getOptionLabel={(f) => {
                    const unit = selectedProduct?.UNIDAD_MEDIDA_E || selectedProduct?.UNIDAD_MEDIDA || '';
                    return `Venc: ${formatDateDisplay(f.FECHA_VENCIMIENTO)} - Disp: ${f.CANTIDAD} ${unit}`;
                  }}
                  value={selectedFecha}
                  onChange={(_, val) => setSelectedFecha(val)}
                  disabled={!selectedProduct || (selectedProduct.FECHAS || []).length === 0}
                  fullWidth
                  noOptionsText="Sin fechas disponibles"
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
                    <TextField
                      {...params}
                      variant="outlined"
                      size="small"
                      placeholder="SELECCIONAR FECHA..."
                    />
                  )}
                />
              </div>

              {/* Cantidad a Devolver */}
              <div className="md:col-span-3 flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Cant. Devolver <span className="text-primary">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedFecha?.CANTIDAD ?? 0}
                    step={selectedProduct?.PEDIDO_DECIMAL ? 'any' : '1'}
                    value={cantidadInput}
                    disabled={!selectedFecha}
                    onChange={(e) => setCantidadInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProduct();
                      }
                    }}
                    placeholder="0"
                    className="w-full h-9 px-4 text-center text-xs font-black rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || !selectedFecha || !cantidadInput || parseFloat(cantidadInput) <= 0}
                  className="h-9 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none shrink-0"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Añadir
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Detalle de Productos Agregados a Devolver */}
          <div className="p-2 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center border-b border-outline-variant/40 dark:border-zinc-800 pb-0">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">list_alt</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  DETALLE DE PRODUCTOS A DEVOLVER ({returnItems.length})
                </span>
              </div>
              {returnItems.length > 0 && (
                <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                  Total Unidades:{' '}
                  <strong className="text-primary font-black">{totalDevueltos}</strong>
                </span>
              )}
            </div>

            {/* Main Data Canvas Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full scrollbar-thin max-h-[350px]">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-850 shadow-sm border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <td className="pl-4 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-10">
                        N°
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Producto / Detalle
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Fecha Vencimiento
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Stock Disp.
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Cant. a Devolver
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Unidad
                      </td>
                      <td className="pr-4 pl-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">
                        Acción
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {returnItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                          <span className="material-symbols-outlined text-3xl mb-1 block opacity-40">
                            assignment_return
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider block">
                            No hay productos agregados al detalle
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">
                            Seleccione el producto, su fecha de vencimiento y la cantidad para añadirlo a la lista.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      returnItems.map((item, idx) => {
                        const maxStock = item.fecha.CANTIDAD ?? 0;
                        const prodTitle = item.product.PRODUCTO || `Producto #${item.product.ID_PRODUCTO_DETALLE}`;
                        const prodSubtitle = item.product.NOMBRE_DETALLE || item.product.NOMBRE;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors"
                          >
                            {/* N° */}
                            <td className="pl-4 pr-2 py-2 font-black text-xs text-primary whitespace-nowrap">
                              {idx + 1}
                            </td>

                            {/* Producto */}
                            <td className="px-3 py-2">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight block leading-tight">
                                {prodTitle}
                              </span>
                              {prodSubtitle && (
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold block mt-0.5">
                                  {prodSubtitle}
                                </span>
                              )}
                            </td>

                            {/* Fecha de Vencimiento */}
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                                <span className="material-symbols-outlined text-[10px]">event</span>
                                {formatDateDisplay(item.fecha.FECHA_VENCIMIENTO)}
                              </span>
                            </td>

                            {/* Stock Disponible */}
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                {maxStock} {item.product.UNIDAD_MEDIDA_E || item.product.UNIDAD_MEDIDA || ''}
                              </span>
                            </td>

                            {/* Cantidad a Devolver */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxStock}
                                step={item.product.PEDIDO_DECIMAL ? 'any' : '1'}
                                value={item.cantidad}
                                placeholder="0"
                                onChange={(e) =>
                                  handleQtyChange(item.id, e.target.value, maxStock)
                                }
                                className="w-20 h-7 text-center text-xs font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-all"
                              />
                            </td>

                            {/* Unidad */}
                            <td className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              {item.product.UNIDAD_MEDIDA_E || item.product.UNIDAD_MEDIDA || 'Unidad'}
                            </td>

                            {/* Acciones */}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
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
          disabled={isSaving || returnItems.length === 0}
          loading={isSaving}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSaving ? 'Registrando...' : 'Registrar Devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


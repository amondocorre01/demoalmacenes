import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  useMediaQuery,
  useTheme,
  Autocomplete,
  TextField,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import LoadingOverlay from '../../../../components/common/LoadingOverlay';
import { showAlert } from '../../../../config/alerts';
import {
  useRetirarInsumosServices,
  AlmacenItem,
  ProductoStockAjuste,
  ProductoDescontarPayload,
} from '../services/useRetirarInsumos';

interface Props {
  open: boolean;
  onClose: () => void;
  warehouses: AlmacenItem[];
  initialWarehouse?: AlmacenItem | null;
  onSuccess: () => void;
}

export const ModalNuevoRetiroInsumos: React.FC<Props> = ({
  open,
  onClose,
  warehouses,
  initialWarehouse,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetStockAlmacen, loadApiDescontarStock } = useRetirarInsumosServices();

  // Almacén seleccionado dentro del modal
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);

  // Estados de catálogo y selección
  const [catalogoProductos, setCatalogoProductos] = useState<ProductoStockAjuste[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<ProductoStockAjuste | null>(null);
  const [cantidad, setCantidad] = useState<number | string>('');
  const [detalle, setDetalle] = useState<string>('');

  // Lista de productos acumulados para el retiro
  const [itemsToRetire, setItemsToRetire] = useState<Array<ProductoDescontarPayload & { nombreVisible: string; unidadVisible: string; stockDisponible: number }>>([]);

  // Carga
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultWh = initialWarehouse || (warehouses.length > 0 ? warehouses[0] : null);
      setSelectedWarehouse(defaultWh);
      resetForm();
      setItemsToRetire([]);
      if (defaultWh) {
        fetchStockCatalogo(defaultWh.ID_PLANTA_ALMACEN);
      } else {
        setCatalogoProductos([]);
      }
    }
  }, [open, initialWarehouse, warehouses]);

  const fetchStockCatalogo = async (idPlantaAlmacen: number) => {
    setLoadingCatalogo(true);
    const res = await loadApiGetStockAlmacen(idPlantaAlmacen);
    setLoadingCatalogo(false);

    if (res && res.success && Array.isArray(res.data)) {
      setCatalogoProductos(res.data);
    } else if (Array.isArray(res)) {
      setCatalogoProductos(res);
    } else {
      setCatalogoProductos([]);
    }
  };

  const handleWarehouseChange = (newWh: AlmacenItem | null) => {
    setSelectedWarehouse(newWh);
    resetForm();
    setItemsToRetire([]);
    if (newWh) {
      fetchStockCatalogo(newWh.ID_PLANTA_ALMACEN);
    } else {
      setCatalogoProductos([]);
    }
  };

  const resetForm = () => {
    setSelectedProducto(null);
    setCantidad('');
    setDetalle('');
  };

  const currentAvailableStock = Number(selectedProducto?.STOCK ?? selectedProducto?.CANTIDAD ?? 0);

  const handleAddItem = () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén Requerido', 'Seleccione un almacén para retirar insumos.');
      return;
    }
    if (!selectedProducto) {
      showAlert.warning('Producto Requerido', 'Seleccione un producto para retirarlo del inventario.');
      return;
    }
    const numCant = Number(cantidad);
    if (!cantidad || isNaN(numCant) || numCant <= 0) {
      showAlert.warning('Cantidad Inválida', 'Ingrese una cantidad mayor a 0.');
      return;
    }

    if (numCant > currentAvailableStock) {
      showAlert.warning(
        'Stock Insuficiente',
        `La cantidad a retirar (${numCant.toFixed(2)}) supera el stock disponible (${currentAvailableStock.toFixed(2)}).`
      );
      return;
    }

    const nombreProd = selectedProducto.PRODUCTO || selectedProducto.NOMBRE_DETALLE || selectedProducto.PRODUCTO_DETALLE || '';
    const unidadProd = selectedProducto.UNIDAD_MEDIDA || selectedProducto.UNIDAD_MEDIDA_E || 'Unidad';

    const newItem = {
      id_producto: Number(selectedProducto.ID_PRODUCTO || 0),
      id_producto_detalle: Number(selectedProducto.ID_PRODUCTO_DETALLE || 0),
      id_producto_intermedio: Number(selectedProducto.ID_PRODUCTO_INTERMEDIO || 0),
      cantidad: numCant,
      detalle: detalle.trim() || 'Retiro manual de stock',
      producto: nombreProd,
      nombreVisible: nombreProd,
      unidadVisible: unidadProd,
      stockDisponible: currentAvailableStock,
    };

    setItemsToRetire((prev) => [...prev, newItem]);
    resetForm();
  };

  const handleRemoveItem = (index: number) => {
    setItemsToRetire((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén Requerido', 'Debe seleccionar un almacén para registrar el retiro.');
      return;
    }

    let finalItems = [...itemsToRetire];
    if (finalItems.length === 0 && selectedProducto && Number(cantidad) > 0) {
      const numCant = Number(cantidad);
      if (numCant > currentAvailableStock) {
        showAlert.warning(
          'Stock Insuficiente',
          `La cantidad a retirar (${numCant.toFixed(2)}) supera el stock disponible (${currentAvailableStock.toFixed(2)}).`
        );
        return;
      }
      const nombreProd = selectedProducto.PRODUCTO || selectedProducto.NOMBRE_DETALLE || selectedProducto.PRODUCTO_DETALLE || '';
      const unidadProd = selectedProducto.UNIDAD_MEDIDA || selectedProducto.UNIDAD_MEDIDA_E || 'Unidad';
      finalItems.push({
        id_producto: Number(selectedProducto.ID_PRODUCTO || 0),
        id_producto_detalle: Number(selectedProducto.ID_PRODUCTO_DETALLE || 0),
        id_producto_intermedio: Number(selectedProducto.ID_PRODUCTO_INTERMEDIO || 0),
        cantidad: numCant,
        detalle: detalle.trim() || 'Retiro manual de stock',
        producto: nombreProd,
        nombreVisible: nombreProd,
        unidadVisible: unidadProd,
        stockDisponible: currentAvailableStock,
      });
    }

    if (finalItems.length === 0) {
      showAlert.warning('Sin Productos', 'Debe agregar al menos un producto al retiro manual.');
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Retiro de Insumos?',
      `Se descontarán ${finalItems.length} producto(s) del almacén "${selectedWarehouse.DESCRICION || selectedWarehouse.nombre || selectedWarehouse.NOMBRE}".`
    );

    if (!confirmed) return;

    const payload = {
      id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
      productos: finalItems.map((item) => ({
        id_producto: item.id_producto,
        id_producto_detalle: item.id_producto_detalle,
        id_producto_intermedio: item.id_producto_intermedio,
        cantidad: item.cantidad,
        detalle: item.detalle,
        producto: item.producto,
      })),
    };

    setSaving(true);
    const res = await loadApiDescontarStock(payload);
    setSaving(false);

    if (res && res.success) {
      await showAlert.success('¡Retiro Exitoso!', res.message || 'Se guardó correctamente la información.');
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
          px: 3,
          borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
          bgcolor: 'var(--surface, #ffffff)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">remove_circle</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                AJUSTES DE INVENTARIO
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                REGISTRAR RETIRO DE INSUMOS
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
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '78vh', overflowY: 'auto' }}>
        <LoadingOverlay show={loadingCatalogo || saving} message={saving ? 'Procesando retiro...' : 'Cargando stock de productos...'} />

        <div className="space-y-4">
          {/* Tarjeta de Formulario */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                SELECCIONAR PRODUCTO Y CANTIDAD A RETIRAR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Selector de Almacén */}
              <div className="sm:col-span-12 space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Almacén de Origen *
                </label>
                <Autocomplete
                  options={warehouses}
                  getOptionLabel={(option) => option.DESCRICION || option.nombre || option.NOMBRE || ''}
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

              {/* Selector de Producto */}
              <div className="sm:col-span-12 space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Producto / Insumo con Stock *
                </label>
                <Autocomplete
                  options={catalogoProductos}
                  getOptionLabel={(o) => {
                    const name = o.PRODUCTO || o.NOMBRE_DETALLE || o.PRODUCTO_DETALLE || '';
                    const unit = o.UNIDAD_MEDIDA || o.UNIDAD_MEDIDA_E || '';
                    const stock = Number(o.STOCK ?? o.CANTIDAD ?? 0);
                    return `${name} - Stock: ${stock.toFixed(2)} ${unit}`;
                  }}
                  value={selectedProducto}
                  onChange={(_, nv) => setSelectedProducto(nv)}
                  fullWidth
                  noOptionsText="No hay productos disponibles"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '15px',
                      backgroundColor: 'var(--input-bg, var(--surface))',
                      color: 'var(--on-surface)',
                      padding: '3px 8px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--outline-variant)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--outline)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary)' },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="BUSCAR PRODUCTO PARA RETIRAR..." />
                  )}
                />
              </div>

              {/* Indicador de Stock Disponible */}
              {selectedProducto && (
                <div className="sm:col-span-12 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">Stock Disponible para Retiro:</span>
                  <span className="text-xs font-black text-primary">
                    {currentAvailableStock.toFixed(2)} {selectedProducto.UNIDAD_MEDIDA || selectedProducto.UNIDAD_MEDIDA_E || ''}
                  </span>
                </div>
              )}

              {/* Cantidad */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Cantidad a Retirar
                </label>
                <input
                  type="number"
                  min="0"
                  max={currentAvailableStock}
                  step="any"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value === '' ? '' : e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Motivo / Detalle */}
              <div className="sm:col-span-8 space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Motivo / Detalle del Retiro
                </label>
                <input
                  type="text"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Ej. Merma, prueba de calidad, descarte..."
                  className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Botón Agregar a Lista */}
            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon="playlist_add"
                onClick={handleAddItem}
                className="!h-9 !px-4"
              >
                Agregar a la Lista
              </Button>
            </div>
          </div>

          {/* Tabla de Productos a Retirar */}
          {itemsToRetire.length > 0 && (
            <div className="bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 overflow-hidden">
              <div className="p-3 bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-outline-variant/40 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary font-headline">
                  Productos para Retiro ({itemsToRetire.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/30 dark:bg-zinc-850/30 border-b border-outline-variant/30">
                      <td className="pl-4 pr-2 py-2 text-[9px] font-black uppercase text-zinc-400">N°</td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">PRODUCTO</td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 text-right">CANTIDAD</td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">UNIDAD</td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">MOTIVO</td>
                      <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 text-center">ACCIÓN</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {itemsToRetire.map((it, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="pl-4 pr-2 py-2 font-bold text-primary">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-on-surface">{it.nombreVisible}</td>
                        <td className="px-3 py-2 text-right font-black text-rose-600">-{it.cantidad.toFixed(2)}</td>
                        <td className="px-3 py-2 text-on-surface-variant uppercase text-[10px]">{it.unidadVisible}</td>
                        <td className="px-3 py-2 text-zinc-500 text-[11px]">{it.detalle}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            title="Eliminar de la lista"
                            className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center cursor-pointer mx-auto"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
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
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Confirmar Retiro
        </Button>
      </DialogActions>
    </Dialog>
  );
};

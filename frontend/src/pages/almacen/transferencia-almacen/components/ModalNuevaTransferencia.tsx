import React, { useState, useEffect } from 'react';
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
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  useTransferenciaAlmacenServices,
  ProductoIntermedioStock,
} from '../services/useTransferenciaAlmacen';

interface ModalNuevaTransferenciaProps {
  open: boolean;
  onClose: () => void;
  userWarehouses: any[];
  allWarehouses: any[];
  onSaveSuccess: () => void;
  defaultOriginWarehouse?: any | null;
}

interface TransferItemState {
  id: number;
  product: ProductoIntermedioStock;
  cantidad: string;
}

export const ModalNuevaTransferencia: React.FC<ModalNuevaTransferenciaProps> = ({
  open,
  onClose,
  userWarehouses,
  allWarehouses,
  onSaveSuccess,
  defaultOriginWarehouse = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetStockPI, loadApiRegistrarTransferencia } = useTransferenciaAlmacenServices();

  const [sourceWarehouse, setSourceWarehouse] = useState<any | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState<any | null>(null);
  const [availableStock, setAvailableStock] = useState<ProductoIntermedioStock[]>([]);
  const [selectedStockItem, setSelectedStockItem] = useState<ProductoIntermedioStock | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItemState[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initialSource =
        defaultOriginWarehouse || (userWarehouses.length > 0 ? userWarehouses[0] : null);
      setSourceWarehouse(initialSource);
      setTargetWarehouse(null);
      setSelectedStockItem(null);
      setTransferItems([]);

      if (initialSource) {
        fetchStock(initialSource.ID_PLANTA_ALMACEN);
      }
    }
  }, [open, defaultOriginWarehouse, userWarehouses]);

  const fetchStock = async (idAlmacen: number) => {
    if (!idAlmacen) {
      setAvailableStock([]);
      return;
    }
    setIsLoadingStock(true);
    const res = await loadApiGetStockPI(idAlmacen);
    if (res && res.success && Array.isArray(res.data)) {
      setAvailableStock(res.data);
    } else if (Array.isArray(res)) {
      setAvailableStock(res);
    } else {
      setAvailableStock([]);
    }
    setIsLoadingStock(false);
  };

  const handleSourceChange = (newSource: any | null) => {
    setSourceWarehouse(newSource);
    setSelectedStockItem(null);
    setTransferItems([]);
    if (newSource) {
      fetchStock(newSource.ID_PLANTA_ALMACEN);
    } else {
      setAvailableStock([]);
    }
  };

  const handleAddProduct = () => {
    if (!selectedStockItem) {
      showAlert.warning('Seleccionar Producto', 'Por favor seleccione un producto intermedio del listado.');
      return;
    }

    if (transferItems.some((item) => item.product.ID_PRODUCTO_INTERMEDIO === selectedStockItem.ID_PRODUCTO_INTERMEDIO)) {
      showAlert.warning('Producto duplicado', 'El producto seleccionado ya está en el detalle.');
      return;
    }

    if (selectedStockItem.STOCK <= 0) {
      showAlert.warning('Sin stock', 'El producto seleccionado no cuenta con stock disponible en el almacén origen.');
      return;
    }

    setTransferItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: selectedStockItem,
        cantidad: '',
      },
    ]);
    setSelectedStockItem(null);
  };

  const handleQtyChange = (id: number, value: string, maxStock: number) => {
    if (value === '') {
      setTransferItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, cantidad: '' } : i))
      );
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    if (num > maxStock) {
      showAlert.warning(
        'Stock insuficiente',
        `La cantidad a transferir no puede superar el stock disponible (${maxStock}).`
      );
      setTransferItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, cantidad: maxStock.toString() } : i))
      );
      return;
    }

    setTransferItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: value } : i))
    );
  };

  const handleRemoveItem = (id: number) => {
    setTransferItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveTransfer = async () => {
    if (!sourceWarehouse) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Almacén de Origen.');
      return;
    }
    if (!targetWarehouse) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Almacén de Destino.');
      return;
    }
    if (sourceWarehouse.ID_PLANTA_ALMACEN === targetWarehouse.ID_PLANTA_ALMACEN) {
      showAlert.warning('Almacenes idénticos', 'El almacén de origen y destino no pueden ser el mismo.');
      return;
    }
    if (transferItems.length === 0) {
      showAlert.warning('Sin productos', 'Debe agregar al menos un producto intermedio a la transferencia.');
      return;
    }

    const invalidItem = transferItems.find(
      (item) => !item.cantidad || parseFloat(item.cantidad) <= 0
    );
    if (invalidItem) {
      showAlert.warning(
        'Cantidad inválida',
        `Ingrese una cantidad válida mayor a 0 para ${invalidItem.product.NOMBRE}.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id_planta_almacen: sourceWarehouse.ID_PLANTA_ALMACEN,
        id_planta_almacen_destino: targetWarehouse.ID_PLANTA_ALMACEN,
        productos: transferItems.map((item) => ({
          id_producto_intermedio: item.product.ID_PRODUCTO_INTERMEDIO,
          id_producto_detalle: 0,
          cantidad_adecuacion: item.product.CANTIDAD_ADECUACION || 1,
          cantidad: parseFloat(item.cantidad),
          id_unidad_medida: item.product.ID_UNIDAD_MEDIDA || 0,
          producto: item.product.NOMBRE,
        })),
      };

      const res = await loadApiRegistrarTransferencia(payload);
      if (res && res.success) {
        showAlert.success('Transferencia Exitosa', res.message || 'Se registró la transferencia correctamente.');
        onSaveSuccess();
        onClose();
      } else {
        showAlert.error('Error al transferir', res?.message || 'No se pudo completar la transferencia.');
      }
    } catch (err: any) {
      showAlert.error('Error', err?.message || 'Ocurrió un error al procesar la transferencia.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
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
      {/* ── Encabezado ── */}
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
              <span className="material-symbols-outlined text-xl">sync_alt</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                TRANSFERENCIA INTERNA
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                TRANSFERENCIA DE PRODUCTOS INTERMEDIOS
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

      {/* ── Contenido ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '78vh',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-5">
          {/* Tarjeta de Selección de Almacenes */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Almacén Origen */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Almacén Origen (Usuario) *
                </label>
                <Autocomplete
                  options={userWarehouses}
                  getOptionLabel={(opt) => opt.DESCRICION || opt.nombre || ''}
                  value={sourceWarehouse}
                  onChange={(_, val) => handleSourceChange(val)}
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
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ORIGEN..." />
                  )}
                />
              </div>

              {/* Almacén Destino */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Almacén Destino *
                </label>
                <Autocomplete
                  options={allWarehouses}
                  getOptionLabel={(opt) => opt.DESCRICION || opt.nombre || ''}
                  value={targetWarehouse}
                  onChange={(_, val) => setTargetWarehouse(val)}
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
                    },
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR DESTINO..." />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Añadir Producto */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                AÑADIR PRODUCTO INTERMEDIO AL DETALLE
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1 space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Buscar Producto en Stock ({availableStock.length} disponibles)
                </label>
                <Autocomplete
                  options={availableStock}
                  getOptionLabel={(o) => `${o.NOMBRE} (Stock: ${o.STOCK ?? 0} ${o.UNIDAD_MEDIDA || ''})`}
                  value={selectedStockItem}
                  onChange={(_, val) => setSelectedStockItem(val)}
                  loading={isLoadingStock}
                  disabled={!sourceWarehouse || isLoadingStock}
                  fullWidth
                  noOptionsText={isLoadingStock ? 'Cargando stock...' : 'No hay productos con stock en este almacén'}
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
                    <TextField {...params} variant="outlined" size="small" placeholder="ESCRIBA O SELECCIONE PRODUCTO..." />
                  )}
                />
              </div>

              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedStockItem}
                className="h-10 px-5 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Añadir Producto
              </button>
            </div>
          </div>

          {/* Tabla de Detalle de Transferencia */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex justify-between items-center border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">list_alt</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  DETALLE DE PRODUCTOS A TRANSFERIR ({transferItems.length})
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800">
                      <td className="pl-4 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        N°
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Producto Intermedio
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Stock Actual
                      </td>
                      <td className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
                        Cant. a Transferir
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
                    {transferItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                          <span className="material-symbols-outlined text-3xl mb-1 block opacity-40">
                            inventory
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Utilice el selector arriba para añadir productos a transferir
                          </span>
                        </td>
                      </tr>
                    ) : (
                      transferItems.map((item, idx) => {
                        const maxStock = item.product.STOCK || 0;
                        return (
                          <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors">
                            <td className="pl-4 pr-2 py-2 text-[10px] font-black text-primary whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                {item.product.NOMBRE}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                {maxStock}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxStock}
                                step="0.01"
                                value={item.cantidad}
                                placeholder="0.00"
                                onChange={(e) => handleQtyChange(item.id, e.target.value, maxStock)}
                                className="w-24 h-8 text-center text-xs font-black rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary transition-all"
                              />
                            </td>
                            <td className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              {item.product.UNIDAD_MEDIDA || 'UNIDAD'}
                            </td>
                            <td className="pr-4 pl-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                title="Quitar de la lista"
                                className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center font-bold cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
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

      {/* ── Pie de Modal ── */}
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
          onClick={handleSaveTransfer}
          loading={isSaving}
          icon="send"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Procesar Transferencia
        </Button>
      </DialogActions>
    </Dialog>
  );
};

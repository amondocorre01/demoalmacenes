import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  Autocomplete,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import LoadingOverlay from '../../../../components/common/LoadingOverlay';
import { showAlert } from '../../../../config/alerts';
import {
  AlmacenItem,
  ProductoStockItem,
  FechaStockItem,
  DesperdiciarItemPayload,
  useDesperdicioManualServices,
  getImageUrl,
} from '../services/useDesperdicioManual';
import { ModalCamaraCaptura } from './ModalCamaraCaptura';

interface ModalNuevoDesperdicioManualProps {
  open: boolean;
  onClose: () => void;
  warehouses: AlmacenItem[];
  initialWarehouse?: AlmacenItem | null;
  onSuccess: () => void;
}

interface ItemLoteDesperdicio extends DesperdiciarItemPayload {
  nombreVisible: string;
  detalleVisible: string;
  unidadVisible: string;
  stockDisponible: number;
  archivoNombre?: string;
  archivoTipo?: 'image' | 'pdf' | null;
  archivoPreviewUrl?: string | null;
}

export const ModalNuevoDesperdicioManual: React.FC<ModalNuevoDesperdicioManualProps> = ({
  open,
  onClose,
  warehouses,
  initialWarehouse,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Referencias para inputs de archivos desde la tabla
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const [activeRowIndexForUpload, setActiveRowIndexForUpload] = useState<number | null>(null);

  // Modal de Cámara en Vivo
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [activeRowIndexForCamera, setActiveRowIndexForCamera] = useState<number | null>(null);

  const { loadApiGetProductosStock, loadApiDesperdiciar } = useDesperdicioManualServices();

  // Filtrar almacenes válidos (excluyendo "Todos")
  const validWarehouses = useMemo(() => {
    return warehouses.filter((w) => w.ID_PLANTA_ALMACEN !== 0);
  }, [warehouses]);

  // Almacén seleccionado
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);

  // Catálogo de stock del almacén
  const [stockProductos, setStockProductos] = useState<ProductoStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  // Campos de formulario para agregar item
  const [selectedProducto, setSelectedProducto] = useState<ProductoStockItem | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<FechaStockItem | null>(null);
  const [cantidad, setCantidad] = useState<string>('');
  const [motivoDetalle, setMotivoDetalle] = useState<string>('');

  // Previsualización de archivo
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    nombre: string;
    tipo: 'image' | 'pdf';
  } | null>(null);

  // Lote de items agregados
  const [itemsLote, setItemsLote] = useState<ItemLoteDesperdicio[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formato de fecha DD-MM-YYYY
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Cargar catálogo de stock del almacén
  const fetchStockAlmacen = async (idAlmacen: number) => {
    setLoadingStock(true);
    const items = await loadApiGetProductosStock(idAlmacen);
    setStockProductos(items || []);
    setLoadingStock(false);
  };

  // Inicializar al abrir
  useEffect(() => {
    if (open) {
      const defaultWh =
        initialWarehouse && initialWarehouse.ID_PLANTA_ALMACEN !== 0
          ? initialWarehouse
          : validWarehouses.length > 0
            ? validWarehouses[0]
            : null;

      setSelectedWarehouse(defaultWh);
      setItemsLote([]);
      resetFormInputs();

      if (defaultWh) {
        fetchStockAlmacen(defaultWh.ID_PLANTA_ALMACEN);
      } else {
        setStockProductos([]);
      }
    }
  }, [open, initialWarehouse, validWarehouses]);

  const handleWarehouseChange = (newWh: AlmacenItem | null) => {
    setSelectedWarehouse(newWh);
    resetFormInputs();
    setItemsLote([]);
    if (newWh) {
      fetchStockAlmacen(newWh.ID_PLANTA_ALMACEN);
    } else {
      setStockProductos([]);
    }
  };

  // Cuando cambia el producto, auto-seleccionar primera fecha si existe
  const handleProductoChange = (newProd: ProductoStockItem | null) => {
    setSelectedProducto(newProd);
    setCantidad('');
    if (newProd && Array.isArray(newProd.FECHAS) && newProd.FECHAS.length > 0) {
      setSelectedFecha(newProd.FECHAS[0]);
    } else {
      setSelectedFecha(null);
    }
  };

  const resetFormInputs = () => {
    setSelectedProducto(null);
    setSelectedFecha(null);
    setCantidad('');
    setMotivoDetalle('');
  };

  // Stock disponible según la fecha seleccionada o total del producto
  const availableStock = useMemo(() => {
    if (selectedFecha) {
      return Number(selectedFecha.STOCK || 0);
    }
    if (selectedProducto) {
      return Number(selectedProducto.CANTIDAD ?? selectedProducto.STOCK ?? 0);
    }
    return 0;
  }, [selectedFecha, selectedProducto]);

  // Fechas de vencimiento disponibles para el producto seleccionado
  const fechasDisponibles = useMemo(() => {
    if (!selectedProducto || !Array.isArray(selectedProducto.FECHAS)) {
      return [];
    }
    return selectedProducto.FECHAS;
  }, [selectedProducto]);

  // Procesamiento de archivo subido desde la tabla
  const handleRowFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeRowIndexForUpload === null) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      showAlert.warning('Formato No Válido', 'Solo se permiten fotos o documentos PDF.');
      return;
    }

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setItemsLote((prev) =>
          prev.map((item, idx) =>
            idx === activeRowIndexForUpload
              ? {
                ...item,
                IMAGEN: base64,
                archivoNombre: file.name,
                archivoTipo: 'pdf',
                archivoPreviewUrl: dataUrl,
              }
              : item
          )
        );
        setActiveRowIndexForUpload(null);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawDataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = compressedDataUrl.split(',')[1];
          setItemsLote((prev) =>
            prev.map((item, idx) =>
              idx === activeRowIndexForUpload
                ? {
                  ...item,
                  IMAGEN: base64,
                  archivoNombre: file.name,
                  archivoTipo: 'image',
                  archivoPreviewUrl: compressedDataUrl,
                }
                : item
            )
          );
          setActiveRowIndexForUpload(null);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  // Foto o PDF confirmado desde la cámara/visor
  const handleCameraCaptureConfirm = (
    base64: string,
    previewUrl: string,
    fileName: string,
    tipo?: 'image' | 'pdf'
  ) => {
    if (activeRowIndexForCamera === null) return;
    const determinedType = tipo || (fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
    setItemsLote((prev) =>
      prev.map((item, idx) =>
        idx === activeRowIndexForCamera
          ? {
            ...item,
            IMAGEN: base64,
            archivoNombre: fileName,
            archivoTipo: determinedType,
            archivoPreviewUrl: previewUrl,
          }
          : item
      )
    );
    setActiveRowIndexForCamera(null);
  };

  // Agregar producto al lote
  const handleAddItem = () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén Requerido', 'Seleccione un almacén antes de continuar.');
      return;
    }
    if (!selectedProducto) {
      showAlert.warning('Producto Requerido', 'Seleccione el producto a desperdiciar.');
      return;
    }

    const numCant = Number(cantidad);
    if (!cantidad || isNaN(numCant) || numCant <= 0) {
      showAlert.warning('Cantidad Requerida', 'Ingrese una cantidad válida mayor a 0.');
      return;
    }

    if (numCant > availableStock) {
      showAlert.warning(
        'Stock Insuficiente',
        `La cantidad a desperdiciar (${numCant}) supera el stock disponible (${availableStock}).`
      );
      return;
    }

    // Determinar fecha de vencimiento
    let fechaVenc = '';
    if (selectedFecha?.FECHA_VENCIMIENTO) {
      fechaVenc = selectedFecha.FECHA_VENCIMIENTO.split('T')[0];
    } else if (selectedProducto.FECHA_VENCIMIENTO) {
      fechaVenc = selectedProducto.FECHA_VENCIMIENTO.split('T')[0];
    } else {
      fechaVenc = new Date().toISOString().split('T')[0];
    }

    const nombreProd =
      selectedProducto.PRODUCTO ||
      selectedProducto.NOMBRE_PRODUCTO ||
      selectedProducto.NOMBRE_DETALLE ||
      '';
    const detalleProd =
      selectedProducto.NOMBRE_DETALLE || selectedProducto.PRODUCTO_DETALLE || '';
    const unidad =
      selectedProducto.UNIDAD_MEDIDA_E ||
      selectedProducto.UNIDAD_MEDIDA ||
      selectedProducto.MEDIDA ||
      'Unidad';

    const existingImg = selectedProducto.IMAGEN || '';
    const initialPreviewUrl = existingImg ? getImageUrl(existingImg) : null;
    const initialTipo = existingImg
      ? existingImg.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : 'image'
      : null;

    const newItem: ItemLoteDesperdicio = {
      ID_PRODUCTO_DETALLE: Number(
        selectedFecha?.ID_PRODUCTO_DETALLE ?? selectedProducto.ID_PRODUCTO_DETALLE ?? 0
      ),
      ID_PRODUCTO: Number(selectedFecha?.ID_PRODUCTO ?? selectedProducto.ID_PRODUCTO ?? 0),
      ID_PRODUCTO_INTERMEDIO: Number(
        selectedFecha?.ID_PRODUCTO_INTERMEDIO ?? selectedProducto.ID_PRODUCTO_INTERMEDIO ?? 0
      ),
      PRODUCTO: nombreProd,
      FECHA_VENCIMIENTO: fechaVenc,
      CANTIDAD: numCant,
      CANTIDAD_ADECUACION: Number(
        selectedFecha?.CANTIDAD_ADECUACION ?? selectedProducto.CANTIDAD_ADECUACION ?? 1
      ),
      PROD_PRIMARIO: Number(
        selectedFecha?.PROD_PRIMARIO ?? selectedProducto.PROD_PRIMARIO ?? 0
      ),
      DETALLE: motivoDetalle.trim() || 'Desperdicio manual',
      IMAGEN: existingImg,
      nombreVisible: nombreProd,
      detalleVisible: detalleProd,
      unidadVisible: unidad,
      stockDisponible: availableStock,
      archivoNombre: existingImg ? existingImg.split('/').pop() || 'Evidencia' : '',
      archivoTipo: initialTipo,
      archivoPreviewUrl: initialPreviewUrl,
    };

    setItemsLote((prev) => [...prev, newItem]);
    resetFormInputs();
  };

  // Eliminar producto del lote
  const handleRemoveItem = (index: number) => {
    setItemsLote((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar transacción
  const handleGuardarDesperdicio = async () => {
    if (!selectedWarehouse) {
      showAlert.error('Almacén Requerido', 'Seleccione un almacén para procesar.');
      return;
    }
    if (itemsLote.length === 0) {
      showAlert.error('Lista Vacía', 'Agregue al menos un producto a la lista de desperdicio.');
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Desperdicio Manual?',
      `Se registrarán ${itemsLote.length} producto(s) como desperdicio en ${selectedWarehouse.DESCRICION || selectedWarehouse.nombre
      }.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    const payload = {
      id_almacen: Number(selectedWarehouse.ID_PLANTA_ALMACEN),
      productos: itemsLote.map((item) => ({
        ID_PRODUCTO_DETALLE: item.ID_PRODUCTO_DETALLE,
        ID_PRODUCTO: item.ID_PRODUCTO,
        ID_PRODUCTO_INTERMEDIO: item.ID_PRODUCTO_INTERMEDIO,
        PRODUCTO: item.PRODUCTO,
        FECHA_VENCIMIENTO: item.FECHA_VENCIMIENTO,
        CANTIDAD: item.CANTIDAD,
        CANTIDAD_ADECUACION: item.CANTIDAD_ADECUACION,
        PROD_PRIMARIO: item.PROD_PRIMARIO,
        DETALLE: item.DETALLE,
        IMAGEN: item.IMAGEN || '',
      })),
    };

    const res = await loadApiDesperdiciar(payload);
    setIsSubmitting(false);

    if (res.success) {
      showAlert.success(
        'Desperdicio Registrado',
        res.message || 'Se procesaron los productos correctamente.'
      );
      onSuccess();
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100%' : undefined,
              m: isMobile ? 1 : 2,
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
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                  GESTIÓN DE DESPERDICIOS
                </p>
                <h2 className="text-base sm:text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                  REGISTRAR DESPERDICIO MANUAL
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
            p: { xs: 1.5, sm: 2.5 },
            bgcolor: 'var(--surface, #ffffff)',
            maxHeight: '78vh',
            overflowY: 'auto',
          }}
        >
          <div className="space-y-4">
            {/* 1. SECCIÓN FORMULARIO DE AGREGAR PRODUCTO (LIMPIO Y SIN BOTONES DE EVIDENCIA) */}
            <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-lg">add_box</span>
                  <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                    INFORMACIÓN DEL PRODUCTO A DESPERDICIAR
                  </span>
                </div>
                {selectedProducto && (
                  <button
                    type="button"
                    onClick={resetFormInputs}
                    className="text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase cursor-pointer transition-colors"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* 1.1 Almacén */}
                <div className="sm:col-span-12 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Almacén *
                  </label>
                  <Autocomplete
                    options={validWarehouses}
                    getOptionLabel={(option) =>
                      option.DESCRICION || option.nombre || String(option.ID_PLANTA_ALMACEN)
                    }
                    value={selectedWarehouse}
                    onChange={(_, newValue) => handleWarehouseChange(newValue)}
                    isOptionEqualToValue={(option, value) =>
                      option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                    }
                    size="small"
                    fullWidth
                    noOptionsText="Sin almacenes disponibles"
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
                      <TextField {...params} variant="outlined" placeholder="SELECCIONAR ALMACÉN..." />
                    )}
                  />
                </div>

                {/* 1.2 Buscador de Producto */}
                <div className="sm:col-span-12 space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Producto en Stock *
                    </label>
                    {selectedProducto && (
                      <span className="text-[10px] font-black text-primary">
                        Stock Total: {Number(selectedProducto.CANTIDAD ?? selectedProducto.STOCK ?? 0)}{' '}
                        {selectedProducto.UNIDAD_MEDIDA_E ||
                          selectedProducto.UNIDAD_MEDIDA ||
                          selectedProducto.MEDIDA ||
                          ''}
                      </span>
                    )}
                  </div>
                  <Autocomplete
                    options={stockProductos}
                    getOptionLabel={(option) => {
                      const name =
                        option.PRODUCTO || option.NOMBRE_PRODUCTO || option.NOMBRE_DETALLE || '';
                      const stockVal = Number(option.CANTIDAD ?? option.STOCK ?? 0);
                      const unit =
                        option.UNIDAD_MEDIDA_E || option.UNIDAD_MEDIDA || option.MEDIDA || '';
                      return `${name} (Stock: ${stockVal} ${unit})`;
                    }}
                    value={selectedProducto}
                    onChange={(_, newValue) => handleProductoChange(newValue)}
                    isOptionEqualToValue={(option, value) =>
                      option.ID_PRODUCTO_DETALLE === value?.ID_PRODUCTO_DETALLE &&
                      option.ID_PRODUCTO === value?.ID_PRODUCTO &&
                      option.ID_PRODUCTO_INTERMEDIO === value?.ID_PRODUCTO_INTERMEDIO
                    }
                    disabled={!selectedWarehouse || loadingStock}
                    fullWidth
                    noOptionsText={
                      loadingStock ? 'Cargando stock...' : 'No hay productos con stock en este almacén'
                    }
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
                        placeholder="BUSCAR PRODUCTO PARA DESPERDICIAR..."
                      />
                    )}
                  />
                </div>

                {/* 1.3 Fecha Vencimiento / Lote */}
                <div className="sm:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Fecha Vencimiento *
                    </label>
                  </div>
                  <Autocomplete
                    options={fechasDisponibles}
                    getOptionLabel={(option) => {
                      const dateFormatted = formatDateDisplay(option.FECHA_VENCIMIENTO);
                      const stockVal = Number(option.STOCK || 0);
                      const unit =
                        selectedProducto?.UNIDAD_MEDIDA_E ||
                        selectedProducto?.UNIDAD_MEDIDA ||
                        selectedProducto?.MEDIDA ||
                        '';
                      return `${dateFormatted} (${stockVal} ${unit})`;
                    }}
                    value={selectedFecha}
                    onChange={(_, newValue) => {
                      setSelectedFecha(newValue);
                      setCantidad('');
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.FECHA_VENCIMIENTO === value?.FECHA_VENCIMIENTO
                    }
                    disabled={!selectedProducto || fechasDisponibles.length === 0}
                    fullWidth
                    noOptionsText="Sin lotes registrados"
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
                        placeholder="SELECCIONAR VENCIMIENTO..."
                      />
                    )}
                  />
                </div>

                {/* 1.4 Cantidad a Desperdiciar */}
                <div className="sm:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Cantidad a Desperdiciar *
                    </label>
                    {selectedProducto && (
                      <span className="text-[10px] font-bold text-primary">
                        (Disp: {availableStock})
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={availableStock || undefined}
                    step={Boolean(selectedProducto?.PEDIDO_DECIMAL === 1 || selectedProducto?.PEDIDO_DECIMAL === true) ? 'any' : '1'}
                    value={cantidad}
                    onKeyDown={(e) => {
                      const isDecimalAllowed = Boolean(selectedProducto?.PEDIDO_DECIMAL === 1 || selectedProducto?.PEDIDO_DECIMAL === true);
                      if (!isDecimalAllowed && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isDecimalAllowed = Boolean(selectedProducto?.PEDIDO_DECIMAL === 1 || selectedProducto?.PEDIDO_DECIMAL === true);
                      if (val === '') {
                        setCantidad('');
                      } else {
                        if (!isDecimalAllowed) {
                          const cleanVal = val.split('.')[0].split(',')[0];
                          const parsed = parseInt(cleanVal, 10);
                          setCantidad(isNaN(parsed) ? '' : String(parsed));
                        } else {
                          setCantidad(val);
                        }
                      }
                    }}
                    placeholder={Boolean(selectedProducto?.PEDIDO_DECIMAL === 1 || selectedProducto?.PEDIDO_DECIMAL === true) ? '0.00' : '0'}
                    className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* 1.5 Motivo / Observación */}
                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Motivo / Observación
                  </label>
                  <input
                    type="text"
                    value={motivoDetalle}
                    onChange={(e) => setMotivoDetalle(e.target.value)}
                    placeholder="EJ: VENCIDO, DAÑADO..."
                    className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                  className="!h-9 !px-6 shadow-md shadow-primary/20"
                >
                  Agregar a la Lista
                </Button>
              </div>
            </div>

            {/* 2. TABLA DE PRODUCTOS LISTADOS (CON ACCIONES DE EVIDENCIA: CÁMARA Y ARCHIVO) */}
            {itemsLote.length > 0 && (
              <div className="bg-surface dark:bg-zinc-900 rounded-2xl border border-outline-variant/60 overflow-hidden shadow-xs">
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-outline-variant/40 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary font-headline">
                    Productos Agregados para Desperdicio ({itemsLote.length})
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    Total:{' '}
                    <strong className="text-primary">
                      {itemsLote.reduce((acc, curr) => acc + Number(curr.CANTIDAD || 0), 0)}
                    </strong>
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[240px] custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50/30 dark:bg-zinc-850/30 border-b border-outline-variant/30 sticky top-0 z-10">
                        <td className="pl-4 pr-2 py-2 text-[9px] font-black uppercase text-zinc-400">N°</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">PRODUCTO</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 text-right">CANTIDAD</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">UNIDAD</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">VENCIMIENTO</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400">MOTIVO</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 text-center">EVIDENCIA</td>
                        <td className="px-3 py-2 text-[9px] font-black uppercase text-zinc-400 text-center">ACCIÓN</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {itemsLote.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="pl-4 pr-2 py-1.5 font-black text-xs text-primary whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-1.5 uppercase font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">
                            {item.detalleVisible || item.nombreVisible}
                          </td>
                          <td className="px-3 py-1.5 text-right font-black text-zinc-800 dark:text-zinc-200 text-[10px] whitespace-nowrap">
                            {item.CANTIDAD.toLocaleString('es-BO', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-1.5 uppercase text-zinc-500 text-[9px] font-semibold whitespace-nowrap">
                            {item.unidadVisible}
                          </td>
                          <td className="px-3 py-1.5 font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                            {formatDateDisplay(item.FECHA_VENCIMIENTO)}
                          </td>
                          <td className="px-3 py-1.5 text-[10px] text-zinc-600 dark:text-zinc-300 uppercase">
                            {item.DETALLE}
                          </td>
                          <td className="px-3 py-1.5 text-center whitespace-nowrap">
                            {(() => {
                              const rowPreviewUrl = item.archivoPreviewUrl || getImageUrl(item.IMAGEN);
                              const rowFileType =
                                item.archivoTipo ||
                                (rowPreviewUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');

                              return rowPreviewUrl ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewFile({
                                        url: rowPreviewUrl,
                                        nombre: item.archivoNombre || item.nombreVisible || 'Evidencia',
                                        tipo: rowFileType,
                                      });
                                      setPreviewModalOpen(true);
                                    }}
                                    title={`Ver ${rowFileType === 'pdf' ? 'PDF' : 'Foto'}`}
                                    className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">
                                      {rowFileType === 'pdf' ? 'picture_as_pdf' : 'image'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setItemsLote((prev) =>
                                        prev.map((it, i) =>
                                          i === idx
                                            ? {
                                              ...it,
                                              IMAGEN: '',
                                              archivoNombre: '',
                                              archivoTipo: null,
                                              archivoPreviewUrl: null,
                                            }
                                            : it
                                        )
                                      );
                                    }}
                                    title="Quitar archivo"
                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {/* Botón Cámara en Vivo (Trasera en móvil, Webcam en PC) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRowIndexForCamera(idx);
                                      setCameraModalOpen(true);
                                    }}
                                    title="Tomar fotografía con cámara"
                                    className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                                  </button>

                                  {/* Botón Subir Archivo / PDF */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRowIndexForUpload(idx);
                                      rowFileInputRef.current?.click();
                                    }}
                                    title="Subir archivo o PDF"
                                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">attach_file</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-1.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Eliminar de la lista"
                              className="w-7 h-7 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center font-bold cursor-pointer mx-auto"
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
            className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGuardarDesperdicio}
            disabled={itemsLote.length === 0 || isSubmitting}
            icon={isSubmitting ? 'progress_activity' : 'save'}
            className="!h-9 !px-8 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Guardando...'
              : `Registrar Desperdicio (${itemsLote.length})`}
          </Button>
        </DialogActions>

        {/* Componentes Centralizados de Carga */}
        <LoadingOverlay show={loadingStock} message="Cargando productos en stock..." />
        <LoadingOverlay show={isSubmitting} message="Registrando desperdicio manual..." />
      </Dialog>

      {/* Input oculto para subir archivo desde la tabla */}
      <input
        type="file"
        ref={rowFileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        onChange={handleRowFileSelected}
        className="hidden"
      />

      {/* Modal de Cámara en Vivo (Cámara trasera en celular, Webcam en PC) */}
      <ModalCamaraCaptura
        open={cameraModalOpen}
        onClose={() => {
          setCameraModalOpen(false);
          setActiveRowIndexForCamera(null);
        }}
        onCapture={handleCameraCaptureConfirm}
      />

      {/* Mini Modal para Previsualizar Archivo Adjunto (Foto / PDF) */}
      <Dialog
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '1.5rem',
              overflow: 'hidden',
              bgcolor: 'var(--surface, #ffffff)',
              color: 'var(--on-surface, #18181b)',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            px: 2.5,
            borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              {previewFile?.tipo === 'pdf' ? 'picture_as_pdf' : 'image'}
            </span>
            <span className="text-xs font-black uppercase text-on-surface truncate max-w-[280px]">
              {previewFile?.nombre || 'Vista Previa del Archivo'}
            </span>
          </div>
          <IconButton onClick={() => setPreviewModalOpen(false)} size="small">
            <span className="material-symbols-outlined text-base">close</span>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: 'var(--surface, #ffffff)', minHeight: '300px' }}>
          {previewFile?.tipo === 'pdf' ? (
            <iframe
              src={previewFile.url}
              title={previewFile.nombre}
              className="w-full h-[400px] rounded-xl border border-outline-variant"
            />
          ) : (
            <div className="flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden min-h-[300px] max-h-[450px]">
              <img
                src={previewFile?.url}
                alt={previewFile?.nombre}
                className="w-full h-auto max-h-[450px] object-contain"
              />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1.5, px: 2.5, borderTop: '1px solid var(--border-outline-variant, #f4f4f5)' }}>
          <Button
            onClick={() => setPreviewModalOpen(false)}
            variant="secondary"
            size="sm"
            className="!h-8 !px-4"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

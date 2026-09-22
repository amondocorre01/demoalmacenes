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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  useSolicitudesAlmacenServices,
  ProductoPlantaAlmacen,
  SolicitudAlmacenItem,
} from '../services/useSolicitudesAlmacen';

interface ModalNuevaSolicitudProps {
  open: boolean;
  onClose: () => void;
  warehouses: any[];
  areas: any[];
  onSaveSuccess: () => void;
  editItem?: SolicitudAlmacenItem | null;
}

interface ProductRowState extends ProductoPlantaAlmacen {
  requestedQty: string;
  idDetalle?: number;
}

export const ModalNuevaSolicitud: React.FC<ModalNuevaSolicitudProps> = ({
  open,
  onClose,
  warehouses,
  areas,
  onSaveSuccess,
  editItem = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    loadApiGetProductosPlantaAlmacen,
    loadApiEnviarSolicitud,
    loadApiEditarSolicitud,
  } = useSolicitudesAlmacenServices();

  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [products, setProducts] = useState<ProductRowState[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtros internos de tabla de productos
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Inicialización / Reset al abrir o cambiar editItem
  useEffect(() => {
    if (open) {
      if (editItem) {
        // En modo edición
        const matchedArea = areas.find(
          (a) => a.ID_AREA === editItem.ID_AREA || a.NOMBRE === editItem.NOMBRE_AREA
        ) || (editItem.ID_AREA ? { ID_AREA: editItem.ID_AREA, NOMBRE: editItem.NOMBRE_AREA } : null);

        const matchedWarehouse = warehouses.find(
          (w) => w.ID_PLANTA_ALMACEN === editItem.ID_PLANTA_ALMACEN || w.DESCRICION === editItem.ALMACEN
        ) || (editItem.ID_PLANTA_ALMACEN ? { ID_PLANTA_ALMACEN: editItem.ID_PLANTA_ALMACEN, DESCRICION: editItem.ALMACEN } : null);

        setSelectedArea(matchedArea);
        setSelectedWarehouse(matchedWarehouse);

        if (editItem.FECHA_A_ENTREGAR) {
          const cleanDate = editItem.FECHA_A_ENTREGAR.split('T')[0];
          setDeliveryDate(dayjs(cleanDate + 'T00:00:00'));
        } else {
          setDeliveryDate(dayjs().add(1, 'day'));
        }

        // Si ya trae detalle, precargamos o traemos productos del almacén
        if (matchedArea && matchedWarehouse) {
          fetchProductsForSelection(
            matchedArea.ID_AREA,
            matchedWarehouse.ID_PLANTA_ALMACEN,
            editItem.DETALLE
          );
        }
      } else {
        // Modo nueva solicitud
        setSelectedArea(areas.length > 0 ? areas[0] : null);
        setSelectedWarehouse(warehouses.length > 0 ? warehouses[0] : null);
        setDeliveryDate(dayjs().add(1, 'day'));
        setProducts([]);
        setShowOnlyWithStock(false);
        setProductSearch('');

        if (areas.length > 0 && warehouses.length > 0) {
          fetchProductsForSelection(areas[0].ID_AREA, warehouses[0].ID_PLANTA_ALMACEN);
        }
      }
    }
  }, [open, editItem]);

  // Cargar productos del almacén al cambiar área o almacén en modo nueva solicitud
  const fetchProductsForSelection = async (
    idArea: number,
    idWarehouse: number,
    existingDetails?: any[]
  ) => {
    if (!idArea || !idWarehouse) {
      setProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    const res = await loadApiGetProductosPlantaAlmacen(idArea, idWarehouse);
    let items: ProductoPlantaAlmacen[] = [];

    if (Array.isArray(res)) {
      items = res;
    } else if (res?.productos || res?.data) {
      items = res.productos || res.data;
    }

    if (existingDetails && existingDetails.length > 0) {
      // Modo edición: mostrar exclusivamente los productos solicitados
      const mapped: ProductRowState[] = existingDetails.map((d) => {
        const stockMatch = items.find(
          (p) => p.ID_PRODUCTO_DETALLE === d.ID_PRODUCTO_DETALLE
        );
        return {
          ID_PRODUCTO_DETALLE: d.ID_PRODUCTO_DETALLE,
          ID_PRODUCTO: d.ID_PRODUCTO || stockMatch?.ID_PRODUCTO || 0,
          PRODUCTO: d.PRODUCTO || stockMatch?.PRODUCTO || '',
          NOMBRE: d.NOMBRE || stockMatch?.NOMBRE || d.PRODUCTO || '',
          STOCK: stockMatch !== undefined ? (stockMatch.STOCK ?? 0) : (d.STOCK ?? 0),
          CANTIDAD_MEDIDA: d.CANTIDAD_MEDIDA || stockMatch?.CANTIDAD_MEDIDA,
          UNIDAD_MEDIDA: d.UNIDAD_MEDIDA || stockMatch?.UNIDAD_MEDIDA || 'UNIDAD',
          UNIDAD_MEDIDA_A: stockMatch?.UNIDAD_MEDIDA_A || d.UNIDAD_MEDIDA_A,
          PEDIDO_DECIMAL: stockMatch?.PEDIDO_DECIMAL ?? d.PEDIDO_DECIMAL,
          requestedQty: d.CANTIDAD_SOLICITADA !== undefined && d.CANTIDAD_SOLICITADA !== null ? d.CANTIDAD_SOLICITADA.toString() : '',
          idDetalle: d.ID_PLANTA_ALMACEN_DETALLE,
        };
      });
      setProducts(mapped);
    } else {
      // Modo nueva solicitud: todos los productos del catálogo
      const mapped: ProductRowState[] = items.map((p) => ({
        ...p,
        requestedQty: '',
        idDetalle: undefined,
      }));
      setProducts(mapped);
    }

    setIsLoadingProducts(false);
  };

  const handleAreaChange = (newArea: any | null) => {
    setSelectedArea(newArea);
    if (newArea && selectedWarehouse) {
      fetchProductsForSelection(newArea.ID_AREA, selectedWarehouse.ID_PLANTA_ALMACEN);
    } else {
      setProducts([]);
    }
  };

  const handleWarehouseChange = (newWh: any | null) => {
    setSelectedWarehouse(newWh);
    if (selectedArea && newWh) {
      fetchProductsForSelection(selectedArea.ID_AREA, newWh.ID_PLANTA_ALMACEN);
    } else {
      setProducts([]);
    }
  };

  const handleQtyChange = (id: number, value: string, maxStock: number, isDecimalAllowed: boolean = true) => {
    if (value === '') {
      setProducts((prev) =>
        prev.map((p) => (p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: '' } : p))
      );
      return;
    }

    if (!isDecimalAllowed) {
      const cleanVal = value.split('.')[0].split(',')[0];
      const numInt = parseInt(cleanVal, 10);
      if (isNaN(numInt)) return;
      if (numInt < 0) {
        setProducts((prev) =>
          prev.map((p) => (p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: '0' } : p))
        );
        return;
      }
      if (numInt > maxStock) {
        showAlert.warning(
          'Stock insuficiente',
          `No puede solicitar una cantidad mayor al stock disponible (${maxStock}).`
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: Math.floor(maxStock).toString() } : p
          )
        );
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: numInt.toString() } : p))
      );
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num)) return;

    if (num < 0) {
      setProducts((prev) =>
        prev.map((p) => (p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: '0' } : p))
      );
      return;
    }

    if (num > maxStock) {
      showAlert.warning(
        'Stock insuficiente',
        `No puede solicitar una cantidad mayor al stock disponible (${maxStock}).`
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: maxStock.toString() } : p
        )
      );
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.ID_PRODUCTO_DETALLE === id ? { ...p, requestedQty: value } : p))
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (showOnlyWithStock && (p.STOCK || 0) <= 0) return false;
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase().trim();
        const matchName = (p.NOMBRE || '').toLowerCase().includes(query);
        const matchProduct = (p.PRODUCTO || '').toLowerCase().includes(query);
        const matchUnit = (p.UNIDAD_MEDIDA || '').toLowerCase().includes(query);
        if (!matchName && !matchProduct && !matchUnit) return false;
      }
      return true;
    });
  }, [products, showOnlyWithStock, productSearch]);

  const totalRequestedItems = useMemo(() => {
    return products.filter((p) => p.requestedQty && parseFloat(p.requestedQty) > 0).length;
  }, [products]);

  const handleSave = async () => {
    if (!selectedArea) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Área a solicitar.');
      return;
    }
    if (!selectedWarehouse) {
      showAlert.warning('Campo requerido', 'Por favor seleccione el Almacén destino.');
      return;
    }
    if (!deliveryDate || !deliveryDate.isValid()) {
      showAlert.warning('Campo requerido', 'Por favor seleccione una Fecha de Entrega válida.');
      return;
    }

    // Validar productos ingresados
    const itemsToSubmit = products.filter(
      (p) => p.requestedQty && parseFloat(p.requestedQty) > 0
    );

    if (itemsToSubmit.length === 0) {
      showAlert.warning(
        'Sin productos',
        'Debe ingresar al menos una cantidad válida mayor a 0 para generar la solicitud.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const fechaEntregaStr = deliveryDate.format('YYYY-MM-DD');

      if (editItem) {
        // Edición de solicitud
        const productosPayload: Record<string | number, { cantidad: number; id_detalle?: number }> = {};
        itemsToSubmit.forEach((p) => {
          productosPayload[p.ID_PRODUCTO_DETALLE] = {
            cantidad: parseFloat(p.requestedQty),
            id_detalle: p.idDetalle || 0,
          };
        });

        const res = await loadApiEditarSolicitud({
          id_documento: editItem.ID_PLANTA_ALMACEN_DOCUMENTO,
          id_area: selectedArea.ID_AREA,
          productos: productosPayload,
        });

        if (res && (res.status === true || res.success === true)) {
          showAlert.success('Solicitud Actualizada', res.message || 'Se guardaron los cambios correctamente.');
          onSaveSuccess();
          onClose();
        } else {
          showAlert.error(
            'Error al actualizar',
            res?.message || 'No se pudo actualizar la solicitud.'
          );
        }
      } else {
        // Nueva solicitud
        const productosPayload: Record<string | number, { cantidad: number }> = {};
        itemsToSubmit.forEach((p) => {
          productosPayload[p.ID_PRODUCTO_DETALLE] = {
            cantidad: parseFloat(p.requestedQty),
          };
        });

        const res = await loadApiEnviarSolicitud({
          id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
          id_area: selectedArea.ID_AREA,
          fecha_entrega: fechaEntregaStr,
          productos: productosPayload,
        });

        if (res && (res.status === true || res.success === true)) {
          showAlert.success('Solicitud Registrada', res.message || 'Se registró la solicitud exitosamente.');
          onSaveSuccess();
          onClose();
        } else {
          showAlert.error(
            'Error al registrar',
            res?.message || 'No se pudo enviar la solicitud.'
          );
        }
      }
    } catch (err: any) {
      showAlert.error('Error inesperado', err?.message || 'Ocurrió un error al procesar la solicitud.');
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
              <span className="material-symbols-outlined text-xl">
                {editItem ? 'edit_note' : 'post_add'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                GESTIÓN DE SOLICITUDES
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {editItem ? 'EDITAR SOLICITUD DE ALMACÉN' : 'NUEVA SOLICITUD DE ALMACÉN'}
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
        <div className="space-y-5">
          {/* Tarjeta de Parámetros de Solicitud */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-4">
            {/* <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">tune</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                PARÁMETROS DE LA SOLICITUD
              </span>
            </div> */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selector de Área */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Área a Solicitar *
                </label>
                <Autocomplete
                  options={areas}
                  getOptionLabel={(opt) => opt.NOMBRE || ''}
                  value={selectedArea}
                  onChange={(_, val) => handleAreaChange(val)}
                  disabled={Boolean(editItem)}
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
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ÁREA..." />
                  )}
                />
              </div>

              {/* Selector de Almacén */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Almacén Destino *
                </label>
                <Autocomplete
                  options={warehouses}
                  getOptionLabel={(opt) => opt.DESCRICION || opt.nombre || ''}
                  value={selectedWarehouse}
                  onChange={(_, val) => handleWarehouseChange(val)}
                  disabled={Boolean(editItem)}
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
                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />
                  )}
                />
              </div>

              {/* Fecha de Entrega */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Fecha de Entrega *
                </label>
                <DatePicker
                  value={deliveryDate}
                  onChange={(val) => setDeliveryDate(val)}
                  disabled={Boolean(editItem)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '15px',
                          backgroundColor: 'var(--input-bg, var(--surface))',
                          color: 'var(--on-surface)',
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
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Desglose de Productos */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline-variant/40 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest font-headline block">
                    {editItem ? 'PRODUCTOS DE LA SOLICITUD' : 'DESGLOSE DE PRODUCTOS DEL ALMACÉN'}
                  </span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tight block">
                    {editItem
                      ? `Detalle de productos solicitados (${selectedWarehouse?.DESCRICION || 'Almacén seleccionado'})`
                      : selectedWarehouse
                        ? `Stock en tiempo real: ${selectedWarehouse.DESCRICION || 'Almacén seleccionado'}`
                        : 'Seleccione un almacén para consultar productos'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Buscador interno de productos */}
                <div className="relative group flex-1 sm:w-48">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="BUSCAR PRODUCTO..."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                    search
                  </span>
                </div>

                {/* Filtro stock > 0 */}
                <button
                  type="button"
                  onClick={() => setShowOnlyWithStock(!showOnlyWithStock)}
                  className={`h-7 px-2 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border cursor-pointer shrink-0 ${showOnlyWithStock
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  title={showOnlyWithStock ? 'Mostrando solo productos con stock > 0' : 'Filtrar productos con stock > 0'}
                >
                  <span className="material-symbols-outlined text-xs">
                    {showOnlyWithStock ? 'filter_alt' : 'filter_alt'}
                  </span>
                  {showOnlyWithStock ? 'Ver Todos' : 'Stock > 0'}
                </button>
              </div>
            </div>

            {/* Resumen de items solicitados */}
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-1">
              <span>{editItem ? `Productos solicitados: ${products.length}` : `Productos disponibles: ${products.length}`}</span>
              <span className={totalRequestedItems > 0 ? 'text-primary' : ''}>
                Items con cantidad: {totalRequestedItems}
              </span>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[460px] sm:min-w-[650px]">
                  <thead>
                    <tr className="bg-zinc-50/90 dark:bg-zinc-850/90 border-b border-zinc-200 dark:border-zinc-800">
                      <td className="sticky left-0 z-30 bg-zinc-50 dark:bg-zinc-850 w-[24px] min-w-[24px] max-w-[24px] text-center px-0.5 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        N°
                      </td>
                      <td className="sticky left-[24px] z-30 bg-zinc-50 dark:bg-zinc-850 border-r border-zinc-200 dark:border-zinc-800 px-1.5 sm:px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-[100px] min-w-[100px] max-w-[115px] sm:w-auto sm:min-w-[180px] sm:max-w-none shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        Producto / Detalle
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap min-w-[65px] sm:min-w-[80px]">
                        Cant. Medida
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap min-w-[55px] sm:min-w-[70px]">
                        Stock Disp.
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap min-w-[78px] sm:min-w-[95px]">
                        Cant. Solicitar
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap min-w-[50px] sm:min-w-[65px]">
                        Solicitar en
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {isLoadingProducts ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400">
                          <div className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-primary">
                              progress_activity
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-wider">
                              Cargando catálogo de productos...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                          <span className="material-symbols-outlined text-3xl mb-1 block opacity-40">
                            inventory
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            No se encontraron productos para los criterios seleccionados
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p, idx) => {
                        const stockVal = p.STOCK || 0;
                        const hasStock = stockVal > 0;
                        const hasRequested = Boolean(
                          p.requestedQty && parseFloat(p.requestedQty) > 0
                        );

                        return (
                          <tr
                            key={p.ID_PRODUCTO_DETALLE}
                            className={`group hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors ${hasRequested ? 'bg-primary/5 dark:bg-primary/10' : ''
                              }`}
                          >
                            <td
                              className={`sticky left-0 z-20 w-[24px] min-w-[24px] max-w-[24px] text-center px-0.5 py-1.5 text-[9px] font-black text-primary whitespace-nowrap bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-850 transition-colors ${hasRequested ? '!bg-red-50 dark:!bg-red-950/40' : ''
                                }`}
                            >
                              {idx + 1}
                            </td>
                            <td
                              className={`sticky left-[24px] z-20 border-r border-zinc-200 dark:border-zinc-800 px-1.5 sm:px-3 py-1.5 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-850 transition-colors w-[100px] min-w-[100px] max-w-[115px] sm:w-auto sm:min-w-[180px] sm:max-w-none shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${hasRequested ? '!bg-red-50 dark:!bg-red-950/40' : ''
                                }`}
                            >
                              <p
                                className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight line-clamp-2 leading-tight"
                                title={p.NOMBRE || p.PRODUCTO}
                              >
                                {p.NOMBRE || p.PRODUCTO}
                              </p>
                              {p.PRODUCTO && p.PRODUCTO !== p.NOMBRE && (
                                <p
                                  className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-tight line-clamp-1 mt-0.5"
                                  title={p.PRODUCTO}
                                >
                                  {p.PRODUCTO}
                                </p>
                              )}
                            </td>
                            <td className="px-1 sm:px-2 py-1.5 text-center text-[10px] sm:text-[11px] font-black text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              {p.CANTIDAD_MEDIDA ? `${p.CANTIDAD_MEDIDA} ${p.UNIDAD_MEDIDA_A || ''}` : '-'}
                            </td>
                            <td className="px-1 sm:px-2 py-1.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black ${hasStock
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                  }`}
                              >
                                {stockVal}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 py-1.5 text-center whitespace-nowrap">
                              <input
                                type="number"
                                min={0}
                                max={stockVal}
                                step={Boolean(p.PEDIDO_DECIMAL === 1 || p.PEDIDO_DECIMAL === true) ? 'any' : '1'}
                                disabled={!hasStock}
                                value={p.requestedQty}
                                placeholder={Boolean(p.PEDIDO_DECIMAL === 1 || p.PEDIDO_DECIMAL === true) ? '0.00' : '0'}
                                onKeyDown={(e) => {
                                  const isDecimalAllowed = Boolean(p.PEDIDO_DECIMAL === 1 || p.PEDIDO_DECIMAL === true);
                                  if (!isDecimalAllowed && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) =>
                                  handleQtyChange(
                                    p.ID_PRODUCTO_DETALLE,
                                    e.target.value,
                                    stockVal,
                                    Boolean(p.PEDIDO_DECIMAL === 1 || p.PEDIDO_DECIMAL === true)
                                  )
                                }
                                className={`w-16 sm:w-22 h-7 sm:h-8 text-center text-[11px] sm:text-xs font-black rounded-lg border outline-none transition-all ${!hasStock
                                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-50'
                                  : hasRequested
                                    ? 'bg-white dark:bg-zinc-950 border-primary text-primary ring-2 ring-primary/10'
                                    : 'bg-zinc-50/80 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-primary'
                                  }`}
                              />
                            </td>
                            <td className="px-1 sm:px-2 py-1.5 text-center whitespace-nowrap">
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                {p.UNIDAD_MEDIDA || p.UNIDAD_MEDIDA_A || 'UNIDAD'}
                              </span>
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
          disabled={isSaving}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={isSaving}
          icon={editItem ? 'save' : 'send'}
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {editItem ? 'Guardar Cambios' : 'Enviar Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

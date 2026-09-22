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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../../components/common/Button';
import { showAlert, MySwal } from '../../../../config/alerts';
import {
  AlmacenSolicitante,
  AlmacenDestino,
  ProductoCatalogoItem,
  SolicitudPedidoAlmacenItem,
  usePedidosAlmacenSegunSucursalesServices,
} from '../services/usePedidosAlmacenSegunSucursales';

interface SelectedProductRow {
  id_producto_detalle: number;
  id_producto_intermedio: number;
  id_unidad: number;
  producto: string;
  grupo: string;
  presentacion: string;
  unidad: string;
  stock: number;
  cantidad: number | '';
  pedido_decimal?: boolean | number;
}

interface ModalNuevaSolicitudProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitantes: AlmacenSolicitante[];
  editingRequest?: SolicitudPedidoAlmacenItem | null;
}

export const ModalNuevaSolicitud: React.FC<ModalNuevaSolicitudProps> = ({
  open,
  onClose,
  onSuccess,
  solicitantes,
  editingRequest,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loadApiGetProductos,
    loadApiCrearSolicitud,
    loadApiEditarSolicitud,
  } = usePedidosAlmacenSegunSucursalesServices();

  // Estados de cabecera
  const [selectedSolicitante, setSelectedSolicitante] = useState<AlmacenSolicitante | null>(null);
  const [selectedDestino, setSelectedDestino] = useState<AlmacenDestino | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<Dayjs | null>(dayjs().add(1, 'day'));

  // Catálogo de productos y filtro
  const [tipoFiltro, setTipoFiltro] = useState<'all' | 'insumo' | 'intermedio'>('all');
  const [catalogoProductos, setCatalogoProductos] = useState<ProductoCatalogoItem[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<ProductoCatalogoItem | null>(null);
  const [cantidadToAdd, setCantidadToAdd] = useState<number | ''>('');
  const [loadingProductos, setLoadingProductos] = useState<boolean>(false);

  // Lista de productos seleccionados en la solicitud
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Destinos disponibles según el solicitante elegido
  const destinosDisponibles = useMemo(() => {
    return selectedSolicitante?.DESTINOS || [];
  }, [selectedSolicitante]);

  // Cargar catálogo de productos cuando cambian solicitante o destino
  useEffect(() => {
    if (selectedSolicitante && selectedDestino) {
      setLoadingProductos(true);
      loadApiGetProductos(
        selectedDestino.ID_PLANTA_ALMACEN,
        selectedSolicitante.ID_PLANTA_ALMACEN,
        tipoFiltro
      ).then((res) => {
        setCatalogoProductos(res);
        setLoadingProductos(false);
      });
    } else {
      setCatalogoProductos([]);
    }
  }, [selectedSolicitante, selectedDestino, tipoFiltro, loadApiGetProductos]);

  // Inicializar o resetear formulario
  useEffect(() => {
    if (open) {
      if (editingRequest) {
        // Modo Edición
        const sol = solicitantes.find(
          (s) => s.ID_PLANTA_ALMACEN === editingRequest.ID_ALMACEN_SOLICITANTE
        );
        setSelectedSolicitante(sol || null);

        const des = sol?.DESTINOS.find(
          (d) => d.ID_PLANTA_ALMACEN === editingRequest.ID_ALMACEN_DESTINO
        );
        setSelectedDestino(des || null);

        setFechaEntrega(
          editingRequest.FECHA_A_ENTREGAR ? dayjs(editingRequest.FECHA_A_ENTREGAR) : dayjs()
        );

        // Mapear productos del detalle
        const mappedProds: SelectedProductRow[] = (editingRequest.DETALLE || []).map((det) => ({
          id_producto_detalle: det.ID_PRODUCTO_DETALLE || 0,
          id_producto_intermedio: det.ID_PRODUCTO_INTERMEDIO || 0,
          id_unidad: det.ID_UNIDAD || 0,
          producto: det.PRODUCTO || det.GRUPO || '',
          grupo: det.GRUPO || '',
          presentacion: det.UNIDAD_MEDIDA_A || det.UNIDAD_MEDIDA_E || '',
          unidad: det.UNIDAD_MEDIDA_A || det.UNIDAD_MEDIDA_E || '',
          stock: det.STOCK ?? 0,
          cantidad: det.CANTIDAD_SOLICITADA || '',
          pedido_decimal: det.PEDIDO_DECIMAL,
        }));
        setSelectedProducts(mappedProds);
      } else {
        // Modo Creación
        if (solicitantes.length > 0) {
          const first = solicitantes[0];
          setSelectedSolicitante(first);
          setSelectedDestino(first.DESTINOS.length > 0 ? first.DESTINOS[0] : null);
        } else {
          setSelectedSolicitante(null);
          setSelectedDestino(null);
        }
        setFechaEntrega(dayjs().add(1, 'day'));
        setSelectedProducts([]);
      }
      setSelectedProductToAdd(null);
      setCantidadToAdd('');
    }
  }, [open, editingRequest, solicitantes]);

  // Agregar producto a la lista
  const handleAddProduct = () => {
    if (!selectedProductToAdd) {
      showAlert.warning('Seleccione un producto', 'Debe elegir un producto del catálogo.');
      return;
    }

    const isDecimalAllowed = Boolean(
      selectedProductToAdd.PEDIDO_DECIMAL === 1 ||
      selectedProductToAdd.PEDIDO_DECIMAL === true
    );

    let qty: number;
    if (typeof cantidadToAdd === 'number') {
      qty = isDecimalAllowed ? cantidadToAdd : parseInt(String(cantidadToAdd), 10);
    } else {
      qty = isDecimalAllowed ? parseFloat(String(cantidadToAdd)) : parseInt(String(cantidadToAdd), 10);
    }

    if (!qty || isNaN(qty) || qty <= 0) {
      showAlert.warning('Cantidad inválida', 'Ingrese una cantidad mayor a 0.');
      return;
    }

    const exists = selectedProducts.some(
      (p) =>
        (p.id_producto_detalle > 0 && p.id_producto_detalle === selectedProductToAdd.ID_PRODUCTO_DETALLE) ||
        (p.id_producto_intermedio > 0 && p.id_producto_intermedio === selectedProductToAdd.ID_PRODUCTO_INTERMEDIO)
    );

    if (exists) {
      showAlert.warning('Producto duplicado', 'Este producto ya fue agregado a la lista.');
      return;
    }

    const newRow: SelectedProductRow = {
      id_producto_detalle: selectedProductToAdd.ID_PRODUCTO_DETALLE || 0,
      id_producto_intermedio: selectedProductToAdd.ID_PRODUCTO_INTERMEDIO || 0,
      id_unidad: 0,
      producto: selectedProductToAdd.PRODUCTO || selectedProductToAdd.GRUPO || '',
      grupo: selectedProductToAdd.GRUPO || '',
      presentacion: selectedProductToAdd.PRESENTACION || selectedProductToAdd.UNIDAD_MEDIDA_A || '',
      unidad: selectedProductToAdd.UNIDAD_MEDIDA_A || selectedProductToAdd.UNIDAD_MEDIDA_E || '',
      stock: selectedProductToAdd.STOCK || 0,
      cantidad: qty,
      pedido_decimal: selectedProductToAdd.PEDIDO_DECIMAL,
    };

    setSelectedProducts((prev) => [...prev, newRow]);
    setSelectedProductToAdd(null);
    setCantidadToAdd('');
  };

  // Quitar producto de la lista
  const handleRemoveProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Modificar cantidad en la tabla
  const handleQuantityChange = (index: number, valStr: string) => {
    if (valStr === '') {
      setSelectedProducts((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, cantidad: '' } : item))
      );
      return;
    }

    const currentItem = selectedProducts[index];
    const isDecimalAllowed = Boolean(
      currentItem?.pedido_decimal === 1 ||
      currentItem?.pedido_decimal === true
    );

    if (!isDecimalAllowed) {
      const cleanVal = valStr.split('.')[0].split(',')[0];
      const numInt = parseInt(cleanVal, 10);
      if (isNaN(numInt) || numInt < 0) return;
      setSelectedProducts((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, cantidad: numInt } : item))
      );
      return;
    }

    const num = parseFloat(valStr);
    if (isNaN(num) || num < 0) return;

    setSelectedProducts((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, cantidad: num } : item))
    );
  };

  // Helper para mostrar alerta detallada de stock insuficiente con tabla de productos
  const showStockInsuficienteAlert = (
    message?: string,
    productos?: Array<{ producto: string; solicitado?: number; stock?: number; id_producto_detalle?: number }>
  ) => {
    if (!productos || productos.length === 0) {
      showAlert.warning('Stock Insuficiente', message || 'No hay stock disponible para completar la solicitud.');
      return;
    }

    const tableRows = productos
      .map(
        (p) => `
        <tr style="border-bottom: 1px solid var(--border-outline-variant, #e4e4e7);">
          <td style="padding: 8px 10px; text-align: left; font-weight: 800; font-size: 11px; text-transform: uppercase; color: var(--on-surface, #18181b);">
            ${p.producto || 'Producto'}
          </td>
          <td style="padding: 8px 10px; text-align: center; font-weight: 900; font-size: 11px; color: var(--primary, #9d0013);">
            ${p.solicitado ?? '-'}
          </td>
          <td style="padding: 8px 10px; text-align: center; font-weight: 900; font-size: 11px; color: #e11d48;">
            ${p.stock ?? 0}
          </td>
        </tr>
      `
      )
      .join('');

    MySwal.fire({
      icon: 'warning',
      iconColor: '#f59e0b',
      title: 'STOCK INSUFICIENTE',
      html: `
        <div style="text-align: left; margin-top: 6px;">
          <p style="font-size: 12px; font-weight: 700; margin-bottom: 12px; color: var(--on-surface-variant, #52525b); text-align: center;">
            ${message || 'Stock insuficiente en el almacén destino para los siguientes productos:'}
          </p>
          <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-outline-variant, #e4e4e7); border-radius: 14px; background: var(--surface, #ffffff);">
            <table style="width: 100%; border-collapse: collapse; font-family: inherit;">
              <thead>
                <tr style="background-color: var(--surface-variant, #f4f4f5); border-bottom: 1px solid var(--border-outline-variant, #e4e4e7);">
                  <th style="padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Producto</th>
                  <th style="padding: 8px 10px; text-align: center; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Solicitado</th>
                  <th style="padding: 8px 10px; text-align: center; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">Stock Disponible</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `,
      confirmButtonText: 'Entendido',
    });
  };

  // Guardar Solicitud
  const handleSave = async () => {
    if (!selectedSolicitante) {
      showAlert.warning('Falta Solicitante', 'Seleccione el almacén solicitante.');
      return;
    }
    if (!selectedDestino) {
      showAlert.warning('Falta Destino', 'Seleccione el almacén destino.');
      return;
    }
    if (!fechaEntrega || !fechaEntrega.isValid()) {
      showAlert.warning('Fecha inválida', 'Indique una fecha de entrega válida.');
      return;
    }
    if (selectedProducts.length === 0) {
      showAlert.warning('Sin productos', 'Debe agregar al menos un producto a la solicitud.');
      return;
    }

    // Validar cantidades mayores a 0
    for (const prod of selectedProducts) {
      const q = typeof prod.cantidad === 'number' ? prod.cantidad : parseFloat(String(prod.cantidad));
      if (!q || isNaN(q) || q <= 0) {
        showAlert.warning(
          'Cantidad inválida',
          `El producto "${prod.producto}" tiene una cantidad no válida.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingRequest) {
        // Editar existente
        const payload = {
          id_documento: editingRequest.ID_ALMACEN_SOLICITUD_DOCUMENTO,
          productos: selectedProducts.map((p) => ({
            id_producto_detalle: p.id_producto_detalle,
            id_producto_intermedio: p.id_producto_intermedio,
            cantidad: typeof p.cantidad === 'number' ? p.cantidad : parseFloat(String(p.cantidad)),
            producto: p.producto,
          })),
        };

        const res = await loadApiEditarSolicitud(payload);
        if (res.success) {
          showAlert.success('Solicitud Actualizada', res.message || 'La solicitud fue actualizada correctamente.');
          onSuccess();
          onClose();
        } else if (res.productos && Array.isArray(res.productos) && res.productos.length > 0) {
          showStockInsuficienteAlert(res.message, res.productos);
        } else {
          showAlert.error('Error al actualizar', res.message || 'No se pudo actualizar la solicitud.');
        }
      } else {
        // Crear nueva
        const payload = {
          id_almacen_solicitante: selectedSolicitante.ID_PLANTA_ALMACEN,
          id_almacen_destino: selectedDestino.ID_PLANTA_ALMACEN,
          fecha_entrega: fechaEntrega.format('YYYY-MM-DD'),
          productos: selectedProducts.map((p) => ({
            id_producto_detalle: p.id_producto_detalle,
            id_producto_intermedio: p.id_producto_intermedio,
            id_unidad: p.id_unidad,
            cantidad: typeof p.cantidad === 'number' ? p.cantidad : parseFloat(String(p.cantidad)),
            producto: p.producto,
          })),
        };

        const res = await loadApiCrearSolicitud(payload);
        if (res.success) {
          showAlert.success('Solicitud Registrada', res.message || 'La solicitud fue creada exitosamente.');
          onSuccess();
          onClose();
        } else if (res.productos && Array.isArray(res.productos) && res.productos.length > 0) {
          showStockInsuficienteAlert(res.message, res.productos);
        } else {
          showAlert.error('Error al registrar', res.message || 'No se pudo crear la solicitud.');
        }
      }
    } catch (error) {
      console.error('Error al guardar solicitud:', error);
      showAlert.error('Error', 'Ocurrió un fallo al procesar la solicitud.');
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
              <span className="material-symbols-outlined text-xl">
                {editingRequest ? 'edit_note' : 'add_shopping_cart'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                GESTIÓN DE PEDIDOS ENTRE ALMACENES
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {editingRequest
                  ? `EDITAR SOLICITUD N° ${editingRequest.ID_ALMACEN_SOLICITUD_DOCUMENTO}`
                  : 'REGISTRAR NUEVA SOLICITUD'}
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
        <div className="space-y-4 font-body">
          {/* SECCIÓN 1: Datos de Almacén y Fecha */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">domain</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                INFORMACIÓN DE TRASPASO
              </span>
            </div>

            <Grid container spacing={2}>
              {/* Almacén Solicitante */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Almacén Solicitante
                  </label>
                  <Autocomplete
                    options={solicitantes}
                    getOptionLabel={(option) => option.DESCRICION || ''}
                    value={selectedSolicitante}
                    disabled={Boolean(editingRequest)}
                    onChange={(_, newValue) => {
                      setSelectedSolicitante(newValue);
                      setSelectedDestino(
                        newValue && newValue.DESTINOS.length > 0 ? newValue.DESTINOS[0] : null
                      );
                      setSelectedProducts([]);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                    }
                    fullWidth
                    disableClearable
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '15px',
                        backgroundColor: 'var(--input-bg, var(--surface))',
                        color: 'var(--on-surface)',
                      },
                    }}
                  />
                </div>
              </Grid>

              {/* Almacén Destino */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Almacén Destino (Proveedor)
                  </label>
                  <Autocomplete
                    options={destinosDisponibles}
                    getOptionLabel={(option) => option.DESCRICION || ''}
                    value={selectedDestino}
                    disabled={Boolean(editingRequest)}
                    onChange={(_, newValue) => {
                      setSelectedDestino(newValue);
                      setSelectedProducts([]);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                    }
                    fullWidth
                    disableClearable
                    renderInput={(params) => (
                      <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '15px',
                        backgroundColor: 'var(--input-bg, var(--surface))',
                        color: 'var(--on-surface)',
                      },
                    }}
                  />
                </div>
              </Grid>

              {/* Fecha a Entregar */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Fecha a Entregar
                  </label>
                  <DatePicker
                    value={fechaEntrega}
                    onChange={(newValue) => setFechaEntrega(newValue)}
                    format="DD/MM/YYYY"
                    disabled={Boolean(editingRequest)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '15px',
                            backgroundColor: 'var(--input-bg, var(--surface))',
                            color: 'var(--on-surface)',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Grid>
            </Grid>
          </div>

          {/* SECCIÓN 2: Selección y Búsqueda de Productos */}
          {!editingRequest && (
            <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/40 pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                    CATÁLOGO Y STOCK DISPONIBLE
                  </span>
                </div>
                {/* Filtro de Tipo */}
                <div className="flex items-center gap-1.5">
                  {(['all', 'insumo', 'intermedio'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoFiltro(t)}
                      className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${tipoFiltro === t
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-outline-variant'
                        }`}
                    >
                      {t === 'all' ? 'TODOS' : t === 'insumo' ? 'INSUMOS' : 'INTERMEDIOS'}
                    </button>
                  ))}
                </div>
              </div>

              <Grid container spacing={2} alignItems="flex-end">
                {/* Selector de Producto con Stock */}
                <Grid size={{ xs: 12, sm: 7 }}>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Seleccionar Producto / Insumo
                    </label>
                    <Autocomplete
                      options={catalogoProductos}
                      getOptionLabel={(option) =>
                        `${option.PRODUCTO || option.GRUPO} (Stock: ${option.STOCK} ${option.UNIDAD_MEDIDA_A || option.UNIDAD_MEDIDA_E || ''})`
                      }
                      value={selectedProductToAdd}
                      loading={loadingProductos}
                      onChange={(_, newValue) => {
                        setSelectedProductToAdd(newValue);
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.ID_PRODUCTO_DETALLE === value?.ID_PRODUCTO_DETALLE &&
                        option.ID_PRODUCTO_INTERMEDIO === value?.ID_PRODUCTO_INTERMEDIO
                      }
                      fullWidth
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          size="small"
                          placeholder={
                            loadingProductos
                              ? 'Cargando productos...'
                              : 'BUSCAR PRODUCTO O INSUMO...'
                          }
                        />
                      )}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '15px',
                          backgroundColor: 'var(--input-bg, var(--surface))',
                          color: 'var(--on-surface)',
                        },
                      }}
                    />
                  </div>
                </Grid>

                {/* Cantidad a Solicitar */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={Boolean(selectedProductToAdd?.PEDIDO_DECIMAL === 1 || selectedProductToAdd?.PEDIDO_DECIMAL === true) ? 'any' : '1'}
                      value={cantidadToAdd}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        const isDecimalAllowed = Boolean(selectedProductToAdd?.PEDIDO_DECIMAL === 1 || selectedProductToAdd?.PEDIDO_DECIMAL === true);
                        if (!isDecimalAllowed && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isDecimalAllowed = Boolean(selectedProductToAdd?.PEDIDO_DECIMAL === 1 || selectedProductToAdd?.PEDIDO_DECIMAL === true);
                        if (val === '') {
                          setCantidadToAdd('');
                        } else {
                          if (!isDecimalAllowed) {
                            const cleanVal = val.split('.')[0].split(',')[0];
                            const parsed = parseInt(cleanVal, 10);
                            setCantidadToAdd(isNaN(parsed) ? '' : parsed);
                          } else {
                            const parsed = parseFloat(val);
                            setCantidadToAdd(isNaN(parsed) ? '' : parsed);
                          }
                        }
                      }}
                      placeholder={Boolean(selectedProductToAdd?.PEDIDO_DECIMAL === 1 || selectedProductToAdd?.PEDIDO_DECIMAL === true) ? '0.00' : '0'}
                      className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </Grid>

                {/* Botón Agregar */}
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="add"
                    onClick={handleAddProduct}
                    className="w-full !h-10 shadow-md shadow-primary/20"
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
            </div>
          )}

          {/* SECCIÓN 3: Lista de Productos en la Solicitud */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  PRODUCTOS A SOLICITAR ({selectedProducts.length})
                </span>
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/70 border-b border-outline-variant/60">
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">N°</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">Producto / Insumo</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Stock Destino</th>
                    <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center w-36">Cant. Solicitada</th>
                    {!editingRequest && (
                      <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center w-16">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {selectedProducts.length > 0 ? (
                    selectedProducts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-variant/20 transition-colors">
                        <td className="px-3 py-2 text-xs font-black text-primary">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <p className="text-xs font-black text-on-surface leading-tight">{item.producto}</p>
                          {item.presentacion && (
                            <p className="text-[10px] text-zinc-400 font-bold">{item.presentacion}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${item.stock > 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                          >
                            {item.stock} {item.unidad}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step={Boolean(item.pedido_decimal === 1 || item.pedido_decimal === true) ? 'any' : '1'}
                            value={item.cantidad}
                            onWheel={(e) => (e.target as HTMLElement).blur()}
                            onKeyDown={(e) => {
                              const isDecimalAllowed = Boolean(item.pedido_decimal === 1 || item.pedido_decimal === true);
                              if (!isDecimalAllowed && (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E')) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className="w-24 h-8 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder={Boolean(item.pedido_decimal === 1 || item.pedido_decimal === true) ? '0.00' : '0'}
                          />
                        </td>
                        {!editingRequest && (
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(idx)}
                              title="Eliminar ítem"
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10 hover:bg-red-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer mx-auto"
                            >
                              <span className="material-symbols-outlined text-[14px] sm:text-base">delete</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={editingRequest ? 4 : 5}
                        className="py-8 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest"
                      >
                        No hay productos agregados a la lista
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
          justify: 'space-between',
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
          disabled={isSubmitting || selectedProducts.length === 0}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSubmitting
            ? 'Guardando...'
            : editingRequest
              ? 'Guardar Modificaciones'
              : 'Registrar Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNuevaSolicitud;

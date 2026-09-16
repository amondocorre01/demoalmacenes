/**
 * ModalConvertirProductos.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal para el registro y consulta de conversión/depreciación de productos.
 * Permite transformar productos (materia prima) en productos procesados
 * afectando el inventario en tiempo real y consultar el historial de transformaciones.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  useMediaQuery,
  useTheme,
  Zoom,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  AlmacenItem,
  ProductoAlmacenItem,
  ProductoEspecialItem,
  ProductoDepreciadoItem,
  useInventarioAlmacenesServices,
} from '../services/useInventarioAlmacen';

interface ModalConvertirProductosProps {
  open: boolean;
  onClose: () => void;
  almacenes: AlmacenItem[];
  currentAlmacen: AlmacenItem | null;
  onSuccess: () => void;
}

export const ModalConvertirProductos: React.FC<ModalConvertirProductosProps> = ({
  open,
  onClose,
  almacenes,
  currentAlmacen,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loadApiGetProductosAlmacen,
    loadApiGetProductosEspeciales,
    loadApiDepreciarProducto,
    loadApiGetProductosDepreciados,
  } = useInventarioAlmacenesServices();

  const [activeTab, setActiveTab] = useState(0);

  // Tab 0 Form State
  const [selectedAlmacen, setSelectedAlmacen] = useState<AlmacenItem | null>(currentAlmacen);
  const [productosSalida, setProductosSalida] = useState<ProductoAlmacenItem[]>([]);
  const [productosIngreso, setProductosIngreso] = useState<ProductoEspecialItem[]>([]);
  const [selectedSaliente, setSelectedSaliente] = useState<ProductoAlmacenItem | null>(null);
  const [qtySalida, setQtySalida] = useState<string>('');
  const [selectedIngreso, setSelectedIngreso] = useState<ProductoEspecialItem | null>(null);
  const [qtyIngreso, setQtyIngreso] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // Tab 1 Historial State
  const [historyAlmacen, setHistoryAlmacen] = useState<AlmacenItem | null>(currentAlmacen);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [historyList, setHistoryList] = useState<ProductoDepreciadoItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Sincronizar almacén inicial
  useEffect(() => {
    if (open) {
      if (currentAlmacen) {
        setSelectedAlmacen(currentAlmacen);
        setHistoryAlmacen(currentAlmacen);
      } else if (almacenes.length > 0) {
        setSelectedAlmacen(almacenes[0]);
        setHistoryAlmacen(almacenes[0]);
      }
    }
  }, [open, currentAlmacen, almacenes]);

  // Cargar productos de salida y especiales al cambiar de almacén
  useEffect(() => {
    const loadProducts = async () => {
      if (!open || !selectedAlmacen?.ID_PLANTA_ALMACEN) return;
      setIsLoadingCatalogs(true);
      try {
        const [salidaRes, ingresoRes] = await Promise.all([
          loadApiGetProductosAlmacen(selectedAlmacen.ID_PLANTA_ALMACEN),
          loadApiGetProductosEspeciales(selectedAlmacen.ID_PLANTA_ALMACEN),
        ]);

        if (salidaRes && salidaRes.success && Array.isArray(salidaRes.datos)) {
          setProductosSalida(salidaRes.datos);
        } else if (Array.isArray(salidaRes)) {
          setProductosSalida(salidaRes);
        } else {
          setProductosSalida([]);
        }

        if (ingresoRes && ingresoRes.success && Array.isArray(ingresoRes.datos)) {
          setProductosIngreso(ingresoRes.datos);
        } else if (Array.isArray(ingresoRes)) {
          setProductosIngreso(ingresoRes);
        } else {
          setProductosIngreso([]);
        }
      } catch {
        setProductosSalida([]);
        setProductosIngreso([]);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadProducts();
    setSelectedSaliente(null);
    setSelectedIngreso(null);
    setQtySalida('');
    setQtyIngreso('');
  }, [open, selectedAlmacen]);

  // Cargar historial al presionar Buscar / Consultar
  const fetchHistory = async () => {
    const targetAlmacenId = historyAlmacen?.ID_PLANTA_ALMACEN || 0;
    if (!targetAlmacenId) {
      showAlert.error('Selección Requerida', 'Seleccione un almacén para consultar el historial.');
      return;
    }

    setIsLoadingHistory(true);
    setHasSearched(true);
    try {
      const fechaIniStr = startDate && startDate.isValid() ? startDate.format('YYYY-MM-DD') : '';
      const fechaFinStr = endDate && endDate.isValid() ? endDate.format('YYYY-MM-DD') : '';

      const res = await loadApiGetProductosDepreciados(targetAlmacenId, fechaIniStr, fechaFinStr);
      if (res && res.success && Array.isArray(res.datos)) {
        setHistoryList(res.datos);
      } else if (Array.isArray(res)) {
        setHistoryList(res);
      } else {
        setHistoryList([]);
      }
    } catch {
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === 1 && historyAlmacen?.ID_PLANTA_ALMACEN) {
      fetchHistory();
    }
  }, [open, activeTab]);

  const handleConfirmConversion = async () => {
    if (!selectedAlmacen?.ID_PLANTA_ALMACEN) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar un almacén para realizar la conversión.');
      return;
    }
    if (!selectedSaliente?.ID_PRODUCTO) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar el producto saliente (materia prima).');
      return;
    }
    const parsedQtySalida = parseFloat(qtySalida);
    if (!qtySalida || isNaN(parsedQtySalida) || parsedQtySalida <= 0) {
      showAlert.error('Cantidad Inválida', 'La cantidad de salida a descontar debe ser mayor a 0.');
      return;
    }
    if (!selectedIngreso?.ID_PRODUCTO) {
      showAlert.error('Datos Incompletos', 'Debe seleccionar el producto de ingreso.');
      return;
    }
    const parsedQtyIngreso = parseFloat(qtyIngreso);
    if (!qtyIngreso || isNaN(parsedQtyIngreso) || parsedQtyIngreso <= 0) {
      showAlert.error('Cantidad Inválida', 'La cantidad de ingreso a registrar debe ser mayor a 0.');
      return;
    }
    if (selectedSaliente.ID_PRODUCTO === selectedIngreso.ID_PRODUCTO) {
      showAlert.error('Conflicto de Productos', 'El producto de salida no puede ser igual al de ingreso.');
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Conversión?',
      `Se descontarán ${parsedQtySalida} de ${selectedSaliente.PRODUCTO} e ingresarán ${parsedQtyIngreso} de ${selectedIngreso.NOMBRE}.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await loadApiDepreciarProducto(selectedAlmacen.ID_PLANTA_ALMACEN, {
        id_producto_salida: selectedSaliente.ID_PRODUCTO,
        id_producto_ingreso: selectedIngreso.ID_PRODUCTO,
        cantidad_salida: parsedQtySalida,
        cantidad_ingreso: parsedQtyIngreso,
      });

      if (res && res.success) {
        showAlert.success(
          'Conversión Registrada',
          res.message || 'La transformación de productos se completó con éxito.'
        );
        setSelectedSaliente(null);
        setSelectedIngreso(null);
        setQtySalida('');
        setQtyIngreso('');
        onSuccess();
        setActiveTab(1);
        setHistoryAlmacen(selectedAlmacen);
      } else {
        showAlert.error('Error al registrar', res?.message || 'No se pudo registrar la conversión.');
      }
    } catch {
      // El error ya es procesado por handleApiError en el servicio
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
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
              <span className="material-symbols-outlined text-xl">published_with_changes</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                OPERACIONES DE ALMACÉN
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                CONVERSIÓN DE PRODUCTOS
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

      {/* ── Selector de Pestañas ── */}
      <Box
        sx={{
          borderBottom: '1px solid var(--border-outline-variant, #e4e4e7)',
          bgcolor: 'var(--surface-variant, #fafafa)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              height: 3,
              bgcolor: 'var(--primary, #9d0013)',
            },
            '& .MuiTab-root': {
              minHeight: 40,
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.08em',
              py: 0.5,
              textTransform: 'uppercase',
              color: 'var(--on-surface-variant, #71717a)',
              '&.Mui-selected': {
                color: 'var(--primary, #9d0013)',
              },
            },
          }}
        >
          <Tab
            label="Convertir Productos"
            icon={<span className="material-symbols-outlined text-base">shuffle</span>}
            iconPosition="start"
          />
          <Tab
            label="Historial de Conversiones"
            icon={<span className="material-symbols-outlined text-base">history</span>}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* ── Cuerpo del Modal ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'var(--surface, #ffffff)',
          maxHeight: '74vh',
          overflowY: 'auto',
        }}
      >
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Almacén Selector */}
            <div className="p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-1.5 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-1.5">
                <span className="material-symbols-outlined text-base">store</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                  ALMACÉN DE OPERACIÓN
                </span>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                  Seleccione el Almacén <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={almacenes}
                  getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
                  value={selectedAlmacen}
                  onChange={(_, newValue) => setSelectedAlmacen(newValue)}
                  isOptionEqualToValue={(opt, val) =>
                    opt.ID_PLANTA_ALMACEN === val?.ID_PLANTA_ALMACEN
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
                      placeholder="SELECCIONAR ALMACÉN..."
                      size="small"
                    />
                  )}
                />
              </div>
            </div>

            {/* Grid 2 Columnas: Salida vs Ingreso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta Producto Saliente */}
              <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 border-b border-rose-200/50 pb-1.5">
                    <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs">remove</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                      PRODUCTO SALIENTE (Materia Prima)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                      Producto a Descontar <span className="text-primary">*</span>
                    </label>
                    <Autocomplete
                      loading={isLoadingCatalogs}
                      options={productosSalida}
                      getOptionLabel={(option) => option.PRODUCTO || ''}
                      value={selectedSaliente}
                      onChange={(_, newValue) => setSelectedSaliente(newValue)}
                      isOptionEqualToValue={(opt, val) =>
                        opt.ID_PRODUCTO === val?.ID_PRODUCTO &&
                        opt.ID_PRODUCTO_INTERMEDIO === val?.ID_PRODUCTO_INTERMEDIO
                      }
                      fullWidth
                      noOptionsText={isLoadingCatalogs ? 'Cargando productos...' : 'No hay productos disponibles'}
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
                          placeholder="BUSCAR PRODUCTO SALIENTE..."
                          size="small"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Cantidad de Salida (A Descontar) <span className="text-primary">*</span>
                  </label>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={qtySalida}
                    onChange={(e) => setQtySalida(e.target.value)}
                    placeholder="0.00"
                    slotProps={{
                      htmlInput: { min: 0, step: 'any' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '15px',
                        backgroundColor: 'var(--input-bg, var(--surface))',
                        color: 'var(--on-surface)',
                        '& input': {
                          fontWeight: '900',
                          textAlign: 'center',
                          color: '#e11d48',
                          fontSize: '1.1rem',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Tarjeta Producto Ingreso */}
              <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 border-b border-emerald-200/50 pb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs">add</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                      PRODUCTO ENTRANTE (Procesado / Pulpa)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                      Producto a Ingresar <span className="text-primary">*</span>
                    </label>
                    <Autocomplete
                      loading={isLoadingCatalogs}
                      options={productosIngreso}
                      getOptionLabel={(option) =>
                        option.NOMBRE
                          ? `${option.NOMBRE} ${option.UNIDAD_MEDIDA ? `(${option.UNIDAD_MEDIDA})` : ''}`
                          : ''
                      }
                      value={selectedIngreso}
                      onChange={(_, newValue) => setSelectedIngreso(newValue)}
                      isOptionEqualToValue={(opt, val) => opt.ID_PRODUCTO === val?.ID_PRODUCTO}
                      fullWidth
                      noOptionsText={isLoadingCatalogs ? 'Cargando productos...' : 'No hay productos especiales'}
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
                          placeholder="BUSCAR PRODUCTO ESPECIAL..."
                          size="small"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Cantidad de Ingreso (A Registrar) <span className="text-primary">*</span>
                  </label>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={qtyIngreso}
                    onChange={(e) => setQtyIngreso(e.target.value)}
                    placeholder="0.00"
                    slotProps={{
                      htmlInput: { min: 0, step: 'any' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '15px',
                        backgroundColor: 'var(--input-bg, var(--surface))',
                        color: 'var(--on-surface)',
                        '& input': {
                          fontWeight: '900',
                          textAlign: 'center',
                          color: '#059669',
                          fontSize: '1.1rem',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Panel de Filtros con Botón Buscar */}
            <div className="p-3 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Almacén
                  </label>
                  <Autocomplete
                    options={almacenes}
                    getOptionLabel={(option) => option.DESCRICION || option.nombre || ''}
                    value={historyAlmacen}
                    onChange={(_, newValue) => setHistoryAlmacen(newValue)}
                    isOptionEqualToValue={(opt, val) =>
                      opt.ID_PLANTA_ALMACEN === val?.ID_PLANTA_ALMACEN
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
                        placeholder="SELECCIONAR ALMACÉN..."
                        size="small"
                      />
                    )}
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Fecha Inicio
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
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

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Fecha Fin
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
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

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={fetchHistory}
                    title="Buscar Historial"
                    className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">search</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de Historial */}
            <div className="bg-surface rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/50 text-[9px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60">
                      <th className="px-4 py-3">Almacén</th>
                      <th className="px-4 py-3">Producto Saliente</th>
                      <th className="px-4 py-3 text-center">Cant. Salida</th>
                      <th className="px-4 py-3">Producto Entrante</th>
                      <th className="px-4 py-3 text-center">Cant. Ingreso</th>
                      <th className="px-4 py-3 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {isLoadingHistory ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl animate-spin text-primary">
                            progress_activity
                          </span>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-2">
                            Cargando historial de conversiones...
                          </p>
                        </td>
                      </tr>
                    ) : historyList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-3xl opacity-40 mb-1">
                            history_toggle_off
                          </span>
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            {hasSearched
                              ? 'No se encontraron registros en el rango seleccionado.'
                              : 'Seleccione filtros y presione Buscar para consultar registros.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      historyList.map((item, idx) => (
                        <tr
                          key={item.ID_PLANTA_PRODUCTO_CONVERCION || idx}
                          className="hover:bg-surface-variant/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-bold text-xs text-on-surface uppercase">
                            {item.ALMACEN || selectedAlmacen?.DESCRICION || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-xs font-black text-on-surface uppercase leading-none">
                              {item.PRODUCTO_SALIDA || '-'}
                            </p>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase">
                              {item.UNIDAD_MEDIDA_SALIDA || ''}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                              -{Number(item.CANTIDAD_SALIDA || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-xs font-black text-on-surface uppercase leading-none">
                              {item.PRODUCTO_INGRESO || '-'}
                            </p>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase">
                              {item.UNIDAD_MEDIDA_INGRESO || ''}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                              +{Number(item.CANTIDAD_INGRESO || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-xs text-on-surface-variant whitespace-nowrap">
                            {formatDate(item.FECHA_REGISTRO)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
          Cerrar
        </Button>
        {activeTab === 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmConversion}
            loading={isSubmitting}
            icon="published_with_changes"
            className="!h-9 !px-8 shadow-lg shadow-primary/20"
          >
            Confirmar Conversión
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalConvertirProductos;

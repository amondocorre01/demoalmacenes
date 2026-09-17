import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom,
  Autocomplete,
  TextField,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../../components/common/Button';
import LoadingOverlay from '../../../../components/common/LoadingOverlay';
import { showAlert } from '../../../../config/alerts';
import {
  AlmacenItem,
  ProductoVencidoItem,
  useDesperdicioInsumosServices,
} from '../services/useDesperdicioInsumos';

interface ModalDesperdicioVencidosProps {
  open: boolean;
  onClose: () => void;
  warehouses: AlmacenItem[];
  onSuccess: () => void;
}

const ALL_WAREHOUSES_OPTION: AlmacenItem = {
  ID_PLANTA_ALMACEN: 0,
  DESCRICION: 'TODOS LOS ALMACENES',
};

export const ModalDesperdicioVencidos: React.FC<ModalDesperdicioVencidosProps> = ({
  open,
  onClose,
  warehouses,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiGetProductosVencidos, loadApiDesperdiciarProductosVencidos } =
    useDesperdicioInsumosServices();

  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem>(ALL_WAREHOUSES_OPTION);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [productosVencidos, setProductosVencidos] = useState<ProductoVencidoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Opciones de almacén agregando "TODOS" al inicio
  const warehouseOptions = useMemo(() => {
    return [ALL_WAREHOUSES_OPTION, ...warehouses.filter((w) => w.ID_PLANTA_ALMACEN !== 0)];
  }, [warehouses]);

  // Limpiar estado al abrir
  useEffect(() => {
    if (open) {
      setSelectedWarehouse(ALL_WAREHOUSES_OPTION);
      setSelectedDate(dayjs());
      setProductosVencidos([]);
      setHasSearched(false);
    }
  }, [open]);

  // Consultar productos vencidos
  const handleSearchProductosVencidos = async () => {
    if (!selectedDate) {
      showAlert.error('Fecha requerida', 'Por favor seleccione una fecha válida.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    const fechaStr = selectedDate.format('YYYY-MM-DD');
    const almacenesParam =
      selectedWarehouse.ID_PLANTA_ALMACEN === 0
        ? ''
        : String(selectedWarehouse.ID_PLANTA_ALMACEN);

    const items = await loadApiGetProductosVencidos({
      almacenes: almacenesParam,
      fecha: fechaStr,
    });

    setProductosVencidos(items || []);
    setIsSearching(false);
  };

  // Calcular total monetario acumulado
  const totalMontoVencidos = useMemo(() => {
    return productosVencidos.reduce((acc, curr) => {
      const precio = Number(curr.PRECIO || curr.PRECIO_PRODUCTO || 0);
      const cant = Number(curr.CANTIDAD || 0);
      const tot = Number(curr.TOTAL || precio * cant);
      return acc + tot;
    }, 0);
  }, [productosVencidos]);

  // Procesar registro de desperdicios
  const handleProcesarDesperdicio = async () => {
    if (productosVencidos.length === 0) {
      showAlert.error('Sin productos', 'No hay productos vencidos listados para procesar.');
      return;
    }

    if (!selectedDate) {
      showAlert.error('Fecha requerida', 'Seleccione una fecha válida.');
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Confirmar Desperdicio de Insumos?',
      `Se registrarán ${productosVencidos.length} productos vencidos como desperdicio en el inventario.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    const fechaStr = selectedDate.format('YYYY-MM-DD');

    // Array de IDs de almacén
    const almacenesArr: number[] =
      selectedWarehouse.ID_PLANTA_ALMACEN === 0
        ? []
        : [Number(selectedWarehouse.ID_PLANTA_ALMACEN)];

    const res = await loadApiDesperdiciarProductosVencidos({
      almacenes: almacenesArr,
      fecha: fechaStr,
    });

    setIsSubmitting(false);

    if (res.success) {
      showAlert.success(
        'Desperdicio Registrado',
        res.message || 'Se procesaron los productos vencidos exitosamente.'
      );
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
          px: 3,
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
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                DESPERDICIAR PRODUCTOS VENCIDOS
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
          {/* Tarjeta de Parámetros de Consulta */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">

            <Grid container spacing={1.5} alignItems="flex-end">
              {/* Almacén */}
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <div className="w-full space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Almacén
                  </label>
                  <Autocomplete
                    options={warehouseOptions}
                    getOptionLabel={(option) =>
                      option.DESCRICION || option.nombre || String(option.ID_PLANTA_ALMACEN)
                    }
                    value={selectedWarehouse}
                    onChange={(_, newValue) => {
                      if (newValue) setSelectedWarehouse(newValue);
                      setProductosVencidos([]);
                      setHasSearched(false);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                    }
                    fullWidth
                    disableClearable
                    noOptionsText="No hay almacenes"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
              </Grid>

              {/* Fecha */}
              <Grid size={{ xs: 12, sm: 5, md: 5 }}>
                <div className="w-full space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                    Fecha Vencimiento
                  </label>
                  <DatePicker
                    format="DD-MM-YYYY"
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      setProductosVencidos([]);
                      setHasSearched(false);
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        placeholder: 'DD-MM-AAAA',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
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
              </Grid>

              {/* Botón Buscar */}
              <Grid size={{ xs: 12, sm: 1, md: 1 }}>
                <div className="w-full space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-transparent select-none ml-1 hidden sm:block">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={handleSearchProductosVencidos}
                    disabled={isSearching}
                    title="Buscar Desperdicios"
                    className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">
                      {isSearching ? 'progress_activity' : 'search'}
                    </span>
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          {/* Lista / Tabla de Productos Vencidos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Productos Vencidos Encontrados ({productosVencidos.length})
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[320px] custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 dark:bg-zinc-850/80 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10">
                      <td className="w-1 pl-3 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        N°
                      </td>
                      <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        Almacén
                      </td>
                      <td className="w-48 max-w-[200px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Producto / Detalle
                      </td>
                      <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                        Cantidad
                      </td>
                      <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        Vencimiento
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {productosVencidos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                          <span className="material-symbols-outlined text-4xl block mb-1 text-zinc-300 dark:text-zinc-600">
                            inventory_2
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {hasSearched
                              ? 'No se encontraron productos vencidos para los criterios seleccionados'
                              : 'Realice una búsqueda para consultar productos vencidos'}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      productosVencidos.map((prod, idx) => {
                        const productName = prod.PRODUCTO || prod.NOMBRE_PRODUCTO || '-';
                        const detailName = prod.NOMBRE_DETALLE || prod.DETALLE || '';
                        const hasDetail =
                          detailName &&
                          detailName.toUpperCase() !== productName.toUpperCase();

                        // Formatear fecha a DD-MM-YYYY
                        const rawDate = prod.FECHA_VENCIMIENTO ? prod.FECHA_VENCIMIENTO.split('T')[0] : '';
                        let formattedDate = '-';
                        if (rawDate) {
                          const parts = rawDate.split('-');
                          if (parts.length === 3) {
                            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                          } else {
                            formattedDate = rawDate;
                          }
                        }

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="w-1 pl-3 pr-2 py-1.5 font-black text-xs text-primary whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="w-1 px-3 py-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap">
                              {prod.ALMACEN || prod.DESCRICION || '-'}
                            </td>
                            <td className="w-48 max-w-[200px] px-3 py-1.5 uppercase">
                              <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate" title={detailName || productName}>
                                {detailName || productName}
                              </span>
                              {hasDetail && (
                                <span className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight truncate" title={productName}>
                                  {productName}
                                </span>
                              )}
                            </td>
                            <td className="w-1 px-3 py-1.5 text-center whitespace-nowrap">
                              <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-[10px]">
                                {Number(prod.CANTIDAD || 0).toLocaleString('es-BO', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="block text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[9px] leading-tight">
                                {prod.UNIDAD_MEDIDA || prod.MEDIDA || '-'}
                              </span>
                            </td>
                            <td className="w-1 px-3 py-1.5 font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                              {formattedDate}
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
          justify: 'space-between',
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
          onClick={handleProcesarDesperdicio}
          disabled={productosVencidos.length === 0 || isSubmitting}
          icon={isSubmitting ? 'progress_activity' : 'delete_sweep'}
          className="!h-9 !px-8 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Procesando...'
            : `Procesar Desperdicio (${productosVencidos.length})`}
        </Button>
      </DialogActions>

      {/* Componente Centralizado LoadingOverlay */}
      <LoadingOverlay show={isSearching} message="Buscando productos vencidos..." />
      <LoadingOverlay show={isSubmitting} message="Procesando registro de desperdicio..." />
    </Dialog>
  );
};

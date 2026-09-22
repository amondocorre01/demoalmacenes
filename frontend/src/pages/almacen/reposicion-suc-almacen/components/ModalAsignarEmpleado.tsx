import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  VentaReposicionItem,
  EmpleadoItem,
  useReposicionSucAlmacenProductosServices,
} from '../services/useReposicionSucAlmacenProd';

interface ModalAsignarEmpleadoProps {
  open: boolean;
  onClose: () => void;
  venta: VentaReposicionItem | null;
  empleados: EmpleadoItem[];
  onSuccess: (idVenta: number | string, nuevoEmpleado: EmpleadoItem) => void;
}

export const ModalAsignarEmpleado: React.FC<ModalAsignarEmpleadoProps> = ({
  open,
  onClose,
  venta,
  empleados,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiUpdateVentas } = useReposicionSucAlmacenProductosServices();

  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && venta) {
      const currentEmpId = venta.ID_EMPLEADO_ASUMIDO || venta.id_empleado;
      if (currentEmpId && empleados.length > 0) {
        const found = empleados.find((e) => Number(e.ID_EMPLEADO) === Number(currentEmpId));
        setSelectedEmpleado(found || null);
      } else if (venta.NOMBRE_COMPLETO || venta.EMPLEADO || venta.EMPLEADO_ASUMIDO) {
        const targetName = (
          venta.NOMBRE_COMPLETO ||
          venta.EMPLEADO ||
          venta.EMPLEADO_ASUMIDO ||
          ''
        ).toLowerCase();
        const found = empleados.find(
          (e) => (e.NOMBRE_COMPLETO || '').toLowerCase() === targetName
        );
        setSelectedEmpleado(found || null);
      } else {
        setSelectedEmpleado(null);
      }
    } else {
      setSelectedEmpleado(null);
    }
  }, [open, venta, empleados]);

  const handleSave = async () => {
    if (!venta) return;

    if (!selectedEmpleado) {
      showAlert.error('Selección Requerida', 'Por favor seleccione un empleado responsable.');
      return;
    }

    const idVenta =
      venta.ID_VENTAS_REPOSICION_SUCURSAL ||
      venta.ID_VENTA_REPOSICION ||
      venta.id_venta_reposicion ||
      venta.ID_VENTA;

    if (!idVenta) {
      showAlert.error('Error', 'No se pudo identificar el registro de la venta.');
      return;
    }

    setIsSaving(true);
    const result = await loadApiUpdateVentas([
      {
        id_venta_reposicion: idVenta,
        id_empleado: Number(selectedEmpleado.ID_EMPLEADO),
      },
    ]);
    setIsSaving(false);

    if (result.success) {
      showAlert.success(
        'Empleado Asignado',
        `Se asignó correctamente a ${selectedEmpleado.NOMBRE_COMPLETO}.`
      );
      onSuccess(idVenta, selectedEmpleado);
      onClose();
    } else {
      showAlert.error('Error', result.message || 'No se pudo guardar la asignación.');
    }
  };

  if (!venta) return null;

  const sucursalName =
    venta.NOMBRE_LISTA_PRECIOS || venta.SUCURSAL || venta.CANAL_VENTA || 'Sucursal';
  const totalMonto = Number(venta.TOTAL ?? venta.TOTAL_VENTA ?? 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
              <span className="material-symbols-outlined text-xl">assignment_ind</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                ASIGNACIÓN DE RESPONSABLE
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                ASIGNAR EMPLEADO A LA VENTA
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
          {/* Tarjeta Informativa de la Venta */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800/80 pb-2">
              <span className="material-symbols-outlined text-lg">info</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                DATOS DE LA VENTA / REPOSICIÓN
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Sucursal / Canal
                </span>
                <span className="font-bold text-on-surface uppercase">{sucursalName}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 block">
                  Monto Total
                </span>
                <span className="font-black text-primary text-sm">
                  Bs. {totalMonto.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Selección de Empleado */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800/80 pb-2">
              <span className="material-symbols-outlined text-lg">badge</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                SELECCIONAR EMPLEADO RESPONSABLE
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Empleado
              </label>
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) =>
                  `${option.NOMBRE_COMPLETO || ''}${option.CI ? ` (CI: ${option.CI})` : ''}`
                }
                value={selectedEmpleado}
                onChange={(_, newValue) => setSelectedEmpleado(newValue)}
                isOptionEqualToValue={(option, value) =>
                  Number(option.ID_EMPLEADO) === Number(value?.ID_EMPLEADO)
                }
                fullWidth
                noOptionsText="No hay empleados disponibles"
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
                    placeholder="BUSCAR Y SELECCIONAR EMPLEADO..."
                  />
                )}
              />
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
          disabled={isSaving || !selectedEmpleado}
          icon={isSaving ? undefined : 'save'}
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={16} color="inherit" />
              <span>Guardando...</span>
            </div>
          ) : (
            'Guardar Asignación'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

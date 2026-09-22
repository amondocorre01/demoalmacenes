import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  ReposicionItem,
  UsuarioItem,
  useReposicionUsuarioAlmacenServices,
} from '../services/useReposicionUsuarioAlmacen';

interface ModalAsignarResponsableProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reposicionItem: ReposicionItem | null;
}

export const ModalAsignarResponsable: React.FC<ModalAsignarResponsableProps> = ({
  open,
  onClose,
  onSuccess,
  reposicionItem,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loadApiAsignarResponsable } = useReposicionUsuarioAlmacenServices();

  const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lista de usuarios disponibles para este registro
  const availableUsers: UsuarioItem[] = reposicionItem?.USUARIOS || [];

  useEffect(() => {
    if (open && reposicionItem) {
      if (reposicionItem.ID_USUARIO_ASUMIDO && availableUsers.length > 0) {
        const found = availableUsers.find(
          (u) => u.ID_USUARIO === reposicionItem.ID_USUARIO_ASUMIDO
        );
        setSelectedUser(found || null);
      } else {
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
  }, [open, reposicionItem]);

  const handleSave = async () => {
    if (!reposicionItem) return;
    if (!selectedUser) {
      showAlert.warning('Seleccione un usuario', 'Debe seleccionar un responsable para asignar.');
      return;
    }

    const idReposicion =
      reposicionItem.ID_PLANTA_REPOSICION_ALMACEN ||
      reposicionItem.ID_REPOSICION_ALMACEN ||
      (reposicionItem as any).ID_DESPERDICIO_ALMACEN ||
      0;

    if (!idReposicion) {
      showAlert.error('Error', 'No se identificó el registro de reposición.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loadApiAsignarResponsable(idReposicion, selectedUser.ID_USUARIO);
      if (res.success) {
        showAlert.success(
          'Responsable Asignado',
          `Se asignó a ${selectedUser.NOMBRE_COMPLETO} como responsable de la reposición.`
        );
        onSuccess();
        onClose();
      } else {
        showAlert.error('Error', res.message || 'No se pudo asignar el responsable.');
      }
    } catch (error) {
      console.error('Error al asignar responsable:', error);
      showAlert.error('Error', 'Ocurrió un error inesperado al asignar el responsable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reposicionItem) return null;

  const productName =
    reposicionItem.PRODUCTO ||
    reposicionItem.NOMBRE_PRODUCTO ||
    reposicionItem.NOMBRE_DETALLE ||
    'Producto';
  const totalAmount = reposicionItem.TOTAL_ASUMIDO ?? reposicionItem.TOTAL ?? 0;
  const unitMeasure = reposicionItem.UNIDAD_MEDIDA || reposicionItem.MEDIDA || '';

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
              <span className="material-symbols-outlined text-xl">person_add</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                AUDITORÍA Y RESPONSABILIDAD
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                ASIGNAR RESPONSABLE
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
          {/* Tarjeta de Resumen del Registro */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                DETALLES DE LA REPOSICIÓN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Producto</span>
                <span className="font-black text-on-surface text-sm">{productName}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Almacén</span>
                <span className="font-black text-on-surface">{reposicionItem.ALMACEN || reposicionItem.DESCRICION || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Cantidad</span>
                <span className="font-bold text-on-surface">
                  {reposicionItem.CANTIDAD} {unitMeasure}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">Total a Asumir</span>
                <span className="font-black text-primary text-sm">
                  Bs. {Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Selección de Usuario */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">badge</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                SELECCIONAR RESPONSABLE
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Usuario / Personal Asignado
              </label>
              <Autocomplete
                options={availableUsers}
                getOptionLabel={(option) =>
                  option.NOMBRE_COMPLETO
                    ? `${option.NOMBRE_COMPLETO} ${option.CARGO ? `(${option.CARGO})` : ''}`
                    : ''
                }
                value={selectedUser}
                onChange={(_, newValue) => {
                  setSelectedUser(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.ID_USUARIO === value?.ID_USUARIO}
                fullWidth
                noOptionsText="No hay usuarios disponibles en el almacén"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="BUSCAR PERSONAL POR NOMBRE O CARGO..."
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
          disabled={isSubmitting}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSubmitting || !selectedUser}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? 'Asignando...' : 'Asignar Responsable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalAsignarResponsable;

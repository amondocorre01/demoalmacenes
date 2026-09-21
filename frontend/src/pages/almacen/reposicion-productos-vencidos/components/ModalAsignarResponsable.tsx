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
} from '@mui/material';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  DesperdicioItem,
  UsuarioItem,
  useReposicionProductosVencidosServices,
} from '../services/useReposicionProductosVencidos';

interface ModalAsignarResponsableProps {
  open: boolean;
  onClose: () => void;
  item: DesperdicioItem | null;
  onSuccess: () => void;
}

export const ModalAsignarResponsable: React.FC<ModalAsignarResponsableProps> = ({
  open,
  onClose,
  item,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loadApiAsignarResponsableDesperdicio } = useReposicionProductosVencidosServices();

  const [selectedUser, setSelectedUser] = useState<UsuarioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Available users list from item or fallback
  const userOptions: UsuarioItem[] = React.useMemo(() => {
    if (!item?.USUARIOS || !Array.isArray(item.USUARIOS)) {
      return [];
    }
    return item.USUARIOS;
  }, [item]);

  useEffect(() => {
    if (open && item) {
      if (item.ID_USUARIO_ASUMIDO && userOptions.length > 0) {
        const found = userOptions.find((u) => u.ID_USUARIO === item.ID_USUARIO_ASUMIDO);
        setSelectedUser(found || null);
      } else if (item.USUARIO_ASUMIDO || item.USUARIO) {
        const userName = (item.USUARIO_ASUMIDO || item.USUARIO || '').toLowerCase();
        const found = userOptions.find(
          (u) =>
            u.NOMBRE_COMPLETO?.toLowerCase() === userName ||
            u.USUARIO?.toLowerCase() === userName
        );
        setSelectedUser(found || null);
      } else {
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
  }, [open, item, userOptions]);

  const handleSave = async () => {
    if (!item) return;

    if (!selectedUser) {
      showAlert.error('Selección Requerida', 'Por favor seleccione un usuario responsable.');
      return;
    }

    const idDesperdicio =
      item.ID_PLANTA_DESPERDICIO_ALMACEN ||
      item.ID_DESPERDICIO_ALMACEN ||
      item.ID_DESPERDICIO ||
      0;

    if (!idDesperdicio) {
      showAlert.error('Error', 'No se pudo identificar el registro de desperdicio.');
      return;
    }

    setIsSaving(true);
    const success = await loadApiAsignarResponsableDesperdicio({
      id_desperdicio_alamcen: Number(idDesperdicio),
      id_usuario: Number(selectedUser.ID_USUARIO),
    });
    setIsSaving(false);

    if (success) {
      showAlert.success('Responsable Asignado', 'Se asignó el responsable correctamente.');
      onSuccess();
      onClose();
    }
  };

  const formattedFechaRegistro = React.useMemo(() => {
    if (!item?.FECHA_REGISTRO) return { date: '-', time: '' };
    try {
      let datePart = '';
      let timePart = '';

      if (item.FECHA_REGISTRO.includes('T')) {
        const [d, t] = item.FECHA_REGISTRO.split('T');
        datePart = d;
        timePart = t.replace('Z', '').split('.')[0];
      } else if (item.FECHA_REGISTRO.includes(' ')) {
        const [d, t] = item.FECHA_REGISTRO.split(' ');
        datePart = d;
        timePart = t.split('.')[0];
      } else {
        datePart = item.FECHA_REGISTRO;
      }

      const parts = datePart.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : datePart;
      return { date: formatted, time: timePart };
    } catch {
      return { date: item.FECHA_REGISTRO, time: '' };
    }
  }, [item?.FECHA_REGISTRO]);

  const formattedFechaVencimiento = React.useMemo(() => {
    if (!item?.FECHA_VENCIMIENTO) return '-';
    try {
      const clean = item.FECHA_VENCIMIENTO.split('T')[0];
      const parts = clean.split(' ')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return item.FECHA_VENCIMIENTO;
    } catch {
      return item.FECHA_VENCIMIENTO;
    }
  }, [item?.FECHA_VENCIMIENTO]);

  const productName = item?.PRODUCTO || item?.NOMBRE_PRODUCTO || (item?.NOMBRE_DETALLE ? item.NOMBRE_DETALLE : '-');
  const hasDetailSubtitle = Boolean(
    item?.NOMBRE_DETALLE &&
    item.NOMBRE_DETALLE.trim() !== '' &&
    item.NOMBRE_DETALLE.trim().toUpperCase() !== (item?.PRODUCTO || item?.NOMBRE_PRODUCTO || '').trim().toUpperCase()
  );

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
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                AUDITORÍA Y REPOSICIÓN
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
          {/* Tarjeta de Información del Producto */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                INFORMACIÓN DEL PRODUCTO / DESPERDICIO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Producto
                </span>
                <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase block leading-tight">
                  {productName}
                </span>
                {hasDetailSubtitle && (
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-tight">
                    {item?.NOMBRE_DETALLE}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Almacén
                </span>
                <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase">
                  {item?.ALMACEN || item?.DESCRICION || '-'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Fecha Registro
                </span>
                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 block">
                  {formattedFechaRegistro.date}
                </span>
                {formattedFechaRegistro.time && (
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block">
                    {formattedFechaRegistro.time}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Fecha Vencimiento
                </span>
                <span className="font-mono font-bold text-primary">
                  {formattedFechaVencimiento}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Cantidad & Medida
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {Number(item?.CANTIDAD || 0).toLocaleString('es-BO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-[10px] font-black uppercase text-zinc-500">
                    {item?.UNIDAD_MEDIDA || item?.MEDIDA || ''}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Total Asumido (Bs)
                </span>
                <span className="font-black text-primary">
                  Bs.{' '}
                  {Number(item?.TOTAL_ASUMIDO ?? item?.TOTAL ?? 0).toLocaleString('es-BO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Asignación de Responsable */}
          <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 dark:border-zinc-800 pb-2">
              <span className="material-symbols-outlined text-lg">badge</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                SELECCIONAR RESPONSABLE
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Usuario Responsable
              </label>
              <Autocomplete
                options={userOptions}
                getOptionLabel={(option) =>
                  option.NOMBRE_COMPLETO || option.USUARIO || String(option.ID_USUARIO)
                }
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                isOptionEqualToValue={(option, value) =>
                  option.ID_USUARIO === value?.ID_USUARIO
                }
                fullWidth
                noOptionsText="No hay usuarios disponibles"
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
                    placeholder="BUSCAR Y SELECCIONAR USUARIO..."
                  />
                )}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    key={option.ID_USUARIO}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex flex-col items-start border-b border-zinc-100 dark:border-zinc-800 text-xs"
                  >
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                      {option.NOMBRE_COMPLETO}
                    </span>
                    {option.CARGO && (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                        {option.CARGO}
                      </span>
                    )}
                  </li>
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
          justify: 'space-between',
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
          disabled={isSaving || !selectedUser}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isSaving ? 'Guardando...' : 'Asignar Responsable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

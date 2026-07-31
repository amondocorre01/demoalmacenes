import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import {
  AlmacenItem,
  UsuarioAccesibilidadAlmacen,
  useAccesibilidadAlmacenUsuario,
} from '../services/useAccesibilidadAlmacenUsuario';

interface ModalAsignacionAlmacenUsuarioProps {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioAccesibilidadAlmacen | null;
  allAlmacenes: AlmacenItem[];
  onToggleAlmacen: (idUsuario: number, almacen: AlmacenItem, estado: number) => void;
}

export const getAlmacenId = (a: AlmacenItem): number => {
  return Number(a.ID_PLANTA_ALMACEN || a.ID_ALMACEN || a.id_almacen || 0);
};

export const getAlmacenNombre = (a: AlmacenItem): string => {
  return a.DESCRICION || a.DESCRIPCION || a.NOMBRE || a.ALMACEN || `Almacén #${getAlmacenId(a)}`;
};

export const ModalAsignacionAlmacenUsuario: React.FC<ModalAsignacionAlmacenUsuarioProps> = ({
  open,
  onClose,
  usuario,
  allAlmacenes,
  onToggleAlmacen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { setAccesoAlmacen } = useAccesibilidadAlmacenUsuario();
  const [filterQuery, setFilterQuery] = useState('');
  const [assignedSet, setAssignedSet] = useState<Set<number>>(new Set());

  // Sincronizar el Set local de almacenes asignados cuando cambia el usuario o se abre el modal
  useEffect(() => {
    if (usuario && Array.isArray(usuario.ALMACENES)) {
      const activeIds = new Set<number>();
      usuario.ALMACENES.forEach((a) => {
        if (a.ESTADO !== 0) {
          activeIds.add(getAlmacenId(a));
        }
      });
      setAssignedSet(activeIds);
    } else {
      setAssignedSet(new Set());
    }
  }, [usuario, open]);

  if (!usuario) return null;

  const filteredAlmacenes = allAlmacenes.filter((a) =>
    getAlmacenNombre(a).toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleToggleAcceso = async (almacen: AlmacenItem) => {
    const almacenId = getAlmacenId(almacen);
    if (!almacenId) return;

    const isCurrentlyAssigned = assignedSet.has(almacenId);
    const newEstado = isCurrentlyAssigned ? 0 : 1;

    // 1. Actualización Optimista e Instantánea del estado local del Modal
    setAssignedSet((prev) => {
      const next = new Set(prev);
      if (isCurrentlyAssigned) {
        next.delete(almacenId);
      } else {
        next.add(almacenId);
      }
      return next;
    });

    // 2. Actualización instantánea de la tabla principal
    onToggleAlmacen(usuario.ID_USUARIO, almacen, newEstado);

    // 3. Notificación pequeña (Toast) no bloqueante
    const almacenNombre = getAlmacenNombre(almacen);
    showAlert.toast(
      newEstado === 1 ? `Acceso concedido: ${almacenNombre}` : `Acceso revocado: ${almacenNombre}`,
      newEstado === 1 ? 'success' : 'info'
    );

    // 4. Petición en segundo plano (Background API call)
    try {
      const res = await setAccesoAlmacen(almacenId, usuario.ID_USUARIO, newEstado);
      if (res && res.success === false) {
        // Revertir si el servidor responde con error
        setAssignedSet((prev) => {
          const next = new Set(prev);
          if (isCurrentlyAssigned) {
            next.add(almacenId);
          } else {
            next.delete(almacenId);
          }
          return next;
        });
        onToggleAlmacen(usuario.ID_USUARIO, almacen, isCurrentlyAssigned ? 1 : 0);
        showAlert.toast(`Error al guardar acceso para ${almacenNombre}`, 'error');
      }
    } catch (err) {
      console.error('Error enviando acceso de almacén a API:', err);
      // Revertir en error de red
      setAssignedSet((prev) => {
        const next = new Set(prev);
        if (isCurrentlyAssigned) {
          next.add(almacenId);
        } else {
          next.delete(almacenId);
        }
        return next;
      });
      onToggleAlmacen(usuario.ID_USUARIO, almacen, isCurrentlyAssigned ? 1 : 0);
      showAlert.toast(`Error de conexión al asignar ${almacenNombre}`, 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            bgcolor: 'var(--surface)',
            color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            m: { xs: 2, sm: 'auto' }
          }
        }
      }}
    >
      {/* Header del Modal */}
      <DialogTitle sx={{ p: 1.5, px: 3, borderBottom: '1px solid var(--outline-variant)', color: 'var(--on-surface)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-base">warehouse</span>
            </div>
            <div>
              <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-0.5 font-headline">Configuración de Accesos</p>
              <p className="text-base font-bold font-headline uppercase tracking-tight leading-none">
                Permisos de Almacén
              </p>
            </div>
          </div>
          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--on-surface-variant)', '&:hover': { bgcolor: 'var(--surface-variant)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </DialogTitle>

      {/* Content flex container con scroll interno directo */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Info Banner del Usuario */}
        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg font-bold">person</span>
            <div>
              <p className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider leading-none">Usuario</p>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase mt-0.5">{usuario.NOMBRE_COMPLETO}</p>
            </div>
          </div>
          {/* <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            ID: {usuario.ID_USUARIO}
          </span> */}
        </div>

        {/* Buscador interno de almacenes */}
        <div className="relative shrink-0 mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="FILTRAR ALMACÉN POR NOMBRE..."
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Lista de Almacenes con Scroll Inmediato y Visibilidad Directa */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
          {filteredAlmacenes.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
              <span className="material-symbols-outlined text-3xl mb-1 text-zinc-300 dark:text-zinc-700">inventory_2</span>
              <p className="text-[10px] font-black uppercase tracking-widest">No se encontraron almacenes disponibles</p>
            </div>
          ) : (
            filteredAlmacenes.map((almacen) => {
              const almacenId = getAlmacenId(almacen);
              const almacenNombre = getAlmacenNombre(almacen);
              const hasAccess = assignedSet.has(almacenId);

              return (
                <div
                  key={almacenId}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${hasAccess
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-all ${hasAccess
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">warehouse</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        {almacenNombre}
                      </p>
                      <p className="text-[8.5px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
                        ID Almacén: {almacenId}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAcceso(almacen)}
                    className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${hasAccess
                      ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-primary hover:text-white hover:border-primary'
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {hasAccess ? 'check_circle' : 'add_circle'}
                    </span>
                    {hasAccess ? 'Concedido' : 'Asignar'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>

      {/* Footer del Modal */}
      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: 'var(--background)', borderTop: '1px solid var(--outline-variant)', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="secondary" className="!h-8 !px-5 text-[9px] bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

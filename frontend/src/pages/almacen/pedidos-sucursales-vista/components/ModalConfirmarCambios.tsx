import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  useTheme,
  useMediaQuery,
  Zoom,
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

export interface ChangedProduct {
  idSub2: number;
  idTurno: number;
  producto: string;
  turno: string;
  pedido_principal: boolean;
  changes: Array<{
    sucursalKey: string;
    sucursalLabel: string;
    oldQty: number;
    newQty: number;
    id_producto_detalle: number;
  }>;
}

interface ModalConfirmarCambiosProps {
  open: boolean;
  onClose: () => void;
  changedProducts: ChangedProduct[];
  onConfirm: (observations: Record<string, string>) => Promise<void>;
  isProcessing: boolean;
}

interface ProductRowProps {
  prod: ChangedProduct;
  open: boolean;
  initialObservation: string;
  onObservationChange: (key: string, value: string) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  prod,
  open,
  initialObservation,
  onObservationChange,
}) => {
  const [localObs, setLocalObs] = useState(initialObservation);

  useEffect(() => {
    if (open) {
      setLocalObs(initialObservation);
    }
  }, [open, initialObservation]);

  const key = `${prod.idSub2}-${prod.idTurno}`;

  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 sm:px-6 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight">
            {prod.producto}
          </div>
          <div className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest mt-0.5">
            {prod.turno}
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {prod.changes.map((chg, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[9px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm"
            >
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {chg.sucursalLabel}:
              </span>
              <span className="text-rose-500 font-bold">{chg.oldQty}</span>
              <span className="material-symbols-outlined text-[10px] text-zinc-400">
                arrow_right_alt
              </span>
              <span className="text-emerald-500 font-bold">{chg.newQty}</span>
            </div>
          ))}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-3">
        <TextField
          fullWidth
          size="small"
          placeholder="Ingrese una observación..."
          value={localObs}
          onChange={(e) => {
            const val = e.target.value;
            setLocalObs(val);
            onObservationChange(key, val);
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'var(--input-bg, var(--surface))',
              color: 'var(--on-surface)',
              fontSize: '11px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--outline-variant, #e4e4e7)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--outline, #a1a1aa)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary)',
              },
            },
          }}
        />
      </td>
    </tr>
  );
};

export const ModalConfirmarCambios: React.FC<ModalConfirmarCambiosProps> = ({
  open,
  onClose,
  changedProducts,
  onConfirm,
  isProcessing,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [observations, setObservations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setObservations({});
    }
  }, [open]);

  const handleObservationChange = (key: string, val: string) => {
    setObservations((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = async () => {
    await onConfirm(observations);
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
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                PEDIDOS DE SUCURSALES
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                CONFIRMAR CAMBIOS EN PEDIDOS
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
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl shrink-0">
              info
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-snug">
              Se detectaron cambios en las cantidades de los pedidos. Revise las modificaciones y agregue observaciones si es necesario antes de guardar.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-4 sm:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-[200px]">
                      Producto / Insumo
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Modificaciones
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-[240px]">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {changedProducts.map((prod) => (
                    <ProductRow
                      key={`${prod.idSub2}-${prod.idTurno}`}
                      prod={prod}
                      open={open}
                      initialObservation={observations[`${prod.idSub2}-${prod.idTurno}`] || ''}
                      onObservationChange={handleObservationChange}
                    />
                  ))}
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
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          disabled={isProcessing}
          className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isProcessing}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isProcessing ? 'Guardando...' : 'Confirmar y Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalConfirmarCambios;

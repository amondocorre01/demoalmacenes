import React, { useState } from 'react';
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
  Zoom
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

interface NuevaMedidaModalProps {
  open: boolean;
  onClose: () => void;
  unitsList: any[];
  onSave: (data: {
    label: string;
    stdQty: string | number;
    stdUnitId: number | string;
    adeqQty: string | number;
    adeqUnitId: number | string;
  }) => Promise<void>;
  isLoading?: boolean;
  selectSx?: any;
}

export const NuevaMedidaModal: React.FC<NuevaMedidaModalProps> = ({
  open,
  onClose,
  unitsList,
  onSave,
  isLoading = false,
  selectSx
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [label, setLabel] = useState('');
  const [stdQty, setStdQty] = useState<string>('');
  const [stdUnit, setStdUnit] = useState<any>(null);
  const [adeqQty, setAdeqQty] = useState<string>('');
  const [adeqUnit, setAdeqUnit] = useState<any>(null);

  const handleSave = async () => {
    if (!stdQty || !stdUnit || !adeqQty || !adeqUnit) return;
    await onSave({
      label: label || `Lote (${stdQty} ${stdUnit.UNIDAD_MEDIDA || stdUnit.name || 'U'})`,
      stdQty,
      stdUnitId: stdUnit.ID_UNIDAD_MEDIDA || stdUnit.id || 1,
      adeqQty,
      adeqUnitId: adeqUnit.ID_UNIDAD_MEDIDA || adeqUnit.id || 1
    });
    // Reset form
    setLabel('');
    setStdQty('');
    setStdUnit(null);
    setAdeqQty('');
    setAdeqUnit(null);
    onClose();
  };

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
            borderRadius: isMobile ? '1rem' : '1.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            bgcolor: 'var(--surface, #ffffff)',
            color: 'var(--on-surface, #18181b)',
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)'
          }
        }
      }}
    >
      {/* ── Encabezado Estándar (ModalNewAlmacen.tsx) ── */}
      <DialogTitle sx={{ p: 2, px: 3, borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)', bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">straighten</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                Recetas Intermedias
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                Nueva Unidad de Medida
              </h2>
            </div>
          </div>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'var(--on-surface-variant)',
              bgcolor: 'var(--surface-variant, #f4f4f5)',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      {/* ── Cuerpo del Formulario ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '78vh', overflowY: 'auto' }}>
        <div className="space-y-5">
          {/* Bloque 1: Identificación */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">label</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Identificación</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                Nombre o Etiqueta Opcional
              </label>
              <TextField
                fullWidth
                size="small"
                placeholder="EJEMPLO: LOTE DE (10 UNIDADES)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                sx={selectSx}
              />
            </div>
          </div>

          {/* Bloque 2: Configuración Estándar */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">tune</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Configuración Estándar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="col-span-1 sm:col-span-4 space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Cantidad <span className="text-primary">*</span>
                </label>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  placeholder="0"
                  value={stdQty}
                  onChange={(e) => setStdQty(e.target.value)}
                  sx={selectSx}
                />
              </div>
              <div className="col-span-1 sm:col-span-8 space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Unidad Medida Estándar <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={unitsList}
                  getOptionLabel={(o: any) => o.UNIDAD_MEDIDA || o.name || ''}
                  value={stdUnit}
                  onChange={(_, v) => setStdUnit(v)}
                  isOptionEqualToValue={(o, v) => (o.ID_UNIDAD_MEDIDA || o.id) === (v.ID_UNIDAD_MEDIDA || v.id)}
                  sx={selectSx}
                  renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />}
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Configuración Adecuación */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">swap_vert</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Configuración Adecuación</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="col-span-1 sm:col-span-4 space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Cantidad <span className="text-primary">*</span>
                </label>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  placeholder="0"
                  value={adeqQty}
                  onChange={(e) => setAdeqQty(e.target.value)}
                  sx={selectSx}
                />
              </div>
              <div className="col-span-1 sm:col-span-8 space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Unidad Medida Adecuación <span className="text-primary">*</span>
                </label>
                <Autocomplete
                  options={unitsList}
                  getOptionLabel={(o: any) => o.UNIDAD_MEDIDA || o.name || ''}
                  value={adeqUnit}
                  onChange={(_, v) => setAdeqUnit(v)}
                  isOptionEqualToValue={(o, v) => (o.ID_UNIDAD_MEDIDA || o.id) === (v.ID_UNIDAD_MEDIDA || v.id)}
                  sx={selectSx}
                  renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ── Pie de Modal Estándar (ModalNewAlmacen.tsx) ── */}
      <DialogActions sx={{
        px: 3,
        py: 2,
        bgcolor: 'var(--background, #fafafa)',
        borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
        display: 'flex',
        justify: 'space-between',
        gap: 1.5
      }}>
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
          onClick={handleSave}
          disabled={!stdQty || !stdUnit || !adeqQty || !adeqUnit || isLoading}
          icon="save"
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          Guardar Medida
        </Button>
      </DialogActions>
    </Dialog>
  );
};

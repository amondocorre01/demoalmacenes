import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Switch,
  useTheme,
  useMediaQuery
} from '@mui/material';

interface ModalNewAlmacenProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: any;
}

const ModalNewAlmacen: React.FC<ModalNewAlmacenProps> = ({
  open,
  onClose,
  onSave,
  data
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = React.useState({
    nombre: '',
    produccion: false,
    activo: true,
  });

  // Synchronize state when data prop changes (e.g. when opening for editing)
  useEffect(() => {
    if (data) {
      setFormData({
        nombre: data.DESCRICION || '',
        produccion: data.ESTADO_PRODUCCION === 1,
        activo: data.ESTADO === 1,
      });
    } else {
      setFormData({
        nombre: '',
        produccion: false,
        activo: true,
      });
    }
  }, [data, open]);

  const handleSave = () => {
    if (onSave) onSave(formData);
    onClose();
  };

  const isEditing = !!data;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : '2rem',
            p: 0,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }
        }
      }}
    >
      <DialogTitle sx={{ p: 1.5, px: 4, borderBottom: '1px solid', borderColor: 'zinc.100' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isEditing ? 'bg-primary' : 'bg-zinc-900'} text-white`}>
              <span className="material-symbols-outlined text-xl">{isEditing ? 'edit_square' : 'warehouse'}</span>
            </div>
            <div>
              <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Gestión de Almacenes</p>
              <p className="text-xl font-black text-zinc-900 uppercase tracking-tight leading-none">
                {isEditing ? 'Editar Almacén' : 'Nuevo Almacén'}
              </p>
            </div>
          </div>
          <IconButton onClick={onClose} size="small" className="bg-zinc-50 hover:bg-zinc-100 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Almacén (*)</label>
            <TextField
              fullWidth
              placeholder="Ej: ALMACÉN CENTRAL"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50', fontSize: '12px', fontWeight: '800' } }}
            />
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">Estado del Almacén</p>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">{formData.activo ? 'El almacén está ACTIVO' : 'El almacén está INACTIVO'}</p>
              </div>
              <Switch
                size="small"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'emerald.500',
                    '& + .MuiSwitch-track': { backgroundColor: 'emerald.500' },
                  },
                }}
              />
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">Área de Producción</p>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">Habilitar flujo de producción</p>
              </div>
              <Switch
                size="small"
                checked={formData.produccion}
                onChange={(e) => setFormData({ ...formData, produccion: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                    '& + .MuiSwitch-track': { backgroundColor: 'primary.main' },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 1.5, px: 4, display: 'flex', gap: 1.5, borderTop: '1px solid', borderColor: 'zinc.100', bgcolor: 'zinc.50/30' }}>
        <Button onClick={onClose} sx={{ color: 'zinc.400', fontWeight: 900, fontSize: '10px', px: 3 }}>Cancelar</Button>
        <Box sx={{ flexGrow: 1 }} />
        <button
          onClick={handleSave}
          className={`h-10 px-8 ${isEditing ? 'bg-primary' : 'bg-zinc-900'} text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2`}
        >
          <span className="material-symbols-outlined text-lg">{isEditing ? 'check_circle' : 'save'}</span>
          {isEditing ? 'Guardar Cambios' : 'Crear Almacén'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNewAlmacen;

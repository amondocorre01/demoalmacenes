import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
  TextField,
  Switch,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Zoom,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/common/Button';
import { showAlert } from '../../../../config/alerts';
import { useProductosIntermediosServices } from '../services/useProductosIntermedios';

interface ModalNuevoProductoIntermedioProps {
  open: boolean;
  onClose: () => void;
  warehouses: any[];
  onSaveSuccess: () => void;
  editItem?: any | null;
}

export const ModalNuevoProductoIntermedio: React.FC<ModalNuevoProductoIntermedioProps> = ({
  open,
  onClose,
  warehouses,
  onSaveSuccess,
  editItem = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { loadApiCrearProductoIntermedio, loadApiEditarProductoIntermedio } = useProductosIntermediosServices();

  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdProductName, setCreatedProductName] = useState('');
  const [createdWarehouseName, setCreatedWarehouseName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  const [nombre, setNombre] = useState('');
  const [duracion, setDuracion] = useState<string | number>('');
  const [porcentajeDesperdicio, setPorcentajeDesperdicio] = useState<string | number>('');
  const [nota, setNota] = useState('');
  const [productoPrimario, setProductoPrimario] = useState(false);
  const [estadoProduccion, setEstadoProduccion] = useState(true);
  const [requiereLoteo, setRequiereLoteo] = useState(false);

  useEffect(() => {
    if (editItem) {
      setNombre(editItem.NOMBRE || editItem.nombre || '');
      setDuracion(editItem.DURACION ?? editItem.duracion ?? '');
      setPorcentajeDesperdicio(editItem.PORCENTAJE_DESPERDICIO ?? editItem.porcentaje_desperdicio ?? '');
      setNota(editItem.NOTA || editItem.nota || '');
      setProductoPrimario(Boolean(editItem.PRODUCTO_PRIMARIO || editItem.producto_primario));
      setEstadoProduccion(Boolean(editItem.ESTADO_PRODUCCION ?? editItem.estado_produccion ?? 1));
      setRequiereLoteo(Boolean(editItem.REQUIERE_LOTEO || editItem.requiere_loteo));
      setSelectedWarehouse(null);
      setRegistrationSuccess(false);
    } else {
      resetForm();
    }
  }, [editItem, open]);

  const resetForm = () => {
    setSelectedWarehouse(null);
    setNombre('');
    setDuracion('');
    setPorcentajeDesperdicio('');
    setNota('');
    setProductoPrimario(false);
    setEstadoProduccion(true);
    setRequiereLoteo(false);
    setRegistrationSuccess(false);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      showAlert.warning('Campo requerido', 'Por favor, ingrese el nombre del producto intermedio.');
      return;
    }

    if (!duracion || Number(duracion) <= 0) {
      showAlert.warning('Campo requerido', 'Por favor, especifique una duración válida en días (número positivo).');
      return;
    }

    setIsLoading(true);

    if (editItem) {
      const payload = {
        nombre: nombre.trim().toUpperCase(),
        duracion: Number(duracion),
        porcentaje_desperdicio: porcentajeDesperdicio !== '' ? Number(porcentajeDesperdicio) : 0,
        producto_primario: productoPrimario ? 1 : 0,
        nota: nota.trim(),
        estado_produccion: estadoProduccion ? 1 : 0,
        requiere_loteo: requiereLoteo ? 1 : 0
      };

      const res = await loadApiEditarProductoIntermedio(editItem.ID_PRODUCTO_INTERMEDIO || editItem.id, payload);
      setIsLoading(false);

      if (res && res.success !== false) {
        showAlert.success('Producto Actualizado', 'El producto intermedio se actualizó correctamente.');
        onSaveSuccess();
        onClose();
      }
    } else {
      const payload = {
        nombre: nombre.trim().toUpperCase(),
        duracion: Number(duracion),
        porcentaje_desperdicio: porcentajeDesperdicio !== '' ? Number(porcentajeDesperdicio) : 0,
        producto_primario: productoPrimario ? 1 : 0,
        nota: nota.trim(),
        estado_produccion: estadoProduccion ? 1 : 0,
        requiere_loteo: requiereLoteo ? 1 : 0,
        id_planta_almacen: selectedWarehouse ? (selectedWarehouse.ID_PLANTA_ALMACEN || selectedWarehouse.id) : undefined
      };

      const res = await loadApiCrearProductoIntermedio(payload);
      setIsLoading(false);

      if (res && res.success !== false) {
        setCreatedProductName(nombre.toUpperCase());
        setCreatedWarehouseName(selectedWarehouse ? (selectedWarehouse.DESCRICION || selectedWarehouse.nombre) : 'GENERAL');
        setRegistrationSuccess(true);
        onSaveSuccess();
      }
    }
  };

  const selectSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      bgcolor: 'var(--surface, #ffffff)',
      fontSize: '11px',
      color: 'var(--on-surface, #18181b)',
      '& fieldset': { borderColor: 'var(--border-outline-variant, #e4e4e7)' },
      '&:hover fieldset': { borderColor: 'var(--primary, #9d0013)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--primary, #9d0013)' },
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      bgcolor: 'var(--surface, #ffffff)',
      fontSize: '11px',
      color: 'var(--on-surface, #18181b)',
      '& fieldset': { borderColor: 'var(--border-outline-variant, #e4e4e7)' },
      '&:hover fieldset': { borderColor: 'var(--primary, #9d0013)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--primary, #9d0013)' },
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
            border: isMobile ? 'none' : '1px solid var(--border-outline-variant, #e4e4e7)'
          }
        }
      }}
    >
      {/* ── Encabezado Estándar AGENTS.md ── */}
      <DialogTitle sx={{ p: 2, px: 3, borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)', bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">
                {registrationSuccess ? 'done_all' : editItem ? 'edit' : 'inventory_2'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                {registrationSuccess ? 'REGISTRO EXITOSO' : 'GESTIÓN DE PRODUCTOS INTERMEDIOS'}
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {registrationSuccess ? '¡PRODUCTO REGISTRADO!' : editItem ? 'EDITAR PRODUCTO INTERMEDIO' : 'NUEVO PRODUCTO INTERMEDIO'}
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

      {/* ── Cuerpo del Formulario / Asistente ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'var(--surface, #ffffff)', maxH: '78vh', overflowY: 'auto' }}>
        {registrationSuccess ? (
          <div className="flex flex-col items-center py-4 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <span className="material-symbols-outlined text-3xl font-black">done_all</span>
            </div>

            <div className="space-y-1">
              <p className="text-base font-black text-on-surface uppercase tracking-tight font-headline">
                ¡Producto Creado Correctamente!
              </p>
              <p className="text-on-surface-variant font-medium text-xs max-w-md leading-relaxed font-body">
                El producto intermedio <strong className="text-on-surface uppercase">{createdProductName}</strong> ha sido creado exitosamente y vinculado al almacén <strong className="text-on-surface uppercase">{createdWarehouseName}</strong>.
              </p>
            </div>

            <Divider className="w-full" />

            <div className="w-full text-left space-y-3">
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest font-headline">PASOS SIGUIENTES</p>
                <p className="text-xs font-black text-on-surface uppercase tracking-tight">¿Qué desea realizar a continuación?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Recetas Intermedias */}
                <div
                  onClick={() => {
                    onClose();
                    navigate('/almacen/recetas-intermedias');
                  }}
                  className="p-4 rounded-2xl bg-surface-variant/40 hover:bg-surface-variant/80 border border-outline-variant/60 hover:border-primary cursor-pointer transition-all flex flex-col justify-between gap-3 group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">kitchen</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface uppercase group-hover:text-primary transition-colors font-headline">
                      Registrar Receta Intermedia
                    </p>
                    <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-tight mt-0.5">
                      Configurar insumos y cantidades para producir este concentrado o base.
                    </p>
                  </div>
                </div>

                {/* Opción 2: Lista General de Recetas */}
                <div
                  onClick={() => {
                    onClose();
                    navigate('/almacen/lista-general-recetas');
                  }}
                  className="p-4 rounded-2xl bg-surface-variant/40 hover:bg-surface-variant/80 border border-outline-variant/60 hover:border-primary cursor-pointer transition-all flex flex-col justify-between gap-3 group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface uppercase group-hover:text-primary transition-colors font-headline">
                      Lista General de Recetas
                    </p>
                    <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-tight mt-0.5">
                      Verificar vinculación jerárquica en los almacenes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sección 1: Datos Principales */}
            <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-lg">badge</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">IDENTIFICACIÓN</span>
              </div>

              {!editItem && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                    Almacén de Destino
                  </label>
                  <Autocomplete
                    options={warehouses}
                    getOptionLabel={(o) => o.DESCRICION || o.nombre || ''}
                    value={selectedWarehouse}
                    onChange={(_, v) => setSelectedWarehouse(v)}
                    sx={selectSx}
                    renderInput={(params) => <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR ALMACÉN..." />}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Nombre del Producto <span className="text-primary">*</span>
                </label>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="EJ. BIZCOCHO DE VAINILLA..."
                  sx={inputSx}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                  Nota u Observación
                </label>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="INFORMACIÓN ADICIONAL DEL PRODUCTO INTERMEDIO..."
                  sx={inputSx}
                />
              </div>
            </div>

            {/* Sección 2: Métricas Operativas */}
            <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-lg">tune</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">MÉTRICAS Y OPCIONES</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                    Duración (Días) <span className="text-primary">*</span>
                  </label>
                  <TextField
                    fullWidth
                    type="number"
                    variant="outlined"
                    size="small"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><span className="text-[9px] font-black text-on-surface-variant">DÍAS</span></InputAdornment>
                      }
                    }}
                    sx={inputSx}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                    Desperdicio (%)
                  </label>
                  <TextField
                    fullWidth
                    type="number"
                    variant="outlined"
                    size="small"
                    value={porcentajeDesperdicio}
                    onChange={(e) => setPorcentajeDesperdicio(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><span className="text-[9px] font-black text-on-surface-variant">%</span></InputAdornment>
                      }
                    }}
                    sx={inputSx}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-outline-variant/40">
                  <div>
                    <p className="text-[10px] font-black text-on-surface uppercase">Producto Primario</p>
                    <p className="text-[8px] text-on-surface-variant font-medium">Habilita vinculación directa</p>
                  </div>
                  <Switch
                    checked={productoPrimario}
                    onChange={(e) => setProductoPrimario(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary)' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--primary)' }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-outline-variant/40">
                  <div>
                    <p className="text-[10px] font-black text-on-surface uppercase">Habilitar Producción</p>
                    <p className="text-[8px] text-on-surface-variant font-medium">Disponible en módulo de producción</p>
                  </div>
                  <Switch
                    checked={estadoProduccion}
                    onChange={(e) => setEstadoProduccion(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary)' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--primary)' }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-outline-variant/40">
                  <div>
                    <p className="text-[10px] font-black text-on-surface uppercase">Requiere Loteo</p>
                    <p className="text-[8px] text-on-surface-variant font-medium">Asigna número de lote en producción</p>
                  </div>
                  <Switch
                    checked={requiereLoteo}
                    onChange={(e) => setRequiereLoteo(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary)' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--primary)' }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* ── Pie de Modal Estándar ── */}
      <DialogActions sx={{
        px: 3,
        py: 2,
        bgcolor: 'var(--background, #fafafa)',
        borderTop: '1px solid var(--border-outline-variant, #f4f4f5)',
        display: 'flex',
        justify: 'space-between',
        gap: 1.5
      }}>
        {registrationSuccess ? (
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="!h-9 !px-6 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 ml-auto"
          >
            Cerrar Asistente
          </Button>
        ) : (
          <>
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
              disabled={isLoading || !nombre.trim() || !duracion}
              icon="save"
              className="!h-9 !px-8 shadow-lg shadow-primary/20"
            >
              {editItem ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

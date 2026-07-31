import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Switch,
  Autocomplete,
  Chip,
  useTheme,
  useMediaQuery,
  Zoom
} from '@mui/material';
import { Button } from '../../../../components/common/Button';

interface AlmacenOption {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
}

interface ModalNewAlmacenProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  data?: any;
  allWarehouses?: AlmacenOption[]; // Lista de almacenes activos para "solicita_a"
  currentGestionPiId?: number | null; // ID del almacén que actualmente tiene gestion_pi = 1
}

const DRAFT_KEY = 'draft_registro_almacen';

const ModalNewAlmacen: React.FC<ModalNewAlmacenProps> = ({
  open,
  onClose,
  onSave,
  data,
  allWarehouses = [],
  currentGestionPiId = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultForm = {
    nombre: '',
    produccion: false,   // estado_produccion
    activo: true,        // estado
    gestion_pi: false,
    solicitud_planta: false,
    entrega_planta: false,
    solicita_a: [] as AlmacenOption[],  // almacenes a los que este puede solicitar
  };

  const [formData, setFormData] = useState(defaultForm);
  const isEditing = !!data;

  // ───────────── Carga / restauración de formulario ─────────────
  useEffect(() => {
    if (!open) return;

    if (data) {
      // Modo edición: poblar desde el registro actual
      const solicita_a_loaded: AlmacenOption[] = (data.solicita_a || [])
        .map((item: any) => allWarehouses.find(w => w.ID_PLANTA_ALMACEN === item.id_almacen))
        .filter(Boolean) as AlmacenOption[];

      setFormData({
        nombre: data.DESCRICION || '',
        produccion: data.ESTADO_PRODUCCION == 1,
        activo: data.ESTADO === 1,
        gestion_pi: data.GESTION_PI == 1,
        solicitud_planta: data.SOLICITUD_PLANTA == 1,
        entrega_planta: data.ENTREGA_PLANTA == 1,
        solicita_a: solicita_a_loaded,
      });
    } else {
      // Modo creación: intentar restaurar borrador
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const solicita_a_restored: AlmacenOption[] = (parsed.solicita_a_ids || [])
            .map((id: number) => allWarehouses.find(w => w.ID_PLANTA_ALMACEN === id))
            .filter(Boolean) as AlmacenOption[];
          setFormData({ ...parsed, solicita_a: solicita_a_restored });
        } catch {
          setFormData(defaultForm);
        }
      } else {
        setFormData(defaultForm);
      }
    }
  }, [data, open, allWarehouses]);

  // ───────────── Auto-guardado de borrador ─────────────
  useEffect(() => {
    if (open && !data) {
      const draftPayload = {
        ...formData,
        solicita_a_ids: formData.solicita_a.map(w => w.ID_PLANTA_ALMACEN),
        solicita_a: []
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
    }
  }, [formData, open, data]);

  // ───────────── Control gestion_pi ─────────────
  const handleGestionPiChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      gestion_pi: checked,
      solicitud_planta: checked ? false : prev.solicitud_planta,
      entrega_planta: checked ? false : prev.entrega_planta,
    }));
  };

  // ───────────── Guardar ─────────────
  const handleSave = () => {
    const nombreLimpio = formData.nombre.trim();
    if (!nombreLimpio) return;
    const payload = {
      almacen: nombreLimpio,
      nombre: nombreLimpio,
      estado_produccion: formData.produccion ? 1 : 0,
      activo: formData.activo,
      estado: formData.activo ? 1 : 0,
      gestion_pi: formData.gestion_pi ? 1 : 0,
      solicitud_planta: formData.gestion_pi ? 0 : (formData.solicitud_planta ? 1 : 0),
      entrega_planta: formData.gestion_pi ? 0 : (formData.entrega_planta ? 1 : 0),
      solicita_a: formData.solicita_a.map(w => ({ id_almacen: w.ID_PLANTA_ALMACEN, estado: 1 })),
    };
    if (onSave) onSave(payload);
    localStorage.removeItem(DRAFT_KEY);
    onClose();
  };

  const handleCancel = () => {
    if (!data) localStorage.removeItem(DRAFT_KEY);
    onClose();
  };

  // Aviso si otro almacén ya tiene gestion_pi activo
  const anotherHasGestionPi =
    currentGestionPiId !== null &&
    currentGestionPiId !== data?.ID_PLANTA_ALMACEN;

  // Almacenes disponibles para "solicita_a":
  // 1. Solo activos (ESTADO === 1 o indefinido por venir del endpoint de activos)
  // 2. Excluye el almacén actual que se está editando
  // 3. Excluye los almacenes que ya están asignados/seleccionados en solicita_a
  const availableForSolicita = allWarehouses.filter(w => {
    const isSelf = w.ID_PLANTA_ALMACEN === data?.ID_PLANTA_ALMACEN;
    const isActive = w.ESTADO === undefined || w.ESTADO === 1;
    const isAlreadySelected = formData.solicita_a.some(
      selected => selected.ID_PLANTA_ALMACEN === w.ID_PLANTA_ALMACEN
    );
    return !isSelf && isActive && !isAlreadySelected;
  });

  const switchSx = {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: 'var(--primary, #9d0013)',
      '& + .MuiSwitch-track': { backgroundColor: 'var(--primary, #9d0013)' },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Zoom}
      slotProps={{
        paper: {
          sx: {
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
      {/* ── Encabezado Estándar ── */}
      <DialogTitle sx={{ p: 2, px: 3, borderBottom: '1px solid var(--border-outline-variant, #f4f4f5)', bgcolor: 'var(--surface, #ffffff)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-xl">{isEditing ? 'edit_square' : 'warehouse'}</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1 font-headline">
                Gestión de Almacenes
              </p>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                {isEditing ? 'Editar Almacén' : 'Registrar Nuevo Almacén'}
              </h2>
            </div>
          </div>
          <IconButton
            onClick={handleCancel}
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

          {/* Banner de Aviso de Borrador */}
          {!data && localStorage.getItem(DRAFT_KEY) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">history</span>
                <span className="text-[9px] font-black uppercase tracking-wider">Se ha restaurado un borrador guardado automáticamente</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setFormData(defaultForm);
                }}
                className="text-[8px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 underline hover:opacity-80 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* ── BLOQUE 1: Datos Principales ── */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">badge</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">Información Principal</span>
              </div>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${formData.activo ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'}`}>
                {formData.activo ? '● Almacén Activo' : '○ Almacén Inactivo'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                Nombre Oficial del Almacén <span className="text-primary">*</span>
              </label>
              <TextField
                fullWidth
                placeholder="EJEMPLO: ALMACÉN DE MATERIA PRIMA"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                size="small"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    bgcolor: 'var(--surface, #ffffff)',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: 'var(--on-surface, #18181b)',
                    '& fieldset': { borderColor: 'var(--border-outline-variant, #e4e4e7)' },
                    '&:hover fieldset': { borderColor: 'var(--primary, #9d0013)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--primary, #9d0013)' }
                  },
                  '& .MuiInputBase-input': { fontSize: '11px', py: '10px !important' }
                }}
              />
              <span className="text-[8px] font-medium text-on-surface-variant block ml-1 opacity-70">
                Escriba un nombre descriptivo único para identificar el almacén en los reportes.
              </span>
            </div>

            {/* Switch Estado del Almacén */}
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-on-surface uppercase tracking-wider leading-none">
                  Estado Operativo
                </p>
                <p className="text-[8px] font-semibold text-on-surface-variant uppercase tracking-tight">
                  {formData.activo ? 'Permite transacciones y movimiento de inventario' : 'Bloquea operaciones temporales en este almacén'}
                </p>
              </div>
              <Switch
                size="small"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                sx={switchSx}
              />
            </div>
          </div>

          {/* ── BLOQUE 2: Áreas & Roles Especiales ── */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Operaciones & Producción</span>
            </div>

            {/* Area de producción */}
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/60 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">factory</span>
                  <p className="text-[10px] font-black text-on-surface uppercase tracking-wider leading-none">
                    Área de Producción
                  </p>
                </div>
                <p className="text-[8px] font-semibold text-on-surface-variant uppercase tracking-tight">
                  Habilita el flujo de transformación e insumos dentro de una planta productiva
                </p>
              </div>
              <Switch
                size="small"
                checked={formData.produccion}
                onChange={(e) => setFormData({ ...formData, produccion: e.target.checked })}
                sx={switchSx}
              />
            </div>
          </div>

          {/* ── BLOQUE 3: Flujos de Solicitudes y Gestión PI ── */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">swap_horizontal_circle</span>
                <span className="text-[10px] font-black uppercase tracking-widest font-headline">Flujos de Trabajo & Transferencias</span>
              </div>
            </div>

            {/* Switch Gestión PI */}
            <div className={`p-3.5 rounded-xl border transition-all ${formData.gestion_pi
                ? 'bg-primary/10 border-primary/40 shadow-sm'
                : 'bg-surface border-outline-variant/60'
              }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${formData.gestion_pi ? 'text-primary' : 'text-on-surface-variant'}`}>
                      inventory_2
                    </span>
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-wider leading-none">
                      Gestión de Productos Intermedios (PI)
                    </p>
                  </div>
                  <p className="text-[8px] font-semibold text-on-surface-variant uppercase tracking-tight">
                    Administra stock central de insumos elaborados y concentrados
                  </p>
                </div>
                <Switch
                  size="small"
                  checked={formData.gestion_pi}
                  onChange={(e) => handleGestionPiChange(e.target.checked)}
                  sx={switchSx}
                />
              </div>

              {/* Mensajes informativos de Gestión PI */}
              {anotherHasGestionPi && !formData.gestion_pi && (
                <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-700 dark:text-amber-400">
                  <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">warning</span>
                  <span className="text-[7.5px] font-black uppercase tracking-tight leading-normal">
                    Importante: Solo un almacén en todo el sistema puede tener activa la "Gestión PI". Si lo activa aquí, se deshabilitará en otros almacenes al guardar.
                  </span>
                </div>
              )}

              {formData.gestion_pi && (
                <div className="mt-2.5 p-2 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">info</span>
                  <span className="text-[7.5px] font-black uppercase tracking-tight leading-normal">
                    Nota: Al activar Gestión PI, las opciones directas de "Solicitud a Planta" y "Entrega a Planta" quedan inhabilitadas por regla de negocio.
                  </span>
                </div>
              )}
            </div>

            {/* Sub-bloque: Solicitud y Entrega Planta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

              {/* Solicitud Planta */}
              <div className={`p-3 rounded-xl border transition-all ${formData.gestion_pi
                  ? 'opacity-40 bg-surface-variant/40 border-outline-variant/30 pointer-events-none'
                  : 'bg-surface border-outline-variant/60 hover:border-primary/40'
                }`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">send</span>
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-wider">Solicitud Planta</span>
                  </div>
                  <Switch
                    size="small"
                    checked={formData.solicitud_planta && !formData.gestion_pi}
                    disabled={formData.gestion_pi}
                    onChange={(e) => setFormData({ ...formData, solicitud_planta: e.target.checked })}
                    sx={switchSx}
                  />
                </div>
                <p className="text-[7.5px] font-semibold text-on-surface-variant uppercase tracking-tight">
                  {formData.gestion_pi ? 'No aplicable en almacén PI' : 'Puede requerir materia prima a la planta'}
                </p>
              </div>

              {/* Entrega Planta */}
              <div className={`p-3 rounded-xl border transition-all ${formData.gestion_pi
                  ? 'opacity-40 bg-surface-variant/40 border-outline-variant/30 pointer-events-none'
                  : 'bg-surface border-outline-variant/60 hover:border-primary/40'
                }`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">output</span>
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-wider">Entrega Planta</span>
                  </div>
                  <Switch
                    size="small"
                    checked={formData.entrega_planta && !formData.gestion_pi}
                    disabled={formData.gestion_pi}
                    onChange={(e) => setFormData({ ...formData, entrega_planta: e.target.checked })}
                    sx={switchSx}
                  />
                </div>
                <p className="text-[7.5px] font-semibold text-on-surface-variant uppercase tracking-tight">
                  {formData.gestion_pi ? 'No aplicable en almacén PI' : 'Puede despachar productos a planta'}
                </p>
              </div>

            </div>
          </div>

          {/* ── BLOQUE 4: Red de Almacenes Destino (Solicita A) ── */}
          <div className="p-4 bg-surface-variant/40 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/40 pb-2">
              <span className="material-symbols-outlined text-lg">alt_route</span>
              <span className="text-[10px] font-black uppercase tracking-widest font-headline">Vínculos de Requerimiento (Solicita A)</span>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest block ml-0.5">
                Seleccionar Almacenes de Destino
              </label>
              <p className="text-[8px] font-semibold text-on-surface-variant uppercase tracking-tight block ml-0.5">
                Establece a qué almacenes autorizados de la empresa podrá solicitar insumos o productos este almacén.
              </p>

              <Autocomplete
                multiple
                options={availableForSolicita}
                getOptionLabel={(o) => o.DESCRICION || ''}
                value={formData.solicita_a}
                onChange={(_, v) => setFormData({ ...formData, solicita_a: v as AlmacenOption[] })}
                isOptionEqualToValue={(option, value) => option.ID_PLANTA_ALMACEN === value.ID_PLANTA_ALMACEN}
                filterSelectedOptions={true}
                noOptionsText="No hay más almacenes activos disponibles"
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    return (
                      <Chip
                        key={option.ID_PLANTA_ALMACEN}
                        label={option.DESCRICION}
                        {...tagProps}
                        size="small"
                        sx={{
                          fontSize: '8.5px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          height: 24,
                          borderRadius: '10px',
                          bgcolor: 'var(--primary, #9d0013)',
                          color: '#ffffff',
                          boxShadow: '0 2px 4px rgba(157, 0, 19, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '14px',
                            '&:hover': { color: '#ffffff' }
                          }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder={formData.solicita_a.length === 0 ? 'Buscar almacén...' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        bgcolor: 'var(--surface, #ffffff)',
                        color: 'var(--on-surface)',
                        fontSize: '11px',
                        py: '4px',
                        '& fieldset': { borderColor: 'var(--border-outline-variant, #e4e4e7)' },
                        '&:hover fieldset': { borderColor: 'var(--primary, #9d0013)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--primary, #9d0013)' },
                      }
                    }}
                  />
                )}
              />
            </div>
          </div>

        </div>
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
        <Button
          onClick={handleCancel}
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
          disabled={!formData.nombre.trim()}
          icon={isEditing ? 'check_circle' : 'save'}
          className="!h-9 !px-8 shadow-lg shadow-primary/20"
        >
          {isEditing ? 'Guardar Cambios' : 'Registrar Almacén'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNewAlmacen;

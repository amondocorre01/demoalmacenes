import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete,
    Button,
    IconButton,
    Box,
    Switch,
    useTheme,
    useMediaQuery
} from '@mui/material';

interface ModalRegistroGrupoProductoProps {
    open: boolean;
    onClose: () => void;
    onSave?: (data: any) => void;
    initialData?: any;
}

const ModalRegistroGrupoProducto: React.FC<ModalRegistroGrupoProductoProps> = ({
    open,
    onClose,
    onSave,
    initialData
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [formData, setFormData] = React.useState({
        nombre: '',
        tipo: 'INSUMOS',
        unidad: 'Kilogramos (kg)',
        merma: '0.00',
        stockMinimo: '0',
        stockDeseado: '0',
        permitirDecimales: false,
        descontadoMerma: true,
        conteoManual: false,
        estado: 'Activo',
        ...initialData
    });

    const tipos = ['INSUMOS', 'SERVICIOS', 'ACTIVOS'];
    const unidades = ['Kilogramos (kg)', 'Litros (L)', 'Unidades (u)', 'Metros (m)', 'Cajas (cj)'];

    const handleSave = () => {
        if (onSave) onSave(formData);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: isMobile ? 0 : '2rem',
                        p: 0,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle sx={{ p: 1.5, px: 4 }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-xl">category</span>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Inventarios Técnicos</p>
                            <p className="text-xl font-black text-zinc-900 uppercase tracking-tight leading-none">Registro de Grupo</p>
                        </div>
                    </div>
                    <IconButton onClick={onClose} size="small" className="bg-zinc-100 hover:bg-zinc-200">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </IconButton>
                </div>
            </DialogTitle>

            <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
                <div className="grid grid-cols-12 gap-8">
                    {/* Main Info */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                Identificación del Grupo
                            </p>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Grupo (*)</label>
                                <TextField
                                    fullWidth
                                    placeholder="EJ. FILTROS DE GRANO FINO"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Clasificación Técnica</label>
                                    <Autocomplete
                                        options={tipos}
                                        value={formData.tipo}
                                        onChange={(_, v) => setFormData({ ...formData, tipo: v || 'INSUMOS' })}
                                        renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }} />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Unidad Principal</label>
                                    <Autocomplete
                                        options={unidades}
                                        value={formData.unidad}
                                        onChange={(_, v) => setFormData({ ...formData, unidad: v || '' })}
                                        renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }} />}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                Metría y Alertas
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mermas %</label>
                                    <TextField
                                        type="number"
                                        value={formData.merma}
                                        onChange={(e) => setFormData({ ...formData, merma: e.target.value })}
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Mínimo</label>
                                    <TextField
                                        type="number"
                                        value={formData.stockMinimo}
                                        onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Ideal</label>
                                    <TextField
                                        type="number"
                                        value={formData.stockDeseado}
                                        onChange={(e) => setFormData({ ...formData, stockDeseado: e.target.value })}
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc.50' } }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration / Logic */}
                    <div className="col-span-12 lg:col-span-5 bg-zinc-50 p-6 rounded-[1.5rem] border border-zinc-100 flex flex-col gap-6">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Configuración Lógica</p>

                        <div className="space-y-6">
                            {[
                                { key: 'permitirDecimales', label: 'Estado Decimal', desc: 'Permitir fracciones en el conteo' },
                                { key: 'descontadoMerma', label: 'Descontado %', desc: 'Aplicar merma automática en salida' },
                                { key: 'conteoManual', label: 'Conteo Manual', desc: 'Exigir validación física periódica' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">{item.desc}</p>
                                    </div>
                                    <Switch
                                        size="small"
                                        checked={(formData as any)[item.key]}
                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                    />
                                </div>
                            ))}
                        </div>

                        <Box sx={{ mt: 'auto', pt: 4 }} className="space-y-3">
                            <div className="p-4 bg-white rounded-xl border border-zinc-200">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Estado del Grupo</p>
                                <Autocomplete
                                    options={['Activo', 'Inactivo']}
                                    value={formData.estado}
                                    onChange={(_, v) => setFormData({ ...formData, estado: v || 'Activo' })}
                                    renderInput={(params) => <TextField {...params} size="small" variant="standard" sx={{ '& .MuiInputBase-input': { fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' } }} />}
                                />
                            </div>
                        </Box>
                    </div>
                </div>
            </DialogContent>

            <DialogActions sx={{ p: 1.5, px: 4, display: 'flex', gap: 1.5, borderTop: '1px solid', borderColor: 'zinc.100' }}>
                <Button onClick={onClose} sx={{ color: 'zinc-400', fontWeight: 900, fontSize: '10px', px: 3 }}>Cancelar</Button>
                <Box sx={{ flexGrow: 1 }} />
                <button
                    onClick={handleSave}
                    className="h-9 px-8 bg-zinc-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-primary transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirmar Registro
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalRegistroGrupoProducto;

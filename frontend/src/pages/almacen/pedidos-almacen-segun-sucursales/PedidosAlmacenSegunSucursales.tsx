/**
 * PedidosAlmacenSegunSucursales.tsx
 * 
 * 1. Propósito de la vista:
 *    Gestión, trazabilidad y control de pedidos y solicitudes de traspaso de productos e insumos
 *    entre almacenes de la planta central y almacenes según requerimientos de sucursales.
 *    Permite registrar nuevas solicitudes, editar pedidos pendientes, despachar y transferir
 *    inventario entre almacenes, y confirmar la recepción de los productos con auditoría completa.
 * 
 * 2. APIs Utilizadas:
 *    - GET   /v1/pedido-almacen/solicitantes                (loadApiGetAlmacenesSolicitantes - Obtener almacenes con permiso y sus destinos)
 *    - GET   /v1/pedido-almacen/productos                   (loadApiGetProductos - Catálogo de insumos e intermedios con stock disponible)
 *    - GET   /v1/pedido-almacen/solicitudes                 (loadApiGetSolicitudes - Listar solicitudes filtradas por almacén y rango de fechas)
 *    - GET   /v1/pedido-almacen/solicitudes/:id             (loadApiGetSolicitudById - Obtener detalle completo y trazabilidad de la solicitud)
 *    - POST  /v1/pedido-almacen/solicitudes                 (loadApiCrearSolicitud - Registrar nueva solicitud entre almacenes)
 *    - PUT   /v1/pedido-almacen/solicitudes                 (loadApiEditarSolicitud - Modificar cantidades de una solicitud pendiente)
 *    - PATCH /v1/pedido-almacen/solicitudes/enviar          (loadApiEnviarSolicitud - Despachar y transferir stock entre almacenes)
 *    - PATCH /v1/pedido-almacen/solicitudes/recibir         (loadApiRecibirSolicitud - Confirmar recepción y aceptar cantidades)
 *    - PATCH /v1/pedido-almacen/solicitudes/:id/cancelar    (loadApiCancelarSolicitud - Anular una solicitud pendiente)
 * 
 * 3. Controles Clave:
 *    - Filtro compuesto por Almacén Solicitante, Almacén Destino y Rango de Fechas con Autocomplete y botón de búsqueda estandarizado.
 *    - Limpieza automática y sincronización de datos de la tabla al modificar los filtros superiores.
 *    - Tabla compacta con buscador tipo píldora en cabecera y paginación estándar responsiva.
 *    - Botones de acción con iconos estandarizados según AGENTS.md (Ver Detalle, Editar, Despachar, Recepcionar, Cancelar).
 *    - Modales ubicados en components/ con diseño corporativo oficial (cabecera roja, tarjetas redondeadas y botones de píldora).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Autocomplete,
    TextField,
    Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import { showAlert } from '../../../config/alerts';
import {
    usePedidosAlmacenSegunSucursalesServices,
    AlmacenSolicitante,
    AlmacenDestino,
    SolicitudPedidoAlmacenItem,
} from './services/usePedidosAlmacenSegunSucursales';
import { ModalNuevaSolicitud } from './components/ModalNuevaSolicitudSucursales';
import { ModalDetalleSolicitud } from './components/ModalDetalleSolicitud';
import { ModalDespachoSolicitud } from './components/ModalDespachoSolicitud';
import { ModalRecepcionSolicitud } from './components/ModalRecepcionSolicitud';

export const PedidosAlmacenSegunSucursales: React.FC = () => {
    const {
        loadApiGetAlmacenesSolicitantes,
        loadApiGetSolicitudes,
        loadApiCancelarSolicitud,
    } = usePedidosAlmacenSegunSucursalesServices();

    // Catálogo de almacenes
    const [solicitantesList, setSolicitantesList] = useState<AlmacenSolicitante[]>([]);

    // Filtros superiores
    const [selectedSolicitante, setSelectedSolicitante] = useState<AlmacenSolicitante | null>(null);
    const [selectedDestino, setSelectedDestino] = useState<AlmacenDestino | null>(null);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

    // Datos principales y estado de carga
    const [solicitudes, setSolicitudes] = useState<SolicitudPedidoAlmacenItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Paginación
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Modales
    const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
    const [editingRequest, setEditingRequest] = useState<SolicitudPedidoAlmacenItem | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [viewingRequest, setViewingRequest] = useState<SolicitudPedidoAlmacenItem | null>(null);

    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
    const [dispatchingRequest, setDispatchingRequest] = useState<SolicitudPedidoAlmacenItem | null>(null);

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
    const [receivingRequest, setReceivingRequest] = useState<SolicitudPedidoAlmacenItem | null>(null);

    // Destinos disponibles para el filtro superior
    const destinosOpciones = useMemo(() => {
        if (!selectedSolicitante) return [];
        return selectedSolicitante.DESTINOS || [];
    }, [selectedSolicitante]);

    // Carga inicial de almacenes solicitantes
    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const almacenes = await loadApiGetAlmacenesSolicitantes();
            setSolicitantesList(almacenes);

            if (almacenes.length > 0) {
                const first = almacenes[0];
                setSelectedSolicitante(first);
                const firstDest = first.DESTINOS.length > 0 ? first.DESTINOS[0] : null;
                setSelectedDestino(firstDest);

                // Cargar solicitudes iniciales
                await fetchSolicitudes(first.ID_PLANTA_ALMACEN, firstDest?.ID_PLANTA_ALMACEN || 0);
            }
        } catch (error) {
            console.error('Error al inicializar datos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Carga de listado de solicitudes
    const fetchSolicitudes = useCallback(
        async (
            idSol = selectedSolicitante?.ID_PLANTA_ALMACEN || 0,
            idDes = selectedDestino?.ID_PLANTA_ALMACEN || 0
        ) => {
            setIsLoading(true);
            try {
                const fi = startDate && startDate.isValid() ? startDate.format('YYYY-MM-DD') : '';
                const ff = endDate && endDate.isValid() ? endDate.format('YYYY-MM-DD') : '';

                const data = await loadApiGetSolicitudes({
                    id_almacen_solicitante: idSol,
                    id_almacen_destino: idDes,
                    fecha_inicio: fi,
                    fecha_fin: ff,
                });

                setSolicitudes(data);
                setPage(1);
            } catch (error) {
                console.error('Error al obtener solicitudes:', error);
                setSolicitudes([]);
            } finally {
                setIsLoading(false);
            }
        },
        [selectedSolicitante, selectedDestino, startDate, endDate, loadApiGetSolicitudes]
    );

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Filtrado por buscador interno tipo píldora
    const filteredSolicitudes = useMemo(() => {
        if (!searchTerm.trim()) return solicitudes;
        const term = searchTerm.toLowerCase().trim();

        return solicitudes.filter((item) => {
            const idStr = String(item.ID_ALMACEN_SOLICITUD_DOCUMENTO || '');
            const sol = (item.ALMACEN_SOLICITANTE || '').toLowerCase();
            const des = (item.ALMACEN_DESTINO || '').toLowerCase();
            const fecha = (item.FECHA_REGISTRO || '').toLowerCase();
            const entrega = (item.FECHA_A_ENTREGAR || '').toLowerCase();

            return (
                idStr.includes(term) ||
                sol.includes(term) ||
                des.includes(term) ||
                fecha.includes(term) ||
                entrega.includes(term)
            );
        });
    }, [solicitudes, searchTerm]);

    // Paginación
    const totalItems = filteredSolicitudes.length;
    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedSolicitudes = useMemo(() => {
        if (pageSize === -1) return filteredSolicitudes;
        const startIndex = (page - 1) * pageSize;
        return filteredSolicitudes.slice(startIndex, startIndex + pageSize);
    }, [filteredSolicitudes, page, pageSize]);

    // Manejo de Cancelación de Solicitud
    const handleCancelRequest = async (item: SolicitudPedidoAlmacenItem) => {
        const confirmed = await showAlert.confirm(
            '¿Cancelar Solicitud?',
            `¿Está seguro de cancelar la Solicitud N° ${item.ID_ALMACEN_SOLICITUD_DOCUMENTO}? Esta acción no se puede deshacer.`
        );

        if (confirmed) {
            setIsLoading(true);
            try {
                const res = await loadApiCancelarSolicitud(item.ID_ALMACEN_SOLICITUD_DOCUMENTO);
                if (res.success) {
                    showAlert.success('Solicitud Cancelada', res.message || 'La solicitud fue cancelada exitosamente.');
                    fetchSolicitudes();
                } else {
                    showAlert.error('Error', res.message || 'No se pudo cancelar la solicitud.');
                }
            } catch (error) {
                console.error('Error al cancelar solicitud:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Helper para renderizar badge de estado
    const renderStatusBadge = (estado: number) => {
        switch (estado) {
            case 1:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pendiente
                    </span>
                );
            case 2:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        Enviado
                    </span>
                );
            case 3:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Recibido
                    </span>
                );
            case 4:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        Cancelado
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-500/10 text-zinc-600 border border-zinc-500/20">
                        Desconocido
                    </span>
                );
        }
    };

    const getStatusText = (estado: number) => {
        switch (estado) {
            case 1: return 'Pendiente';
            case 2: return 'Enviado';
            case 3: return 'Recibido';
            case 4: return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    const getExportData = () => {
        const columns = [
            { header: 'N°', key: 'index', width: 6, align: 'center' as const },
            { header: 'N° SOLICITUD', key: 'idSolicitud', width: 14, align: 'center' as const },
            { header: 'ALMACÉN SOLICITANTE', key: 'solicitante', width: 25 },
            { header: 'ALMACÉN DESTINO', key: 'destino', width: 25 },
            { header: 'FECHA REGISTRO', key: 'fechaReg', width: 16 },
            { header: 'HORA', key: 'horaReg', width: 12 },
            { header: 'FECHA A ENTREGAR', key: 'fechaEnt', width: 16 },
            { header: 'ÍTEMS', key: 'items', width: 10, align: 'center' as const, format: 'number' as const },
            { header: 'ESTADO', key: 'estado', width: 14, align: 'center' as const },
        ];

        const rows = filteredSolicitudes.map((item, idx) => {
            const fechaReg = item.FECHA_REGISTRO ? item.FECHA_REGISTRO.split('T')[0] : '-';
            const fechaEnt = item.FECHA_A_ENTREGAR ? item.FECHA_A_ENTREGAR.split('T')[0] : '-';
            return {
                index: idx + 1,
                idSolicitud: `#${item.ID_ALMACEN_SOLICITUD_DOCUMENTO}`,
                solicitante: item.ALMACEN_SOLICITANTE || '-',
                destino: item.ALMACEN_DESTINO || '-',
                fechaReg,
                horaReg: item.HORA_REGISTRO || '-',
                fechaEnt,
                items: item.DETALLE?.length || 0,
                estado: getStatusText(item.ESTADO),
            };
        });

        return { columns, rows };
    };

    const handleExportExcel = () => {
        const { columns, rows } = getExportData();
        exportTableToExcel({
            filename: `Pedidos_Almacen_${selectedSolicitante?.DESCRICION || 'Todos'}_${dayjs().format('YYYYMMDD_HHmm')}`,
            sheetName: 'Pedidos',
            title: 'SOLICITUDES DE PEDIDOS SEGÚN SUCURSALES',
            subtitle: `Solicitante: ${selectedSolicitante?.DESCRICION || 'Todos'} | Destino: ${selectedDestino?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
            columns,
            rows,
        });
    };

    const handleExportPdf = () => {
        const { columns, rows } = getExportData();
        exportTableToPdf({
            title: 'SOLICITUDES DE PEDIDOS SEGÚN SUCURSALES',
            subtitle: `Solicitante: ${selectedSolicitante?.DESCRICION || 'Todos'} | Destino: ${selectedDestino?.DESCRICION || 'Todos'} | Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
            columns,
            rows,
            orientation: 'landscape',
        });
    };

    return (
        <div className="space-y-4 font-body">
            {/* ── Encabezado Principal ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
                        PEDIDOS DE ALMACÉN SEGÚN SUCURSALES
                    </h1>
                    <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
                        Gestión de solicitudes de reposición, transferencias entre almacenes centrales y control de despacho
                    </p>
                </div>

                {/* Acciones a la derecha */}
                <div className="flex items-center gap-2">
                    <ExportTableButtons
                        onExportExcel={handleExportExcel}
                        onExportPdf={handleExportPdf}
                        disabled={filteredSolicitudes.length === 0}
                    />
                    <Button
                        variant="primary"
                        size="md"
                        icon="add"
                        onClick={() => {
                            setEditingRequest(null);
                            setIsNewModalOpen(true);
                        }}
                        className="!h-10 !px-6 shadow-lg shadow-primary/20 shrink-0"
                    >
                        Nueva Solicitud
                    </Button>
                </div>
            </div>

            {/* ── Barra Superior de Filtros ── */}
            <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Grid container spacing={1.5} alignItems="flex-end">
                    {/* 1. Selector de Almacén Solicitante */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Almacén Solicitante
                            </label>
                            <Autocomplete
                                options={solicitantesList}
                                getOptionLabel={(option) => option.DESCRICION || ''}
                                value={selectedSolicitante}
                                onChange={(_, newValue) => {
                                    setSelectedSolicitante(newValue);
                                    setSelectedDestino(newValue && newValue.DESTINOS.length > 0 ? newValue.DESTINOS[0] : null);
                                    setSolicitudes([]);
                                    setPage(1);
                                }}
                                isOptionEqualToValue={(option, value) =>
                                    option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                                }
                                fullWidth
                                noOptionsText="No hay almacenes solicitantes"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '15px',
                                        backgroundColor: 'var(--input-bg, var(--surface))',
                                        color: 'var(--on-surface)',
                                        padding: '3px 8px',
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
                                renderInput={(params) => (
                                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />
                                )}
                            />
                        </div>
                    </Grid>

                    {/* 2. Selector de Almacén Destino */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Almacén Destino
                            </label>
                            <Autocomplete
                                options={destinosOpciones}
                                getOptionLabel={(option) => option.DESCRICION || ''}
                                value={selectedDestino}
                                onChange={(_, newValue) => {
                                    setSelectedDestino(newValue);
                                    setSolicitudes([]);
                                    setPage(1);
                                }}
                                isOptionEqualToValue={(option, value) =>
                                    option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
                                }
                                fullWidth
                                noOptionsText="No hay destinos configurados"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '15px',
                                        backgroundColor: 'var(--input-bg, var(--surface))',
                                        color: 'var(--on-surface)',
                                        padding: '3px 8px',
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
                                renderInput={(params) => (
                                    <TextField {...params} variant="outlined" size="small" placeholder="SELECCIONAR..." />
                                )}
                            />
                        </div>
                    </Grid>

                    {/* 3. Fecha Inicio */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Fecha Inicio
                            </label>
                            <DatePicker
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    setSolicitudes([]);
                                    setPage(1);
                                }}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '15px',
                                                backgroundColor: 'var(--input-bg, var(--surface))',
                                                color: 'var(--on-surface)',
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
                                        },
                                    },
                                }}
                            />
                        </div>
                    </Grid>

                    {/* 4. Fecha Fin */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Fecha Fin
                            </label>
                            <DatePicker
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                    setSolicitudes([]);
                                    setPage(1);
                                }}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '15px',
                                                backgroundColor: 'var(--input-bg, var(--surface))',
                                                color: 'var(--on-surface)',
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
                                        },
                                    },
                                }}
                            />
                        </div>
                    </Grid>

                    {/* 5. Botón de Búsqueda Estandarizado */}
                    <Grid size={{ xs: 12, sm: 6, md: 1 }} sx={{ paddingTop: { xs: '0px', sm: '22px', md: '22px' } }}>
                        <div className="flex justify-start pb-0.5">
                            <button
                                type="button"
                                onClick={() => fetchSolicitudes()}
                                title="Buscar Solicitudes"
                                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
                            >
                                <span className="material-symbols-outlined text-2xl font-bold">search</span>
                            </button>
                        </div>
                    </Grid>
                </Grid>
            </div>

            {/* ── Main Data Canvas (Tabla Unificada) ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                {/* Cabecera de la tabla con Buscador tipo Píldora */}
                <div className="px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-headline">
                            HISTORIAL DE SOLICITUDES ({filteredSolicitudes.length} REGISTROS)
                        </p>
                    </div>

                    <div className="relative group w-48 ml-2">
                        <input
                            type="text"
                            placeholder="BUSCAR..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-100 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                            search
                        </span>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800">
                                <th className="pl-6 pr-2 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">N°</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">N° Solicitud</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Almacén Solicitante</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Almacén Destino</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Fecha Registro</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">Fecha a Entregar</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">Ítems</th>
                                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">Estado</th>
                                <th className="pr-6 pl-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {paginatedSolicitudes.length > 0 ? (
                                paginatedSolicitudes.map((item, idx) => {
                                    const globalIdx = pageSize === -1 ? idx + 1 : (page - 1) * pageSize + idx + 1;
                                    const fechaReg = item.FECHA_REGISTRO ? item.FECHA_REGISTRO.split('T')[0] : '-';
                                    const fechaEnt = item.FECHA_A_ENTREGAR ? item.FECHA_A_ENTREGAR.split('T')[0] : '-';

                                    return (
                                        <tr
                                            key={item.ID_ALMACEN_SOLICITUD_DOCUMENTO || idx}
                                            className="hover:bg-zinc-50/40 dark:hover:bg-zinc-850/40 transition-colors"
                                        >
                                            {/* N° */}
                                            <td className="pl-6 pr-2 py-2.5 font-black text-xs text-primary whitespace-nowrap">
                                                {globalIdx}
                                            </td>

                                            {/* ID Solicitud */}
                                            <td className="px-3 py-2.5 font-black text-xs text-on-surface whitespace-nowrap">
                                                #{item.ID_ALMACEN_SOLICITUD_DOCUMENTO}
                                            </td>

                                            {/* Almacén Solicitante */}
                                            <td className="px-3 py-2.5 text-xs font-black text-on-surface">
                                                {item.ALMACEN_SOLICITANTE || '-'}
                                            </td>

                                            {/* Almacén Destino */}
                                            <td className="px-3 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                                {item.ALMACEN_DESTINO || '-'}
                                            </td>

                                            {/* Fecha Registro */}
                                            <td className="px-3 py-2.5 text-xs font-bold text-zinc-500 whitespace-nowrap">
                                                {fechaReg} <span className="text-[10px] text-zinc-400">{item.HORA_REGISTRO || ''}</span>
                                            </td>

                                            {/* Fecha Entrega */}
                                            <td className="px-3 py-2.5 text-xs font-black text-primary whitespace-nowrap">
                                                {fechaEnt}
                                            </td>

                                            {/* Cantidad Ítems */}
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-surface-variant text-on-surface border border-outline-variant">
                                                    {item.DETALLE?.length || 0}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                {renderStatusBadge(item.ESTADO)}
                                            </td>

                                            {/* Acciones */}
                                            <td className="pr-6 pl-3 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Ver Detalle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setViewingRequest(item);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                        title="Ver Detalle"
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px] sm:text-base">visibility</span>
                                                    </button>

                                                    {/* Editar (Solo si Pendiente Estado === 1) */}
                                                    {item.ESTADO === 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingRequest(item);
                                                                setIsNewModalOpen(true);
                                                            }}
                                                            title="Editar Solicitud"
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-base">edit</span>
                                                        </button>
                                                    )}

                                                    {/* Despachar / Enviar (Solo si Pendiente Estado === 1) */}
                                                    {item.ESTADO === 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDispatchingRequest(item);
                                                                setIsDispatchModalOpen(true);
                                                            }}
                                                            title="Despachar / Enviar Productos"
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/10 hover:bg-sky-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-base">local_shipping</span>
                                                        </button>
                                                    )}

                                                    {/* Recepcionar / Confirmar (Solo si Enviado Estado === 2) */}
                                                    {item.ESTADO === 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReceivingRequest(item);
                                                                setIsReceiveModalOpen(true);
                                                            }}
                                                            title="Recepcionar Pedido"
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-base">inventory</span>
                                                        </button>
                                                    )}

                                                    {/* Cancelar Solicitud (Solo si Pendiente Estado === 1) */}
                                                    {item.ESTADO === 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelRequest(item)}
                                                            title="Cancelar Solicitud"
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10 hover:bg-red-600 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-base">cancel</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest"
                                    >
                                        {isLoading ? 'Cargando solicitudes...' : 'No se encontraron solicitudes registradas'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Footer / Paginación Estándar ── */}
                {!isLoading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                                    Mostrar:
                                </span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-350 px-2.5 outline-none shadow-sm cursor-pointer"
                                >
                                    <option value={5}>5 filas</option>
                                    <option value={10}>10 filas</option>
                                    <option value={20}>20 filas</option>
                                    <option value={50}>50 filas</option>
                                    <option value={-1}>Todos ({totalItems})</option>
                                </select>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                                Mostrando {totalItems > 0 ? (pageSize === -1 ? 1 : (page - 1) * pageSize + 1) : 0}-{pageSize === -1 ? totalItems : Math.min(page * pageSize, totalItems)} de {totalItems} registros
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1 || pageSize === -1}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                            </button>
                            <span className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-2">
                                Página {pageSize === -1 ? 1 : page} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages || pageSize === -1}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal Nueva / Editar Solicitud ── */}
            <ModalNuevaSolicitud
                open={isNewModalOpen}
                onClose={() => {
                    setIsNewModalOpen(false);
                    setEditingRequest(null);
                }}
                onSuccess={() => fetchSolicitudes()}
                solicitantes={solicitantesList}
                editingRequest={editingRequest}
            />

            {/* ── Modal Detalle Solicitud ── */}
            <ModalDetalleSolicitud
                open={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setViewingRequest(null);
                }}
                requestItem={viewingRequest}
            />

            {/* ── Modal Despacho / Envío ── */}
            <ModalDespachoSolicitud
                open={isDispatchModalOpen}
                onClose={() => {
                    setIsDispatchModalOpen(false);
                    setDispatchingRequest(null);
                }}
                onSuccess={() => fetchSolicitudes()}
                requestItem={dispatchingRequest}
            />

            {/* ── Modal Recepción de Solicitud ── */}
            <ModalRecepcionSolicitud
                open={isReceiveModalOpen}
                onClose={() => {
                    setIsReceiveModalOpen(false);
                    setReceivingRequest(null);
                }}
                onSuccess={() => fetchSolicitudes()}
                requestItem={receivingRequest}
            />

            {/* ── Loading Overlay ── */}
            <LoadingOverlay show={isLoading} message="Cargando solicitudes..." />
        </div>
    );
};

export default PedidosAlmacenSegunSucursales;

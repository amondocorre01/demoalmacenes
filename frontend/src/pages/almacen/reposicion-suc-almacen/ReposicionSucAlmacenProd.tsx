/**
 * ReposicionSucAlmacenProd.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, auditoría y control de ventas y reposiciones por sucursal / canal de venta.
 *    Permite auditar las ventas registradas por reposición, visualizar el detalle de
 *    productos asociados y asignar o reasignar empleados responsables que asumen la reposición.
 *
 * 2. APIs Utilizadas:
 *    - GET /v1/reposicion/canales-venta
 *      (loadApiGetCanalesVenta - Obtener lista de canales de venta de reposición).
 *    - GET /v1/reposicion/ventas?fecha_inicio&fecha_fin&id_nombre_lista_precio
 *      (loadApiGetVentas - Obtener ventas de reposición, lista de empleados autorizados y bandera de edición).
 *    - PUT /v1/reposicion/ventas
 *      (loadApiUpdateVentas - Asignar empleado a ventas de reposición y registrar log de auditoría).
 *
 * 3. Controles Clave y Reglas de Negocio:
 *    - Selector de Canal de Venta mediante <Autocomplete> de MUI priorizando por defecto el ID = 29.
 *    - Filtro por rango de fechas (Fecha Inicio y Fecha Fin) con reseteo de lista al cambiar parámetros.
 *    - Control de Edición (bandera `editar`):
 *      * El backend valida si la fecha fin seleccionada está dentro de los 2 días permitidos para edición.
 *      * Si `editar === false`, la vista funciona en modo solo lectura deshabilitando modificaciones.
 *    - Métricas interactivas centralizadas (Total Ventas, Con Responsable, Sin Asignar).
 *    - Asignación rápida de responsable tanto en línea (inline) como a través de modal estandarizado.
 *    - Modal estandarizado para visualización del detalle de productos por venta.
 *    - Exportación de auditoría en formato CSV.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Autocomplete, TextField, Tooltip, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
    useReposicionSucAlmacenProductosServices,
    CanalVentaItem,
    EmpleadoItem,
    VentaReposicionItem,
} from './services/useReposicionSucAlmacenProd';
import { ModalDetalleProductosVenta } from './components/ModalDetalleProductosVenta';
import { ModalAsignarEmpleado } from './components/ModalAsignarEmpleado';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';

import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf, TableColumnConfig } from '../../../utils/exportTableHelper';

export const ReposicionSucAlmacenProd: React.FC = () => {
    const { loadApiGetCanalesVenta, loadApiGetVentas, loadApiUpdateVentas } =
        useReposicionSucAlmacenProductosServices();

    // Estados de datos principales
    const [canales, setCanales] = useState<CanalVentaItem[]>([]);
    const [selectedCanal, setSelectedCanal] = useState<CanalVentaItem | null>(null);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('month'));

    const [itemsList, setItemsList] = useState<VentaReposicionItem[]>([]);
    const [empleadosList, setEmpleadosList] = useState<EmpleadoItem[]>([]);
    const [canEdit, setCanEdit] = useState<boolean>(true);

    // Estados de carga y asignación
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAssigningId, setIsAssigningId] = useState<number | string | null>(null);

    // Modales
    const [modalDetalleOpen, setModalDetalleOpen] = useState<boolean>(false);
    const [selectedVentaForDetalle, setSelectedVentaForDetalle] =
        useState<VentaReposicionItem | null>(null);

    const [modalAsignarOpen, setModalAsignarOpen] = useState<boolean>(false);
    const [selectedVentaForAsignar, setSelectedVentaForAsignar] =
        useState<VentaReposicionItem | null>(null);

    // Filtros de tabla y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [kpiFilter, setKpiFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Cargar canales de venta al montar la vista
    useEffect(() => {
        const fetchCanales = async () => {
            setIsLoading(true);
            try {
                const list = await loadApiGetCanalesVenta();
                if (list && list.length > 0) {
                    setCanales(list);
                    // Priorizar y seleccionar por defecto el canal con ID = 29
                    const defaultCanal =
                        list.find((c: any) => {
                            const id =
                                c.ID_NOMBRE_LISTA_PRECIOS ??
                                c.ID_NOMBRE_LISTA_PRECIO ??
                                c.id_nombre_lista_precio ??
                                c.id ??
                                c.ID;
                            return Number(id) === 29;
                        }) || list[0];

                    setSelectedCanal(defaultCanal);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchCanales();
    }, [loadApiGetCanalesVenta]);

    // Consultar ventas de reposición
    const handleFetchVentas = useCallback(async () => {
        if (!selectedCanal) {
            showAlert.error('Canal Requerido', 'Por favor seleccione un canal de venta.');
            return;
        }

        if (!startDate || !endDate) {
            showAlert.error('Fechas Requeridas', 'Por favor seleccione un rango de fechas válido.');
            return;
        }

        setIsLoading(true);
        try {
            const fi = startDate.format('YYYY-MM-DD');
            const ff = endDate.format('YYYY-MM-DD');
            const canalId =
                selectedCanal?.ID_NOMBRE_LISTA_PRECIOS ??
                selectedCanal?.ID_NOMBRE_LISTA_PRECIO ??
                selectedCanal?.id_nombre_lista_precio ??
                0;

            const res = await loadApiGetVentas({
                fecha_inicio: fi,
                fecha_fin: ff,
                id_nombre_lista_precio: Number(canalId),
            });

            setItemsList(res.data || []);
            setEmpleadosList(res.empleados || []);
            setCanEdit(res.editar);
            setPage(1);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, selectedCanal, loadApiGetVentas]);

    // Asignación rápida en línea directamente desde la tabla
    const handleInlineAssignEmpleado = async (
        item: VentaReposicionItem,
        newEmpleado: EmpleadoItem | null
    ) => {
        if (!newEmpleado) return;
        if (!canEdit) {
            showAlert.error(
                'Modo Solo Lectura',
                'No está permitido editar las asignaciones para este rango de fecha.'
            );
            return;
        }

        const idVenta =
            item.ID_VENTAS_REPOSICION_SUCURSAL ||
            item.ID_VENTA_REPOSICION ||
            item.id_venta_reposicion ||
            item.ID_VENTA;

        if (!idVenta) {
            showAlert.error('Error', 'No se pudo identificar el registro de la venta.');
            return;
        }

        setIsAssigningId(idVenta);
        const res = await loadApiUpdateVentas([
            {
                id_venta_reposicion: idVenta,
                id_empleado: Number(newEmpleado.ID_EMPLEADO),
            },
        ]);
        setIsAssigningId(null);

        if (res.success) {
            setItemsList((prev) =>
                prev.map((row) => {
                    const rowId =
                        row.ID_VENTAS_REPOSICION_SUCURSAL ||
                        row.ID_VENTA_REPOSICION ||
                        row.id_venta_reposicion ||
                        row.ID_VENTA;

                    if (rowId === idVenta) {
                        return {
                            ...row,
                            ID_EMPLEADO_ASUMIDO: newEmpleado.ID_EMPLEADO,
                            id_empleado: newEmpleado.ID_EMPLEADO,
                            NOMBRE_COMPLETO: newEmpleado.NOMBRE_COMPLETO,
                            EMPLEADO: newEmpleado.NOMBRE_COMPLETO,
                            EMPLEADO_ASUMIDO: newEmpleado.NOMBRE_COMPLETO,
                        };
                    }
                    return row;
                })
            );
            showAlert.success(
                'Empleado Asignado',
                `Se asignó a ${newEmpleado.NOMBRE_COMPLETO} correctamente.`
            );
        } else {
            showAlert.error('Error', res.message || 'No se pudo guardar la asignación.');
        }
    };

    // Actualización exitosa desde modal
    const handleModalAssignSuccess = (idVenta: number | string, nuevoEmpleado: EmpleadoItem) => {
        setItemsList((prev) =>
            prev.map((row) => {
                const rowId =
                    row.ID_VENTAS_REPOSICION_SUCURSAL ||
                    row.ID_VENTA_REPOSICION ||
                    row.id_venta_reposicion ||
                    row.ID_VENTA;

                if (rowId === idVenta) {
                    return {
                        ...row,
                        ID_EMPLEADO_ASUMIDO: nuevoEmpleado.ID_EMPLEADO,
                        id_empleado: nuevoEmpleado.ID_EMPLEADO,
                        NOMBRE_COMPLETO: nuevoEmpleado.NOMBRE_COMPLETO,
                        EMPLEADO: nuevoEmpleado.NOMBRE_COMPLETO,
                        EMPLEADO_ASUMIDO: nuevoEmpleado.NOMBRE_COMPLETO,
                    };
                }
                return row;
            })
        );
    };

    // Abrir Modal de Detalle
    const handleOpenDetalleModal = (item: VentaReposicionItem) => {
        setSelectedVentaForDetalle(item);
        setModalDetalleOpen(true);
    };

    // Abrir Modal de Asignar Empleado
    const handleOpenAsignarModal = (item: VentaReposicionItem) => {
        if (!canEdit) {
            showAlert.error(
                'Modo Solo Lectura',
                'No está permitido editar las asignaciones para el rango de fechas seleccionado.'
            );
            return;
        }
        setSelectedVentaForAsignar(item);
        setModalAsignarOpen(true);
    };

    // Filtrado reactivo en tabla (Buscador + KPI)
    const filteredItems = useMemo(() => {
        return itemsList.filter((item) => {
            const empId = item.ID_EMPLEADO_ASUMIDO || item.id_empleado;
            const empName =
                item.NOMBRE_COMPLETO || item.EMPLEADO || item.EMPLEADO_ASUMIDO || '';
            const hasResponsible =
                (empId != null && Number(empId) > 0) ||
                (empName.trim() !== '' &&
                    empName.trim().toUpperCase() !== 'SIN ASIGNAR' &&
                    empName.trim().toUpperCase() !== 'NULL');

            if (kpiFilter === 'assigned' && !hasResponsible) return false;
            if (kpiFilter === 'unassigned' && hasResponsible) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const sucursal = (
                item.NOMBRE_LISTA_PRECIOS ||
                item.SUCURSAL ||
                item.CANAL_VENTA ||
                ''
            ).toLowerCase();
            const emp = empName.toLowerCase();
            const idStr = String(
                item.ID_VENTAS_REPOSICION_SUCURSAL ||
                item.ID_VENTA_REPOSICION ||
                item.id_venta_reposicion ||
                ''
            );

            return sucursal.includes(term) || emp.includes(term) || idStr.includes(term);
        });
    }, [itemsList, kpiFilter, searchTerm]);

    // Paginación
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, page, pageSize]);

    // Métricas
    const totalAssumedCost = useMemo(() => {
        return itemsList.reduce((acc, curr) => {
            const val = Number(
                curr.TOTAL ?? curr.TOTAL_VENTA ?? curr.TOTAL_ASUMIDO ?? curr.total ?? 0
            );
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    }, [itemsList]);

    const assignedCount = useMemo(() => {
        return itemsList.filter((item) => {
            const empId = item.ID_EMPLEADO_ASUMIDO || item.id_empleado;
            const empName =
                item.NOMBRE_COMPLETO || item.EMPLEADO || item.EMPLEADO_ASUMIDO || '';
            return (
                (empId != null && Number(empId) > 0) ||
                (empName.trim() !== '' &&
                    empName.trim().toUpperCase() !== 'SIN ASIGNAR' &&
                    empName.trim().toUpperCase() !== 'NULL')
            );
        }).length;
    }, [itemsList]);

    const unassignedCount = useMemo(() => {
        return itemsList.length - assignedCount;
    }, [itemsList.length, assignedCount]);

    // Formateador de Fecha y Hora seguro
    const formatDateTimeDisplay = (
        dateString?: string
    ): { date: string; time: string } => {
        if (!dateString) return { date: '-', time: '' };
        try {
            let datePart = '';
            let timePart = '';
            if (dateString.includes('T')) {
                const [d, t] = dateString.split('T');
                datePart = d;
                timePart = t.replace('Z', '').split('.')[0];
            } else if (dateString.includes(' ')) {
                const [d, t] = dateString.split(' ');
                datePart = d;
                timePart = t.split('.')[0];
            } else {
                datePart = dateString;
            }
            const [year, month, day] = datePart.split('-');
            const formattedDate =
                year && month && day ? `${day}/${month}/${year}` : datePart;
            return { date: formattedDate, time: timePart ? timePart.substring(0, 5) : '' };
        } catch {
            return { date: dateString, time: '' };
        }
    };

    const exportColumns: TableColumnConfig[] = [
        { header: 'N°', width: 45, align: 'center', type: 'number' },
        { header: 'Fecha Venta', width: 90, align: 'center' },
        { header: 'Hora', width: 65, align: 'center' },
        { header: 'Canal / Sucursal', width: 180, align: 'left' },
        { header: 'Cantidad Productos', width: 90, align: 'center', type: 'number' },
        { header: 'Total Venta (Bs.)', width: 110, align: 'right', type: 'currency' },
        { header: 'Empleado Responsable', width: 200, align: 'left' },
        { header: 'Observación', width: 220, align: 'left' },
    ];

    const getExportData = () => {
        return filteredItems.map((item, idx) => {
            const dateTime = formatDateTimeDisplay(
                item.FECHA_REGISTRO || item.FECHA_VENTA || item.FECHA || item.fecha
            );
            const sucursal =
                item.NOMBRE_LISTA_PRECIOS || item.SUCURSAL || item.CANAL_VENTA || '-';
            const empleado =
                item.NOMBRE_COMPLETO || item.EMPLEADO || item.EMPLEADO_ASUMIDO || 'Sin Asignar';
            const total = Number(
                item.TOTAL ?? item.TOTAL_VENTA ?? item.TOTAL_ASUMIDO ?? 0
            );
            const prodCount = Array.isArray(item.PRODUCTOS) ? item.PRODUCTOS.length : 0;
            const obs = item.OBSERVACION || '-';

            return [
                idx + 1,
                dateTime.date,
                dateTime.time,
                sucursal,
                prodCount,
                total,
                empleado,
                obs,
            ];
        });
    };

    const handleExportExcel = () => {
        const data = getExportData();
        const canalName = selectedCanal?.NOMBRE_LISTA_PRECIOS || selectedCanal?.NOMBRE || 'TODOS';
        const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
        const ff = endDate ? endDate.format('DD/MM/YYYY') : '';

        exportTableToExcel({
            title: 'REPOSICIÓN DE PRODUCTOS POR SUCURSAL',
            subtitle: `CANAL: ${canalName}   |   RANGO: ${fi} AL ${ff}`,
            filename: `reposicion_sucursales_${dayjs().format('YYYYMMDD_HHmm')}`,
            columns: exportColumns,
            data,
            totals: ['', '', '', 'TOTAL GENERAL', '', totalAssumedCost, '', ''],
        });
    };

    const handleExportPdf = () => {
        const data = getExportData();
        const canalName = selectedCanal?.NOMBRE_LISTA_PRECIOS || selectedCanal?.NOMBRE || 'TODOS';
        const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
        const ff = endDate ? endDate.format('DD/MM/YYYY') : '';

        exportTableToPdf({
            title: 'REPOSICIÓN DE PRODUCTOS POR SUCURSAL',
            subtitle: `CANAL: ${canalName}   |   RANGO: ${fi} AL ${ff}`,
            columns: exportColumns,
            data,
            totals: ['', '', '', 'TOTAL GENERAL', '', totalAssumedCost, '', ''],
        });
    };

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-2 p-2 sm:p-0 animate-in fade-in duration-300">
            <LoadingOverlay
                show={isLoading}
                message="Cargando reposición de sucursales..."
            />

            {/* ── Encabezado Principal Estandarizado ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
                        REPOSICIÓN DE PRODUCTOS POR SUCURSAL
                    </h1>
                    <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
                        Control cronológico, trazabilidad de reposiciones por canal y asignación de personal responsable
                    </p>
                </div>

                {/* Acciones del Encabezado con Botón Estandarizado Excel/PDF */}
                <ExportTableButtons
                    onExportExcel={handleExportExcel}
                    onExportPdf={handleExportPdf}
                    disabled={filteredItems.length === 0}
                />
            </div>

            {/* ── Barra Superior de Filtros ── */}
            <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4">
                <Grid container spacing={1.5} alignItems="flex-end">
                    {/* 1. Canal de Venta / Sucursal */}
                    <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Canal de Venta / Sucursal
                            </label>
                            <Autocomplete
                                options={canales}
                                getOptionLabel={(option) =>
                                    option.NOMBRE_LISTA_PRECIOS ||
                                    option.NOMBRE ||
                                    option.nombre ||
                                    'Canal sin nombre'
                                }
                                value={selectedCanal}
                                onChange={(_, newValue) => {
                                    setSelectedCanal(newValue);
                                    setItemsList([]);
                                }}
                                isOptionEqualToValue={(option, value) => {
                                    const optId =
                                        option.ID_NOMBRE_LISTA_PRECIOS ??
                                        option.ID_NOMBRE_LISTA_PRECIO ??
                                        option.id_nombre_lista_precio;
                                    const valId =
                                        value?.ID_NOMBRE_LISTA_PRECIOS ??
                                        value?.ID_NOMBRE_LISTA_PRECIO ??
                                        value?.id_nombre_lista_precio;
                                    return optId === valId;
                                }}
                                fullWidth
                                disableClearable={Boolean(selectedCanal)}
                                noOptionsText="No hay canales disponibles"
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
                                        placeholder="SELECCIONAR CANAL DE VENTA..."
                                    />
                                )}
                            />
                        </div>
                    </Grid>

                    {/* 2. Fecha Inicio */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Fecha Inicio
                            </label>
                            <DatePicker
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    setItemsList([]);
                                }}
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
                                                    borderColor: 'var(--outline-variant)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'var(--outline)',
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

                    {/* 3. Fecha Fin */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <div className="w-full space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                                Fecha Fin
                            </label>
                            <DatePicker
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                    setItemsList([]);
                                }}
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
                                                    borderColor: 'var(--outline-variant)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'var(--outline)',
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

                    {/* 4. Botón de Búsqueda Estandarizado */}
                    <Grid
                        size={{ xs: 12, sm: 6, md: 1 }}
                        sx={{ paddingTop: { xs: '0px', sm: '22px', md: '22px' } }}
                    >
                        <div className="flex justify-start pb-0.5">
                            <button
                                type="button"
                                onClick={handleFetchVentas}
                                title="Buscar Ventas de Reposición"
                                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
                            >
                                <span className="material-symbols-outlined text-2xl font-bold">
                                    search
                                </span>
                            </button>
                        </div>
                    </Grid>
                </Grid>
            </div>

            {/* ── Aviso Sutil de Estado de Edición ── */}
            {!canEdit && itemsList.length > 0 && (
                <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs animate-in fade-in">
                    <span className="material-symbols-outlined text-lg shrink-0">
                        lock_clock
                    </span>
                    <p className="font-bold">
                        <span className="font-black uppercase tracking-wider">Modo Solo Lectura:</span>{' '}
                        El período de edición de 2 días para la fecha seleccionada ha concluido. Las
                        asignaciones se muestran únicamente para auditoría y consulta.
                    </p>
                </div>
            )}

            {/* ── Tarjetas de Resumen y Métricas (Centradas e Interactivas) ── */}
            <div className="flex justify-center w-full my-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 max-w-5xl w-full gap-3 sm:gap-4">
                    {/* 1. Total Ventas / Registros */}
                    <div
                        onClick={() => {
                            setKpiFilter('all');
                            setPage(1);
                        }}
                        title="Ver todas las ventas"
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'all'
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]'
                            : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-primary/40 hover:scale-[1.01]'
                            }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'all'
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-primary/10 text-primary'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    storefront
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Total Ventas
                                </p>
                                <p className="text-lg font-black text-zinc-900 dark:text-white leading-tight font-headline">
                                    {itemsList.length}
                                </p>
                            </div>
                        </div>
                        {kpiFilter === 'all' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-white tracking-widest">
                                ACTIVO
                            </span>
                        )}
                    </div>

                    {/* 3. Con Responsable */}
                    <div
                        onClick={() => {
                            setKpiFilter((prev) => (prev === 'assigned' ? 'all' : 'assigned'));
                            setPage(1);
                        }}
                        title="Filtrar ventas con responsable asignado"
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'assigned'
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                            : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-emerald-500/40 hover:scale-[1.01]'
                            }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'assigned'
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    verified_user
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Con Responsable
                                </p>
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight font-headline">
                                    {assignedCount}
                                </p>
                            </div>
                        </div>
                        {kpiFilter === 'assigned' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white tracking-widest">
                                ACTIVO
                            </span>
                        )}
                    </div>

                    {/* 4. Sin Asignar */}
                    <div
                        onClick={() => {
                            setKpiFilter((prev) => (prev === 'unassigned' ? 'all' : 'unassigned'));
                            setPage(1);
                        }}
                        title="Filtrar ventas sin responsable asignado"
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm select-none ${kpiFilter === 'unassigned'
                            ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30 shadow-md scale-[1.02]'
                            : 'bg-surface dark:bg-zinc-900 border-outline-variant dark:border-zinc-800 hover:border-rose-500/40 hover:scale-[1.01]'
                            }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${kpiFilter === 'unassigned'
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    person_alert
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Sin Asignar
                                </p>
                                <p className="text-lg font-black text-rose-600 dark:text-rose-400 leading-tight font-headline">
                                    {unassignedCount}
                                </p>
                            </div>
                        </div>
                        {kpiFilter === 'unassigned' && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-widest">
                                ACTIVO
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main Data Canvas ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                {/* Cabecera interna de tabla con Buscador Tipo Píldora */}
                <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                            list_alt
                        </span>
                        <p className="font-black text-zinc-900 dark:text-white uppercase text-xs tracking-wider font-headline">
                            VENTAS DE REPOSICIÓN ({filteredItems.length})
                            {kpiFilter === 'assigned' && (
                                <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                                    (CON RESPONSABLE)
                                </span>
                            )}
                            {kpiFilter === 'unassigned' && (
                                <span className="text-rose-600 dark:text-rose-400 ml-1.5 font-bold">
                                    (SIN ASIGNAR)
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="BUSCAR SUCURSAL, EMPLEADO..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-2 text-zinc-400 text-sm">
                            search
                        </span>
                    </div>
                </div>

                {/* Tabla Compacta y Responsiva */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[880px]">
                        <thead>
                            <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-100 dark:border-zinc-800">
                                <td className="w-1 pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                    N°
                                </td>
                                <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                                    <span>Fecha</span>
                                    <span className="block">Venta</span>
                                </td>
                                <td className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                    Sucursal
                                </td>
                                <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                                    Productos
                                </td>
                                <td className="w-36 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                                    Observación
                                </td>
                                <td className="w-28 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap leading-tight">
                                    <span>Total</span>
                                    <span className="block">Venta (Bs.)</span>
                                </td>
                                <td className="w-72 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                    Empleado Responsable
                                </td>
                                {/* <td className="w-1 px-3 pr-4 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                                    Acciones
                                </td> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-10 text-center text-zinc-400 dark:text-zinc-500"
                                    >
                                        <span className="material-symbols-outlined text-4xl block mb-1 text-zinc-300 dark:text-zinc-600">
                                            receipt_long
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            No se encontraron ventas de reposición en el rango seleccionado
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item, idx) => {
                                    const itemIndex = (page - 1) * pageSize + idx + 1;
                                    const sucursalName =
                                        item.NOMBRE_LISTA_PRECIOS ||
                                        item.SUCURSAL ||
                                        item.CANAL_VENTA ||
                                        '-';
                                    const dateTime = formatDateTimeDisplay(
                                        item.FECHA_REGISTRO || item.FECHA_VENTA || item.FECHA || item.fecha
                                    );
                                    const totalVenta = Number(
                                        item.MONTO ?? item.TOTAL_VENTA ?? item.TOTAL_ASUMIDO ?? 0
                                    );
                                    const productosCount = Array.isArray(item.PRODUCTOS)
                                        ? item.PRODUCTOS.length
                                        : 0;

                                    const currentEmpId = item.ID_EMPLEADO_ASUMIDO || item.id_empleado;
                                    const currentEmpName =
                                        item.NOMBRE_COMPLETO ||
                                        item.EMPLEADO ||
                                        item.EMPLEADO_ASUMIDO ||
                                        '';
                                    const hasAssignedEmp =
                                        (currentEmpId != null && Number(currentEmpId) > 0) ||
                                        (currentEmpName.trim() !== '' &&
                                            currentEmpName.trim().toUpperCase() !== 'SIN ASIGNAR');

                                    const selectedEmpleadoObj = empleadosList.find(
                                        (e) => Number(e.ID_EMPLEADO) === Number(currentEmpId)
                                    ) || null;

                                    const idVenta =
                                        item.ID_VENTAS_REPOSICION_SUCURSAL ||
                                        item.ID_VENTA_REPOSICION ||
                                        item.id_venta_reposicion ||
                                        item.ID_VENTA ||
                                        idx;

                                    const isRowUpdating = isAssigningId === idVenta;

                                    return (
                                        <tr
                                            key={idVenta}
                                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                                        >
                                            {/* 1. N° */}
                                            <td className="pl-4 pr-2 py-2 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                                                {itemIndex}
                                            </td>

                                            {/* 2. Fecha */}
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-on-surface">
                                                        {dateTime.date}
                                                    </span>
                                                    {dateTime.time && (
                                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                            {dateTime.time}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 3. Canal / Sucursal */}
                                            <td className="px-3 py-2">
                                                <span className="font-black text-on-surface uppercase block">
                                                    {sucursalName}
                                                </span>
                                            </td>

                                            {/* 4. Productos */}
                                            <td className="px-3 py-2 text-center whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDetalleModal(item)}
                                                    title="Ver detalle de productos"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all text-xs font-black cursor-pointer shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        inventory_2
                                                    </span>
                                                    <span>{productosCount} ítems</span>
                                                </button>
                                            </td>
                                            {/* 4. Observación */}
                                            <td className="px-3 py-2 text-left whitespace-nowrap">
                                                <span className="font-black text-on-surface uppercase block">
                                                    {item.OBSERVACION}
                                                </span>
                                            </td>

                                            {/* 5. Total Venta */}
                                            <td className="px-3 py-2 text-right font-black text-primary text-xs whitespace-nowrap">
                                                Bs. {totalVenta.toFixed(2)}
                                            </td>

                                            {/* 6. Empleado Responsable (Selector Inline o Badge) */}
                                            <td className="px-3 py-2">
                                                {canEdit && empleadosList.length > 0 ? (
                                                    <div className="w-full max-w-[260px]">
                                                        <Autocomplete
                                                            options={empleadosList}
                                                            getOptionLabel={(option) => option.NOMBRE_COMPLETO || ''}
                                                            value={selectedEmpleadoObj}
                                                            onChange={(_, newValue) =>
                                                                handleInlineAssignEmpleado(item, newValue)
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                Number(option.ID_EMPLEADO) === Number(value?.ID_EMPLEADO)
                                                            }
                                                            disabled={isRowUpdating}
                                                            size="small"
                                                            noOptionsText="Sin empleados"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '12px',
                                                                    backgroundColor: 'var(--input-bg, var(--surface))',
                                                                    color: 'var(--on-surface)',
                                                                    fontSize: '0.75rem',
                                                                    padding: '1px 6px',
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: hasAssignedEmp
                                                                            ? 'rgba(16, 185, 129, 0.3)'
                                                                            : 'rgba(244, 63, 94, 0.3)',
                                                                    },
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        borderColor: 'var(--primary)',
                                                                    },
                                                                },
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    placeholder="SELECCIONAR..."
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {hasAssignedEmp ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase border border-emerald-500/20">
                                                                <span className="material-symbols-outlined text-xs">
                                                                    check_circle
                                                                </span>
                                                                {selectedEmpleadoObj?.NOMBRE_COMPLETO || currentEmpName}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase border border-rose-500/20">
                                                                <span className="material-symbols-outlined text-xs">
                                                                    warning
                                                                </span>
                                                                Sin Asignar
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* 7. Acciones Estandarizadas */}
                                            {/* <td className="px-3 pr-4 py-2 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                 
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDetalleModal(item)}
                                                        title="Ver Detalle de Productos"
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px] sm:text-base">
                                                            visibility
                                                        </span>
                                                    </button>

                                                   
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAsignarModal(item)}
                                                            title="Asignar / Cambiar Empleado"
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center font-bold cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-base">
                                                                assignment_ind
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td> */}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Footer / Paginación Estandarizada ── */}
                {!isLoading && itemsList.length > 0 && (
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
                                </select>
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                                Mostrando {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-
                                {Math.min(page * pageSize, totalItems)} de {totalItems} registros
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-black">
                                    chevron_left
                                </span>
                            </button>
                            <span className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-2">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages}
                                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-black">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modales ── */}
            <ModalDetalleProductosVenta
                open={modalDetalleOpen}
                onClose={() => {
                    setModalDetalleOpen(false);
                    setSelectedVentaForDetalle(null);
                }}
                venta={selectedVentaForDetalle}
            />

            <ModalAsignarEmpleado
                open={modalAsignarOpen}
                onClose={() => {
                    setModalAsignarOpen(false);
                    setSelectedVentaForAsignar(null);
                }}
                venta={selectedVentaForAsignar}
                empleados={empleadosList}
                onSuccess={handleModalAssignSuccess}
            />
        </div>
    );
};

export default ReposicionSucAlmacenProd;

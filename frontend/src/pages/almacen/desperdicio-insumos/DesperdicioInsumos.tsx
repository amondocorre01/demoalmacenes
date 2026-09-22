/**
 * DesperdicioInsumos.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, auditoría y control de mermas y desperdicios de insumos vencidos en almacenes.
 *    Permite visualizar los registros históricos de desperdicios (id_estado = 12 estático)
 *    y procesar nuevos registros de desperdicios masivos mediante transacción.
 *
 * 2. APIs Utilizadas:
 *    - GET /v1/inventario/declaracion/almacenes (loadApiGetAlmacenes - Almacenes autorizados)
 *    - GET /v1/inventario/rep-desp/desperdicios (loadApiGetDesperdicios - Listado con id_estado: 12)
 *    - GET /v1/inventario/rep-desp/productos-vencidos (loadApiGetProductosVencidos - Consulta para modal)
 *    - POST /v1/inventario/rep-desp/desperdiciar-vencidos (loadApiDesperdiciarProductosVencidos - Transacción)
 *
 * 3. Controles Clave y Reglas de Negocio:
 *    - id_estado fijo en 12 para consultar exclusivamente mermas e insumos vencidos.
 *    - Filtro multialmacén con modal de selección interactivo o todos los almacenes.
 *    - Rango de fechas dinámico con DatePicker y botón de búsqueda estandarizado.
 *    - Métricas interactivas y visualización compacta y responsiva.
 *    - Modal estandarizado para consultar productos vencidos por fecha y procesar el desperdicio.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import {
  useDesperdicioInsumosServices,
  AlmacenItem,
  DesperdicioInsumoItem,
} from './services/useDesperdicioInsumos';
import { ModalSeleccionarAlmacenes } from './components/ModalSeleccionarAlmacenes';
import { ModalDesperdicioVencidos } from './components/ModalDesperdicioVencidos';

const ALL_WAREHOUSES_OPTION: AlmacenItem = {
  ID_PLANTA_ALMACEN: 0,
  DESCRICION: 'TODOS LOS ALMACENES',
};

export const DesperdicioInsumos: React.FC = () => {
  const { loadApiGetAlmacenes, loadApiGetDesperdicios } = useDesperdicioInsumosServices();

  // Estados de datos
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<AlmacenItem[]>([
    ALL_WAREHOUSES_OPTION,
  ]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('month'));

  const [itemsList, setItemsList] = useState<DesperdicioInsumoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modales
  const [modalAlmacenesOpen, setModalAlmacenesOpen] = useState<boolean>(false);
  const [modalDesperdicioOpen, setModalDesperdicioOpen] = useState<boolean>(false);

  // Filtros de tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar almacenes disponibles al inicio
  useEffect(() => {
    const fetchAlmacenes = async () => {
      setIsLoading(true);
      const res = await loadApiGetAlmacenes();
      const list = Array.isArray(res) ? res : ((res as any)?.datos || (res as any)?.data || []);
      if (list && list.length > 0) {
        setWarehouses(list);
      }
      setIsLoading(false);
    };
    fetchAlmacenes();
  }, []);

  // Consultar desperdicios de insumos (id_estado: 12)
  const handleFetchDesperdicios = useCallback(async () => {
    setIsLoading(true);
    try {
      const fi = startDate ? startDate.format('YYYY-MM-DD') : '';
      const ff = endDate ? endDate.format('YYYY-MM-DD') : '';

      const isAll =
        selectedWarehouses.length === 0 ||
        selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0);

      const almacenesParam = isAll
        ? []
        : selectedWarehouses.map((w) => w.ID_PLANTA_ALMACEN);

      const data = await loadApiGetDesperdicios({
        almacenes: almacenesParam,
        fecha_inicio: fi,
        fecha_fin: ff,
        id_estado: 12,
      });

      setItemsList(data || []);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedWarehouses]);

  // Formato seguro de fecha DD/MM/YYYY
  const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const clean = dateString.split('T')[0].split(' ')[0];
      const [year, month, day] = clean.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Formato seguro de fecha y hora DD/MM/YYYY con HH:mm:ss
  const formatDateTimeDisplay = (dateString?: string): { date: string; time: string } => {
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
      const formattedDate = year && month && day ? `${day}/${month}/${year}` : datePart;
      return { date: formattedDate, time: timePart };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  // Filtrado interno en tabla
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return itemsList;
    const term = searchTerm.toLowerCase();
    return itemsList.filter((item) => {
      const prod = (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toLowerCase();
      const det = (item.NOMBRE_DETALLE || '').toLowerCase();
      const alm = (item.ALMACEN || item.DESCRICION || '').toLowerCase();
      const user = (item.USUARIO_ASUMIDO || item.USUARIO || '').toLowerCase();
      return (
        prod.includes(term) ||
        det.includes(term) ||
        alm.includes(term) ||
        user.includes(term)
      );
    });
  }, [itemsList, searchTerm]);

  // Paginación
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Métricas
  const totalCostoDesperdicio = useMemo(() => {
    return itemsList.reduce(
      (acc, curr) => acc + (Number(curr.TOTAL_ASUMIDO ?? curr.TOTAL ?? curr.PRECIO_ASUMIDO_EMPLEADO ?? 0) || 0),
      0
    );
  }, [itemsList]);

  const totalCantidadDesperdiciada = useMemo(() => {
    return itemsList.reduce((acc, curr) => acc + (Number(curr.CANTIDAD || 0) || 0), 0);
  }, [itemsList]);

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'ALMACÉN', key: 'almacen', width: 22 },
      { header: 'FECHA REGISTRO', key: 'fechaReg', width: 16 },
      { header: 'FECHA VENCIMIENTO', key: 'fechaVenc', width: 16 },
      { header: 'PRODUCTO / INSUMO', key: 'producto', width: 30 },
      { header: 'CANTIDAD', key: 'cantidad', width: 12, align: 'right' as const, format: 'number' as const },
      { header: 'UNIDAD', key: 'unidad', width: 10, align: 'center' as const },
      { header: 'P. CONSUMO INT.', key: 'precio', width: 16, align: 'right' as const, format: 'currency' as const },
      { header: 'TOTAL ASUMIDO', key: 'total', width: 16, align: 'right' as const, format: 'currency' as const },
      { header: 'USUARIO DESPERDICIA', key: 'usuario', width: 22 },
    ];

    const rows = filteredItems.map((item, idx) => {
      const regDateTime = formatDateTimeDisplay(item.FECHA_REGISTRO);
      const productName = item.PRODUCTO || item.NOMBRE_PRODUCTO || item.NOMBRE_DETALLE || '-';
      const detailName = item.NOMBRE_DETALLE || '';
      const displayProduct = detailName && detailName.toUpperCase() !== (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toUpperCase()
        ? `${detailName} (${productName})`
        : (detailName || productName);

      return {
        index: idx + 1,
        almacen: item.ALMACEN || item.DESCRICION || '-',
        fechaReg: `${regDateTime.date} ${regDateTime.time || ''}`.trim(),
        fechaVenc: formatDateDisplay(item.FECHA_VENCIMIENTO),
        producto: displayProduct,
        cantidad: Number(item.CANTIDAD || 0),
        unidad: item.UNIDAD_MEDIDA || item.MEDIDA || '-',
        precio: Number(item.PRECIO_PRODUCTO ?? item.PRECIO_CONSUMO_INTERNO ?? item.PRECIO ?? 0),
        total: Number(item.PRECIO_ASUMIDO_EMPLEADO ?? item.TOTAL_ASUMIDO ?? item.TOTAL ?? 0),
        usuario: item.USUARIO_REGISTRA || item.USUARIO || '-',
      };
    });

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Desperdicio_Insumos_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'Desperdicios',
      title: 'REPORTE DE DESPERDICIO DE INSUMOS VENCIDOS',
      subtitle: `Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'REPORTE DE DESPERDICIO DE INSUMOS VENCIDOS',
      subtitle: `Rango: ${startDate?.format('DD/MM/YYYY') || ''} al ${endDate?.format('DD/MM/YYYY') || ''}`,
      columns,
      rows,
      totalsRow: true,
      orientation: 'landscape',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-2 p-2 sm:p-0 animate-in fade-in duration-300">
      <LoadingOverlay show={isLoading} message="Cargando desperdicio de insumos..." />

      {/* ── Encabezado Principal ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            DESPERDICIO DE INSUMOS VENCIDOS
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Auditoría cronológica, control de mermas por expiración y registro de desperdicios
          </p>
        </div>

        {/* Acciones a la derecha */}
        <div className="flex items-center gap-2">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredItems.length === 0}
          />
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => setModalDesperdicioOpen(true)}
            className="!h-10 !px-5 shadow-lg shadow-primary/20 shrink-0"
          >
            Nuevo Desperdicio
          </Button>
        </div>
      </div>

      {/* ── Barra Superior de Filtros ── */}
      <div className="bg-surface dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-2">
        <Grid container spacing={1.5} alignItems="flex-end">
          {/* 1. Selector de Almacén */}
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <div className="w-full space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Almacenes Seleccionados
              </label>
              <div
                onClick={() => setModalAlmacenesOpen(true)}
                title="Haga clic para seleccionar almacenes"
                className="w-full h-[40px] px-3.5 bg-white dark:bg-zinc-950 border border-zinc-400 dark:border-zinc-800 rounded-[15px] flex items-center justify-between cursor-pointer hover:border-primary transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">
                    store
                  </span>
                  <span className="text-xs font-bold text-on-surface uppercase truncate">
                    {selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
                      ? 'TODOS LOS ALMACENES'
                      : selectedWarehouses.length === 1
                        ? (selectedWarehouses[0].DESCRICION || selectedWarehouses[0].nombre || '1 ALMACÉN')
                        : `${selectedWarehouses.length} ALMACENES SELECCIONADOS`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                    {selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
                      ? `TODOS (${warehouses.length})`
                      : `${selectedWarehouses.length}`}
                  </span>
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary text-base transition-colors">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </Grid>

          {/* 2. Fecha Inicio */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="w-full space-y-2">
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
            <div className="w-full space-y-2">
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
          <Grid size={{ xs: 12, sm: 6, md: 1 }} sx={{ paddingTop: { xs: '0px', sm: '22px', md: '22px' } }}>
            <div className="flex justify-start pb-0.5">
              <button
                type="button"
                onClick={handleFetchDesperdicios}
                title="Buscar Desperdicios"
                className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
              >
                <span className="material-symbols-outlined text-2xl font-bold">search</span>
              </button>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* ── Main Data Canvas ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Cabecera interna de tabla con Buscador Tipo Píldora */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
            <p className="font-black text-zinc-900 dark:text-white uppercase text-xs tracking-wider font-headline">
              REGISTRO DE DESPERDICIOS ({filteredItems.length})
            </p>
          </div>

          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              placeholder="BUSCAR..."
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

        {/* Tabla Compacta */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-100 dark:border-zinc-800">
                <td className="w-1 pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  N°
                </td>
                <td className="w-1 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Almacén
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Fecha</span>
                  <span className="block">Registro</span>
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Fecha</span>
                  <span className="block">Vencimiento</span>
                </td>
                <td className="w-48 max-w-[200px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto
                </td>
                <td className="w-1 px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                  Cantidad
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap leading-tight">
                  <span>P. Consumo</span>
                  <span className="block">Int.</span>
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right whitespace-nowrap leading-tight">
                  <span>Total</span>
                  <span className="block">Asumido</span>
                </td>
                <td className="w-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Usuario</span>
                  <span className="block">Desperdicia</span>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl block mb-1 text-zinc-300 dark:text-zinc-600">
                      inventory_2
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      No se encontraron registros de desperdicios
                    </span>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const itemIndex = (page - 1) * pageSize + idx + 1;
                  const idDesp =
                    item.ID_PLANTA_DESPERDICIO_ALMACEN ||
                    item.ID_DESPERDICIO_ALMACEN ||
                    item.ID_DESPERDICIO ||
                    idx;
                  const regDateTime = formatDateTimeDisplay(item.FECHA_REGISTRO);
                  const productName =
                    item.PRODUCTO || item.NOMBRE_PRODUCTO || item.NOMBRE_DETALLE || '-';
                  const detailName = item.NOMBRE_DETALLE || '';
                  const hasDetail =
                    detailName &&
                    detailName.toUpperCase() !== (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toUpperCase();

                  return (
                    <tr
                      key={idDesp}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="w-1 pl-4 pr-2 py-1.5 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                        {itemIndex}
                      </td>
                      <td className="w-1 px-3 py-1.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap">
                        {item.ALMACEN || item.DESCRICION || '-'}
                      </td>
                      <td className="w-1 px-2 py-1.5 whitespace-nowrap">
                        <span className="block text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          {regDateTime.date}
                        </span>
                        {regDateTime.time ? (
                          <span className="block font-mono text-[9px] text-zinc-400 dark:text-zinc-500 font-bold leading-tight">
                            {regDateTime.time}
                          </span>
                        ) : null}
                      </td>
                      <td className="w-1 px-2 py-1.5 font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                        {formatDateDisplay(item.FECHA_VENCIMIENTO)}
                      </td>
                      <td className="w-48 max-w-[200px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {detailName || productName}
                        </span>
                        {hasDetail && (
                          <span className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                            {productName}
                          </span>
                        )}
                      </td>
                      <td className="w-1 px-2 py-1.5 text-center whitespace-nowrap">
                        <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-[10px]">
                          {Number(item.CANTIDAD || 0).toLocaleString('es-BO', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="block text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[10px] leading-tight mt-0.5">
                          {item.UNIDAD_MEDIDA || item.MEDIDA || '-'}
                        </span>
                      </td>
                      <td className="w-1 px-2 py-1.5 font-bold text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap text-[11px]">
                        Bs.{' '}
                        {Number(
                          item.PRECIO_PRODUCTO ?? item.PRECIO_CONSUMO_INTERNO ?? item.PRECIO ?? 0
                        ).toLocaleString('es-BO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="w-1 px-2 py-1.5 font-black text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap text-[11px]">
                        Bs.{' '}
                        {Number(
                          item.PRECIO_ASUMIDO_EMPLEADO ?? item.TOTAL_ASUMIDO ?? item.TOTAL ?? 0
                        ).toLocaleString('es-BO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="w-1 px-3 py-1.5 uppercase whitespace-nowrap text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {item.USUARIO_REGISTRA || item.USUARIO || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {!isLoading && itemsList.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-2 border-t border-zinc-100 dark:border-zinc-800/80">
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
                <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
              </button>
              <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Selección de Almacenes ── */}
      <ModalSeleccionarAlmacenes
        open={modalAlmacenesOpen}
        onClose={() => setModalAlmacenesOpen(false)}
        warehouses={warehouses}
        selectedWarehouses={selectedWarehouses}
        onApply={(newSelected) => {
          setSelectedWarehouses(newSelected);
          setItemsList([]);
        }}
      />

      {/* ── Modal Desperdicio de Productos Vencidos ── */}
      <ModalDesperdicioVencidos
        open={modalDesperdicioOpen}
        onClose={() => setModalDesperdicioOpen(false)}
        warehouses={warehouses}
        onSuccess={handleFetchDesperdicios}
      />
    </div>
  );
};

export default DesperdicioInsumos;

/**
 * DesperdicioManual.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Registro y Auditoría de Desperdicio Manual de Insumos
 *
 * Propósito:
 * Visualización, trazabilidad y registro de desperdicios manuales de insumos y
 * productos (id_estado = 14), causados por daño físico, merma no programada
 * o incidentes en almacén.
 *
 * APIs Utilizadas:
 * ┌─────┬────────┬───────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Endpoint                                      │ Descripción                                             │
 * ├─────┼────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/inventario/declaracion/almacenes          │ Listar almacenes autorizados del usuario                │
 * │  2  │ GET    │ /v1/inventario/rep-desp/desperdicios          │ Listar desperdicios manuales (id_estado: 14 estático)   │
 * │  3  │ GET    │ /v1/inventario/rep-desp/productos-stock      │ Consultar catálogo de productos con stock para el modal │
 * │  4  │ POST   │ /v1/inventario/rep-desp/desperdiciar          │ Procesar registro de desperdicio manual de productos    │
 * └─────┴────────┴───────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de desperdicios manuales con id_estado fijo en 14.
 * - Limpieza de datos al cambiar almacén, fecha de inicio o fecha fin.
 * - Consulta a la API únicamente cuando el usuario presiona el botón de búsqueda.
 * - Modal estandarizado para selección múltiple de almacenes y registro de nuevos desperdicios.
 * - Componente reutilizable LoadingOverlay para estados de carga.
 * - Exportación de auditoría en formato CSV.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import { API_URL } from '../../../config/api';
import {
  AlmacenItem,
  DesperdicioManualItem,
  useDesperdicioManualServices,
  getImageUrl,
} from './services/useDesperdicioManual';
import { ModalSeleccionarAlmacenes } from './components/ModalSeleccionarAlmacenes';
import { ModalNuevoDesperdicioManual } from './components/ModalNuevoDesperdicioManual';
import { ModalVerImagenDesperdicio } from './components/ModalVerImagenDesperdicio';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf, TableColumnConfig } from '../../../utils/exportTableHelper';

const ALL_WAREHOUSES_OPTION: AlmacenItem = {
  ID_PLANTA_ALMACEN: 0,
  DESCRICION: 'TODOS LOS ALMACENES',
};

export const DesperdicioManual: React.FC = () => {
  const { loadApiGetAlmacenes, loadApiGetDesperdicios } = useDesperdicioManualServices();

  // Estados de almacenes y fechas
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<AlmacenItem[]>([
    ALL_WAREHOUSES_OPTION,
  ]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  // Datos principales
  const [itemsList, setItemsList] = useState<DesperdicioManualItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros de búsqueda en tabla y paginación
  const [filterSearch, setFilterSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modales
  const [openModalAlmacenes, setOpenModalAlmacenes] = useState(false);
  const [openModalNuevoDesperdicio, setOpenModalNuevoDesperdicio] = useState(false);
  const [openModalImagen, setOpenModalImagen] = useState(false);
  const [selectedImageItem, setSelectedImageItem] = useState<DesperdicioManualItem | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // 1. Cargar lista de almacenes al montar
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const dataAlmacenes = await loadApiGetAlmacenes();
      setWarehouses(dataAlmacenes || []);
      setIsLoading(false);
    };
    initData();
  }, []);

  // 2. Consulta de desperdicios manuales (solo al dar click en Buscar)
  const handleFetchDesperdicios = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    const isAll =
      selectedWarehouses.length === 0 ||
      selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0);

    const almacenesIds = isAll
      ? []
      : selectedWarehouses.map((w) => w.ID_PLANTA_ALMACEN);

    const data = await loadApiGetDesperdicios({
      almacenes: almacenesIds,
      fecha_inicio: startDate ? startDate.format('YYYY-MM-DD') : '',
      fecha_fin: endDate ? endDate.format('YYYY-MM-DD') : '',
      id_estado: 14, // Estado 14 fijo para desperdicio manual
    });

    setItemsList(data || []);
    setPage(1);
    setIsLoading(false);
  }, [selectedWarehouses, startDate, endDate, loadApiGetDesperdicios]);

  // Limpiar datos cuando cambie algún filtro
  const handleAlmacenesChange = (selected: AlmacenItem[]) => {
    setSelectedWarehouses(selected);
    setItemsList([]);
    setHasSearched(false);
  };

  const handleStartDateChange = (newValue: Dayjs | null) => {
    setStartDate(newValue);
    setItemsList([]);
    setHasSearched(false);
  };

  const handleEndDateChange = (newValue: Dayjs | null) => {
    setEndDate(newValue);
    setItemsList([]);
    setHasSearched(false);
  };

  // Filtrar items en memoria por el buscador interno
  const filteredItems = useMemo(() => {
    if (!filterSearch.trim()) return itemsList;
    const term = filterSearch.toLowerCase();
    return itemsList.filter((item) => {
      const almacen = (item.ALMACEN || item.DESCRICION || '').toLowerCase();
      const prod = (item.PRODUCTO || item.NOMBRE_PRODUCTO || '').toLowerCase();
      const detalle = (item.NOMBRE_DETALLE || item.DETALLE || '').toLowerCase();
      const obs = (item.OBSERVACION || '').toLowerCase();
      const user = (item.USUARIO_REGISTRA || item.USUARIO || '').toLowerCase();
      const estado = (item.DESCRIPCION_ESTADO || '').toLowerCase();
      return (
        almacen.includes(term) ||
        prod.includes(term) ||
        detalle.includes(term) ||
        obs.includes(term) ||
        user.includes(term) ||
        estado.includes(term)
      );
    });
  }, [itemsList, filterSearch]);

  // Paginación
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Formato seguro de fecha DD-MM-YYYY
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Formato seguro de fecha y hora
  const formatDateTimeDisplay = (dateStr?: string | null) => {
    if (!dateStr) return { date: '-', time: '' };
    try {
      const [rawDate, rawTime] = dateStr.split('T');
      const dateParts = (rawDate || '').split('-');
      const formattedDate =
        dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : rawDate;
      const formattedTime = rawTime ? rawTime.substring(0, 5) : '';
      return { date: formattedDate, time: formattedTime };
    } catch {
      return { date: dateStr, time: '' };
    }
  };


  // Abrir modal para previsualizar imagen
  const handleOpenImage = (item: DesperdicioManualItem) => {
    const rawImg = item.IMAGEN || item.FOTO || item.RUTA_IMAGEN || item.ARCHIVO || null;
    const url = getImageUrl(rawImg);
    if (url) {
      setSelectedImageItem(item);
      setSelectedImageUrl(url);
      setOpenModalImagen(true);
    }
  };

  const exportColumns: TableColumnConfig[] = [
    { header: 'N°', width: 45, align: 'center', type: 'number' },
    { header: 'Almacén', width: 140, align: 'left' },
    { header: 'Fecha Registro', width: 110, align: 'center' },
    { header: 'Fecha Vencimiento', width: 110, align: 'center' },
    { header: 'Producto / Insumo', width: 200, align: 'left' },
    { header: 'Detalle', width: 160, align: 'left' },
    { header: 'Cantidad', width: 80, align: 'right', type: 'number' },
    { header: 'U. Medida', width: 70, align: 'center' },
    { header: 'P. Consumo Int.', width: 100, align: 'right', type: 'currency' },
    { header: 'Total Asumido (Bs.)', width: 115, align: 'right', type: 'currency' },
    { header: 'Usuario Registra', width: 160, align: 'left' },
    { header: 'Motivo / Observación', width: 200, align: 'left' },
  ];

  const getExportData = () => {
    return itemsList.map((item, idx) => {
      const cant = Number(item.CANTIDAD || 0);
      const pUnit = Number(item.PRECIO_PRODUCTO ?? item.PRECIO_CONSUMO_INTERNO ?? item.PRECIO ?? 0);
      const tot = Number(item.PRECIO_ASUMIDO_EMPLEADO ?? item.TOTAL_ASUMIDO ?? item.TOTAL ?? cant * pUnit);

      return [
        idx + 1,
        item.ALMACEN || item.DESCRICION || '-',
        item.FECHA_REGISTRO ? item.FECHA_REGISTRO.replace('T', ' ').substring(0, 19) : '-',
        formatDateDisplay(item.FECHA_VENCIMIENTO),
        item.PRODUCTO || item.NOMBRE_PRODUCTO || '-',
        item.NOMBRE_DETALLE || item.DETALLE || '-',
        cant,
        item.UNIDAD_MEDIDA || item.MEDIDA || '-',
        pUnit,
        tot,
        item.USUARIO_REGISTRA || item.USUARIO || '-',
        item.OBSERVACION || item.DETALLE || '-',
      ];
    });
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
    const ff = endDate ? endDate.format('DD/MM/YYYY') : '';
    const totalMonto = itemsList.reduce((acc, curr) => acc + Number(curr.PRECIO_ASUMIDO_EMPLEADO ?? curr.TOTAL_ASUMIDO ?? curr.TOTAL ?? 0), 0);

    exportTableToExcel({
      title: 'REGISTRO DE DESPERDICIO MANUAL',
      subtitle: `RANGO: ${fi} AL ${ff}   |   ALMACENES: ${warehouseButtonLabel}`,
      filename: `desperdicios_manuales_${dayjs().format('YYYYMMDD_HHmm')}`,
      columns: exportColumns,
      data,
      totals: ['', '', '', '', '', 'TOTAL GENERAL', '', '', '', totalMonto, '', ''],
    });
  };

  const handleExportPdf = () => {
    const data = getExportData();
    const fi = startDate ? startDate.format('DD/MM/YYYY') : '';
    const ff = endDate ? endDate.format('DD/MM/YYYY') : '';
    const totalMonto = itemsList.reduce((acc, curr) => acc + Number(curr.PRECIO_ASUMIDO_EMPLEADO ?? curr.TOTAL_ASUMIDO ?? curr.TOTAL ?? 0), 0);

    exportTableToPdf({
      title: 'REGISTRO DE DESPERDICIO MANUAL',
      subtitle: `RANGO: ${fi} AL ${ff}   |   ALMACENES: ${warehouseButtonLabel}`,
      columns: exportColumns,
      data,
      totals: ['', '', '', '', '', 'TOTAL GENERAL', '', '', '', totalMonto, '', ''],
    });
  };

  // Resumen del selector de almacenes para el botón
  const warehouseButtonLabel = useMemo(() => {
    if (
      selectedWarehouses.length === 0 ||
      selectedWarehouses.some((w) => w.ID_PLANTA_ALMACEN === 0)
    ) {
      return 'TODOS LOS ALMACENES';
    }
    if (selectedWarehouses.length === 1) {
      return selectedWarehouses[0].DESCRICION || selectedWarehouses[0].nombre || '1 ALMACÉN';
    }
    return `${selectedWarehouses.length} ALMACENES SELECCIONADOS`;
  }, [selectedWarehouses]);

  return (
    <div className="w-full space-y-4">
      {/* ── Encabezado Principal Estandarizado ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            REGISTRO DE DESPERDICIO MANUAL
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Control de mermas por daño, manipulación o incidentes no programados
          </p>
        </div>

        {/* Acciones a la derecha */}
        <div className="flex items-center gap-2.5">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={itemsList.length === 0}
          />

          <Button
            variant="primary"
            size="md"
            icon="add_circle"
            onClick={() => setOpenModalNuevoDesperdicio(true)}
            className="!h-10 !px-6 shadow-lg shadow-primary/20 shrink-0"
          >
            Nuevo Registro
          </Button>
        </div>
      </div>

      {/* ── Barra Superior de Filtros ── */}
      <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <Grid container spacing={1.5} alignItems="flex-end">
          {/* 1. Selector Múltiple de Almacenes */}
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <div className="w-full space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Almacenes Seleccionados
              </label>
              <div
                onClick={() => setOpenModalAlmacenes(true)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-surface dark:bg-zinc-850 border border-outline-variant hover:border-outline cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">
                    warehouse
                  </span>
                  <span className="text-xs font-black uppercase text-on-surface truncate">
                    {warehouseButtonLabel}
                  </span>
                </div>
                <span className="material-symbols-outlined text-zinc-400 text-sm shrink-0">
                  expand_more
                </span>
              </div>
            </div>
          </Grid>

          {/* 2. Fecha Inicio */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="w-full space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                Fecha Inicio
              </label>
              <DatePicker
                //format="DD-MM-YYYY"
                value={startDate}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                //format="DD-MM-YYYY"
                value={endDate}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
          <Grid size={{ xs: 12, sm: 6, md: 1 }}>
            <div className="w-full space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-transparent select-none ml-1 hidden sm:block">
                &nbsp;
              </label>
              <button
                type="button"
                onClick={handleFetchDesperdicios}
                title="Buscar Desperdicios Manuales"
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
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">delete_sweep</span>
            <div>
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider font-headline">
                LISTADO DE DESPERDICIOS MANUALES
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase">
                {hasSearched
                  ? `Mostrando ${filteredItems.length} registros filtrados`
                  : 'Presione el botón buscar para consultar los registros'}
              </p>
            </div>
          </div>

          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => {
                setFilterSearch(e.target.value);
                setPage(1);
              }}
              placeholder="BUSCAR EN TABLA..."
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
                <td className="min-w-[140px] max-w-[220px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Producto / Detalle
                </td>
                <td className="w-1 px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                  Cantidad
                </td>
                <td className="w-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Fecha</span>
                  <span className="block">Vencimiento</span>
                </td>
                <td className="min-w-[120px] max-w-[200px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Descripción
                </td>
                <td className="min-w-[120px] max-w-[180px] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-tight">
                  <span>Usuario</span>
                  <span className="block">Desperdicia</span>
                </td>
                <td className="w-1 pl-4 pr-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  Acciones
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl block mb-1 text-zinc-300 dark:text-zinc-600">
                      inventory_2
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {hasSearched
                        ? 'No se encontraron registros de desperdicios manuales'
                        : 'Realice una búsqueda para consultar los registros'}
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
                  const detailName = item.NOMBRE_DETALLE || item.DETALLE || '';
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
                      <td className="min-w-[140px] max-w-[220px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight break-words whitespace-normal">
                          {detailName || productName}
                        </span>
                        {hasDetail && (
                          <span className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight break-words whitespace-normal">
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
                      <td className="w-1 px-2 py-1.5 font-mono font-bold text-primary whitespace-nowrap text-[10px]">
                        {formatDateDisplay(item.FECHA_VENCIMIENTO)}
                      </td>
                      <td className="min-w-[120px] max-w-[200px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight break-words whitespace-normal">
                          {item.DETALLE || item.OBSERVACION || '-'}
                        </span>
                      </td>
                      <td className="min-w-[120px] max-w-[180px] px-2 py-1.5 uppercase">
                        <span className="block text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight break-words whitespace-normal">
                          {item.USUARIO_REGISTRA || item.USUARIO || '-'}
                        </span>
                      </td>
                      <td className="w-1 px-3 py-1.5 whitespace-nowrap text-center">
                        {(() => {
                          const rawImg =
                            item.IMAGEN || item.FOTO || item.RUTA_IMAGEN || item.ARCHIVO;
                          const url = getImageUrl(rawImg);
                          if (!url) {
                            return (
                              <span className="text-zinc-300 dark:text-zinc-600 font-bold text-xs">
                                -
                              </span>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenImage(item)}
                              title="Ver Imagen del Desperdicio"
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer mx-auto"
                            >
                              <span className="material-symbols-outlined text-[14px] sm:text-base">
                                image
                              </span>
                            </button>
                          );
                        })()}
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
                  className="h-8 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-300 px-2.5 outline-none shadow-sm cursor-pointer"
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
              <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 px-2">
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
      {/* 1. Modal de Selección de Almacenes */}
      <ModalSeleccionarAlmacenes
        open={openModalAlmacenes}
        onClose={() => setOpenModalAlmacenes(false)}
        warehouses={warehouses}
        selectedWarehouses={selectedWarehouses}
        onApply={handleAlmacenesChange}
      />

      {/* 2. Modal de Registro de Desperdicio Manual */}
      <ModalNuevoDesperdicioManual
        open={openModalNuevoDesperdicio}
        onClose={() => setOpenModalNuevoDesperdicio(false)}
        warehouses={warehouses}
        initialWarehouse={
          selectedWarehouses.length === 1 &&
            selectedWarehouses[0].ID_PLANTA_ALMACEN !== 0
            ? selectedWarehouses[0]
            : null
        }
        onSuccess={handleFetchDesperdicios}
      />

      {/* 3. Modal de Previsualización de Imagen */}
      <ModalVerImagenDesperdicio
        open={openModalImagen}
        onClose={() => {
          setOpenModalImagen(false);
          setSelectedImageItem(null);
          setSelectedImageUrl(null);
        }}
        item={selectedImageItem}
        imageUrl={selectedImageUrl}
      />

      {/* ── Componente Centralizado de Carga ── */}
      <LoadingOverlay show={isLoading} message="Cargando desperdicios manuales..." />
    </div>
  );
};

export default DesperdicioManual;

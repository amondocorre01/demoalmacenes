/**
 * DeclaracionInventario.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión y registro de la declaración física de inventario para almacenes.
 *    Permite a los operarios registrar los conteos físicos reales de los productos,
 *    insumos y productos intermedios asignados a un almacén específico para la fecha actual,
 *    los cuales servirán como base para la auditoría, verificación y cuadre de inventario.
 *
 * 2. APIs Utilizadas:
 *    - GET /inventario/declaracion/almacenes?id_planta_almacen=0 (loadApiGetAlmacenes - Almacenes habilitados del usuario)
 *    - GET /inventario/declaracion/:idAlmacen?fecha=YYYY-MM-DD (loadApiGetDeclaracion - Detalle de inventario para fecha actual)
 *    - POST /inventario/declaracion/:idAlmacen (loadApiGuardarDeclaracion - Registrar/Actualizar declaración)
 *
 * 3. Controles Clave:
 *    - Selección automática y fija de la fecha actual de operación (sin selector de fecha para el usuario).
 *    - Visualización de la fecha actual con badge distintivo junto al título "Listado de Productos".
 *    - Selector de almacén con Autocomplete de MUI respetando el formato estricto de AGENTS.md.
 *    - Botón de consulta estandarizado con icono search y clases corporativas.
 *    - Tabla unificada compacta y responsiva con buscador tipo píldora en cabecera superior derecha.
 *    - Entradas numéricas compactas que admiten valor vacío sin bloquearse en '0'.
 *    - Tarjetas de información y estado con soporte completo para modo claro y oscuro.
 *    - Validaciones previas al guardado y confirmación con showAlert.confirm.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { Button } from '../../../components/common/Button';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToExcel, exportTableToPdf } from '../../../utils/exportTableHelper';
import { showAlert } from '../../../config/alerts';
import {
  useDeclaracionInventarioServices,
  AlmacenItem,
  DeclaracionProductoItem,
  DeclaracionResponse,
} from './services/useDeclaracionInventario';

export const DeclaracionInventario: React.FC = () => {
  const {
    loadApiGetAlmacenes,
    loadApiGetDeclaracion,
    loadApiGuardarDeclaracion,
  } = useDeclaracionInventarioServices();

  // Fecha actual fijada internamente
  const currentDateStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const formattedCurrentDate = useMemo(() => dayjs().format('DD/MM/YYYY'), []);

  // Estados de datos
  const [warehouses, setWarehouses] = useState<AlmacenItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [declaracionInfo, setDeclaracionInfo] = useState<DeclaracionResponse | null>(null);
  const [itemsList, setItemsList] = useState<DeclaracionProductoItem[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filtros de tabla y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Carga inicial de almacenes
  useEffect(() => {
    const fetchAlmacenes = async () => {
      setIsLoading(true);
      const res = await loadApiGetAlmacenes();
      let loadedWh: AlmacenItem[] = [];
      if (res && res.success && Array.isArray(res.datos)) {
        loadedWh = res.datos;
      } else if (Array.isArray(res)) {
        loadedWh = res;
      }
      setWarehouses(loadedWh);

      if (loadedWh.length > 0) {
        const firstWh = loadedWh[0];
        setSelectedWarehouse(firstWh);
        fetchDeclaracionData(firstWh);
      } else {
        setIsLoading(false);
      }
    };
    fetchAlmacenes();
  }, []);

  // Consultar declaración del almacén para la fecha actual
  const fetchDeclaracionData = async (warehouse: AlmacenItem | null) => {
    if (!warehouse) {
      showAlert.warning('Seleccione un Almacén', 'Debe seleccionar un almacén para consultar la declaración.');
      return;
    }

    setIsLoading(true);
    const res = await loadApiGetDeclaracion(warehouse.ID_PLANTA_ALMACEN, currentDateStr);
    setIsLoading(false);

    if (res && res.success) {
      setDeclaracionInfo(res);
      const productosMap: DeclaracionProductoItem[] = (res.productos || []).map((p) => {
        const stockNum = Number(p.STOCK ?? p.STOCK_SISTEMA ?? 0);
        const defaultQty = p.CANTIDAD !== undefined && p.CANTIDAD !== null ? p.CANTIDAD : '';
        return {
          ...p,
          cantidad_declarada: defaultQty,
          observacion_declaracion: p.OBSERVACION || '',
          STOCK: stockNum,
        };
      });
      setItemsList(productosMap);
      setPage(1);
    } else {
      setDeclaracionInfo(null);
      setItemsList([]);
    }
  };

  // Manejo de cambio en cantidad declarada por fila
  const handleQuantityChange = (targetItem: DeclaracionProductoItem, rawValue: string) => {
    setItemsList((prevList) =>
      prevList.map((item) => {
        const isMatch =
          item.ID_PRODUCTO === targetItem.ID_PRODUCTO &&
          item.ID_PRODUCTO_DETALLE === targetItem.ID_PRODUCTO_DETALLE &&
          item.ID_PRODUCTO_INTERMEDIO === targetItem.ID_PRODUCTO_INTERMEDIO;
        if (!isMatch) return item;

        if (rawValue === '') {
          return { ...item, cantidad_declarada: '' };
        }
        const parsed = parseFloat(rawValue);
        return { ...item, cantidad_declarada: isNaN(parsed) ? '' : Math.max(0, parsed) };
      })
    );
  };

  // Manejo de cambio en observación por fila
  const handleObservacionChange = (targetItem: DeclaracionProductoItem, value: string) => {
    setItemsList((prevList) =>
      prevList.map((item) => {
        const isMatch =
          item.ID_PRODUCTO === targetItem.ID_PRODUCTO &&
          item.ID_PRODUCTO_DETALLE === targetItem.ID_PRODUCTO_DETALLE &&
          item.ID_PRODUCTO_INTERMEDIO === targetItem.ID_PRODUCTO_INTERMEDIO;
        if (!isMatch) return item;
        return { ...item, observacion_declaracion: value };
      })
    );
  };

  // Guardar declaración
  const handleGuardarDeclaracion = async () => {
    if (!selectedWarehouse) {
      showAlert.warning('Almacén Requerido', 'Seleccione un almacén para guardar la declaración.');
      return;
    }

    const isVerified = Boolean(
      declaracionInfo?.documento?.ESTADO_VERIFICACION ||
      declaracionInfo?.documento?.FECHA_VERIFICACION
    );

    if (isVerified) {
      showAlert.error(
        'Declaración Bloqueada',
        'Esta declaración ya fue verificada y cerrada, por lo tanto no se pueden realizar modificaciones.'
      );
      return;
    }

    if (itemsList.length === 0) {
      showAlert.warning('Sin Productos', 'No hay productos en el listado para declarar.');
      return;
    }

    const confirmed = await showAlert.confirm(
      '¿Guardar Declaración de Inventario?',
      `Se guardarán los conteos para el almacén "${selectedWarehouse.DESCRICION || selectedWarehouse.nombre || selectedWarehouse.NOMBRE}".`
    );

    if (!confirmed) return;

    const payload = {
      fecha: currentDateStr,
      productos: itemsList.map((item) => ({
        id_producto: Number(item.ID_PRODUCTO || 0),
        id_producto_detalle: Number(item.ID_PRODUCTO_DETALLE || 0),
        id_producto_intermedio: Number(item.ID_PRODUCTO_INTERMEDIO || 0),
        cantidad: item.cantidad_declarada === '' ? 0 : Number(item.cantidad_declarada || 0),
        cantidad_adecuacion: Number(item.CANTIDAD_ADECUACION || 1),
        observacion: item.observacion_declaracion || '',
        producto: item.PRODUCTO || item.PRODUCTO_FACTURADO || '',
      })),
    };

    setIsSaving(true);
    const res = await loadApiGuardarDeclaracion(selectedWarehouse.ID_PLANTA_ALMACEN, payload);
    setIsSaving(false);

    if (res && res.success) {
      await showAlert.success('¡Declaración Guardada!', res.message || 'Se guardó correctamente la información.');
      fetchDeclaracionData(selectedWarehouse);
    }
  };

  // Filtrado de productos en tabla
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return itemsList;
    const term = searchTerm.toLowerCase();
    return itemsList.filter((item) => {
      const prodName = (item.PRODUCTO || '').toLowerCase();
      const factName = (item.PRODUCTO_FACTURADO || item.FACTURADO || item.NOMBRE_FACTURADO || '').toLowerCase();
      const unit = (item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_E || '').toLowerCase();
      return prodName.includes(term) || factName.includes(term) || unit.includes(term);
    });
  }, [itemsList, searchTerm]);

  // Paginación
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Estados del documento
  const isDocumentVerified = Boolean(
    declaracionInfo?.documento?.ESTADO_VERIFICACION ||
    declaracionInfo?.documento?.FECHA_VERIFICACION
  );
  const hasExistingDocument = Boolean(declaracionInfo && declaracionInfo.id_documento > 0);
  const ultVerifDate = declaracionInfo?.ulitimo_verificacion?.FECHA_VERIFICACION || declaracionInfo?.ulitimo_verificacion?.FECHA_REGISTRO;

  const formattedUltVerif = ultVerifDate
    ? (() => {
      const cleanDate = ultVerifDate.split('T')[0];
      const [y, m, d] = cleanDate.split('-');
      return `${d}/${m}/${y}`;
    })()
    : 'Sin registro previo';

  const getExportData = () => {
    const columns = [
      { header: 'N°', key: 'index', width: 6, align: 'center' as const },
      { header: 'PRODUCTO', key: 'producto', width: 28 },
      { header: 'PRODUCTO FACTURADO', key: 'facturado', width: 25 },
      { header: 'STOCK SISTEMA', key: 'stock', width: 16, align: 'right' as const, format: 'number' as const },
      { header: 'UNIDAD MEDIDA', key: 'unidad', width: 14, align: 'center' as const },
      { header: 'MEDIDA NOTA', key: 'medidaNota', width: 14, align: 'center' as const },
      { header: 'UNIDAD DECLARACIÓN', key: 'unidadDecl', width: 16, align: 'center' as const },
      { header: 'CANT. DECLARADA', key: 'cantDeclarada', width: 16, align: 'right' as const, format: 'number' as const },
      { header: 'OBSERVACIÓN', key: 'observacion', width: 25 },
    ];

    const rows = filteredItems.map((item, idx) => ({
      index: idx + 1,
      producto: item.PRODUCTO || '-',
      facturado: item.PRODUCTO_FACTURADO || item.FACTURADO || item.NOMBRE_FACTURADO || '-',
      stock: Number(item.STOCK || 0),
      unidad: item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_E || '-',
      medidaNota: item.MEDIDA_NOTA || item.UNIDAD_MEDIDA_A || '-',
      unidadDecl: item.UNIDAD_MEDIDA_DECLARADA || item.UNIDAD_MEDIDA || '-',
      cantDeclarada: item.cantidad_declarada === '' ? 0 : Number(item.cantidad_declarada || 0),
      observacion: item.observacion_declaracion || item.OBSERVACION || '-',
    }));

    return { columns, rows };
  };

  const handleExportExcel = () => {
    const { columns, rows } = getExportData();
    exportTableToExcel({
      filename: `Declaracion_Inventario_${selectedWarehouse?.DESCRICION || 'Almacen'}_${dayjs().format('YYYYMMDD_HHmm')}`,
      sheetName: 'Declaracion',
      title: 'DECLARACIÓN FÍSICA DE INVENTARIO',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Fecha: ${formattedCurrentDate}`,
      columns,
      rows,
      totalsRow: true,
    });
  };

  const handleExportPdf = () => {
    const { columns, rows } = getExportData();
    exportTableToPdf({
      title: 'DECLARACIÓN FÍSICA DE INVENTARIO',
      subtitle: `Almacén: ${selectedWarehouse?.DESCRICION || 'Todos'} | Fecha: ${formattedCurrentDate}`,
      columns,
      rows,
      totalsRow: true,
      orientation: 'landscape',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      {/* Componente Centralizado LoadingOverlay */}
      <LoadingOverlay show={isLoading} message="Cargando inventario del almacén..." />
      <LoadingOverlay show={isSaving} message="Guardando declaración de inventario..." />

      {/* Cabecera Estándar de Página (AGENTS.md Layout) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-on-surface font-headline">
                Declaración de Inventario
              </h1>
            </div>
          </div>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Ingrese los conteos físicos manuales de productos para el cierre oficial del almacén.
          </p>
        </div>

        {/* Botón de Acción Principal en Cabecera */}
        <div className="flex items-center gap-2">
          <ExportTableButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={filteredItems.length === 0}
          />
          <Button
            variant="primary"
            size="md"
            icon="save"
            onClick={handleGuardarDeclaracion}
            disabled={isLoading || isSaving || itemsList.length === 0 || isDocumentVerified}
            className="!py-1.5 !px-4 shadow-lg shadow-primary/20"
          >
            {hasExistingDocument ? 'Actualizar Declaración' : 'Guardar Declaración'}
          </Button>
        </div>
      </div>

      {/* Barra Superior de Filtros y Selectores (Estándar Oficial AGENTS.md) */}
      <div className="bg-surface dark:bg-zinc-900 rounded-3xl p-5 border border-outline-variant/60 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          {/* Selector de Almacén */}
          <div className="w-full sm:flex-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Seleccionar Almacén
            </label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.DESCRICION || option.nombre || option.NOMBRE || ''}
              value={selectedWarehouse}
              onChange={(_, newValue) => {
                setSelectedWarehouse(newValue);
                setDeclaracionInfo(null);
                setItemsList([]);
                if (newValue) {
                  fetchDeclaracionData(newValue);
                }
              }}
              isOptionEqualToValue={(option, value) =>
                option.ID_PLANTA_ALMACEN === value?.ID_PLANTA_ALMACEN
              }
              fullWidth
              noOptionsText="No hay almacenes disponibles"
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
                  placeholder="SELECCIONAR ALMACÉN..."
                />
              )}
            />
          </div>

          {/* Botón de Búsqueda Estandarizado */}
          <button
            type="button"
            onClick={() => fetchDeclaracionData(selectedWarehouse)}
            title="Buscar Declaraciones"
            className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
          >
            <span className="material-symbols-outlined text-2xl font-bold">search</span>
          </button>
        </div>

        {/* Tarjetas de Información / Estado */}
        {selectedWarehouse && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/40 dark:border-zinc-800">
            <div className="bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl p-3 border border-outline-variant/50 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">history</span>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Última Verificación
                </p>
                <p className="text-xs font-bold text-on-surface">
                  {formattedUltVerif}
                </p>
              </div>
            </div>

            <div className="bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl p-3 border border-outline-variant/50 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">calendar_clock</span>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Días Transcurridos
                </p>
                <p className="text-xs font-bold text-on-surface">
                  {declaracionInfo?.dias !== undefined ? `${declaracionInfo.dias} días` : '-'}
                </p>
              </div>
            </div>

            <div className="bg-surface-variant/40 dark:bg-zinc-850/50 rounded-2xl p-3 border border-outline-variant/50 dark:border-zinc-800 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDocumentVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                <span className="material-symbols-outlined text-lg">
                  {isDocumentVerified ? 'verified' : 'pending_actions'}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Estado Declaración
                </p>
                <p className={`text-xs font-bold ${isDocumentVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isDocumentVerified ? 'Verificado (Cerrado)' : hasExistingDocument ? 'Registrado (Pendiente Verificación)' : 'Sin Registro'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Data Canvas / Diseño de Tablas Unificado (AGENTS.md) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Cabecera Superior de Tabla con Título, Fecha Actual y Buscador tipo Píldora */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">inventory</span>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-headline">
                Listado de Productos ({itemsList.length} ítems)
              </span>
            </div>
            {/* Badge con la Fecha Actual al lado del título */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 text-primary">
              <span className="material-symbols-outlined text-sm font-bold">calendar_today</span>
              <span className="text-[11px] font-black uppercase tracking-wider font-body">
                {formattedCurrentDate}
              </span>
            </div>
          </div>

          {/* Buscador de Tabla Interno Estandarizado */}
          <div className="relative group w-full sm:w-48 sm:ml-2">
            <input
              type="text"
              placeholder="BUSCAR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 pl-9 text-[10px] font-black text-zinc-900 dark:text-zinc-150 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Tabla Compacta y Responsiva */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-850/50">
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  N°
                </td>
                <td className="pl-6 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  PRODUCTO
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  PRODUCTO FACTURADO
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center whitespace-nowrap">
                  STOCK SISTEMA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  UNIDAD MEDIDA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  MEDIDA NOTA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  UNIDAD DECLARACIÓN
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center w-32 whitespace-nowrap">
                  CANT. DECLARADA
                </td>
                <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 min-w-[180px]">
                  OBSERVACIÓN
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {paginatedItems.map((item, idx) => {
                const globalIdx = (page - 1) * pageSize + idx;

                return (
                  <tr
                    key={`${item.ID_PRODUCTO}-${item.ID_PRODUCTO_DETALLE}-${item.ID_PRODUCTO_INTERMEDIO}-${idx}`}
                    className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/30 transition-colors group"
                  >
                    <td className="pl-6 pr-2 py-1 font-black text-xs text-primary tracking-tight whitespace-nowrap">
                      <span>{globalIdx + 1}</span>
                    </td>
                    <td className="pl-6 pr-2 py-1 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {item.PRODUCTO || '-'}
                    </td>
                    <td className="px-4 py-1 text-xs text-zinc-600 dark:text-zinc-350 font-medium">
                      {item.PRODUCTO_FACTURADO || item.FACTURADO || item.NOMBRE_FACTURADO || '-'}
                    </td>
                    <td className="px-4 py-1 text-center font-bold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {(Number(item.STOCK) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-1 text-zinc-600 dark:text-zinc-400 uppercase text-[11px] font-medium whitespace-nowrap">
                      {item.UNIDAD_MEDIDA || item.UNIDAD_MEDIDA_E || '-'}
                    </td>
                    <td className="px-4 py-1 text-zinc-400 dark:text-zinc-500 italic text-[11px] whitespace-nowrap">
                      {item.MEDIDA_NOTA || item.NOTA || '-'}
                    </td>
                    <td className="px-4 py-1 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase text-[10px] font-bold">
                        {item.UNIDAD_DECLARACION || item.UNIDAD_MEDIDA_A || item.UNIDAD_MEDIDA || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-1 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        disabled={isDocumentVerified}
                        value={item.cantidad_declarada !== undefined ? item.cantidad_declarada : ''}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                        placeholder="0.00"
                        className="w-24 h-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1 px-2 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <input
                        type="text"
                        disabled={isDocumentVerified}
                        value={item.observacion_declaracion || ''}
                        onChange={(e) => handleObservacionChange(item, e.target.value)}
                        placeholder="Opcional..."
                        className="w-full h-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-1 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>
                );
              })}

              {!isLoading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <span className="material-symbols-outlined text-4xl mb-2 text-zinc-400">inventory_2</span>
                    <p className="text-sm font-bold">No se encontraron productos para esta consulta.</p>
                    <p className="text-xs text-zinc-400 mt-1">Seleccione un almacén o presione el botón de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination (Estándar Oficial AGENTS.md) */}
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
                  <option value={100}>100 filas</option>
                </select>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Mostrando {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalItems)} de {totalItems} registros
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
              <span className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-400 px-2">
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

      {/* Botones de Acción al pie */}
      <div className="flex justify-end items-center gap-4 pb-8">
        <Button
          variant="primary"
          size="md"
          icon="check_circle"
          onClick={handleGuardarDeclaracion}
          disabled={isLoading || isSaving || itemsList.length === 0 || isDocumentVerified}
          className="shadow-lg shadow-primary/20"
        >
          {hasExistingDocument ? 'Actualizar Declaración' : 'Finalizar Declaración'}
        </Button>
      </div>
    </div>
  );
};

export default DeclaracionInventario;
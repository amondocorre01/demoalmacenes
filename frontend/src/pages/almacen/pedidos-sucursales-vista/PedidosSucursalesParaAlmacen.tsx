/**
 * PedidosSucursalesParaAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * 1. Propósito de la vista:
 *    Gestión, consolidación y control de pedidos emitidos por las sucursales hacia el
 *    almacén central. Permite visualizar de forma matricial las cantidades solicitadas
 *    y enviadas por producto para cada sucursal con columnas dinámicas, validar stock
 *    disponible en tiempo real y registrar cambios y despachos de manera consolidada.
 *
 * 2. APIs Utilizadas:
 *    - GET /v1/pedidos-sucursal/listar-pedidos (loadApiListarPedidos - Consulta consolidada con filtros)
 *    - PATCH /v1/pedidos-sucursal/guardar-cambios (loadApiGuardarCambios - Guardar modificaciones en cantidades)
 *
 * 3. Controles Clave:
 *    - Columnas de sucursales dinámicas renderizadas según la respuesta de la cabecera del servidor.
 *    - Cabecera de la tabla fija (sticky) con scroll independiente.
 *    - Columna fija de Producto / Insumo con visualización completa del nombre (sin sustitución por puntos suspensivos).
 *    - Paginación estandarizada con visualización de todos los datos por defecto y opciones configurables.
 *    - Barra de filtros superior con selectores autocompletables para Sucursal, Turno y Fecha.
 *    - Buscador integrado tipo píldora para filtrar rápidamente productos en la tabla.
 *    - Edición de cantidades enviadas por sucursal con control de entradas numéricas sin ceros pegados.
 *    - Indicadores visuales de estado y totales con badges circulares de alta legibilidad.
 *    - Modal de confirmación para auditoría de cambios y registro de observaciones por producto.
 *    - Soporte completo para modo claro y modo oscuro usando tokens de diseño institucional.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Tooltip,
  Zoom,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { showAlert } from '../../../config/alerts';
import { ExportTableButtons } from '../../../components/common/ExportTableButtons';
import { exportTableToPdf, TableColumnConfig } from '../../../utils/exportTableHelper';
import {
  usePedidosSucursalesParaAlmacenServices,
  ConsolidadoItem,
} from './services/usePedidosSucursalesParaAlmacen';
import {
  ModalConfirmarCambios,
  ChangedProduct,
} from './components/ModalConfirmarCambios';
import { exportExcelConsolidado } from './components/exportExcelConsolidado';

// Helper para formato de nombres de sucursal
const getBranchLabel = (col: string): string => {
  const mapping: Record<string, string> = {
    salamanca: 'SALAMANCA',
    pando: 'PANDO',
    jordan: 'JORDÁN',
    hupermall: 'HUPERMALL',
    center: 'MEGA CENTER',
    aoeste: 'AMÉRICA OESTE',
    aeste: 'AMÉRICA ESTE',
    fidelanze: 'FIDEL ANZE',
    lincoln: 'LINCOLN',
    feria: 'FERIA',
  };
  return mapping[col.toLowerCase()] || col.toUpperCase();
};

// Helper de iconos por categoría de producto
const getProductIcon = (category: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('reposter') || cat.includes('pie') || cat.includes('torta') || cat.includes('pastel')) return 'cake';
  if (cat.includes('pan') || cat.includes('masa')) return 'bakery_dining';
  if (cat.includes('bebida') || cat.includes('cafe') || cat.includes('café')) return 'local_cafe';
  if (cat.includes('galleta') || cat.includes('snack')) return 'cookie';
  return 'lunch_dining';
};

// Componente optimizado de fila de la tabla
interface TableRowProps {
  row: ConsolidadoItem;
  cabecera: string[];
  onValueChange: (idSub2: number, idTurno: number, col: string, val: string) => void;
  refreshKey: number;
}

const TableRow = React.memo(({ row, cabecera, onValueChange, refreshKey }: TableRowProps) => {
  const [localData, setLocalData] = useState<Record<string, number | string>>({});
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initialVals: Record<string, number | string> = {};
    cabecera.forEach((col) => {
      const cell = row[col];
      if (cell) {
        const mostrarEnviada =
          cell.estado !== 11 ||
          cell.cantidad_enviada > 0 ||
          cell.cantidad_enviada !== cell.cantidad_solicitada;
        initialVals[col] = mostrarEnviada ? cell.cantidad_enviada : cell.cantidad_solicitada;
      } else {
        initialVals[col] = 0;
      }
    });
    setLocalData(initialVals);
  }, [row, cabecera, refreshKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const rowTotal = useMemo(() => {
    return cabecera.reduce((sum: number, col: string) => {
      const rawVal = localData[col];
      const num = rawVal === '' || rawVal === undefined || rawVal === null ? 0 : Number(rawVal);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [localData, cabecera]);

  const handleLocalChange = (col: string, val: string) => {
    const cleanedVal = val.replace(/^0+(?=\d)/, '');
    if (cleanedVal === '') {
      setLocalData((prev) => ({
        ...prev,
        [col]: '',
      }));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onValueChange(row.id_sub_categoria_2, row.idTurno, col, '0');
      }, 400);
      return;
    }

    const numVal = parseInt(cleanedVal, 10);
    if (isNaN(numVal) || numVal < 0) return;

    setLocalData((prev) => ({
      ...prev,
      [col]: numVal,
    }));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onValueChange(row.id_sub_categoria_2, row.idTurno, col, cleanedVal);
    }, 400);
  };

  const handleBlur = (col: string, val: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const cleanedVal = String(val).replace(/^0+(?=\d)/, '');
    const finalVal = cleanedVal === '' || isNaN(parseInt(cleanedVal, 10)) ? '0' : cleanedVal;
    setLocalData((prev) => ({
      ...prev,
      [col]: finalVal === '0' ? 0 : parseInt(finalVal, 10),
    }));
    onValueChange(row.id_sub_categoria_2, row.idTurno, col, finalVal);
  };

  const productIcon = getProductIcon(row.Categoria || row.Producto);
  const isTotalZero = rowTotal === 0;

  return (
    <tr className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group">
      {/* Celda fija de Producto (compacta en móvil, amplia en desktop) */}
      <td className="px-2 sm:px-5 py-2 sm:py-2.5 sticky left-0 z-10 transition-colors bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-850 shadow-[2px_0_8px_rgba(0,0,0,0.03)] border-b border-zinc-100 dark:border-zinc-800/80 w-[110px] min-w-[110px] max-w-[110px] sm:w-[240px] sm:min-w-[240px] sm:max-w-none">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl hidden sm:flex items-center justify-center shrink-0 border ${isTotalZero
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
              }`}
          >
            <span className="material-symbols-outlined text-sm sm:text-base">{productIcon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] sm:text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight whitespace-normal break-words">
              {row.Producto}
            </div>
            <div className="text-[7px] sm:text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest mt-0.5">
              {row.Turno || 'PERECEDERO'}
            </div>
          </div>
        </div>
      </td>

      {/* Celdas dinámicas de sucursales */}
      {cabecera.map((col) => {
        const cell = row[col];
        const isLocked =
          !cell ||
          (cell.estado && cell.estado >= 12) ||
          Boolean(row.btnProducto) ||
          String(row.Turno || '').toUpperCase() !== 'PERECEDERO';
        const cantSolicitada = cell?.cantidad_solicitada ?? 0;

        return (
          <td
            key={col}
            className="px-2 py-2 text-center border-b border-zinc-100 dark:border-zinc-800/80 min-w-[85px]"
          >
            <Tooltip
              title={`Solicitado: ${cantSolicitada}`}
              arrow
            >
              <span>
                <input
                  type="number"
                  min={0}
                  disabled={isLocked}
                  value={localData[col] ?? ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleLocalChange(col, e.target.value)}
                  onBlur={(e) => handleBlur(col, String(localData[col] ?? '0'))}
                  className={`w-12 text-center py-1 text-xs font-black transition-all outline-none rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isLocked
                    ? 'bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/40 cursor-not-allowed'
                    : 'bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-primary focus:bg-white dark:focus:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                />
              </span>
            </Tooltip>
          </td>
        );
      })}

      {/* Total */}
      <td className="px-3 py-2 text-center border-b border-zinc-100 dark:border-zinc-800/80 min-w-[70px]">
        <span
          className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-[10px] font-black tracking-wider shadow-sm ${isTotalZero
            ? 'bg-emerald-500 text-white'
            : 'bg-rose-500 text-white'
            }`}
        >
          {rowTotal}
        </span>
      </td>

      {/* Stock */}
      <td className="px-3 py-2 text-center border-b border-zinc-100 dark:border-zinc-800/80 min-w-[70px]">
        <span className="text-[11px] font-black text-zinc-400 dark:text-zinc-500">
          {row.Stock !== undefined ? row.Stock : 0}
        </span>
      </td>

      {/* Acción */}
      {/* <td className="px-4 py-2 text-right border-b border-zinc-100 dark:border-zinc-800/80 min-w-[70px]">
        {row.btnProducto ? (
          <button
            type="button"
            title="Cambio de Producto"
            className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-500 border border-primary/20 dark:border-primary/10 hover:bg-primary hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold cursor-pointer ml-auto"
          >
            <span className="material-symbols-outlined text-[14px]">autorenew</span>
          </button>
        ) : null}
      </td> */}
    </tr>
  );
});

export const PedidosSucursalesParaAlmacen: React.FC = () => {
  const { loadApiListarPedidos, loadApiGuardarCambios } =
    usePedidosSucursalesParaAlmacenServices();

  // Estados de filtros
  const [selectedBranch, setSelectedBranch] = useState<{ label: string; value: number } | null>({
    label: 'TODOS',
    value: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTurno, setSelectedTurno] = useState<string>('PERECEDERO');

  // Estados de datos
  const [cabecera, setCabecera] = useState<string[]>([]);
  const [sucursalesOptions, setSucursalesOptions] = useState<Array<{ label: string; value: number }>>([
    { label: 'TODOS', value: 0 },
  ]);
  const [consolidados, setConsolidados] = useState<ConsolidadoItem[]>([]);
  const [originalData, setOriginalData] = useState<ConsolidadoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Estados de paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(-1); // -1 = Visualizar todos los datos por defecto

  // Estados de modal y guardado
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [changedProductsList, setChangedProductsList] = useState<ChangedProduct[]>([]);
  const [isProcessingSave, setIsProcessingSave] = useState<boolean>(false);

  // Carga de pedidos consolidados
  const fetchPedidos = useCallback(
    async (
      fecha = selectedDate,
      turno = selectedTurno,
      sucursal = selectedBranch?.value ?? 0
    ) => {
      if (!fecha || !fecha.isValid()) {
        showAlert.warning('Fecha inválida', 'Seleccione una fecha válida para consultar pedidos.');
        return;
      }

      setLoading(true);
      try {
        const fechaStr = fecha.format('YYYY-MM-DD');
        const res = await loadApiListarPedidos({
          fecha_reporte: fechaStr,
          tipo_reporte: turno,
          sucursal: sucursal,
          tipo: 0,
          producible: 1,
          filtrar_restante: 0,
          filtrar_total: 0,
        });

        if (res) {
          const list = res.consolidados || [];
          const dynCabecera = res.cabecera || [];
          setCabecera(dynCabecera);
          setConsolidados(list);
          setOriginalData(JSON.parse(JSON.stringify(list)));
          setRefreshKey((k) => k + 1);
          setPage(1);

          // Armar opciones de sucursales solo con las presentes en cabecera
          if (res.sucursales2 && Object.keys(res.sucursales2).length > 0) {
            const opts: Array<{ label: string; value: number }> = [{ label: 'TODOS', value: 0 }];
            dynCabecera.forEach((code) => {
              if (res.sucursales2 && res.sucursales2[code] !== undefined) {
                opts.push({
                  label: getBranchLabel(code),
                  value: res.sucursales2[code],
                });
              }
            });
            setSucursalesOptions(opts);
          }
        }
      } catch (error) {
        console.error('Error al obtener pedidos consolidados:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, selectedTurno, selectedBranch, loadApiListarPedidos]
  );

  useEffect(() => {
    fetchPedidos();
  }, []);

  // Manejador de cambio de cantidad por celda
  const handleValueChange = useCallback(
    (idSub2: number, idTurno: number, col: string, val: string) => {
      const numVal = parseInt(val, 10) || 0;
      setConsolidados((prev) =>
        prev.map((item) => {
          if (item.id_sub_categoria_2 === idSub2 && item.idTurno === idTurno) {
            const cell = item[col] || {
              id_producto_detalle: 0,
              cantidad_solicitada: 0,
              cantidad_enviada: 0,
              estado: 11,
            };
            return {
              ...item,
              [col]: {
                ...cell,
                cantidad_enviada: numVal,
              },
            };
          }
          return item;
        })
      );
    },
    []
  );

  // Filtrado por buscador
  const filteredConsolidados = useMemo(() => {
    if (!searchTerm.trim()) return consolidados;
    const term = searchTerm.toLowerCase().trim();
    return consolidados.filter(
      (item) =>
        (item.Producto && item.Producto.toLowerCase().includes(term)) ||
        (item.Categoria && item.Categoria.toLowerCase().includes(term)) ||
        (item.SubCategoria && item.SubCategoria.toLowerCase().includes(term)) ||
        (item.Turno && item.Turno.toLowerCase().includes(term))
    );
  }, [consolidados, searchTerm]);

  // Lista paginada
  const totalItems = filteredConsolidados.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedConsolidados = useMemo(() => {
    if (pageSize === -1) return filteredConsolidados;
    const startIndex = (page - 1) * pageSize;
    return filteredConsolidados.slice(startIndex, startIndex + pageSize);
  }, [filteredConsolidados, page, pageSize]);

  // Detección de cambios para botón Guardar
  const handleGuardarClick = () => {
    const changes: ChangedProduct[] = [];

    consolidados.forEach((currentItem) => {
      const origItem = originalData.find(
        (o) =>
          o.id_sub_categoria_2 === currentItem.id_sub_categoria_2 &&
          o.idTurno === currentItem.idTurno
      );
      if (!origItem) return;

      const itemChanges: ChangedProduct['changes'] = [];

      cabecera.forEach((col) => {
        const curCell = currentItem[col];
        const origCell = origItem[col];

        const curQty = curCell ? curCell.cantidad_enviada : 0;
        const origQty = origCell ? origCell.cantidad_enviada : 0;

        if (curQty !== origQty) {
          itemChanges.push({
            sucursalKey: col,
            sucursalLabel: getBranchLabel(col),
            oldQty: origQty,
            newQty: curQty,
            id_producto_detalle: curCell?.id_producto_detalle || 0,
          });
        }
      });

      if (itemChanges.length > 0) {
        changes.push({
          idSub2: currentItem.id_sub_categoria_2,
          idTurno: currentItem.idTurno,
          producto: currentItem.Producto,
          turno: currentItem.Turno,
          pedido_principal: Boolean(currentItem.pedido_principal),
          changes: itemChanges,
        });
      }
    });

    if (changes.length === 0) {
      showAlert.warning('Sin cambios', 'No se ha detectado ninguna modificación en las cantidades.');
      return;
    }

    setChangedProductsList(changes);
    setIsConfirmModalOpen(true);
  };

  // Confirmar y guardar cambios en backend
  const handleConfirmChanges = async (observations: Record<string, string>) => {
    setIsProcessingSave(true);
    try {
      const fechaStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      const sucursalesPayload: Record<string, any[]> = {};

      changedProductsList.forEach((prod) => {
        const obs = observations[`${prod.idSub2}-${prod.idTurno}`] || '';
        prod.changes.forEach((chg) => {
          if (!sucursalesPayload[chg.sucursalKey]) {
            sucursalesPayload[chg.sucursalKey] = [];
          }
          sucursalesPayload[chg.sucursalKey].push({
            cantidad: chg.newQty,
            observacion: obs,
            turno: prod.turno,
            idSub2: prod.idSub2,
            sub2: prod.producto,
            id_protucto_detalle: chg.id_producto_detalle,
            editar: prod.pedido_principal ? 1 : 0,
            pedido_principal: prod.pedido_principal ? 1 : 0,
          });
        });
      });

      const res = await loadApiGuardarCambios({
        fecha: fechaStr,
        sucursales: sucursalesPayload,
      });

      if (res && res.success !== false) {
        showAlert.success('Guardado Exitoso', res.message || 'Se guardaron los cambios correctamente.');
        setIsConfirmModalOpen(false);
        fetchPedidos();
      } else if (res.message == false) {
        showAlert.warning(res.message)
      } else {
        showAlert.error('Error al guardar', res.message);
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      showAlert.error('Error', 'Ocurrió un error inesperado al guardar los cambios.');
    } finally {
      setIsProcessingSave(false);
    }
  };

  // Exportar a Excel amigable con datos visibles
  const handleExportExcel = () => {
    exportExcelConsolidado({
      consolidados: filteredConsolidados,
      cabecera,
      getBranchLabel,
      selectedDate,
      selectedTurno,
    });
  };

  // Exportar a PDF limpio y amigable
  const handleExportPdf = () => {
    const pdfCols: TableColumnConfig[] = [
      { header: 'Producto / Insumo', width: 220, align: 'left' },
      { header: 'Turno', width: 80, align: 'center' },
      ...cabecera.map((col) => ({
        header: getBranchLabel(col),
        width: 75,
        align: 'center' as const,
        type: 'number' as const,
      })),
      { header: 'Total', width: 70, align: 'center', type: 'number' },
      { header: 'Stock', width: 70, align: 'center', type: 'number' },
    ];

    let grandTotal = 0;
    let totalStock = 0;
    const totalsPerBranch: Record<string, number> = {};
    cabecera.forEach((c) => {
      totalsPerBranch[c] = 0;
    });

    const pdfData = filteredConsolidados.map((row) => {
      let rowSum = 0;
      const branchValues = cabecera.map((col) => {
        const cell = row[col];
        const mostrarEnviada =
          cell &&
          (cell.estado !== 11 ||
            cell.cantidad_enviada > 0 ||
            cell.cantidad_enviada !== cell.cantidad_solicitada);
        const val = cell ? (mostrarEnviada ? cell.cantidad_enviada : cell.cantidad_solicitada) : 0;
        const numVal = isNaN(Number(val)) ? 0 : Number(val);
        rowSum += numVal;
        totalsPerBranch[col] = (totalsPerBranch[col] || 0) + numVal;
        return numVal;
      });

      grandTotal += rowSum;
      const stockVal = isNaN(Number(row.Stock)) ? 0 : Number(row.Stock);
      totalStock += stockVal;

      return [
        row.Producto || '',
        row.Turno || 'PERECEDERO',
        ...branchValues,
        rowSum,
        stockVal,
      ];
    });

    const pdfTotals = [
      'TOTAL GENERAL',
      '-',
      ...cabecera.map((col) => totalsPerBranch[col] || 0),
      grandTotal,
      totalStock,
    ];

    const fechaStr = selectedDate ? selectedDate.format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY');

    exportTableToPdf({
      title: 'CONSOLIDADO DE PEDIDOS DE SUCURSALES',
      subtitle: `FECHA DE PEDIDO: ${fechaStr}   |   TURNO: ${selectedTurno}   |   SUCURSAL: ${selectedBranch?.label || 'TODOS'}`,
      columns: pdfCols,
      data: pdfData,
      totals: pdfTotals,
    });
  };

  return (
    <div className="space-y-0 font-body">
      {/* ── Encabezado Principal ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight font-headline">
            CONSOLIDADO DE PEDIDOS DE SUCURSALES
          </h1>
          <p className="text-[10px] font-black text-on-surface-variant mt-0 font-body">
            Control matricial de cantidades solicitadas por sucursales, despacho central y auditoría de inventario
          </p>
        </div>

        {/* Botones de Reportes en la parte superior derecha */}
        <ExportTableButtons
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          disabled={filteredConsolidados.length === 0}
        />
      </div>

      {/* ── Barra Superior de Filtros ── */}
      <div className="bg-surface dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
          {/* 1. Selector de Sucursal */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Filtro de Sucursal
            </label>
            <Autocomplete
              options={sucursalesOptions}
              getOptionLabel={(option) => option.label || ''}
              value={selectedBranch}
              onChange={(_, newValue) => {
                setSelectedBranch(newValue);
                setConsolidados([]);
                setOriginalData([]);
                setCabecera([]);
                setChangedProductsList([]);
                setPage(1);
              }}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              fullWidth
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  placeholder="TODOS"
                />
              )}
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
            />
          </div>

          {/* 2. Selector de Fecha */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Fecha de Pedido
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
                setConsolidados([]);
                setOriginalData([]);
                setCabecera([]);
                setChangedProductsList([]);
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

          {/* 3. Selector de Turno */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
              Turno de Producción
            </label>
            <Autocomplete
              options={['PERECEDERO', 'NO PERECEDERO', 'TODOS']}
              value={selectedTurno}
              onChange={(_, newValue) => {
                if (newValue) {
                  setSelectedTurno(newValue);
                  setConsolidados([]);
                  setOriginalData([]);
                  setCabecera([]);
                  setChangedProductsList([]);
                  setPage(1);
                }
              }}
              fullWidth
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  placeholder="PERECEDERO"
                />
              )}
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
            />
          </div>

          {/* 4. Botón de Búsqueda Estandarizado */}
          <div className="md:col-span-1 flex justify-start pb-0.5">
            <button
              type="button"
              onClick={() => fetchPedidos()}
              title="Buscar Pedidos"
              className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shrink-0 shadow-inner"
            >
              <span className="material-symbols-outlined text-2xl font-bold">search</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Data Canvas ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[1.25rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        {/* Cabecera del Canvas */}
        <div className="px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 bg-primary rounded-full"></span>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 whitespace-nowrap font-headline">
                CONSOLIDADO DE CANTIDADES ({filteredConsolidados.length} PRODUCTOS)
              </p>
            </div>
            <div className="relative group w-48 ml-1">
              <input
                type="text"
                placeholder="BUSCAR..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-1.5 px-3 pl-8 text-[10px] font-black text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-primary/10 transition-all uppercase tracking-widest placeholder:text-zinc-400 outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                search
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGuardarClick}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md shadow-zinc-900/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>GUARDAR</span>
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>

        {/* Contenedor con Scroll y Cabecera Estática para Tabla */}
        <div className="w-full overflow-auto max-h-[65vh] scrollbar-thin">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-zinc-50 dark:bg-zinc-950">
                <th className="px-2 sm:px-5 py-2.5 sm:py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 sticky left-0 top-0 bg-zinc-50 dark:bg-zinc-950 z-30 border-b border-zinc-200 dark:border-zinc-800 shadow-[2px_0_8px_rgba(0,0,0,0.04)] w-[110px] min-w-[110px] max-w-[110px] sm:w-[240px] sm:min-w-[240px] sm:max-w-none">
                  PRODUCTO / INSUMO
                </th>
                {cabecera.map((col) => (
                  <th
                    key={col}
                    className="px-1.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center border-b border-zinc-200 dark:border-zinc-800 min-w-[85px] max-w-[100px] bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-20"
                  >
                    <div className="flex flex-col items-center justify-center leading-tight">
                      {getBranchLabel(col).split(' ').map((word, wIdx) => (
                        <span key={wIdx} className="whitespace-nowrap leading-tight">{word}</span>
                      ))}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-primary dark:text-red-500 text-center border-b border-zinc-200 dark:border-zinc-800 min-w-[70px] bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-20">
                  TOTAL
                </th>
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center border-b border-zinc-200 dark:border-zinc-800 min-w-[70px] bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-20">
                  STOCK
                </th>
                {/* <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right border-b border-zinc-200 dark:border-zinc-800 min-w-[70px] bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-20">
                  ACCIÓN
                </th> */}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {paginatedConsolidados.length > 0 ? (
                paginatedConsolidados.map((row) => (
                  <TableRow
                    key={`${row.id_sub_categoria_2}-${row.idTurno}`}
                    row={row}
                    cabecera={cabecera}
                    onValueChange={handleValueChange}
                    refreshKey={refreshKey}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={cabecera.length + 4}
                    className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest"
                  >
                    {loading ? 'Cargando consolidado de pedidos...' : 'No se encontraron pedidos con los filtros seleccionados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer / Paginación Estándar ── */}
        {!loading && totalItems > 0 && (
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
                  <option value={-1}>Todos ({totalItems})</option>
                  <option value={10}>10 filas</option>
                  <option value={20}>20 filas</option>
                  <option value={50}>50 filas</option>
                  <option value={100}>100 filas</option>
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

      {/* ── Modal de Confirmación de Cambios ── */}
      <ModalConfirmarCambios
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        changedProducts={changedProductsList}
        onConfirm={handleConfirmChanges}
        isProcessing={isProcessingSave}
      />

      {/* ── Loading Overlay ── */}
      <LoadingOverlay show={loading} message="Cargando pedidos consolidados..." />
    </div>
  );
};

export default PedidosSucursalesParaAlmacen;

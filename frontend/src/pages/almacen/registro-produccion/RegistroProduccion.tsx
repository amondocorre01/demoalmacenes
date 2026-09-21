/**
 * RegistroProduccion.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Propósito de la Vista:
 * Módulo interactivo de registro de producción de lotes (intermedios y finales).
 * Permite seleccionar el almacén productor, cargar recetas con balance de insumos en tiempo real,
 * configurar despachos o áreas destino, y registrar la producción impactando el inventario.
 *
 * APIs Utilizadas:
 * 1. GET  /v1/inventario/produccion/almacenes-usuario  (loadApiGetAlmacenesUsuario)
 * 2. GET  /v1/inventario/produccion/almacenes          (loadApiGetAlmacenes)
 * 3. GET  /v1/inventario/produccion/areas              (loadApiGetAreas)
 * 4. GET  /v1/inventario/produccion/almacenes/:id/recetas (loadApiGetRecetasByAlmacen)
 * 5. POST /v1/inventario/produccion/registrar-productos (loadApiRegistrarProductosProducidos)
 *
 * Controles Clave:
 * - Detección y filtrado reactivo de recetas por tipo (Intermedios tipo=0, Finales tipo=1).
 * - Cálculo consolidado en tiempo real de insumos requeridos vs disponibles con desglose de déficit.
 * - Validación estricta que previene registrar si hay insumos insuficientes.
 * - Destino obligatorio según tipo de producto (Área para finales, Almacén destino opcional para intermedios).
 * - Soporte integral de modo claro y modo oscuro conforme a directrices de AGENTS.md.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  Autocomplete,
  TextField,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Button } from '../../../components/common/Button';
import { showAlert, MySwal } from '../../../config/alerts';
import {
  useRegistroProduccionServices,
  AlmacenItem,
  AreaItem,
  RecetaProduccionItem,
  RegistrarProduccionPayload,
  ProductoProduccionPayloadItem
} from './services/useRegistroProduccion';

// --- Interfaces Locales ---
interface ProductionListItem {
  tempId: number;
  receta: RecetaProduccionItem;
  qty: number;
  waste: number;
  destType: 'area' | 'branch' | 'none';
  destinationArea?: AreaItem | null;
  destinationBranch?: AlmacenItem | null;
  isIntermediate: boolean;
}

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 shrink-0">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70 font-headline">
      {label}
    </span>
  </div>
);

export const RegistroProduccion: React.FC = () => {
  const {
    loadApiGetAreas,
    loadApiGetAlmacenes,
    loadApiGetAlmacenesUsuario,
    loadApiGetRecetasByAlmacen,
    loadApiRegistrarProductosProducidos
  } = useRegistroProduccionServices();

  // --- Catálogos Remotos ---
  const [userWarehouses, setUserWarehouses] = useState<AlmacenItem[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<AlmacenItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [availableRecetas, setAvailableRecetas] = useState<RecetaProduccionItem[]>([]);

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingRecetas, setIsLoadingRecetas] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Estados de Formulario de Cabecera ---
  const [selectedWarehouse, setSelectedWarehouse] = useState<AlmacenItem | null>(null);
  const [productionDate, setProductionDate] = useState<Dayjs | null>(dayjs());

  // --- Estados del Constructor de Producto ---
  const [prodType, setProdType] = useState<'intermediate' | 'final'>('intermediate');
  const [selectedReceta, setSelectedReceta] = useState<RecetaProduccionItem | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [waste, setWaste] = useState<number | string>(0);

  // Transferencia de Intermedios
  const [shouldTransfer, setShouldTransfer] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<AlmacenItem | null>(null);

  // Destino de Finales (Área)
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  // --- Lista de Producción Agregada ---
  const [productionList, setProductionList] = useState<ProductionListItem[]>([]);

  // 1. Carga inicial de almacenes y áreas
  useEffect(() => {
    const initData = async () => {
      setIsLoadingInitial(true);
      try {
        const [resUserWh, resAllWh, resAreas] = await Promise.all([
          loadApiGetAlmacenesUsuario(),
          loadApiGetAlmacenes(),
          loadApiGetAreas()
        ]);

        const uWhList: AlmacenItem[] = (resUserWh && resUserWh.success && Array.isArray(resUserWh.almacenes))
          ? resUserWh.almacenes
          : [];
        const allWhList: AlmacenItem[] = (resAllWh && resAllWh.success && Array.isArray(resAllWh.almacenes))
          ? resAllWh.almacenes
          : uWhList;
        const areaList: AreaItem[] = (resAreas && resAreas.success && Array.isArray(resAreas.areas))
          ? resAreas.areas
          : [];

        setUserWarehouses(uWhList);
        setAllWarehouses(allWhList);
        setAreas(areaList);

        // Seleccionar primer almacén disponible
        if (uWhList.length > 0) {
          setSelectedWarehouse(uWhList[0]);
        } else if (allWhList.length > 0) {
          setSelectedWarehouse(allWhList[0]);
        }

        if (areaList.length > 0) {
          setSelectedArea(areaList[0]);
        }
      } catch (err) {
        console.error('Error inicializando datos:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    initData();
  }, []);

  // 2. Cargar recetas al cambiar almacén productor o tipo de producto
  useEffect(() => {
    if (!selectedWarehouse) {
      setAvailableRecetas([]);
      return;
    }

    const fetchRecetas = async () => {
      setIsLoadingRecetas(true);
      const tipo = prodType === 'intermediate' ? 0 : 1;
      const res = await loadApiGetRecetasByAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN, tipo);
      if (res && res.success && Array.isArray(res.recetas)) {
        setAvailableRecetas(res.recetas);
      } else {
        setAvailableRecetas([]);
      }
      setIsLoadingRecetas(false);
    };

    fetchRecetas();
  }, [selectedWarehouse, prodType]);

  // --- Memos & Análisis de Stock Consolidado ---

  // Cálculo consolidado de insumos requeridos en tiempo real
  const aggregatedStockReport = useMemo(() => {
    const requirements: Record<
      string,
      {
        name: string;
        required: number;
        available: number;
        unit: string;
      }
    > = {};

    // 1. Acumula requerimientos de los productos en la lista activa
    productionList.forEach((item) => {
      const ingredientes = item.receta.PRODUCTOS || [];
      ingredientes.forEach((ing) => {
        const key = `${ing.ID_PRODUCTO || 0}_${ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0}_${ing.PRODUCTO || ''}`;
        const reqAmount = (ing.CANTIDAD || 0) * item.qty;
        if (!requirements[key]) {
          requirements[key] = {
            name: ing.PRODUCTO || 'Insumo',
            required: 0,
            available: ing.stock ?? 0,
            unit: ing.UNIDAD_MEDIDA || 'uds'
          };
        }
        requirements[key].required += reqAmount;
      });
    });

    // 2. Suma en tiempo real el producto que se está editando en el formulario
    if (selectedReceta && Number(quantity) > 0) {
      const currentQty = parseFloat(String(quantity)) || 0;
      const ingredientes = selectedReceta.PRODUCTOS || [];
      ingredientes.forEach((ing) => {
        const key = `${ing.ID_PRODUCTO || 0}_${ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0}_${ing.PRODUCTO || ''}`;
        const reqAmount = (ing.CANTIDAD || 0) * currentQty;
        if (!requirements[key]) {
          requirements[key] = {
            name: ing.PRODUCTO || 'Insumo',
            required: 0,
            available: ing.stock ?? 0,
            unit: ing.UNIDAD_MEDIDA || 'uds'
          };
        }
        requirements[key].required += reqAmount;
      });
    }

    // 3. Genera listado con desglose de suficiencia y déficit
    return Object.values(requirements)
      .map((item) => {
        const sufficient = item.available >= item.required;
        const deficit = sufficient ? 0 : item.required - item.available;
        return {
          ...item,
          sufficient,
          deficit
        };
      })
      .sort((a, b) => {
        if (a.sufficient !== b.sufficient) return a.sufficient ? 1 : -1;
        return b.deficit - a.deficit;
      });
  }, [productionList, selectedReceta, quantity]);

  // Determina si falta stock para los productos YA confirmados en la lista
  const hasConfirmedMissingStock = useMemo(() => {
    const requirements: Record<string, { required: number; available: number }> = {};
    productionList.forEach((item) => {
      (item.receta.PRODUCTOS || []).forEach((ing) => {
        const key = `${ing.ID_PRODUCTO || 0}_${ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0}_${ing.PRODUCTO || ''}`;
        if (!requirements[key]) {
          requirements[key] = {
            required: 0,
            available: ing.stock ?? 0
          };
        }
        requirements[key].required += (ing.CANTIDAD || 0) * item.qty;
      });
    });

    return Object.values(requirements).some((req) => req.available < req.required);
  }, [productionList]);

  // Determina si falta stock incluyendo el producto en edición actual
  const hasTotalMissingStock = useMemo(() => {
    return aggregatedStockReport.some((report) => !report.sufficient);
  }, [aggregatedStockReport]);

  // --- Acciones de Formulario ---

  const handleAddProduct = () => {
    if (!selectedReceta) {
      showAlert.error('Selecciona un producto', 'Debes elegir una receta del catálogo disponible.');
      return;
    }

    const qtyNum = parseFloat(String(quantity));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showAlert.error('Cantidad inválida', 'Ingresa una cantidad producida mayor a 0.');
      return;
    }

    const wasteNum = parseFloat(String(waste)) || 0;
    if (wasteNum < 0) {
      showAlert.error('Desperdicio inválido', 'El desperdicio no puede ser un valor negativo.');
      return;
    }

    // Validar insumos específicos contra stock acumulado
    const missingIngredients: string[] = [];
    (selectedReceta.PRODUCTOS || []).forEach((ing) => {
      let alreadyRequired = 0;
      productionList.forEach((item) => {
        (item.receta.PRODUCTOS || []).forEach((r) => {
          if (
            (r.ID_PRODUCTO && r.ID_PRODUCTO === ing.ID_PRODUCTO) ||
            (r.ID_PRODUCTO_INTERMEDIO_ANTECESOR &&
              r.ID_PRODUCTO_INTERMEDIO_ANTECESOR === ing.ID_PRODUCTO_INTERMEDIO_ANTECESOR) ||
            r.PRODUCTO === ing.PRODUCTO
          ) {
            alreadyRequired += (r.CANTIDAD || 0) * item.qty;
          }
        });
      });

      const totalNeeded = alreadyRequired + (ing.CANTIDAD || 0) * qtyNum;
      const available = ing.stock ?? 0;
      if (available < totalNeeded) {
        const missingAmount = totalNeeded - available;
        missingIngredients.push(
          `• <b>${ing.PRODUCTO || 'Insumo'}</b>: Falta <b>${missingAmount.toFixed(2)} ${ing.UNIDAD_MEDIDA || ''}</b> (Requerido: ${totalNeeded.toFixed(2)}, Disponible: ${available.toFixed(2)})`
        );
      }
    });

    if (missingIngredients.length > 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'Insumos Insuficientes',
        html: `
          <div style="text-align: left; margin-top: 10px; font-family: var(--font-main, sans-serif);">
            <p style="font-size: 13px; font-weight: 500; color: #52525b; line-height: 1.5;">
              No se puede añadir <b>${qtyNum}</b> unidad(es) de <b>${selectedReceta.PRODUCTO || selectedReceta.NOMBRE}</b> debido a la falta de stock en el almacén:
            </p>
            <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); padding: 16px; border-radius: 16px; margin-top: 14px; font-size: 11px; line-height: 1.6; color: #dc2626;">
              ${missingIngredients.join('<br/>')}
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'var(--primary, #9d0013)'
      });
      return;
    }

    // Validar destinos
    let destType: 'area' | 'branch' | 'none' = 'none';
    if (prodType === 'final') {
      if (!selectedArea) {
        showAlert.error('Área requerida', 'Debes seleccionar un Área de destino para el producto final.');
        return;
      }
      destType = 'area';
    } else {
      if (shouldTransfer) {
        if (!selectedBranch) {
          showAlert.error('Almacén requerido', 'Has seleccionado transferir, debes elegir el almacén de destino.');
          return;
        }
        destType = 'branch';
      }
    }

    const newItem: ProductionListItem = {
      tempId: Date.now() + Math.random(),
      receta: selectedReceta,
      qty: qtyNum,
      waste: wasteNum,
      destType,
      destinationArea: prodType === 'final' ? selectedArea : null,
      destinationBranch: prodType === 'intermediate' && shouldTransfer ? selectedBranch : null,
      isIntermediate: prodType === 'intermediate'
    };

    setProductionList((prev) => [...prev, newItem]);

    // Limpiar campos del formulario
    setSelectedReceta(null);
    setQuantity(1);
    setWaste(0);
    setShouldTransfer(false);
    setSelectedBranch(null);

    showAlert.toast('Producto añadido a la orden de producción', 'success');
  };

  const handleRemoveProduct = (tempId: number) => {
    setProductionList((prev) => prev.filter((item) => item.tempId !== tempId));
    showAlert.toast('Producto removido de la orden', 'info');
  };

  const handleResetForm = () => {
    setProductionList([]);
    setSelectedReceta(null);
    setQuantity(1);
    setWaste(0);
    setShouldTransfer(false);
    setSelectedBranch(null);
    showAlert.toast('Formulario reiniciado', 'info');
  };

  const handleRegisterProduction = async () => {
    if (!selectedWarehouse) {
      showAlert.error('Almacén requerido', 'Selecciona un almacén productor.');
      return;
    }

    if (productionList.length === 0) {
      showAlert.error('Lista vacía', 'Debes añadir al menos un producto antes de registrar la producción.');
      return;
    }

    if (hasConfirmedMissingStock) {
      showAlert.error(
        'Insumos Insuficientes',
        'No se puede procesar el registro porque faltan insumos en el inventario para los productos en la lista.'
      );
      return;
    }

    const isConfirmed = await showAlert.confirm(
      '¿Registrar Producción?',
      `Se registrarán ${productionList.length} producto(s) en ${selectedWarehouse.DESCRICION || selectedWarehouse.nombre || 'el almacén'}. Se descontarán automáticamente los insumos correspondientes del inventario.`,
      'Sí, Registrar'
    );

    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      const productosPayload: ProductoProduccionPayloadItem[] = productionList.map((item) => {
        let detalleText = '';
        if (item.destType === 'area' && item.destinationArea) {
          detalleText = `Área: ${item.destinationArea.NOMBRE}`;
        } else if (item.destType === 'branch' && item.destinationBranch) {
          detalleText = `Transferido a: ${item.destinationBranch.DESCRICION || item.destinationBranch.nombre}`;
        }

        return {
          id_planta_almacen: selectedWarehouse.ID_PLANTA_ALMACEN,
          id_planta_receta: item.receta.ID_PLANTA_RECETA,
          id_producto_intermedio: item.receta.ID_PRODUCTO_INTERMEDIO || 0,
          id_sub_categoria_2: item.receta.ID_SUB_CATEGORIA_2 || 0,
          cantidad_producida: item.qty,
          cantidad_desperdicio: item.waste || 0,
          detalle: detalleText || undefined,
          producto: item.receta.PRODUCTO || item.receta.NOMBRE || '',
          cant_AE: item.receta.CANTIDAD_ADECUACION || 0
        };
      });

      const payload: RegistrarProduccionPayload = {
        id_area: selectedArea?.ID_AREA,
        productos: productosPayload
      };

      const res = await loadApiRegistrarProductosProducidos(payload);
      if (res && res.success) {
        showAlert.success(
          '¡Producción Registrada!',
          res.message || 'La orden de producción se registró correctamente en el sistema y se actualizaron los stocks.'
        );
        // Limpiar lista
        setProductionList([]);
        setSelectedReceta(null);
        setQuantity(1);
        setWaste(0);

        // Recargar recetas para actualizar stocks disponibles
        const tipo = prodType === 'intermediate' ? 0 : 1;
        loadApiGetRecetasByAlmacen(selectedWarehouse.ID_PLANTA_ALMACEN, tipo).then((recRes) => {
          if (recRes && recRes.success && Array.isArray(recRes.recetas)) {
            setAvailableRecetas(recRes.recetas);
          }
        });
      }
    } catch (error) {
      console.error('Error registrando producción:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-3 sm:px-0">

      {/* ── Cabecera de Página Oficial ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-2xl md:text-2xl font-black text-on-surface uppercase tracking-tight leading-none font-headline">
                Registro de Producción
              </h1>
            </div>
          </div>
          <p className="text-[10px] font-black text-on-surface-variant mt-1 font-body">
            Módulo para asentar productos intermedios y terminados con cálculo de insumos en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon="restart_alt"
            onClick={handleResetForm}
            className="!h-10 !px-5"
          >
            Reiniciar
          </Button>
        </div>
      </div>

      {/* ── Grid Principal Responsive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Columna Izquierda: Configuración, Formulario y Lista Activa (8/12) */}
        <div className="lg:col-span-8 space-y-6">

          {/* PASO 01: Origen y Fecha */}
          <div className="p-6 bg-surface dark:bg-zinc-900 rounded-[2rem] border border-outline-variant/60 dark:border-zinc-800 shadow-sm space-y-5">
            <StepBadge num="01" label="Origen y fecha de elaboración" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                  Almacén Productor (Origen) *
                </label>
                <Autocomplete
                  options={userWarehouses.length > 0 ? userWarehouses : allWarehouses}
                  getOptionLabel={(opt) => opt.DESCRICION || opt.nombre || `Almacén #${opt.ID_PLANTA_ALMACEN}`}
                  value={selectedWarehouse}
                  disabled={productionList.length > 0 || isLoadingInitial}
                  onChange={(_, val) => {
                    setSelectedWarehouse(val);
                    setSelectedReceta(null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Seleccionar almacén..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          bgcolor: 'var(--surface-variant, rgba(0,0,0,0.02))'
                        }
                      }}
                    />
                  )}
                />
                {productionList.length > 0 && (
                  <p className="text-[9px] text-primary font-bold uppercase mt-1 ml-1 animate-pulse">
                    * Bloqueado mientras existan productos activos en la lista
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                  Fecha de Elaboración
                </label>
                <DatePicker
                  value={productionDate}
                  onChange={(newValue) => setProductionDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          bgcolor: 'var(--surface-variant, rgba(0,0,0,0.02))'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* PASO 02: Selector de Producto & Configuración de Destino */}
          <div
            className={`p-6 bg-surface dark:bg-zinc-900 rounded-[2rem] border border-outline-variant/60 dark:border-zinc-800 shadow-sm space-y-6 transition-all duration-300 ${!selectedWarehouse ? 'opacity-30 pointer-events-none' : ''
              }`}
          >
            <StepBadge num="02" label="Configuración del Producto a Elaborar" />

            {/* Selector Tipo Producto: Intermedio vs Final */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-outline-variant/40 pb-4">
              <ToggleButtonGroup
                value={prodType}
                exclusive
                onChange={(_, val) => {
                  if (val) {
                    setProdType(val);
                    setSelectedReceta(null);
                    setQuantity(1);
                    setWaste(0);
                    setShouldTransfer(false);
                    setSelectedBranch(null);
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '12px',
                    px: 3,
                    py: 1,
                    border: '1px solid var(--border-outline-variant, #e4e4e7)',
                    textTransform: 'none',
                    fontWeight: 900,
                    fontSize: '11px',
                    letterSpacing: '0.04em',
                    fontFamily: 'var(--font-headline)'
                  }
                }}
              >
                <ToggleButton value="intermediate" className="uppercase gap-1.5">
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                  Producto Intermedio
                </ToggleButton>
                <ToggleButton value="final" className="uppercase gap-1.5">
                  <span className="material-symbols-outlined text-base">star</span>
                  Producto Final
                </ToggleButton>
              </ToggleButtonGroup>

              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                Catálogo: {prodType === 'intermediate' ? 'Intermedios' : 'Productos Finales'} ({availableRecetas.length} recetas)
              </span>
            </div>

            {/* Formulario Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              {/* Autocomplete de Receta */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                  Receta / Producto a Registrar *
                </label>
                <Autocomplete
                  options={availableRecetas}
                  loading={isLoadingRecetas}
                  getOptionLabel={(opt) =>
                    `${opt.PRODUCTO || opt.NOMBRE || 'Sin nombre'} (Máx. prod: ${opt.CANTIDAD ?? '0'} ${opt.UNIDAD_MEDIDA || 'uds'})`
                  }
                  value={selectedReceta}
                  onChange={(_, val) => {
                    setSelectedReceta(val);
                    if (val) {
                      setQuantity(1);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={isLoadingRecetas ? 'Cargando recetas...' : 'Seleccionar receta...'}
                      slotProps={{
                        input: {
                          ...params.InputProps,

                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          bgcolor: 'var(--surface-variant, rgba(0,0,0,0.02))'
                        }
                      }}
                    />
                  )}
                />
              </div>

              {/* Cantidad Producida */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                  Cantidad Producida *
                </label>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: selectedReceta ? (
                        <InputAdornment position="end">
                          <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                            {selectedReceta.UNIDAD_MEDIDA || 'uds'}
                          </span>
                        </InputAdornment>
                      ) : null
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      bgcolor: 'var(--surface-variant, rgba(0,0,0,0.02))'
                    }
                  }}
                />
              </div>

              {/* Desperdicio */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                  Desperdicio (Merma)
                </label>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={waste}
                  onChange={(e) => setWaste(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: selectedReceta ? (
                        <InputAdornment position="end">
                          <span className="text-[10px] font-bold text-on-surface-variant">
                            {selectedReceta.UNIDAD_MEDIDA || 'uds'}
                          </span>
                        </InputAdornment>
                      ) : null
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      bgcolor: 'var(--surface-variant, rgba(0,0,0,0.02))'
                    }
                  }}
                />
              </div>
            </div>

            {/* Condicionales por Tipo de Producto */}
            <div className="space-y-4 pt-2">
              {/* Flujo Intermedio: Despacho Opcional a otro Almacén */}
              {prodType === 'intermediate' && (
                <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">local_shipping</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-on-surface uppercase tracking-tight font-headline">
                          ¿Transferir a otro Almacén / Sucursal?
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">
                          El producto intermedio puede despacharse inmediatamente.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={shouldTransfer}
                      onChange={(e) => {
                        setShouldTransfer(e.target.checked);
                        if (!e.target.checked) setSelectedBranch(null);
                      }}
                      color="primary"
                    />
                  </div>

                  {shouldTransfer && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="sm:col-span-8 space-y-1.5">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 font-headline">
                          Almacén de Destino *
                        </label>
                        <Autocomplete
                          options={allWarehouses.filter(
                            (w) => w.ID_PLANTA_ALMACEN !== selectedWarehouse?.ID_PLANTA_ALMACEN
                          )}
                          getOptionLabel={(opt) => opt.DESCRICION || opt.nombre || `Almacén #${opt.ID_PLANTA_ALMACEN}`}
                          value={selectedBranch}
                          onChange={(_, val) => setSelectedBranch(val)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Seleccionar almacén destino..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '12px',
                                  bgcolor: 'var(--surface, #ffffff)'
                                }
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flujo Final: Área de Destino Obligatoria */}
              {prodType === 'final' && (
                <div className="p-4 bg-surface-variant/40 dark:bg-zinc-850/40 rounded-2xl border border-outline-variant/60 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-lg">business</span>
                    <span className="text-[10px] font-black uppercase tracking-widest font-headline">
                      Área de Destino Obligatoria
                    </span>
                  </div>
                  <Autocomplete
                    options={areas}
                    getOptionLabel={(opt) => opt.NOMBRE || `Área #${opt.ID_AREA}`}
                    value={selectedArea}
                    onChange={(_, val) => setSelectedArea(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Seleccionar área destino..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: 'var(--surface, #ffffff)'
                          }
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {/* Botón Añadir a la Lista */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon="add_circle"
                  onClick={handleAddProduct}
                  disabled={!selectedReceta || !quantity || Number(quantity) <= 0}
                  className="!h-11 !px-8 shadow-lg shadow-primary/20"
                >
                  Añadir a la Orden de Producción
                </Button>
              </div>
            </div>
          </div>

          {/* PASO 03: Lista de Producción Agregada */}
          <div
            className={`p-6 bg-surface dark:bg-zinc-900 rounded-[2rem] border border-outline-variant/60 dark:border-zinc-800 shadow-sm space-y-6 transition-all duration-300 ${productionList.length === 0 ? 'opacity-40' : ''
              }`}
          >
            <StepBadge num="03" label="Lista de Productos en Esta Orden" />

            {productionList.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/50 space-y-3">
                <span className="material-symbols-outlined text-5xl opacity-40">inventory_2</span>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] font-headline">
                  No hay productos en la orden de producción actual
                </p>
                <p className="text-[10px] text-on-surface-variant/70 font-medium">
                  Configura arriba una receta y haz clic en &quot;Añadir a la Orden&quot;.
                </p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-surface-variant/40 border-b border-outline-variant/60">
                        <td className="pl-5 pr-2 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                          N°
                        </td>
                        <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                          Producto / Receta
                        </td>
                        <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center whitespace-nowrap">
                          Tipo
                        </td>
                        <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center whitespace-nowrap">
                          Cantidad
                        </td>
                        <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                          Destino / Despacho
                        </td>
                        <td className="pr-5 pl-2 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right whitespace-nowrap">
                          Acción
                        </td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 text-xs">
                      {productionList.map((item, idx) => (
                        <tr
                          key={item.tempId}
                          className="hover:bg-surface-variant/30 transition-colors group"
                        >
                          <td className="pl-5 pr-2 py-3 font-black text-xs text-primary whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-base">
                                  {item.isIntermediate ? 'inventory_2' : 'star'}
                                </span>
                              </div>
                              <div>
                                <p className="font-black text-on-surface uppercase text-[11px] tracking-tight font-headline">
                                  {item.receta.PRODUCTO || item.receta.NOMBRE}
                                </p>
                                <p className="text-[9px] text-on-surface-variant font-bold">
                                  {item.receta.PRODUCTOS?.length || 0} insumos requeridos
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${item.isIntermediate
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}
                            >
                              {item.isIntermediate ? 'Intermedio' : 'Final'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-on-surface whitespace-nowrap">
                            <span className="text-xs">
                              {item.qty} {item.receta.UNIDAD_MEDIDA || 'uds'}
                            </span>
                            {item.waste > 0 && (
                              <span className="block text-[9px] text-rose-500 font-bold">
                                Merma: {item.waste}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 uppercase text-[10px]">
                            {item.destType === 'area' && item.destinationArea ? (
                              <span className="flex items-center gap-1.5 text-on-surface-variant font-bold">
                                <span className="material-symbols-outlined text-sm text-primary">business</span>
                                {item.destinationArea.NOMBRE}
                              </span>
                            ) : item.destType === 'branch' && item.destinationBranch ? (
                              <span className="flex items-center gap-1.5 text-primary font-black">
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                {item.destinationBranch.DESCRICION || item.destinationBranch.nombre}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/60 italic font-medium">Almacén local</span>
                            )}
                          </td>
                          <td className="pr-5 pl-2 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.tempId)}
                              title="Remover de la orden"
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center justify-center font-bold cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px] sm:text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Balance Consolidado de Stock en Tiempo Real (4/12) */}
        <div className="lg:col-span-4 sticky top-6">
          <div
            className={`bg-zinc-900 text-white rounded-[2rem] p-6 shadow-2xl transition-all duration-500 border ${hasConfirmedMissingStock
              ? 'border-rose-500/50 ring-4 ring-rose-500/15'
              : productionList.length > 0
                ? 'border-emerald-500/50 ring-4 ring-emerald-500/15'
                : 'border-zinc-800'
              }`}
          >
            <StepBadge num="04" label="Consolidado de Insumos" />

            {productionList.length === 0 && !selectedReceta ? (
              <div className="flex flex-col items-center justify-center h-[320px] text-center space-y-4 opacity-40">
                <span className="material-symbols-outlined text-5xl">analytics</span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed font-headline">
                  Agrega productos para validar el stock consolidado de insumos en tiempo real
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Banner de Estado General */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasTotalMissingStock
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasTotalMissingStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      } text-white shadow-lg shrink-0`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {hasTotalMissingStock ? 'warning' : 'verified'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-white/50 tracking-widest font-headline">
                      Disponibilidad de Insumos
                    </p>
                    <p className="text-xs font-black uppercase tracking-tight font-headline">
                      {hasTotalMissingStock ? 'Insumos Insuficientes' : 'Stock Totalmente Disponible'}
                    </p>
                  </div>
                </div>

                {hasTotalMissingStock && (
                  <p className="text-[10px] text-rose-300 font-bold uppercase tracking-tight bg-rose-950/50 p-3 rounded-xl border border-rose-900/60 leading-relaxed">
                    ⚠️ Hay insumos faltantes en el almacén. Reduce las cantidades producidas para poder registrar la orden.
                  </p>
                )}

                {/* Lista de Insumos y Progreso de Stock */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                  {aggregatedStockReport.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${ingredient.sufficient
                        ? 'bg-white/5 border-white/10'
                        : 'bg-rose-500/15 border-rose-500/40'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider font-headline ${ingredient.sufficient ? 'text-zinc-200' : 'text-rose-400'
                            }`}
                        >
                          {ingredient.name}
                        </span>
                        <span
                          className={`material-symbols-outlined text-base ${ingredient.sufficient ? 'text-emerald-400' : 'text-rose-500'
                            }`}
                        >
                          {ingredient.sufficient ? 'check_circle' : 'cancel'}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs font-black tracking-tight text-white">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-white/40 uppercase tracking-wider">
                            Requerido
                          </span>
                          <span>
                            {ingredient.required.toFixed(2)} {ingredient.unit}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-white/40 uppercase tracking-wider">
                            Disponible
                          </span>
                          <span
                            className={
                              ingredient.sufficient ? 'text-zinc-300' : 'text-rose-400'
                            }
                          >
                            {ingredient.available.toFixed(2)} {ingredient.unit}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${ingredient.sufficient ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          style={{
                            width: `${Math.min(
                              (ingredient.available / (ingredient.required || 1)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>

                      {!ingredient.sufficient && (
                        <p className="text-[9px] text-rose-400 font-black uppercase tracking-wider mt-1.5 text-right">
                          Déficit: -{ingredient.deficit.toFixed(2)} {ingredient.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botón Principal de Registro de Producción */}
                <div className="pt-4 border-t border-zinc-800">
                  <Button
                    variant="primary"
                    size="lg"
                    icon="save_as"
                    onClick={handleRegisterProduction}
                    disabled={hasConfirmedMissingStock || productionList.length === 0 || isSubmitting}
                    className="w-full !h-12 !rounded-2xl shadow-xl shadow-primary/30"
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Producción'}
                  </Button>

                  {hasConfirmedMissingStock && (
                    <p className="text-[9px] text-rose-400 font-black uppercase text-center mt-2 tracking-wider animate-pulse">
                      * Registro bloqueado por falta de insumos
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroProduccion;

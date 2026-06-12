import React, { useState, useMemo } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  Autocomplete,
  TextField,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment
} from '@mui/material';
import { showAlert, MySwal } from '../../../config/alerts';

// --- Types ---
interface IngredientReq {
  item: string;
  req: number; // Required quantity per unit of product
}

interface Product {
  id: number;
  name: string;
  warehouse: string;
  unit: string;
  icon: string;
  isIntermediate: boolean;
  recipe: IngredientReq[];
}

interface ProductionItem {
  tempId: number;
  product: Product;
  qty: number;
  destType: 'area' | 'branch' | 'none';
  destination: string | null;
}

// --- Mock Data ---
const warehouses = ['BIZCOCHOS', 'CHEESECAKE', 'ESENCIAS', 'FRUTAS'];

const branches = [
  'Sucursal Salamanca',
  'Sucursal Central',
  'Sucursal Obrajes',
  'Sucursal Achumani',
  'Sucursal Calacoto'
];

const areas = [
  'PLANTA',
  'ADMINISTRACIÓN',
  'AUDITORÍA EXTERNA',
  'SUCURSAL SALAMANCA'
];

const availableProducts: Product[] = [
  // --- BIZCOCHOS (Intermediate Products) ---
  {
    id: 1119,
    name: 'BIZCOCHO DE ALMENDRA - RI',
    warehouse: 'BIZCOCHOS',
    unit: 'uds',
    icon: 'bakery_dining',
    isIntermediate: true,
    recipe: [
      { item: 'HARINA', req: 3.25 },
      { item: 'AZUCAR', req: 0.8 },
      { item: 'HUEVO', req: 10 },
      { item: 'ALMENDRA', req: 0.8 },
      { item: 'ACEITE', req: 0.7 },
      { item: 'POLVO DE HORNEAR', req: 0.08 }
    ]
  },
  {
    id: 74,
    name: 'BIZCOCHO DE CHOCOLATE-RI',
    warehouse: 'BIZCOCHOS',
    unit: 'uds',
    icon: 'cookie',
    isIntermediate: true,
    recipe: [
      { item: 'AZUCAR', req: 2.3 },
      { item: 'CHISPAS DE CHOCOLATE', req: 0.8 },
      { item: 'COCOA BREICK', req: 0.5 },
      { item: 'HARINA', req: 2.3 },
      { item: 'HUEVO', req: 12 },
      { item: 'MARGARINA S/N SAL', req: 0.8 }
    ]
  },
  {
    id: 2159,
    name: 'BIZCOCHO DE ZANAHORIA - RI',
    warehouse: 'BIZCOCHOS',
    unit: 'uds',
    icon: 'bakery_dining',
    isIntermediate: true,
    recipe: [
      { item: 'HUEVO', req: 8 },
      { item: 'ACEITE', req: 1.5 },
      { item: 'AZUCAR MORENA', req: 3.3 },
      { item: 'HARINA', req: 3.3 },
      { item: 'CANELA EN POLVO', req: 0.05 },
      { item: 'ZANAHORIA', req: 4.5 }
    ]
  },
  // --- BIZCOCHOS (Final Products) ---
  {
    id: 5001,
    name: 'TORTA 3 LECHES FAMILIAR',
    warehouse: 'BIZCOCHOS',
    unit: 'uds',
    icon: 'cake',
    isIntermediate: false,
    recipe: [
      { item: 'HARINA', req: 1.6 },
      { item: 'AZUCAR', req: 1.5 },
      { item: 'HUEVO', req: 6 },
      { item: 'CREMA VEGETAL', req: 0.5 }
    ]
  },
  {
    id: 5002,
    name: 'TORTA DE ALMENDRA ESPECIAL',
    warehouse: 'BIZCOCHOS',
    unit: 'uds',
    icon: 'cake',
    isIntermediate: false,
    recipe: [
      { item: 'HARINA', req: 2.0 },
      { item: 'AZUCAR', req: 1.2 },
      { item: 'ALMENDRA', req: 0.5 },
      { item: 'CREMA VEGETAL', req: 0.3 }
    ]
  },

  // --- CHEESECAKE (Intermediate Products) ---
  {
    id: 2001,
    name: 'BASE PARA CHEESECAKE - RI',
    warehouse: 'CHEESECAKE',
    unit: 'uds',
    icon: 'cake',
    isIntermediate: true,
    recipe: [
      { item: 'QUESO CREMA', req: 1.5 },
      { item: 'GALLETA OREO', req: 0.5 },
      { item: 'AZUCAR', req: 0.3 }
    ]
  },
  // --- CHEESECAKE (Final Products) ---
  {
    id: 2002,
    name: 'CHEESECAKE DE FRUTOS ROJOS',
    warehouse: 'CHEESECAKE',
    unit: 'uds',
    icon: 'cake',
    isIntermediate: false,
    recipe: [
      { item: 'QUESO CREMA', req: 1.2 },
      { item: 'MERMELADA FRUTILLA', req: 0.4 },
      { item: 'GALLETA BASE', req: 0.3 }
    ]
  },
  {
    id: 2003,
    name: 'CHEESECAKE DE OREO',
    warehouse: 'CHEESECAKE',
    unit: 'uds',
    icon: 'cake',
    isIntermediate: false,
    recipe: [
      { item: 'QUESO CREMA', req: 1.0 },
      { item: 'GALLETA OREO', req: 0.6 },
      { item: 'AZUCAR', req: 0.2 }
    ]
  }
];

// Insumos iniciales con stock simulado
const initialStock: Record<string, number> = {
  'HARINA': 50.0, // kg
  'AZUCAR': 30.0, // kg
  'HUEVO': 150, // Unidades
  'ALMENDRA': 10.0, // kg
  'ACEITE': 15.0, // litros
  'POLVO DE HORNEAR': 5.0, // kg
  'CHISPAS DE CHOCOLATE': 12.0, // kg
  'COCOA BREICK': 0.0, // kg (Falta de stock por defecto)
  'MARGARINA S/N SAL': 10.0, // kg
  'AZUCAR MORENA': 15.0, // kg
  'CANELA EN POLVO': 2.0, // kg
  'ZANAHORIA': 20.0, // kg
  'CREMA VEGETAL': 10.0, // kg
  'QUESO CREMA': 12.0, // kg
  'GALLETA OREO': 8.0, // kg
  'MERMELADA FRUTILLA': 0.0, // kg (Falta de stock por defecto)
  'GALLETA BASE': 10.0 // kg
};

const StepBadge: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 shrink-0">
      {num}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</span>
  </div>
);

export const RegistroProduccion: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // --- States ---
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>('BIZCOCHOS');
  const [productionDate, setProductionDate] = useState<Dayjs | null>(dayjs());
  const [stock, setStock] = useState<Record<string, number>>(initialStock);
  const [productionList, setProductionList] = useState<ProductionItem[]>([]);

  // Adder/Form States
  const [prodType, setProdType] = useState<'intermediate' | 'final'>('intermediate');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | string>(5);

  // Intermediate Product Transfer State
  const [shouldTransfer, setShouldTransfer] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  // Final Product Area State
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // --- Memos & Calculations ---

  // Filtra los productos según el almacén y el tipo seleccionado
  const filteredProducts = useMemo(() => {
    if (!selectedWarehouse) return [];
    return availableProducts.filter(
      (p) =>
        p.warehouse === selectedWarehouse &&
        p.isIntermediate === (prodType === 'intermediate')
    );
  }, [selectedWarehouse, prodType]);

  // Cálculo consolidado de insumos requeridos en tiempo real
  const aggregatedStockReport = useMemo(() => {
    const requirements: Record<string, number> = {};

    // 1. Acumula requerimientos de los productos en la lista
    productionList.forEach((item) => {
      item.product.recipe.forEach((ingredient) => {
        requirements[ingredient.item] =
          (requirements[ingredient.item] || 0) + ingredient.req * item.qty;
      });
    });

    // 2. Suma también en tiempo real el producto que se está editando actualmente (Vista Previa)
    if (selectedProduct && Number(quantity) > 0) {
      selectedProduct.recipe.forEach((ingredient) => {
        requirements[ingredient.item] =
          (requirements[ingredient.item] || 0) +
          ingredient.req * Number(quantity);
      });
    }

    // 3. Convierte en una lista detallada con estados de stock
    return Object.entries(requirements).map(([name, reqAmount]) => {
      const available = stock[name] ?? 0;
      const sufficient = available >= reqAmount;
      const deficit = sufficient ? 0 : reqAmount - available;

      return {
        name,
        required: reqAmount,
        available,
        sufficient,
        deficit
      };
    }).sort((a, b) => {
      // Mostrar primero los insumos con stock insuficiente
      if (a.sufficient !== b.sufficient) return a.sufficient ? 1 : -1;
      return b.deficit - a.deficit;
    });
  }, [productionList, selectedProduct, quantity, stock]);

  // Determina si falta stock para los productos YA confirmados en la lista
  const hasConfirmedMissingStock = useMemo(() => {
    // Calcula los requisitos estrictos de la lista de producción agregada
    const requirements: Record<string, number> = {};
    productionList.forEach((item) => {
      item.product.recipe.forEach((ingredient) => {
        requirements[ingredient.item] =
          (requirements[ingredient.item] || 0) + ingredient.req * item.qty;
      });
    });

    return Object.entries(requirements).some(([name, reqAmount]) => {
      const available = stock[name] ?? 0;
      return available < reqAmount;
    });
  }, [productionList, stock]);

  // Determina si falta stock incluyendo el producto en edición actual (para alertas rápidas)
  const hasTotalMissingStock = useMemo(() => {
    return aggregatedStockReport.some((report) => !report.sufficient);
  }, [aggregatedStockReport]);

  // --- Handlers ---

  const handleAddProduct = () => {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      showAlert.error('Datos incompletos', 'Por favor ingresa una cantidad válida.');
      return;
    }

    // Validar stock individual de este producto con su cantidad antes de añadir a la tabla
    const missingIngredients: string[] = [];
    selectedProduct.recipe.forEach((ingredient) => {
      // Sumar requerimiento acumulado en la lista actual para este insumo
      let alreadyRequired = 0;
      productionList.forEach((item) => {
        item.product.recipe.forEach((r) => {
          if (r.item === ingredient.item) {
            alreadyRequired += r.req * item.qty;
          }
        });
      });

      const totalNeeded = alreadyRequired + ingredient.req * Number(quantity);
      const available = stock[ingredient.item] ?? 0;
      if (available < totalNeeded) {
        const missingAmount = totalNeeded - available;
        missingIngredients.push(
          `• <b>${ingredient.item}</b>: Falta <b>${missingAmount.toFixed(2)}</b> (Requerido: ${totalNeeded.toFixed(2)}, Disponible: ${available.toFixed(2)})`
        );
      }
    });

    if (missingIngredients.length > 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'Insumos Insuficientes',
        html: `
          <div style="text-align: left; margin-top: 10px; font-family: sans-serif;">
            <p style="font-size: 13px; font-weight: 500; color: #52525b; line-height: 1.5;">
              No se puede añadir <b>${quantity}</b> unidad(es) de <b>${selectedProduct.name}</b> debido a la falta de stock para los siguientes insumos en el almacén:
            </p>
            <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 16px; margin-top: 14px; font-size: 11px; line-height: 1.6; color: #dc2626;">
              ${missingIngredients.join('<br/>')}
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'var(--primary, #9d0013)'
      });
      return; // Detiene la adición a la tabla
    }

    // Validar área o sucursal según corresponda
    let destType: 'area' | 'branch' | 'none' = 'none';
    let destination: string | null = null;

    if (prodType === 'final') {
      if (!selectedArea) {
        showAlert.error('Destino requerido', 'Debes seleccionar un Área de destino para el producto final.');
        return;
      }
      destType = 'area';
      destination = selectedArea;
    } else {
      if (shouldTransfer) {
        if (!selectedBranch) {
          showAlert.error('Almacén requerido', 'Has seleccionado transferir, debes elegir un almacén.');
          return;
        }
        destType = 'branch';
        destination = selectedBranch;
      }
    }

    // Agregar a la lista
    const newItem: ProductionItem = {
      tempId: Date.now() + Math.random(),
      product: selectedProduct,
      qty: Number(quantity),
      destType,
      destination
    };

    setProductionList((prev) => [...prev, newItem]);

    // Resetear cargador unitario pero conservar tipo e intermedios
    setSelectedProduct(null);
    setQuantity(5);
    setShouldTransfer(false);
    setSelectedBranch(null);
    setSelectedArea(null);

    showAlert.toast('Producto añadido a la orden', 'success');
  };

  const handleRemoveProduct = (tempId: number) => {
    setProductionList((prev) => prev.filter((item) => item.tempId !== tempId));
    showAlert.toast('Producto removido', 'info');
  };

  const handleRegisterProduction = async () => {
    if (productionList.length === 0) {
      showAlert.error('Lista vacía', 'Debes añadir al menos un producto a la lista antes de registrar.');
      return;
    }

    if (hasConfirmedMissingStock) {
      showAlert.error(
        'Falta de stock insuperable',
        'No se puede procesar el registro porque faltan insumos en el almacén para los productos en la lista.'
      );
      return;
    }

    // Confirmar orden
    const isConfirmed = await showAlert.confirm(
      '¿Registrar Producción?',
      `Se registrarán ${productionList.length} productos en el almacén de ${selectedWarehouse}. Los insumos correspondientes serán descontados del stock en tiempo real.`,
      'Sí, Registrar'
    );

    if (isConfirmed) {
      // Simular descuento de stock
      setStock((prev) => {
        const updated = { ...prev };
        productionList.forEach((item) => {
          item.product.recipe.forEach((ingredient) => {
            updated[ingredient.item] = Math.max(
              0,
              (updated[ingredient.item] ?? 0) - ingredient.req * item.qty
            );
          });
        });
        return updated;
      });

      setProductionList([]);
      showAlert.success(
        '¡Registro Exitoso!',
        'Los productos producidos se registraron de forma masiva en el sistema y se actualizaron los niveles de inventario.'
      );
    }
  };

  const handleResetForm = () => {
    setProductionList([]);
    setSelectedProduct(null);
    setQuantity(5);
    setShouldTransfer(false);
    setSelectedBranch(null);
    setSelectedArea(null);
    showAlert.toast('Formulario reiniciado', 'info');
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
            Registro de Producción
          </p>
          <p className="text-zinc-500 mt-3 font-medium max-w-xl text-xs md:text-sm">
            Módulo interactivo para asentar productos intermedios y finales en una sola orden.
            Realiza verificación consolidada del stock de insumos antes del registro.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleResetForm}
            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-zinc-200"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reiniciar
          </button>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Config, Adder Form & Current List (8/12 grid) */}
        <div className="lg:col-span-8 space-y-8">

          {/* STEP 01: Origen y Fecha */}
          <div className="p-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
            <StepBadge num="01" label="Origen y fecha de producción" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Almacén Productor (Origen)
                </label>
                <Autocomplete
                  options={warehouses}
                  value={selectedWarehouse}
                  disabled={productionList.length > 0}
                  onChange={(_, v) => {
                    setSelectedWarehouse(v);
                    setSelectedProduct(null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Seleccione almacén..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  )}
                />
                {productionList.length > 0 && (
                  <p className="text-[8px] text-primary font-black uppercase mt-1 ml-1 animate-pulse">
                    El almacén se encuentra bloqueado por ítems activos en la lista
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Fecha de Elaboración
                </label>
                <DatePicker
                  value={productionDate}
                  onChange={(newValue) => setProductionDate(newValue)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* STEP 02: Selector de Producto & Reglas de Destino */}
          <div className={`p-6 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6 transition-all duration-300 ${!selectedWarehouse ? 'opacity-30 pointer-events-none' : ''}`}>
            <StepBadge num="02" label="Configuración del Producto producido" />

            {/* Toggle Tipo Producto: Intermedio o Final */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-100 pb-4">
              <ToggleButtonGroup
                value={prodType}
                exclusive
                onChange={(_, v) => {
                  if (v) {
                    setProdType(v);
                    setSelectedProduct(null);
                    setShouldTransfer(false);
                    setSelectedBranch(null);
                    setSelectedArea(null);
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '12px',
                    px: 3,
                    border: '1px solid var(--outline-variant)',
                    textTransform: 'none',
                    fontWeight: 900,
                    fontSize: '10px',
                    letterSpacing: '0.05em'
                  }
                }}
              >
                <ToggleButton value="intermediate" className="uppercase">
                  📦 Producto Intermedio
                </ToggleButton>
                <ToggleButton value="final" className="uppercase">
                  ✨ Producto Final
                </ToggleButton>
              </ToggleButtonGroup>

              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">
                * Catálogo adaptado a: {prodType === 'intermediate' ? 'Intermedios' : 'Productos Finales'}
              </span>
            </div>

            {/* Formulario Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

              {/* Autocomplete de producto */}
              <div className="md:col-span-5 space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Producto a registrar
                </label>
                <Autocomplete
                  options={filteredProducts}
                  getOptionLabel={(option) => option.name}
                  value={selectedProduct}
                  onChange={(_, v) => setSelectedProduct(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Seleccionar..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  )}
                />
              </div>

              {/* Input de Cantidad */}
              <div className="md:col-span-3 space-y-1">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Cantidad Producida
                </label>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: selectedProduct ? (
                        <InputAdornment position="end">
                          <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {selectedProduct.unit}
                          </span>
                        </InputAdornment>
                      ) : null
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>

              {/* Botón Añadir (Visible si no hay campos condicionales abajo) */}
              {prodType === 'intermediate' && !shouldTransfer && (
                <div className="md:col-span-4">
                  <button
                    onClick={handleAddProduct}
                    disabled={!selectedProduct || !quantity || Number(quantity) <= 0}
                    className={`w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!selectedProduct || !quantity || Number(quantity) <= 0
                        ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed border border-zinc-200'
                        : 'bg-zinc-900 hover:bg-primary text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    Añadir a la Lista
                  </button>
                </div>
              )}
            </div>

            {/* Condicionales por Tipo de Producto */}
            <div className="space-y-4">

              {/* Flujo: PRODUCTO INTERMEDIO -> Pregunta Transferencia */}
              {prodType === 'intermediate' && (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-zinc-400">local_shipping</span>
                      <div>
                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-tight">
                          ¿Transferir a algún Almacén?
                        </p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase">
                          El producto intermedio puede ser despachado inmediatamente.
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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in zoom-in-95 duration-200">
                      <div className="md:col-span-8 space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                          Seleccione el Almacén de Destino
                        </label>
                        <Autocomplete
                          options={warehouses}
                          value={selectedBranch}
                          onChange={(_, v) => setSelectedBranch(v)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Ej: Almacén de Repostería"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '12px',
                                  bgcolor: 'white'
                                }
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <button
                          onClick={handleAddProduct}
                          disabled={!selectedProduct || !selectedBranch || !quantity || Number(quantity) <= 0}
                          className={`w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!selectedProduct || !selectedBranch || !quantity || Number(quantity) <= 0
                              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed border border-zinc-200'
                              : 'bg-zinc-900 hover:bg-primary text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        >
                          Añadir con Despacho
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flujo: PRODUCTO FINAL -> Elegir Área obligatoriamente */}
              {prodType === 'final' && (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in slide-in-from-top-2 duration-300">
                  <div className="md:col-span-8 space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-zinc-400 text-sm">business</span>
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                        Área de Destino Obligatoria
                      </label>
                    </div>
                    <Autocomplete
                      options={areas}
                      value={selectedArea}
                      onChange={(_, v) => setSelectedArea(v)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="Seleccionar área (Ej: PLANTA)..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              bgcolor: 'white'
                            }
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <button
                      onClick={handleAddProduct}
                      disabled={!selectedProduct || !selectedArea || !quantity || Number(quantity) <= 0}
                      className={`w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${!selectedProduct || !selectedArea || !quantity || Number(quantity) <= 0
                          ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed border border-zinc-200'
                          : 'bg-zinc-900 hover:bg-primary text-white shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                      Añadir Producto Final
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 03: Lista de Producción Agregada */}
          <div className={`p-6 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6 transition-all duration-300 ${productionList.length === 0 ? 'opacity-30' : ''}`}>
            <StepBadge num="03" label="Lista de Producción Actual" />

            {productionList.length === 0 ? (
              <div className="text-center py-12 text-zinc-300 space-y-4">
                <span className="material-symbols-outlined text-5xl">inventory_2</span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                  No hay productos en la orden de producción
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-zinc-100 rounded-3xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-zinc-50/70 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 border-b border-zinc-100">
                        <td className="px-6 py-4">Producto</td>
                        <td className="px-6 py-4 text-center">Tipo</td>
                        <td className="px-6 py-4 text-center">Cantidad</td>
                        <td className="px-6 py-4">Destino / Despacho</td>
                        <td className="px-6 py-4 text-right">Quitar</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-xs">
                      {productionList.map((item) => (
                        <tr key={item.tempId} className="hover:bg-zinc-50/30 transition-all text-zinc-700 font-bold group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-primary border border-zinc-100">
                                <span className="material-symbols-outlined text-lg">
                                  {item.product.icon}
                                </span>
                              </div>
                              <span className="font-black text-zinc-900 uppercase text-[11px] tracking-tight">
                                {item.product.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.product.isIntermediate
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}
                            >
                              {item.product.isIntermediate ? 'Intermedio' : 'Final'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-zinc-900">
                            {item.qty} {item.product.unit}
                          </td>
                          <td className="px-6 py-4 uppercase text-[9px]">
                            {item.destType === 'area' ? (
                              <span className="flex items-center gap-1 text-zinc-500 font-bold">
                                <span className="material-symbols-outlined text-sm text-zinc-400">
                                  business
                                </span>
                                Área: {item.destination}
                              </span>
                            ) : item.destType === 'branch' ? (
                              <span className="flex items-center gap-1 text-primary font-black">
                                <span className="material-symbols-outlined text-sm text-primary/60">
                                  local_shipping
                                </span>
                                Traspaso: {item.destination}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">No transferido</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveProduct(item.tempId)}
                              className="w-8 h-8 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
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

        {/* Right Column: High Fidelity Consolidated Stock Analysis (4/12 grid) */}
        <div className="lg:col-span-4">
          <div
            className={`bg-zinc-900 text-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl transition-all duration-500 border ${hasConfirmedMissingStock
                ? 'border-rose-500/40 ring-4 ring-rose-500/10'
                : productionList.length > 0
                  ? 'border-emerald-500/40 ring-4 ring-emerald-500/10'
                  : 'border-zinc-800'
              }`}
          >
            <StepBadge num="04" label="Consolidado de Insumos" />

            {productionList.length === 0 && !selectedProduct ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-6 opacity-30">
                <span className="material-symbols-outlined text-5xl">analytics</span>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  Agrega productos a la orden para validar stock consolidado en tiempo real
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Status Box */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${hasTotalMissingStock
                      ? 'bg-rose-500/20 border-rose-500/30'
                      : 'bg-emerald-500/20 border-emerald-500/30'
                    }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${hasTotalMissingStock
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-emerald-500'
                      } text-white shadow-lg shrink-0`}
                  >
                    <span className="material-symbols-outlined">
                      {hasTotalMissingStock ? 'warning' : 'verified'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">
                      Estado del Almacén
                    </p>
                    <p className="text-[11px] font-black uppercase tracking-tight">
                      {hasTotalMissingStock
                        ? 'Insumos Insuficientes'
                        : 'Stock Totalmente Disponible'}
                    </p>
                  </div>
                </div>

                {/* Explicación de stock */}
                {hasTotalMissingStock && (
                  <p className="text-[9px] text-rose-300 font-bold uppercase tracking-tight bg-rose-950/40 p-3 rounded-xl border border-rose-950">
                    ⚠️ Hay ingredientes faltantes. Agrega stock al almacén o reduce las cantidades para poder registrar.
                  </p>
                )}

                {/* Lista de Insumos Consolidados */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {aggregatedStockReport.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden ${ingredient.sufficient
                          ? 'bg-white/5 border-white/5'
                          : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                    >
                      {/* Badge Vista Previa si es el item que se está editando pero no guardado */}
                      {selectedProduct &&
                        !productionList.some((p) => p.product.id === selectedProduct.id) &&
                        selectedProduct.recipe.some((r) => r.item === ingredient.name) && (
                          <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary/20 text-primary text-[7px] font-black uppercase tracking-tight rounded-bl-lg">
                            Vista Previa
                          </div>
                        )}

                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${ingredient.sufficient ? 'text-zinc-300' : 'text-rose-400'
                            }`}
                        >
                          {ingredient.name}
                        </span>
                        <span
                          className={`material-symbols-outlined text-[16px] ${ingredient.sufficient ? 'text-emerald-400' : 'text-rose-500'
                            }`}
                        >
                          {ingredient.sufficient ? 'check_circle' : 'cancel'}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] font-black tracking-tight text-white">
                        <div className="flex flex-col">
                          <span className="text-[7px] text-white/30 uppercase tracking-wider">
                            Requerido
                          </span>
                          <span>{ingredient.required.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] text-white/30 uppercase tracking-wider">
                            Disponible
                          </span>
                          <span
                            className={
                              ingredient.sufficient ? 'text-zinc-300' : 'text-rose-500'
                            }
                          >
                            {ingredient.available.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Progreso de Abasto */}
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ingredient.sufficient ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          style={{
                            width: `${Math.min(
                              (ingredient.available / ingredient.required) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>

                      {/* Cantidad Faltante */}
                      {!ingredient.sufficient && (
                        <p className="text-[8px] text-rose-400 font-black uppercase tracking-widest mt-1.5 text-right">
                          Falta: {ingredient.deficit.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botón de Registro */}
                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={handleRegisterProduction}
                    disabled={hasConfirmedMissingStock || productionList.length === 0}
                    className={`w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 ${hasConfirmedMissingStock || productionList.length === 0
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                        : 'bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">save_as</span>
                    Registrar Producción
                  </button>

                  {hasConfirmedMissingStock && (
                    <p className="text-[7px] text-rose-400 font-black uppercase text-center mt-3 tracking-widest animate-pulse">
                      * El botón está bloqueado por insumos insuficientes en la lista activa
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

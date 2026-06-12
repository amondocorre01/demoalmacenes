import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  TextField,
  Button,
  Switch,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  Box,
  FormControlLabel,
  Divider,
  RadioGroup,
  Radio,
  Collapse
} from '@mui/material';

// --- Interfaces & Types ---
interface Area {
  id: string;
  name: string;
  branch: string;
  bankAccount: string;
  canRequestSupplies: boolean;
}

interface ProviderContact {
  name: string;
  ci: string;
  mobile: string;
  phone: string;
  email: string;
}

interface Provider {
  id: string;
  name: string;
  internalName: string;
  nit: string;
  emitsInvoice: boolean;
  address: string;
  mobile: string;
  phone: string;
  representativeName: string;
  representativeCI: string;
  contact: ProviderContact;
  productType: 'INSUMO' | 'ACTIVO' | 'SERVICIO';
  ordersPerInvoice: 'UNICO' | 'MULTIPLE';
  paymentMethod: 'al contado' | 'por pagar' | 'anticipo';
  paymentForm: 'efectivo' | 'tarjeta' | 'transferencia';
  resourceOrigin: 'fondo de empresa' | 'caja chica';
  bankAccount: string;
  // Campos condicionales para transferencia
  transferDetails?: {
    clientCode: string;
    accountNumber: string;
    clientName: string;
    internalClientName: string;
    documentNumber: string;
    paymentFormCode: string;
    destCurrency: string;
    destEntityCode: string;
    branch: string;
    glosa: string;
    uniqueCode: string;
    notificationEmail: string;
    isSinglePayment: boolean;
  };
  areaId: string; // Vínculo con el área
}

interface Product {
  id: string;
  provider: string; // Nombre del proveedor
  group: string;
  name: string;
  measureDesc: string;
  durationDays: number;
  hasHistogram: boolean;
  isProducedInPlant: boolean;
  relateToBranch: boolean;
  branchRelation?: string;
  packagingType: string;
  price: number;
  quantity: number;
  unitMeasure: string;
  measureValue: number;
  comesInUnit: string;
  stockMin: number;
  stockMax: number;
  status: 'Activo' | 'Inactivo';
}

// --- Mock Iniciales ---
const initialAreas: Area[] = [
  { id: 'area-1', name: 'REPOSTERÍA', branch: 'Sucursal Central', bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020', canRequestSupplies: true },
  { id: 'area-2', name: 'PANADERÍA', branch: 'Sucursal Sur', bankAccount: 'BANCO MERCANTIL SANTA CRUZ S.A-4071613168', canRequestSupplies: true },
  { id: 'area-3', name: 'COCINA FRÍA', branch: 'Sucursal Norte', bankAccount: 'BANCO GANADERO-1310455304', canRequestSupplies: false },
  { id: 'area-4', name: 'ALMACÉN CENTRAL', branch: 'Sucursal Central', bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020', canRequestSupplies: true }
];

const initialProviders: Provider[] = [
  {
    id: 'prov-1',
    name: '4 LLAMAS S.R.L.',
    internalName: '4 LLAMAS',
    nit: '10203040',
    emitsInvoice: true,
    address: 'Pasaje Portales Nro. 1237 Queru Queru',
    mobile: '79799518',
    phone: '4455667',
    representativeName: 'Andres Torrico Ramirez',
    representativeCI: '445566-CBBA',
    contact: { name: 'Andres Torrico', ci: '445566', mobile: '79799518', phone: '0', email: 'andres@4llamas.com' },
    productType: 'INSUMO',
    ordersPerInvoice: 'MULTIPLE',
    paymentMethod: 'por pagar',
    paymentForm: 'transferencia',
    resourceOrigin: 'fondo de empresa',
    bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020',
    transferDetails: {
      clientCode: 'C-4LLAMAS',
      accountNumber: '3000146020',
      clientName: '4 LLAMAS S.R.L.',
      internalClientName: '4 LLAMAS',
      documentNumber: '10203040',
      paymentFormCode: 'TR-01',
      destCurrency: 'Bs.',
      destEntityCode: '1014-Banco Union',
      branch: 'Central Cochabamba',
      glosa: 'Pago de Insumos Planta',
      uniqueCode: 'UN-99812',
      notificationEmail: 'pagos@4llamas.com',
      isSinglePayment: false
    },
    areaId: 'area-1'
  },
  {
    id: 'prov-2',
    name: 'CAMPANELLA S.R.L.',
    internalName: 'CAMPANELLA',
    nit: '55667788',
    emitsInvoice: true,
    address: 'Av. Blanco Galindo Km 5',
    mobile: '71727374',
    phone: '4223344',
    representativeName: 'Maria Campanella',
    representativeCI: '112233-CBBA',
    contact: { name: 'Maria Campanella', ci: '112233', mobile: '71727374', phone: '4223344', email: 'maria@campanella.com' },
    productType: 'INSUMO',
    ordersPerInvoice: 'UNICO',
    paymentMethod: 'al contado',
    paymentForm: 'efectivo',
    resourceOrigin: 'caja chica',
    bankAccount: 'BANCO MERCANTIL SANTA CRUZ S.A-4071613168',
    areaId: 'area-2'
  },
  {
    id: 'prov-3',
    name: 'ACAISHOP EXPRESS S.R.L.',
    internalName: 'ACAISHOP',
    nit: '99887766',
    emitsInvoice: false,
    address: 'Calle España N° 250',
    mobile: '60606060',
    phone: '0',
    representativeName: 'Pedro Ramirez',
    representativeCI: '334455-LPZ',
    contact: { name: 'Pedro Ramirez', ci: '334455', mobile: '60606060', phone: '0', email: 'pedro@acaishop.com' },
    productType: 'ACTIVO',
    ordersPerInvoice: 'MULTIPLE',
    paymentMethod: 'anticipo',
    paymentForm: 'tarjeta',
    resourceOrigin: 'fondo de empresa',
    bankAccount: 'BANCO GANADERO-1310455304',
    areaId: 'area-3'
  }
];

const initialProducts: Product[] = [
  {
    id: 'CP-00124',
    provider: '4 LLAMAS S.R.L.',
    group: 'ACEITE',
    name: 'Aceite de Girasol Extra',
    measureDesc: 'Botella 900ml',
    durationDays: 365,
    hasHistogram: true,
    isProducedInPlant: false,
    relateToBranch: true,
    branchRelation: 'Aceite ( 900 ml. Fino)',
    packagingType: 'Caja',
    price: 120.50,
    quantity: 12,
    unitMeasure: 'Mililitro',
    measureValue: 900,
    comesInUnit: 'Mililitro',
    stockMin: 10,
    stockMax: 50,
    status: 'Activo'
  }
];

const branchesList = ['Sucursal Central', 'Sucursal Sur', 'Sucursal Norte', 'Sucursal Este', 'Sucursal Oeste'];
const bankAccountsList = ['BANCO NACIONAL DE BOLIVIA-3000146020', 'BANCO MERCANTIL SANTA CRUZ S.A-4071613168', 'BANCO GANADERO-1310455304'];
const productTypesList = ['INSUMO', 'ACTIVO', 'SERVICIO'];
const orderFrequenciesList = ['UNICO', 'MULTIPLE'];
const paymentMethodsList = ['al contado', 'por pagar', 'anticipo'];
const paymentFormsList = ['efectivo', 'tarjeta', 'transferencia'];
const resourceOriginsList = ['fondo de empresa', 'caja chica'];
const currenciesList = ['Bs.', 'USD'];
const destEntitiesList = ['1014-Banco Union', '1015-Banco Mercantil', '1016-Banco Nacional de Bolivia', '1017-Banco Ganadero', '1018-Banco Solidario'];
const branchProductsList = ['Aceite ( 900 ml. Fino)', 'Huevo', 'Leche condensada', 'Harina Especial', 'Margarina Premium'];
const packagingTypesList = ['Caja', 'Bolsa', 'Saco', 'Botella', 'Frasco', 'Lata', 'Unidad'];
const unitsList = ['Kilogramo', 'Gramo', 'Mililitro', 'Unidad', 'Litro'];
const groupsList = ['ACEITE', 'ALMENDRA', 'CAFE EN GRANO - 75', 'HARINA', 'AZUCAR', 'CHOCOLATE'];

const GuiaRegistroProducto: React.FC = () => {
  const navigate = useNavigate();

  // --- States globales de la página ---
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [groups, setGroups] = useState<string[]>(groupsList);
  const [packagingTypes, setPackagingTypes] = useState<string[]>(packagingTypesList);
  const [units, setUnits] = useState<string[]>(unitsList);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Estados de asignación de almacén
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [assignedWarehouseName, setAssignedWarehouseName] = useState<string>('');

  // --- Step 1 Form States ---
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [registerNewArea, setRegisterNewArea] = useState<boolean>(false);
  const [newArea, setNewArea] = useState<Partial<Area>>({
    name: '',
    branch: 'Sucursal Central',
    bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020',
    canRequestSupplies: true
  });

  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [registerNewProvider, setRegisterNewProvider] = useState<boolean>(false);
  const [newProvider, setNewProvider] = useState<Partial<Provider>>({
    name: '',
    internalName: '',
    nit: '',
    emitsInvoice: true,
    address: '',
    mobile: '',
    phone: '',
    representativeName: '',
    representativeCI: '',
    contact: { name: '', ci: '', mobile: '', phone: '', email: '' },
    productType: 'INSUMO',
    ordersPerInvoice: 'MULTIPLE',
    paymentMethod: 'por pagar',
    paymentForm: 'efectivo',
    resourceOrigin: 'fondo de empresa',
    bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020',
    transferDetails: {
      clientCode: '',
      accountNumber: '',
      clientName: '',
      internalClientName: '',
      documentNumber: '',
      paymentFormCode: '',
      destCurrency: 'Bs.',
      destEntityCode: '1014-Banco Union',
      branch: '',
      glosa: '',
      uniqueCode: '',
      notificationEmail: '',
      isSinglePayment: false
    }
  });

  // --- Step 2 Form States ---
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    group: 'ACEITE',
    name: '',
    measureDesc: '',
    durationDays: 30,
    hasHistogram: false,
    isProducedInPlant: false,
    relateToBranch: false,
    branchRelation: '',
    packagingType: 'Caja',
    price: 0,
    quantity: 12,
    unitMeasure: 'Mililitro',
    measureValue: 1000,
    comesInUnit: 'Mililitro',
    stockMin: 10,
    stockMax: 100,
    status: 'Activo'
  });

  // Alta de nuevo grupo
  const [registerNewGroup, setRegisterNewGroup] = useState<boolean>(false);
  const [tempGroupName, setTempGroupName] = useState<string>('');
  const [groupWastePercentage, setGroupWastePercentage] = useState<number>(0);
  const [groupSelectedUnit, setGroupSelectedUnit] = useState<string>('Unidad');
  const [registerNewUnit, setRegisterNewUnit] = useState<boolean>(false);
  const [newUnitName, setNewUnitName] = useState<string>('');
  const [newUnitAbbreviation, setNewUnitAbbreviation] = useState<string>('');
  const [groupStockMin, setGroupStockMin] = useState<number>(0);
  const [groupStockDesired, setGroupStockDesired] = useState<number>(0);
  const [groupAllowOrderType, setGroupAllowOrderType] = useState<'entero' | 'decimal'>('entero');
  const [groupDiscountByWaste, setGroupDiscountByWaste] = useState<boolean>(false);
  const [groupManualCount, setGroupManualCount] = useState<boolean>(false);

  // Alta de nueva presentación/empaque
  const [registerNewPackaging, setRegisterNewPackaging] = useState<boolean>(false);
  const [newPackagingName, setNewPackagingName] = useState<string>('');

  // Presentación intermedia
  const [intermediateType, setIntermediateType] = useState<string>('Botella');

  // --- Variables Computadas ---
  const activeArea = registerNewArea
    ? { name: newArea.name || 'Nueva Área' }
    : areas.find(a => a.id === selectedAreaId);

  const filteredProviders = providers.filter(p => p.areaId === selectedAreaId);

  const activeProvider = registerNewProvider
    ? { name: newProvider.name || 'Nuevo Proveedor' }
    : providers.find(p => p.id === selectedProviderId);

  const activeUnitLabel = registerNewGroup
    ? (registerNewUnit ? (newUnitName || 'Nueva Unidad') : groupSelectedUnit)
    : newProduct.unitMeasure || 'Unidad';

  // --- Handlers & Helpers ---
  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleNextStep1 = () => {
    // Validar Área
    if (registerNewArea) {
      if (!newArea.name?.trim()) {
        showToast('Ingrese el nombre de la nueva área', 'error');
        return;
      }
    } else {
      if (!selectedAreaId) {
        showToast('Seleccione un área registrada', 'error');
        return;
      }
    }

    // Validar Proveedor
    if (registerNewProvider) {
      if (!newProvider.name?.trim() || !newProvider.nit?.trim()) {
        showToast('Ingrese el nombre y NIT del nuevo proveedor', 'error');
        return;
      }
      if (newProvider.paymentForm === 'transferencia') {
        const details = newProvider.transferDetails;
        if (!details?.accountNumber?.trim() || !details?.clientName?.trim()) {
          showToast('Complete el número de cuenta y titular para la transferencia', 'error');
          return;
        }
      }
    } else {
      if (!selectedProviderId) {
        showToast('Seleccione o registre un proveedor para continuar', 'error');
        return;
      }
    }

    // Avanzar
    setCurrentStep(2);
    showToast('Área y Proveedor verificados correctamente');
  };

  // Sincronizador de empaque
  const handlePackagingTypeChange = (val: string) => {
    if (val.toUpperCase() === 'UNIDAD') {
      setIntermediateType('Ninguno');
      setNewProduct(prev => ({
        ...prev,
        packagingType: val,
        quantity: 1,
        measureValue: 1,
        unitMeasure: 'Unidad',
        comesInUnit: 'Unidad'
      }));
    } else {
      setIntermediateType('Botella');
      setNewProduct(prev => ({
        ...prev,
        packagingType: val,
        quantity: 12,
        measureValue: 1000,
        unitMeasure: 'Mililitro',
        comesInUnit: 'Mililitro'
      }));
    }
  };

  const handleRegisterNewPackagingToggle = (checked: boolean) => {
    setRegisterNewPackaging(checked);
    if (checked) {
      setIntermediateType('Ninguno');
      setNewProduct(prev => ({
        ...prev,
        packagingType: newPackagingName || 'Presentación',
        quantity: 1,
        measureValue: 1,
        unitMeasure: 'Unidad',
        comesInUnit: 'Unidad'
      }));
    } else {
      handlePackagingTypeChange('Caja');
    }
  };

  const handleIntermediateTypeChange = (val: string) => {
    setIntermediateType(val);
    if (val === 'Ninguno') {
      setNewProduct(prev => ({
        ...prev,
        quantity: 1,
        measureValue: 1,
        unitMeasure: 'Unidad',
        comesInUnit: 'Unidad'
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        quantity: 12,
        measureValue: 1000,
        unitMeasure: 'Mililitro',
        comesInUnit: 'Mililitro'
      }));
    }
  };

  const calculateEquivalence = () => {
    const pkg = registerNewPackaging ? (newPackagingName || 'Presentación') : (newProduct.packagingType || 'Caja');
    const qty = newProduct.quantity || 1;
    const val = newProduct.measureValue || 1;
    const baseUnit = newProduct.unitMeasure || 'Unidad';

    if (pkg.toUpperCase() === 'UNIDAD') {
      return {
        text: `El empaque es por unidades sueltas. Todo el inventario, stock y pedidos se gestionarán en Unidades simples.`,
        total: `1 Unidad`,
        formula: `1 Unidad = 1 Unidad`
      };
    }

    if (intermediateType === 'Ninguno') {
      return {
        text: `1 ${pkg.toUpperCase()} contiene directamente ${qty} ${baseUnit.toUpperCase()}(s) del producto.`,
        total: `${qty} ${baseUnit.toUpperCase()}S`,
        formula: `1 ${pkg} = ${qty} ${baseUnit}`
      };
    }

    const totalCap = qty * val;
    return {
      text: `1 ${pkg.toUpperCase()} contiene ${qty} ${intermediateType.toUpperCase()}(s), donde cada ${intermediateType.toUpperCase()} contiene ${val} ${baseUnit.toUpperCase()}(s) de producto.`,
      total: `${totalCap.toLocaleString()} ${baseUnit.toUpperCase()}S`,
      formula: `1 ${pkg} = ${qty} x ${val} ${baseUnit} = ${totalCap.toLocaleString()} ${baseUnit}`
    };
  };

  const handleSaveAll = () => {
    if (!newProduct.name?.trim()) {
      showToast('Ingrese el nombre del producto', 'error');
      return;
    }

    let finalAreaId = selectedAreaId;
    let finalProviderName = activeProvider?.name || '';

    // 1. Guardar nueva área si corresponde
    if (registerNewArea) {
      const areaId = `area-${Date.now()}`;
      const createdArea: Area = {
        id: areaId,
        name: newArea.name!.toUpperCase(),
        branch: newArea.branch!,
        bankAccount: newArea.bankAccount!,
        canRequestSupplies: !!newArea.canRequestSupplies
      };
      setAreas(prev => [...prev, createdArea]);
      finalAreaId = areaId;
    }

    // 2. Guardar nuevo proveedor si corresponde
    if (registerNewProvider) {
      const provId = `prov-${Date.now()}`;
      const createdProvider: Provider = {
        ...(newProvider as Provider),
        id: provId,
        name: newProvider.name!.toUpperCase(),
        areaId: finalAreaId
      };
      setProviders(prev => [...prev, createdProvider]);
      finalProviderName = createdProvider.name;
    }

    // 3. Guardar nueva unidad de medida si corresponde
    let finalUnit = groupSelectedUnit;
    if (registerNewGroup && registerNewUnit && newUnitName.trim()) {
      const formattedUnit = newUnitName.trim().toUpperCase();
      if (!units.includes(formattedUnit)) {
        setUnits(prev => [...prev, formattedUnit]);
      }
      finalUnit = formattedUnit;
    }

    // 4. Guardar nuevo grupo de producto si corresponde
    let finalGroup = newProduct.group || '';
    if (registerNewGroup && tempGroupName.trim()) {
      const formattedGroup = tempGroupName.trim().toUpperCase();
      if (!groups.includes(formattedGroup)) {
        setGroups(prev => [...prev, formattedGroup]);
      }
      finalGroup = formattedGroup;
    }

    // 5. Guardar nuevo empaque si corresponde
    let finalPackaging = newProduct.packagingType || 'Caja';
    if (registerNewPackaging && newPackagingName.trim()) {
      const formattedPackaging = newPackagingName.trim().toUpperCase();
      if (!packagingTypes.includes(formattedPackaging)) {
        setPackagingTypes(prev => [...prev, formattedPackaging]);
      }
      finalPackaging = formattedPackaging;
    }

    // 6. Guardar producto
    const createdProduct: Product = {
      ...(newProduct as Product),
      id: `CP-${Math.floor(Math.random() * 90000) + 10000}`,
      provider: finalProviderName,
      group: finalGroup,
      packagingType: finalPackaging,
      unitMeasure: registerNewGroup ? finalUnit : (newProduct.unitMeasure || 'Unidad'),
      comesInUnit: registerNewGroup ? finalUnit : (newProduct.comesInUnit || 'Unidad'),
      status: 'Activo'
    };

    setProducts(prev => [createdProduct, ...prev]);
    setCurrentStep(3); // Éxito
    showToast('¡Producto registrado con éxito mediante la guía asistida!');
  };

  const resetWizard = () => {
    setSelectedAreaId('');
    setRegisterNewArea(false);
    setNewArea({ name: '', branch: 'Sucursal Central', bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020', canRequestSupplies: true });

    setSelectedProviderId('');
    setRegisterNewProvider(false);
    setNewProvider({
      name: '',
      internalName: '',
      nit: '',
      emitsInvoice: true,
      address: '',
      mobile: '',
      phone: '',
      representativeName: '',
      representativeCI: '',
      contact: { name: '', ci: '', mobile: '', phone: '', email: '' },
      productType: 'INSUMO',
      ordersPerInvoice: 'MULTIPLE',
      paymentMethod: 'por pagar',
      paymentForm: 'efectivo',
      resourceOrigin: 'fondo de empresa',
      bankAccount: 'BANCO NACIONAL DE BOLIVIA-3000146020',
      transferDetails: {
        clientCode: '',
        accountNumber: '',
        clientName: '',
        internalClientName: '',
        documentNumber: '',
        paymentFormCode: '',
        destCurrency: 'Bs.',
        destEntityCode: '1014-Banco Union',
        branch: '',
        glosa: '',
        uniqueCode: '',
        notificationEmail: '',
        isSinglePayment: false
      }
    });

    setNewProduct({
      group: 'ACEITE',
      name: '',
      measureDesc: '',
      durationDays: 30,
      hasHistogram: false,
      isProducedInPlant: false,
      relateToBranch: false,
      branchRelation: '',
      packagingType: 'Caja',
      price: 0,
      quantity: 12,
      unitMeasure: 'Mililitro',
      measureValue: 1000,
      comesInUnit: 'Mililitro',
      stockMin: 10,
      stockMax: 100,
      status: 'Activo'
    });
    setRegisterNewGroup(false);
    setTempGroupName('');
    setGroupWastePercentage(0);
    setGroupSelectedUnit('Unidad');
    setRegisterNewUnit(false);
    setNewUnitName('');
    setNewUnitAbbreviation('');
    setGroupStockMin(0);
    setGroupStockDesired(0);
    setGroupAllowOrderType('entero');
    setGroupDiscountByWaste(false);
    setGroupManualCount(false);
    setRegisterNewPackaging(false);
    setNewPackagingName('');
    setIntermediateType('Botella');
    setSelectedWarehouse('');
    setAssignedWarehouseName('');

    setCurrentStep(1);
  };

  return (
    <div className="max-w-[1500px] mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      {/* Header General */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Asistente Operativo</div>
          <p className="text-4xl font-black text-zinc-900 tracking-tight uppercase leading-none">Guía de Registro de Producto</p>
          <p className="text-zinc-500 mt-3 font-medium max-w-2xl text-sm leading-relaxed">
            Este módulo interactivo valida dinámicamente si posee áreas y proveedores relacionados. En caso de no tenerlos, le asiste para darlos de alta en el mismo instante antes de finalizar el registro del producto.
          </p>
        </div>
      </div>

      {/* Grid General con Split Panel (Formulario a la izquierda y resumen de alta a la derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Wizard Form Card (2/3 de la pantalla) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Indicator Bar */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${currentStep >= 1 ? 'bg-zinc-950 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'}`}>
                1
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Validación</p>
                <p className="text-xs font-black text-zinc-800 uppercase tracking-tight mt-1">Área y Proveedor</p>
              </div>
            </div>
            
            <div className="flex-1 h-0.5 mx-4 bg-zinc-100 relative rounded-full overflow-hidden">
              <div className={`absolute top-0 left-0 h-full bg-zinc-900 transition-all duration-500 ${currentStep === 1 ? 'w-[10%]' : currentStep === 2 ? 'w-[60%]' : 'w-full'}`} />
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${currentStep >= 2 ? 'bg-zinc-950 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'}`}>
                2
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Producto</p>
                <p className="text-xs font-black text-zinc-800 uppercase tracking-tight mt-1">Ficha Técnica</p>
              </div>
            </div>

            <div className="flex-1 h-0.5 mx-4 bg-zinc-100 relative rounded-full overflow-hidden">
              <div className={`absolute top-0 left-0 h-full bg-zinc-950 transition-all duration-500 ${currentStep >= 3 ? 'w-full' : 'w-0'}`} />
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${currentStep === 3 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400'}`}>
                ✓
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Registro</p>
                <p className="text-xs font-black text-zinc-800 uppercase tracking-tight mt-1">Éxito</p>
              </div>
            </div>
          </div>

          {/* Form Content Wrapper */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 md:p-12 min-h-[500px] flex flex-col justify-between">
            
            {/* --- PASO 1: ÁREA Y PROVEEDOR --- */}
            {currentStep === 1 && (
              <div className="space-y-10 animate-in fade-in duration-300">
                
                {/* 1. SECCIÓN DE ÁREA */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-xs font-black shadow-md">A</span>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Paso 1.1</p>
                        <p className="text-sm font-black text-zinc-800 uppercase tracking-tight mt-1">Verificación de Área Operativa</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <span className="text-[9px] font-black text-zinc-500 uppercase">Registrar Nueva Área</span>
                      <Switch size="small" checked={registerNewArea} onChange={e => {
                        setRegisterNewArea(e.target.checked);
                        if (e.target.checked) setSelectedAreaId('');
                      }} />
                    </div>
                  </div>

                  {!registerNewArea ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seleccione un Área Registrada</label>
                        <Autocomplete
                          options={areas}
                          getOptionLabel={(option) => option.name}
                          value={areas.find(a => a.id === selectedAreaId) || null}
                          onChange={(_, v) => {
                            setSelectedAreaId(v?.id || '');
                            setSelectedProviderId('');
                          }}
                          renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: REPOSTERÍA" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc-50/50' } }} />}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-zinc-50 border border-zinc-100 rounded-3xl animate-in zoom-in-95 duration-300">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Área *</label>
                        <TextField fullWidth size="small" placeholder="Ej: PANADERÍA" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Sucursal</label>
                        <Autocomplete
                          options={branchesList}
                          value={newArea.branch}
                          onChange={(_, v) => setNewArea({...newArea, branch: v || 'Sucursal Central'})}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cuenta de Banco</label>
                        <Autocomplete
                          options={bankAccountsList}
                          value={newArea.bankAccount}
                          onChange={(_, v) => setNewArea({...newArea, bankAccount: v || ''})}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                        />
                      </div>
                      <div className="md:col-span-3 flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-black text-zinc-950 uppercase">Solicitud de Insumos</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">¿Esta área operativa podrá solicitar insumos directamente?</p>
                        </div>
                        <Switch checked={newArea.canRequestSupplies} onChange={e => setNewArea({...newArea, canRequestSupplies: e.target.checked})} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SECCIÓN DE PROVEEDOR */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-xs font-black shadow-md">P</span>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Paso 1.2</p>
                        <p className="text-sm font-black text-zinc-800 uppercase tracking-tight mt-1">Homologación de Proveedor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <span className="text-[9px] font-black text-zinc-500 uppercase">Registrar Nuevo Proveedor</span>
                      <Switch size="small" checked={registerNewProvider} onChange={e => {
                        setRegisterNewProvider(e.target.checked);
                        if (e.target.checked) setSelectedProviderId('');
                      }} />
                    </div>
                  </div>

                  {!registerNewProvider ? (
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Seleccione el Proveedor</label>
                      <Autocomplete
                        options={filteredProviders}
                        getOptionLabel={(option) => option.name}
                        disabled={!selectedAreaId && !registerNewArea}
                        value={filteredProviders.find(p => p.id === selectedProviderId) || null}
                        onChange={(_, v) => setSelectedProviderId(v?.id || '')}
                        noOptionsText={selectedAreaId ? "No hay proveedores registrados en esta área" : "Primero seleccione un área operativa"}
                        renderInput={(params) => <TextField {...params} size="small" placeholder={selectedAreaId ? "Ej: 4 LLAMAS S.R.L." : "Seleccione un área primero"} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'zinc-50/50' } }} />}
                      />
                      {selectedAreaId && filteredProviders.length === 0 && (
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter ml-1">
                          ⚠️ No se encontraron proveedores para esta área. Active el switch "Registrar Nuevo Proveedor" para dar uno de alta.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 p-6 bg-zinc-50 border border-zinc-100 rounded-3xl animate-in zoom-in-95 duration-300 max-h-[450px] overflow-y-auto custom-scrollbar">
                      
                      {/* Sub-Sección A: Datos Generales */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-1">A. Datos Fiscales y de Contacto Principal</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre / Razón Social *</label>
                            <TextField fullWidth size="small" placeholder="Razón Social del Proveedor" value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre Interno (Alias)</label>
                            <TextField fullWidth size="small" placeholder="Alias de Uso Común" value={newProvider.internalName} onChange={e => setNewProvider({...newProvider, internalName: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">NIT / ID Fiscal *</label>
                            <TextField fullWidth size="small" placeholder="NIT del Proveedor" value={newProvider.nit} onChange={e => setNewProvider({...newProvider, nit: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="flex items-center justify-between px-4 bg-white border border-zinc-200 rounded-xl">
                            <span className="text-[9px] font-black text-zinc-500 uppercase">¿Emite Factura?</span>
                            <Switch checked={newProvider.emitsInvoice} onChange={e => setNewProvider({...newProvider, emitsInvoice: e.target.checked})} />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dirección Completa</label>
                            <TextField fullWidth size="small" placeholder="Ej: Pasaje Portales Nro. 1237 Queru Queru" value={newProvider.address} onChange={e => setNewProvider({...newProvider, address: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Número Celular</label>
                            <TextField fullWidth size="small" placeholder="Celular" value={newProvider.mobile} onChange={e => setNewProvider({...newProvider, mobile: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Número Teléfono</label>
                            <TextField fullWidth size="small" placeholder="Fijo" value={newProvider.phone} onChange={e => setNewProvider({...newProvider, phone: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                        </div>
                      </div>

                      {/* Sub-Sección B: Representante */}
                      <div className="space-y-4 pt-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-1">B. Representante Legal</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre Representante</label>
                            <TextField fullWidth size="small" placeholder="Nombre Completo" value={newProvider.representativeName} onChange={e => setNewProvider({...newProvider, representativeName: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">C.I. Representante</label>
                            <TextField fullWidth size="small" placeholder="Documento de Identidad" value={newProvider.representativeCI} onChange={e => setNewProvider({...newProvider, representativeCI: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                        </div>
                      </div>

                      {/* Sub-Sección C: Contacto de Ventas */}
                      <div className="space-y-4 pt-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-1">C. Contacto Operativo / Comercial</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre de Contacto</label>
                            <TextField fullWidth size="small" placeholder="Nombre del Contacto" value={newProvider.contact?.name} onChange={e => setNewProvider({...newProvider, contact: { ...newProvider.contact!, name: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">C.I. Contacto</label>
                            <TextField fullWidth size="small" placeholder="CI Contacto" value={newProvider.contact?.ci} onChange={e => setNewProvider({...newProvider, contact: { ...newProvider.contact!, ci: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Celular Contacto</label>
                            <TextField fullWidth size="small" placeholder="Celular" value={newProvider.contact?.mobile} onChange={e => setNewProvider({...newProvider, contact: { ...newProvider.contact!, mobile: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Teléfono Contacto</label>
                            <TextField fullWidth size="small" placeholder="Teléfono" value={newProvider.contact?.phone} onChange={e => setNewProvider({...newProvider, contact: { ...newProvider.contact!, phone: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                            <TextField fullWidth size="small" placeholder="contacto@proveedor.com" value={newProvider.contact?.email} onChange={e => setNewProvider({...newProvider, contact: { ...newProvider.contact!, email: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />
                          </div>
                        </div>
                      </div>

                      {/* Sub-Sección D: Condiciones Financieras */}
                      <div className="space-y-4 pt-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-1">D. Configuración Financiera y de Cobro</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Producto *</label>
                            <Autocomplete
                              options={productTypesList}
                              value={newProvider.productType}
                              onChange={(_, v) => setNewProvider({...newProvider, productType: v as any})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Pedidos por Factura *</label>
                            <Autocomplete
                              options={orderFrequenciesList}
                              value={newProvider.ordersPerInvoice}
                              onChange={(_, v) => setNewProvider({...newProvider, ordersPerInvoice: v as any})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Método de Pago *</label>
                            <Autocomplete
                              options={paymentMethodsList}
                              value={newProvider.paymentMethod}
                              onChange={(_, v) => setNewProvider({...newProvider, paymentMethod: v as any})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Forma de Pago *</label>
                            <Autocomplete
                              options={paymentFormsList}
                              value={newProvider.paymentForm}
                              onChange={(_, v) => setNewProvider({...newProvider, paymentForm: v as any})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Origen de Recursos *</label>
                            <Autocomplete
                              options={resourceOriginsList}
                              value={newProvider.resourceOrigin}
                              onChange={(_, v) => setNewProvider({...newProvider, resourceOrigin: v as any})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cuenta Bancaria Principal *</label>
                            <Autocomplete
                              options={bankAccountsList}
                              value={newProvider.bankAccount}
                              onChange={(_, v) => setNewProvider({...newProvider, bankAccount: v || ''})}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                            />
                          </div>
                        </div>

                        {/* --- CAMPOS ADICIONALES DE TRANSFERENCIA (CONDICIONAL) --- */}
                        <Collapse in={newProvider.paymentForm === 'transferencia'}>
                          <div className="p-5 mt-4 bg-white border border-zinc-200 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                              <span className="material-symbols-outlined text-blue-500 text-lg">account_balance</span>
                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Detalles para Transferencia Interbancaria</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase">Código Cliente *</label>
                                <TextField fullWidth size="small" placeholder="Ej: CL-002" value={newProvider.transferDetails?.clientCode} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, clientCode: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">N° de Cuenta *</label>
                                <TextField fullWidth size="small" placeholder="Cuenta Bancaria" value={newProvider.transferDetails?.accountNumber} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, accountNumber: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Nombre Cliente *</label>
                                <TextField fullWidth size="small" placeholder="Titular de Cuenta" value={newProvider.transferDetails?.clientName} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, clientName: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Cliente Interno</label>
                                <TextField fullWidth size="small" placeholder="Nombre Interno" value={newProvider.transferDetails?.internalClientName} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, internalClientName: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Número de Documento</label>
                                <TextField fullWidth size="small" placeholder="Documento Titular" value={newProvider.transferDetails?.documentNumber} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, documentNumber: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Código de Forma Pago</label>
                                <TextField fullWidth size="small" placeholder="Código de Pago" value={newProvider.transferDetails?.paymentFormCode} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, paymentFormCode: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Moneda Destino</label>
                                <Autocomplete
                                  options={currenciesList}
                                  value={newProvider.transferDetails?.destCurrency}
                                  onChange={(_, v) => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, destCurrency: v || 'Bs.' }})}
                                  renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Código Entidad Destino</label>
                                <Autocomplete
                                  options={destEntitiesList}
                                  value={newProvider.transferDetails?.destEntityCode}
                                  onChange={(_, v) => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, destEntityCode: v || '1014-Banco Union' }})}
                                  renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Sucursal Destino</label>
                                <TextField fullWidth size="small" placeholder="Ej: Cochabamba" value={newProvider.transferDetails?.branch} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, branch: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[8px] font-black text-zinc-400">Glosa / Concepto</label>
                                <TextField fullWidth size="small" placeholder="Glosa de la transferencia" value={newProvider.transferDetails?.glosa} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, glosa: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-400">Código Único de Pago</label>
                                <TextField fullWidth size="small" placeholder="Código Único" value={newProvider.transferDetails?.uniqueCode} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, uniqueCode: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[8px] font-black text-zinc-400">Email de Notificación</label>
                                <TextField fullWidth size="small" placeholder="notificaciones@proveedor.com" value={newProvider.transferDetails?.notificationEmail} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, notificationEmail: e.target.value }})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                              </div>
                              <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-xl col-span-full">
                                <span className="text-[8px] font-black text-zinc-500 uppercase">¿Es Pago Único?</span>
                                <Switch size="small" checked={newProvider.transferDetails?.isSinglePayment} onChange={e => setNewProvider({...newProvider, transferDetails: { ...newProvider.transferDetails!, isSinglePayment: e.target.checked }})} />
                              </div>
                            </div>
                          </div>
                        </Collapse>
                      </div>

                    </div>
                  )}
                </div>

                {/* Footer del Paso 1 */}
                <div className="pt-8 border-t border-zinc-100 flex justify-end">
                  <button
                    onClick={handleNextStep1}
                    className="h-14 px-12 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Siguiente: Ficha del Producto
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* --- PASO 2: REGISTRO DEL PRODUCTO --- */}
            {currentStep === 2 && (
              <div className="space-y-10 animate-in fade-in duration-300">
                
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xs font-black shadow-md">P</span>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Paso 2 de 2</p>
                      <p className="text-sm font-black text-zinc-800 uppercase tracking-tight mt-1">Ficha Técnica y Stock del Producto</p>
                    </div>
                  </div>
                  <Chip
                    label={`Proveedor: ${activeProvider?.name}`}
                    size="small"
                    sx={{ fontSize: '9px', fontWeight: 900, borderRadius: '8px', bgcolor: 'primary.main', color: 'white' }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Categoría / Grupo */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Seleccione el Grupo del Producto</label>
                      <button
                        onClick={() => setRegisterNewGroup(!registerNewGroup)}
                        className="text-[9px] font-black text-primary uppercase tracking-tighter hover:underline"
                      >
                        {registerNewGroup ? "✓ Seleccionar Existente" : "+ Crear Nuevo Grupo"}
                      </button>
                    </div>
                    
                    {!registerNewGroup ? (
                      <Autocomplete
                        options={groups}
                        value={newProduct.group}
                        onChange={(_, v) => setNewProduct({...newProduct, group: v || ''})}
                        renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: ACEITE" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'zinc-50/50' } }} />}
                      />
                    ) : (
                      <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl space-y-6 animate-in zoom-in-95 duration-300 col-span-full">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-200 pb-2">Registro de Nuevo Grupo de Producto</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Grupo de Producto *</label>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Ej: HARINAS DE TRIGO"
                              value={tempGroupName}
                              onChange={e => setTempGroupName(e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Porcentaje de Desperdicio (%) *</label>
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              placeholder="Ej: 5"
                              value={groupWastePercentage}
                              onChange={e => setGroupWastePercentage(parseFloat(e.target.value) || 0)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                            />
                          </div>

                          {/* Selección de Medida */}
                          <div className="md:col-span-2 p-4 bg-white border border-zinc-200 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Selección de Medida de Grupo</label>
                              <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-lg">
                                <span className="text-[8px] font-black text-zinc-500 uppercase">Registrar Nueva Unidad</span>
                                <Switch size="small" checked={registerNewUnit} onChange={e => setRegisterNewUnit(e.target.checked)} />
                              </div>
                            </div>

                            {!registerNewUnit ? (
                              <Autocomplete
                                options={units}
                                value={groupSelectedUnit}
                                onChange={(_, v) => setGroupSelectedUnit(v || 'Unidad')}
                                renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }} />}
                              />
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-zinc-400 uppercase ml-1">Nombre Unidad de Medida *</label>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Ej: KILOGRAMO"
                                    value={newUnitName}
                                    onChange={e => setNewUnitName(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-zinc-400 uppercase ml-1">Abreviatura *</label>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Ej: Kg"
                                    value={newUnitAbbreviation}
                                    onChange={e => setNewUnitAbbreviation(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stocks mínimos y deseados expresados en la unidad */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                              Stock Mínimo en ({activeUnitLabel}) *
                            </label>
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              placeholder="0"
                              value={groupStockMin}
                              onChange={e => setGroupStockMin(parseFloat(e.target.value) || 0)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                              Stock Deseado en ({activeUnitLabel}) *
                            </label>
                            <TextField
                              fullWidth
                              type="number"
                              size="small"
                              placeholder="0"
                              value={groupStockDesired}
                              onChange={e => setGroupStockDesired(parseFloat(e.target.value) || 0)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                            />
                          </div>

                          {/* Permitir pedir en decimal/entero */}
                          <div className="md:col-span-2 p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-zinc-950 uppercase">Permitir pedir el grupo en:</p>
                              <p className="text-[7.5px] text-zinc-400 font-bold uppercase">Define el tipo de valor permitido para las solicitudes</p>
                            </div>
                            <RadioGroup
                              row
                              value={groupAllowOrderType}
                              onChange={e => setGroupAllowOrderType(e.target.value as 'entero' | 'decimal')}
                            >
                              <FormControlLabel value="entero" control={<Radio size="small" />} label={<span className="text-[9px] font-black text-zinc-700 uppercase">Entero</span>} />
                              <FormControlLabel value="decimal" control={<Radio size="small" />} label={<span className="text-[9px] font-black text-zinc-700 uppercase">Decimal</span>} />
                            </RadioGroup>
                          </div>

                          {/* Descontar según % desperdicio */}
                          <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-zinc-950 uppercase">Descontar por % desperdicio</p>
                              <p className="text-[7.5px] text-zinc-400 font-bold uppercase">¿Se descontará según desperdicio del grupo?</p>
                            </div>
                            <Switch size="small" checked={groupDiscountByWaste} onChange={e => setGroupDiscountByWaste(e.target.checked)} />
                          </div>

                          {/* Conteo manual */}
                          <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-zinc-950 uppercase">Conteo Manual</p>
                              <p className="text-[7.5px] text-zinc-400 font-bold uppercase">¿Se registrará mediante conteo manual?</p>
                            </div>
                            <Switch size="small" checked={groupManualCount} onChange={e => setGroupManualCount(e.target.checked)} />
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nombre del Producto */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre Completo del Producto *</label>
                    <TextField fullWidth size="small" placeholder="Ej: Harina de Trigo Especial 0000" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </div>

                  {/* Detalle Presentación */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Detalle de Presentación (Medida)</label>
                    <TextField fullWidth size="small" placeholder="Ej: Botella de 900ml" value={newProduct.measureDesc} onChange={e => setNewProduct({...newProduct, measureDesc: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </div>

                  {/* Vida Útil */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Vida Útil en Días</label>
                    <TextField fullWidth type="number" size="small" placeholder="Ej: 30" value={newProduct.durationDays} onChange={e => setNewProduct({...newProduct, durationDays: parseInt(e.target.value) || 0})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                  </div>

                  {/* Switches de Control */}
                  <div className="flex flex-col justify-center px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <FormControlLabel
                      control={<Switch size="small" checked={newProduct.hasHistogram} onChange={e => setNewProduct({...newProduct, hasHistogram: e.target.checked})} />}
                      label={<span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Histograma</span>}
                    />
                  </div>

                  <div className="flex flex-col justify-center px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <FormControlLabel
                      control={<Switch size="small" checked={newProduct.isProducedInPlant} onChange={e => setNewProduct({...newProduct, isProducedInPlant: e.target.checked})} />}
                      label={<span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Producido en Planta</span>}
                    />
                  </div>

                  {/* Relación con Sucursal */}
                  <div className="md:col-span-2 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-zinc-400">hub</span>
                        <div>
                          <p className="text-[10px] font-black text-zinc-950 uppercase leading-none">Relación con Sucursal</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1">¿Este producto se homologará con uno de sucursales?</p>
                        </div>
                      </div>
                      <Switch checked={newProduct.relateToBranch} onChange={e => setNewProduct({...newProduct, relateToBranch: e.target.checked})} />
                    </div>

                    <Collapse in={newProduct.relateToBranch}>
                      <div className="space-y-1 animate-in slide-in-from-top-2">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Producto Homólogo de Sucursal</label>
                        <Autocomplete
                          options={branchProductsList}
                          value={newProduct.branchRelation}
                          onChange={(_, v) => setNewProduct({...newProduct, branchRelation: v || ''})}
                          renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccione un producto..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                        />
                      </div>
                    </Collapse>
                  </div>

                  {/* Empaque, precio, cantidad y métricas técnicas */}
                  <div className="md:col-span-2 border-t border-zinc-100 pt-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                      <div>
                        <p className="text-[11px] font-black text-zinc-800 uppercase tracking-wider">Configuración de Empaque, Contenido y Equivalencia</p>
                        <p className="text-[8.5px] text-zinc-400 font-bold uppercase mt-1">Defina el contenedor mayor, unidades intermedias y la equivalencia en la medida base más pequeña.</p>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-xl self-start md:self-auto">
                        <span className="text-[8px] font-black text-zinc-500 uppercase">¿Registrar Nuevo Tipo de Empaque?</span>
                        <Switch size="small" checked={registerNewPackaging} onChange={e => handleRegisterNewPackagingToggle(e.target.checked)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
                      
                      {/* 1. Empaque Principal */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">1. ¿Cómo se compra / recibe el producto? (Empaque Principal) *</label>
                        {!registerNewPackaging ? (
                          <Autocomplete
                            options={packagingTypes}
                            value={newProduct.packagingType}
                            onChange={(_, v) => handlePackagingTypeChange(v || 'Caja')}
                            renderInput={(params) => <TextField {...params} size="small" placeholder="Ej: Caja, Unidad, Saco..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Ej: BIDÓN 20L, SACO 50KG..."
                            value={newPackagingName}
                            onChange={e => {
                              setNewPackagingName(e.target.value);
                              setNewProduct(prev => ({ ...prev, packagingType: e.target.value }));
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
                          />
                        )}
                        <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">El contenedor más grande (ej: Caja, Bolsa grande, Saco, o Unidad si es suelto).</p>
                      </div>

                      {/* Precio */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Precio Unitario por Empaque Principal (Bs.) *</label>
                        <TextField 
                          fullWidth 
                          type="number" 
                          size="small" 
                          placeholder="0.00" 
                          value={newProduct.price} 
                          onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} 
                        />
                        <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">Costo total de 1 {newProduct.packagingType || 'Empaque'}.</p>
                      </div>

                      {/* Condicional si NO es "Unidad" */}
                      {newProduct.packagingType?.toUpperCase() !== 'UNIDAD' ? (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-3 duration-300">
                          
                          {/* 2. Tipo Intermedio */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">2. ¿Tiene una presentación intermedia adentro? *</label>
                            <Autocomplete
                              options={['Ninguno', 'Botella', 'Bolsa', 'Paquete', 'Frasco', 'Lata', 'Pieza']}
                              value={intermediateType}
                              onChange={(_, v) => handleIntermediateTypeChange(v || 'Ninguno')}
                              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                            />
                            <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">
                              Ejemplo: Una Caja contiene "Botellas". Si no hay intermedio, elija "Ninguno".
                            </p>
                          </div>

                          {/* 3. Cantidad por empaque */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                              {intermediateType === 'Ninguno' 
                                ? `3. Cantidad de contenido por cada ${newProduct.packagingType.toUpperCase()} *`
                                : `3. ¿Cuántas unidades (${intermediateType.toUpperCase()}) vienen dentro del/de la ${newProduct.packagingType.toUpperCase()}? *`
                              }
                            </label>
                            <TextField 
                              fullWidth 
                              type="number" 
                              size="small" 
                              placeholder={intermediateType === 'Ninguno' ? "Ej: 50" : "Ej: 12"} 
                              value={newProduct.quantity} 
                              onChange={e => setNewProduct({...newProduct, quantity: parseFloat(e.target.value) || 0})} 
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} 
                            />
                            <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">
                              {intermediateType === 'Ninguno' 
                                ? `Capacidad directa del empaque (ej: 50).`
                                : `Cantidad de unidades o ${intermediateType.toLowerCase()}(s) en 1 ${newProduct.packagingType.toLowerCase()}.`
                              }
                            </p>
                          </div>

                          {/* 4. Medida Técnica de Unidad Intermedia */}
                          {intermediateType !== 'Ninguno' && (
                            <div className="space-y-1 animate-in zoom-in-95 duration-200">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                4. Capacidad / Contenido de cada {intermediateType} *
                              </label>
                              <TextField 
                                fullWidth 
                                type="number" 
                                size="small" 
                                placeholder="Ej: 1000" 
                                value={newProduct.measureValue} 
                                onChange={e => setNewProduct({...newProduct, measureValue: parseFloat(e.target.value) || 0})} 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} 
                              />
                              <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">
                                Peso o volumen neto de cada {intermediateType} (ej: 1000).
                              </p>
                            </div>
                          )}

                          {/* 5. Unidad de Medida Base */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                              5. Unidad de Medida Base (La más pequeña) *
                            </label>
                            <Autocomplete
                              options={units}
                              value={newProduct.unitMeasure}
                              onChange={(_, v) => {
                                const selected = v || 'Unidad';
                                setNewProduct({
                                  ...newProduct,
                                  unitMeasure: selected,
                                  comesInUnit: selected
                                });
                              }}
                              renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccione la medida base más pequeña..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }} />}
                            />
                            <p className="text-[8px] text-zinc-400 font-bold uppercase ml-1 mt-0.5">
                              "El producto viene en" y se almacena en esta unidad (ej: Mililitro, Gramo).
                            </p>
                          </div>

                        </div>
                      ) : (
                        // Caso A: Es por Unidades sueltas
                        <div className="md:col-span-2 p-5 bg-white border border-zinc-200 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-3 duration-300">
                          <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">inventory_2</span>
                          </span>
                          <div>
                            <p className="text-[10px] font-black text-zinc-900 uppercase">Empaque Simplificado (Unidad)</p>
                            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                              El producto se recibe y almacena directamente por unidades individuales. Todo el inventario, solicitudes y stocks se gestionarán de forma simple en <strong className="text-emerald-600 font-black">UNIDADES</strong>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Equation/Equivalence narrative box */}
                      <div className="md:col-span-2 p-5 bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-lg mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest">Fórmula de Equivalencia y Conversión de Inventario</p>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                            {calculateEquivalence().text}
                          </p>
                        </div>
                        
                        <div className="bg-zinc-850 px-4 py-2 rounded-2xl border border-zinc-800 text-center self-start md:self-auto min-w-[130px]">
                          <p className="text-[7.5px] font-black text-zinc-500 uppercase">Equivalencia Total</p>
                          <p className="text-xs font-black text-emerald-400 mt-1 uppercase tracking-tight">
                            {calculateEquivalence().total}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Stocks de seguridad */}
                  <div className="md:col-span-2 border-t border-zinc-100 pt-6">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Límites Críticos de Stock</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Mínimo (Alerta)</label>
                        <TextField fullWidth type="number" size="small" placeholder="0" value={newProduct.stockMin} onChange={e => setNewProduct({...newProduct, stockMin: parseFloat(e.target.value) || 0})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rose.50/20' } }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Stock Máximo (Repuesto)</label>
                        <TextField fullWidth type="number" size="small" placeholder="0" value={newProduct.stockMax} onChange={e => setNewProduct({...newProduct, stockMax: parseFloat(e.target.value) || 0})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'emerald.50/20' } }} />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer del Paso 2 */}
                <div className="pt-8 border-t border-zinc-100 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="h-14 px-8 border border-zinc-200 text-zinc-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-zinc-50 flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Atrás
                  </button>
                  
                  <button
                    onClick={handleSaveAll}
                    className="h-14 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Finalizar Registro
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </button>
                </div>
              </div>
            )}

            {/* --- PASO 3: ÉXITO ANIMADO --- */}
            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in-95 duration-500 text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xl border-4 border-emerald-50">
                  <span className="material-symbols-outlined text-5xl font-black">done_all</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-3xl font-black text-zinc-900 uppercase tracking-tight">¡Registro Completado!</p>
                  <p className="text-zinc-500 font-medium text-sm max-w-md">
                    El producto ha sido guardado de forma segura vinculando correctamente su respectiva área operativa y el proveedor homologado en la base de datos centralizada.
                  </p>
                </div>

                <div className="w-full max-w-md bg-zinc-50 rounded-3xl border border-zinc-100 p-6 text-left space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">Resumen Operacional de Alta</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">Área:</span>
                    <span className="text-zinc-900 font-black uppercase">{activeArea?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">Proveedor:</span>
                    <span className="text-zinc-900 font-black uppercase">{activeProvider?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">Producto:</span>
                    <span className="text-zinc-900 font-black uppercase">{newProduct.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">Grupo/Empaque:</span>
                    <span className="text-zinc-900 font-black uppercase">
                      {registerNewGroup ? tempGroupName.toUpperCase() : newProduct.group} / {registerNewPackaging ? newPackagingName.toUpperCase() : newProduct.packagingType}
                    </span>
                  </div>
                </div>

                {/* --- SECCIÓN ACCIONES POSTERIORES (NUEVO) --- */}
                <div className="w-full max-w-2xl bg-zinc-50 dark:bg-zinc-900/60 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 p-6 md:p-8 text-left space-y-6 animate-in slide-in-from-bottom-4 duration-500 shadow-inner">
                  <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-sm font-black">flash_on</span>
                    </span>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Pasos Siguientes</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight mt-1">Acciones Posteriores de Inventario y Producción</p>
                    </div>
                  </div>

                  {/* 1. ASIGNACIÓN A ALMACÉN */}
                  <div className="space-y-3 bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-sm transition-all">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-black text-zinc-850 dark:text-zinc-200 uppercase leading-none">1. Asignar Producto a un Almacén *</p>
                         <p className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase mt-1">Vincule este nuevo producto a un almacén para habilitar el control de stock.</p>
                       </div>
                       
                       {assignedWarehouseName && (
                         <Chip
                           label="✓ ASIGNADO"
                           size="small"
                           color="success"
                           sx={{ fontSize: '8px', fontWeight: 900, borderRadius: '6px' }}
                         />
                       )}
                     </div>

                     {!assignedWarehouseName ? (
                       <div className="flex flex-col sm:flex-row gap-3 pt-1">
                         <div className="flex-1">
                           <Autocomplete
                             options={[
                               'ALMACÉN CENTRAL PLANTA',
                               'ALMACÉN DE MATERIA PRIMA',
                               'ALMACÉN DE PRODUCTOS TERMINADOS',
                               'ALMACÉN DE INSUMOS Y EMPAQUES',
                               'ALMACÉN DE CONGELADOS'
                             ]}
                             value={selectedWarehouse}
                             onChange={(_, v) => setSelectedWarehouse(v || '')}
                             renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccione un Almacén..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'zinc.50/20' } }} />}
                           />
                         </div>
                         <button
                           onClick={() => {
                             if (!selectedWarehouse) {
                               showToast('Seleccione un almacén válido', 'error');
                               return;
                             }
                             setAssignedWarehouseName(selectedWarehouse);
                             showToast(`Producto asignado correctamente a: ${selectedWarehouse}`);
                           }}
                           className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                         >
                           <span className="material-symbols-outlined text-sm font-black">warehouse</span>
                           Asignar Almacén
                         </button>
                       </div>
                     ) : (
                       <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-450 text-xs animate-in zoom-in-95 duration-200">
                         <div className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm font-black text-emerald-600">done</span>
                           <span className="font-bold">Asignado con éxito a: <strong className="uppercase">{assignedWarehouseName}</strong></span>
                         </div>
                         <button
                           onClick={() => setAssignedWarehouseName('')}
                           className="text-[9px] font-black text-zinc-500 hover:underline uppercase"
                         >
                           Cambiar Almacén
                         </button>
                       </div>
                     )}
                   </div>

                  {/* 2. PREGUNTAR REGISTRAR RECETA O INSUMO INTERMEDIO */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-[10px] font-black text-zinc-850 dark:text-zinc-200 uppercase leading-none">2. ¿Este Producto requiere Recetas o es Intermedio?</p>
                      <p className="text-[8px] text-zinc-455 dark:text-zinc-500 font-bold uppercase mt-1">Seleccione una de las siguientes opciones para continuar su flujo operacional.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Receta Final */}
                      <div 
                        onClick={() => navigate('/almacen/crear-receta')}
                        className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 hover:border-primary dark:hover:border-primary shadow-sm flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase group-hover:text-primary transition-colors">Receta Final</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight leading-normal mt-0.5">
                            Redirecciona a la vista para crear la receta comercial de este producto.
                          </p>
                        </div>
                      </div>

                      {/* Receta Intermedia */}
                      <div 
                        onClick={() => navigate('/almacen/recetas-intermedias')}
                        className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 hover:border-primary dark:hover:border-primary shadow-sm flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-xl">kitchen</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase group-hover:text-primary transition-colors">Receta Intermedia</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight leading-normal mt-0.5">
                            Cree una sub-receta que sirva como materia prima o insumo para otras.
                          </p>
                        </div>
                      </div>

                      {/* Producto Intermedio */}
                      <div 
                        onClick={() => navigate('/almacen/productos-intermedios?openModal=true')}
                        className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 hover:border-primary dark:hover:border-primary shadow-sm flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-xl">layers</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase group-hover:text-primary transition-colors">Prod. Intermedio</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight leading-normal mt-0.5">
                            Clasifique este producto como intermedio producido para consumo interno.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={resetWizard}
                    className="px-10 py-5 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-zinc-800 dark:border-zinc-700"
                  >
                    <span className="material-symbols-outlined text-lg">autorenew</span>
                    Registrar Otro Producto
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Split Resumen de Alta Operativa (1/3 de la pantalla) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 relative overflow-hidden group transition-all duration-300">
            {/* Círculo gradiente de adorno */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 group-hover:scale-125 transition-all duration-1000" />
            
            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Ficha de Alta</p>
                <p className="text-2xl font-black uppercase tracking-tight mt-1 text-zinc-900 dark:text-white">Resumen Operativo</p>
              </div>

              {/* Bloque Área */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">01. Unidad Organizacional</p>
                {registerNewArea ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-[11px] font-black text-zinc-800 dark:text-white uppercase truncate">{newArea.name || 'Por definir...'}</p>
                    </div>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{newArea.branch} - Cuenta Banco</p>
                  </div>
                ) : selectedAreaId ? (
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-850 rounded-2xl p-4 space-y-1">
                    <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 uppercase">{activeArea?.name}</p>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{activeArea?.branch} - BNB</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase italic">Ninguna seleccionada</p>
                )}
              </div>

              {/* Bloque Proveedor */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">02. Proveedor Homologado</p>
                {registerNewProvider ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-[11px] font-black text-zinc-800 dark:text-white uppercase truncate">{newProvider.name || 'Por definir...'}</p>
                    </div>
                    <p className="text-[9px] text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wider">NIT: {newProvider.nit || 'Falta NIT'} - {newProvider.paymentForm?.toUpperCase()}</p>
                  </div>
                ) : selectedProviderId ? (
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-850 rounded-2xl p-4 space-y-1">
                    <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 uppercase">{activeProvider?.name}</p>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">NIT: {activeProvider?.nit} - {activeProvider?.paymentForm.toUpperCase()}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase italic">Ninguno seleccionado</p>
                )}
              </div>

              {/* Bloque Producto */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">03. Especificación Producto</p>
                {newProduct.name || tempGroupName || newPackagingName ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-black text-zinc-800 dark:text-white uppercase truncate">{newProduct.name || 'Por definir nombre...'}</p>
                    
                    {/* Detalles del grupo y empaque */}
                    <div className="space-y-1 border-t border-zinc-200 dark:border-zinc-805 pt-1 text-[8.5px] text-zinc-500 dark:text-zinc-400">
                      <div>
                        <span className="font-bold text-zinc-400 dark:text-zinc-550 uppercase">Grupo:</span>{' '}
                        <span className="font-black text-zinc-700 dark:text-zinc-300 uppercase">
                          {registerNewGroup ? (tempGroupName || 'NUEVO GRUPO') : newProduct.group}
                        </span>
                      </div>
                      {registerNewGroup && (
                        <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800 text-[8px] text-zinc-500 dark:text-zinc-400 uppercase space-y-0.5">
                          <p>Mermas: {groupWastePercentage}%</p>
                          <p>U.M.: {activeUnitLabel}</p>
                          <p>Pedir: {groupAllowOrderType}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-zinc-400 dark:text-zinc-550 uppercase">Empaque:</span>{' '}
                        <span className="font-black text-zinc-700 dark:text-zinc-300 uppercase">
                          {registerNewPackaging ? (newPackagingName || 'NUEVA PRESENTACIÓN') : newProduct.packagingType}
                        </span>
                      </div>
                      {newProduct.packagingType?.toUpperCase() !== 'UNIDAD' && (
                        <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800 text-[8px] text-zinc-500 dark:text-zinc-400 uppercase space-y-0.5">
                          <p>Equiv: {calculateEquivalence().total}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase italic">Sin datos de producto</p>
                )}
              </div>

            </div>
          </div>

          {/* Tips e información de ayuda */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500">lightbulb</span>
              <p className="text-xs font-black text-zinc-900 dark:text-white uppercase">Tips de Homologación</p>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium leading-relaxed">
              La relación de sucursales permite al sistema de inventarios cruzar automáticamente los stock de la planta con los de las tiendas satélites, agilizando los pedidos cruzados.
            </p>
          </div>
        </div>

      </div>

      {/* Listado de Productos Registrados mediante esta Guía */}
      <div className="mt-12 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 space-y-6">
        <div>
          <p className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Catálogo de Productos Asistidos</p>
          <p className="text-zinc-500 text-xs mt-1 font-medium">Últimos productos homologados mediante esta guía asistida en la sesión.</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-zinc-50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100">
                <td className="px-6 py-4">Código</td>
                <td className="px-6 py-4">Producto</td>
                <td className="px-6 py-4">Proveedor / Grupo</td>
                <td className="px-6 py-4 text-center">Empaque / Cant.</td>
                <td className="px-6 py-4 text-center">Medida Base</td>
                <td className="px-6 py-4 text-center">Stock (Mín/Máx)</td>
                <td className="px-6 py-4 text-center">Estado</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/30 transition-colors">
                  <td className="px-6 py-4 font-black text-zinc-400 text-[10px] tracking-tighter">{p.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-zinc-900 text-xs uppercase tracking-tight">{p.name}</p>
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{p.measureDesc || 'Sin descripción'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Chip 
                      label={p.group} 
                      size="small" 
                      sx={{ fontSize: '8px', fontWeight: 900, borderRadius: '5px', height: '18px', mb: 0.5, bgcolor: 'zinc.100', color: 'zinc.700' }} 
                    />
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter truncate max-w-[150px]">{p.provider}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-xs font-black text-zinc-900">{p.packagingType}</p>
                    <p className="text-[8px] text-zinc-400 font-bold mt-0.5">{p.quantity} Unidades x {p.price} Bs.</p>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-zinc-800 text-xs">
                    {p.measureValue} {p.unitMeasure}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-black border border-rose-100">{p.stockMin}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black border border-emerald-100">{p.stockMax}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Chip 
                      label={p.status} 
                      size="small" 
                      color="success"
                      sx={{ fontSize: '8px', fontWeight: 900, borderRadius: '6px', height: '18px' }} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '16px', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.1em' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default GuiaRegistroProducto;

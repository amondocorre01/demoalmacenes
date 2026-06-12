import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  IconButton,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Chip,
  Box,
  Divider,
  FormControlLabel,
  InputAdornment,
  Collapse,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

// --- Types & Interfaces ---
interface InvoiceProduct {
  id: number;
  name: string;
  unitPrice: number;
  qtyReceived: number;
  discount: number;
  ice: number;
}

interface InvoiceRecord {
  id: string;
  nit: string;
  razonSocial: string;
  authCode: string;
  invoiceNumber: string;
  duiNumber: string;
  invoiceDate: string;
  totalAmount: number;
  iceAmount: number;
  iehdAmount: number;
  ipjAmount: number;
  tasas: number;
  othersNoFiscalCredit: number;
  exemptAmount: number;
  zeroTaxAmount: number;
  subtotal: number;
  totalDiscount: number;
  giftCardAmount: number;
  baseCF: number;
  fiscalCredit: number;
  purchaseType: string;
  controlCode: string;
  hasFiscalCredit: boolean;
  consolidationStatus: 'PENDIENTE' | 'CONSOLIDADO';
  isInvoice: boolean;
  invoiceStatus: boolean;
  orderStatus: boolean;
  registryStatus: boolean;
  paymentStatus: boolean;
  area?: string;
}

interface InvoiceData extends Partial<InvoiceRecord> {
  products: InvoiceProduct[];
  isPaid: boolean;
  paymentMethod: 'POR PAGAR' | 'AL CONTADO' | 'ANTICIPO';
  registryComplete: 'COMPLETO' | 'INCOMPLETO';
  inventoryRegistry: boolean;
  invoiceDateObj?: Dayjs | null;
  provider?: string;
  productStatus?: boolean;
}

// --- Mock Data ---
const initialInvoices: InvoiceRecord[] = [
  {
    id: '1',
    nit: '1020349021',
    razonSocial: 'EUROGRANOS S.A.',
    authCode: '4F-2E-8B-D1-10',
    invoiceNumber: '89210',
    duiNumber: 'DUI-00124',
    invoiceDate: '12/10/2023',
    totalAmount: 12450.00,
    iceAmount: 0,
    iehdAmount: 0,
    ipjAmount: 0,
    tasas: 0,
    othersNoFiscalCredit: 0,
    exemptAmount: 0,
    zeroTaxAmount: 0,
    subtotal: 12450.00,
    totalDiscount: 0,
    giftCardAmount: 0,
    baseCF: 12450.00,
    fiscalCredit: 1618.50,
    purchaseType: '1- INTERNO/ACTIVIDADES GRAVADAS',
    controlCode: 'A1-B2-C3-D4',
    hasFiscalCredit: true,
    consolidationStatus: 'PENDIENTE',
    isInvoice: true,
    invoiceStatus: true,
    orderStatus: true,
    registryStatus: false,
    paymentStatus: false,
    area: 'PLANTA'
  },
  {
    id: '2',
    nit: '1204593822',
    razonSocial: 'ENVASES ELITE',
    authCode: '8A-23-CC-12-90',
    invoiceNumber: '55102',
    duiNumber: '',
    invoiceDate: '15/10/2023',
    totalAmount: 5820.50,
    iceAmount: 50.00,
    iehdAmount: 10.00,
    ipjAmount: 5.00,
    tasas: 0,
    othersNoFiscalCredit: 0,
    exemptAmount: 100.00,
    zeroTaxAmount: 0,
    subtotal: 5820.50,
    totalDiscount: 20.00,
    giftCardAmount: 0,
    baseCF: 5670.50,
    fiscalCredit: 737.16,
    purchaseType: '1- INTERNO/ACTIVIDADES GRAVADAS',
    controlCode: 'Z9-X8-Y7-W6',
    hasFiscalCredit: true,
    consolidationStatus: 'CONSOLIDADO',
    isInvoice: true,
    invoiceStatus: true,
    orderStatus: true,
    registryStatus: true,
    paymentStatus: true,
    area: 'ADMINISTRACION'
  }
];

const areas = ['ADMINISTRACION', 'PLANTA', 'LOGISTICA', 'VENTAS'];
const providers = ['EUROGRANOS S.A.', 'ENVASES ELITE', '4 LLAMAS S.R.L.', 'BISA SEGUROS'];
const purchaseTypes = [
  '1- INTERNO/ACTIVIDADES GRAVADAS',
  '2- INTERNO/ACTIVIDADES NO GRAVADAS',
  '3- SUJETAS A PROPORCIONALIDAD'
];
const paymentForms = ['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE'];
const paymentSources = ['FONDOS EMPRESA', 'CAJA CHICA'];
const bankAccounts = ['BNB - 10002345', 'BISA - 20004567'];
const availableProducts = ['Aceite Girasol', 'Harina 000', 'Azúcar Blanca', 'Sal Marina'];

const RegistroFacturasInsumos: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // --- States ---
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Filter States
  const [filters, setFilters] = useState({
    area: null as string | null,
    provider: null as string | null,
    startDate: dayjs().subtract(1, 'month'),
    endDate: dayjs(),
    verification: 'TODOS',
    registry: 'TODOS',
    paymentStatus: 'TODOS'
  });

  // Form State
  const initialFormState: InvoiceData = {
    area: '',
    provider: '',
    invoiceStatus: true,
    productStatus: true,
    authCode: '',
    invoiceNumber: '',
    invoiceDateObj: dayjs(),
    purchaseType: '1- INTERNO/ACTIVIDADES GRAVADAS',
    hasFiscalCredit: true,
    duiNumber: '',
    iehdAmount: 0,
    ipjAmount: 0,
    tasas: 0,
    othersNoFiscalCredit: 0,
    exemptAmount: 0,
    zeroTaxAmount: 0,
    giftCardAmount: 0,
    controlCode: '',
    products: [],
    paymentMethod: 'POR PAGAR',
    isPaid: false,
    registryComplete: 'INCOMPLETO',
    inventoryRegistry: true,
    isInvoice: true
  };

  const [formData, setFormData] = useState<InvoiceData>(initialFormState);

  // --- Calculations ---
  const totals = useMemo(() => {
    const subtotal = formData.products.reduce((acc, p) => acc + (p.unitPrice * p.qtyReceived), 0);
    const totalDiscount = formData.products.reduce((acc, p) => acc + p.discount, 0);
    const totalICE = formData.products.reduce((acc, p) => acc + p.ice, 0);
    const total = subtotal - totalDiscount + totalICE;
    const baseCF = total - (formData.iehdAmount || 0) - (formData.ipjAmount || 0) - (formData.tasas || 0) - (formData.othersNoFiscalCredit || 0) - (formData.exemptAmount || 0) - (formData.zeroTaxAmount || 0) - (formData.giftCardAmount || 0);
    
    return { subtotal, totalDiscount, totalICE, total, baseCF };
  }, [formData]);

  // --- Handlers ---
  const handleOpenScanner = () => {
    setIsCameraOpen(true);
    setTimeout(() => handleScanComplete(), 3000);
  };

  const handleScanComplete = () => {
    setIsCameraOpen(false);
    setIsScanning(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        provider: 'EUROGRANOS S.A.',
        authCode: '4F-2E-8B-D1-10',
        invoiceNumber: '89210',
        controlCode: 'A1-B2-C3-D4',
        products: [
          { id: 1, name: 'Aceite Girasol', unitPrice: 12.5, qtyReceived: 100, discount: 0, ice: 0 },
          { id: 2, name: 'Harina 000', unitPrice: 5.2, qtyReceived: 50, discount: 10, ice: 0 }
        ]
      }));
      setIsScanning(false);
      setSnackbar({ open: true, message: 'Datos extraídos correctamente de la factura', severity: 'success' });
    }, 1000);
  };

  const handleAddProduct = () => {
    const newProduct: InvoiceProduct = {
      id: Date.now(),
      name: '',
      unitPrice: 0,
      qtyReceived: 0,
      discount: 0,
      ice: 0
    };
    setFormData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const handleUpdateProduct = (id: number, field: keyof InvoiceProduct, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleRemoveProduct = (id: number) => {
    setFormData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  };

  const handleEdit = (inv: InvoiceRecord) => {
    setFormData({
      ...inv,
      invoiceDateObj: dayjs(inv.invoiceDate, 'DD/MM/YYYY'),
      products: [
        { id: 1, name: 'Producto Base', unitPrice: inv.totalAmount / 10, qtyReceived: 10, discount: inv.totalDiscount, ice: inv.iceAmount }
      ],
      isPaid: inv.paymentStatus,
      paymentMethod: inv.paymentStatus ? 'AL CONTADO' : 'POR PAGAR',
      registryComplete: inv.registryStatus ? 'COMPLETO' : 'INCOMPLETO',
      inventoryRegistry: true
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setSnackbar({ open: true, message: 'Factura procesada con éxito', severity: 'success' });
    setIsModalOpen(false);
  };

  const StatusIcon = ({ active, icon, label }: { active: boolean, icon: string, label: string }) => (
    <Tooltip title={`${label}: ${active ? 'ACTIVO' : 'INACTIVO'}`} arrow>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' : 'bg-zinc-50 text-zinc-300 border border-zinc-100'}`}>
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
    </Tooltip>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="max-w-full mx-auto w-full animate-in fade-in duration-500 pb-20 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase leading-none">Registro de Facturas</p>
            <p className="text-zinc-500 mt-2 font-medium max-w-xl text-xs uppercase tracking-wider">Gestión centralizada de compras e insumos</p>
          </div>
          <button 
            onClick={handleNew}
            className="px-8 py-4 bg-zinc-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            Nueva Factura
          </button>
        </div>

        {/* Filter Box */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Autocomplete
              options={areas}
              value={filters.area}
              onChange={(_, v) => setFilters({...filters, area: v})}
              renderInput={(params) => <TextField {...params} label="Área" size="small" />}
              fullWidth
            />
            <Autocomplete
              options={providers}
              value={filters.provider}
              onChange={(_, v) => setFilters({...filters, provider: v})}
              renderInput={(params) => <TextField {...params} label="Proveedor" size="small" />}
              fullWidth
            />
            <DatePicker
              label="Fecha Inicio"
              value={filters.startDate}
              onChange={(v) => setFilters({...filters, startDate: v as any})}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label="Fecha Fin"
              value={filters.endDate}
              onChange={(v) => setFilters({...filters, endDate: v as any})}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            
            {/* Second Row for PC (will naturally wrap) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Verificación</label>
              <select 
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-primary transition-all"
                value={filters.verification}
                onChange={e => setFilters({...filters, verification: e.target.value})}
              >
                <option>TODOS</option>
                <option>VERIFICADO</option>
                <option>PENDIENTE</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Registro</label>
              <select 
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-primary transition-all"
                value={filters.registry}
                onChange={e => setFilters({...filters, registry: e.target.value})}
              >
                <option>TODOS</option>
                <option>COMPLETO</option>
                <option>INCOMPLETO</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Estado Pago</label>
              <select 
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase outline-none focus:border-primary transition-all"
                value={filters.paymentStatus}
                onChange={e => setFilters({...filters, paymentStatus: e.target.value})}
              >
                <option>TODOS</option>
                <option>PAGADO</option>
                <option>POR PAGAR</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200">
            <table className="w-full text-left border-collapse min-w-[3200px]">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100">
                  <td className="px-6 py-6 w-20 sticky left-0 bg-zinc-50 z-10 border-r border-zinc-100">Acciones</td>
                  <td className="px-6 py-6 w-56 sticky left-[80px] bg-zinc-50 z-10 border-r border-zinc-100">Estados</td>
                  <td className="px-6 py-6 bg-zinc-100/30">NIT Proveedor</td>
                  <td className="px-6 py-6 bg-zinc-100/30">Razon Social</td>
                  <td className="px-6 py-6">Factura SI/NO</td>
                  <td className="px-6 py-6">Fecha</td>
                  <td className="px-6 py-6">N° Factura</td>
                  <td className="px-6 py-6">Cod. Autorización</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Total Compra</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">ICE</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">IEHD</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">IPJ</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Tasas</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Otro No CF</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Exentos</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Tasa Cero</td>
                  <td className="px-6 py-6 text-right bg-blue-50/20">Gift Card</td>
                  <td className="px-6 py-6 text-right bg-emerald-50/20">Subtotal</td>
                  <td className="px-6 py-6 text-right bg-emerald-50/20">Descuentos</td>
                  <td className="px-6 py-6 text-right bg-emerald-50/20 font-black text-emerald-700">Base CF</td>
                  <td className="px-6 py-6 text-right bg-emerald-50/20 font-black text-primary">Credito Fiscal</td>
                  <td className="px-6 py-6">Cod. Control</td>
                  <td className="px-6 py-6">DUI / DIM</td>
                  <td className="px-6 py-6">Tipo Compra</td>
                  <td className="px-6 py-6 text-center">Der. CF</td>
                  <td className="px-6 py-6">Consolidación</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/30 transition-all group">
                    <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-zinc-50 group-hover:bg-zinc-50/50 transition-all">
                      <div className="flex gap-1">
                        <Tooltip title="Editar" arrow><IconButton onClick={() => handleEdit(inv)} size="small" className="text-zinc-400 hover:text-amber-500"><span className="material-symbols-outlined text-lg">edit_square</span></IconButton></Tooltip>
                        <Tooltip title="Imprimir" arrow><IconButton size="small" className="text-zinc-400 hover:text-blue-500"><span className="material-symbols-outlined text-lg">print</span></IconButton></Tooltip>
                        <Tooltip title="Ver Imagen" arrow><IconButton size="small" className="text-zinc-400 hover:text-primary"><span className="material-symbols-outlined text-lg">image</span></IconButton></Tooltip>
                      </div>
                    </td>
                    <td className="px-6 py-4 sticky left-[80px] bg-white z-10 border-r border-zinc-50 group-hover:bg-zinc-50/50 transition-all">
                      <div className="flex gap-2">
                        <StatusIcon active={inv.invoiceStatus} icon="description" label="Factura" />
                        <StatusIcon active={inv.orderStatus} icon="shopping_cart" label="Pedido" />
                        <StatusIcon active={inv.registryStatus} icon="inventory" label="Registro" />
                        <StatusIcon active={inv.paymentStatus} icon="payments" label="Pago" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-500 text-[11px] bg-zinc-50/10">{inv.nit}</td>
                    <td className="px-6 py-4 font-black text-zinc-900 text-[11px] uppercase bg-zinc-50/10">{inv.razonSocial}</td>
                    <td className="px-6 py-4 text-center">
                      <Chip label={inv.isInvoice ? 'SI' : 'NO'} size="small" variant="outlined" sx={{ fontSize: '9px', fontWeight: 900, borderRadius: '6px', height: '18px' }} />
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-900 text-[11px]">{inv.invoiceDate}</td>
                    <td className="px-6 py-4 font-black text-zinc-900 text-[11px]">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-zinc-400">{inv.authCode}</td>
                    <td className="px-6 py-4 text-right font-black text-zinc-900 text-xs bg-blue-50/5">{inv.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-blue-600 bg-blue-50/5">{inv.iceAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 bg-blue-50/5">{inv.iehdAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 bg-blue-50/5">{inv.ipjAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 bg-blue-50/5">{inv.tasas.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-rose-500 bg-blue-50/5">{inv.othersNoFiscalCredit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 bg-blue-50/5">{inv.exemptAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-500 bg-blue-50/5">{inv.zeroTaxAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-zinc-400 bg-blue-50/5">{inv.giftCardAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black text-zinc-900 text-xs bg-emerald-50/5">{inv.subtotal.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-rose-500 bg-emerald-50/5">{inv.totalDiscount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-xs bg-emerald-50/10">{inv.baseCF.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black text-primary text-xs bg-emerald-50/10">{inv.fiscalCredit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-zinc-400">{inv.controlCode}</td>
                    <td className="px-6 py-4 text-[10px] text-zinc-400">{inv.duiNumber || '-'}</td>
                    <td className="px-6 py-4 text-[9px] font-black text-zinc-400">{inv.purchaseType}</td>
                    <td className="px-6 py-4 text-center">
                      <Chip label={inv.hasFiscalCredit ? 'SI' : 'NO'} size="small" variant="outlined" sx={{ fontSize: '9px', fontWeight: 900, borderRadius: '6px', height: '18px', color: inv.hasFiscalCredit ? 'emerald.600' : 'rose.600', borderColor: inv.hasFiscalCredit ? 'emerald.100' : 'rose.100', bgcolor: inv.hasFiscalCredit ? 'emerald.50' : 'rose.50' }} />
                    </td>
                    <td className="px-6 py-4">
                      <Chip label={inv.consolidationStatus} size="small" sx={{ fontSize: '9px', fontWeight: 900, borderRadius: '6px', height: '18px', bgcolor: inv.consolidationStatus === 'CONSOLIDADO' ? 'zinc.900' : 'zinc.100', color: inv.consolidationStatus === 'CONSOLIDADO' ? 'white' : 'zinc.500' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration Modal */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          maxWidth="xl"
          fullWidth
          fullScreen={isMobile}
          slotProps={{
            paper: { sx: { borderRadius: isMobile ? 0 : '2.5rem', p: 1, overflow: 'hidden', bgcolor: 'zinc.50/50' } }
          }}
        >
          <DialogTitle sx={{ p: 2, px: 4, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'zinc-50' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xl">
                  <span className="material-symbols-outlined text-xl">receipt</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Operación de Ingreso</p>
                  <p className="text-xl font-black text-zinc-900 uppercase tracking-tight">Registro de Factura</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleOpenScanner}
                  disabled={isScanning || isCameraOpen}
                  className="px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  {isScanning ? (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg text-primary">qr_code_scanner</span>
                  )}
                  {isScanning ? 'Extrayendo...' : 'Escanear QR'}
                </button>
                <IconButton onClick={() => setIsModalOpen(false)} size="small" className="bg-zinc-50">
                  <span className="material-symbols-outlined text-lg">close</span>
                </IconButton>
              </div>
            </div>
          </DialogTitle>

          <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-6">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">info</span>
                    Datos del Proveedor
                  </p>
                  <div className="space-y-4">
                    <Autocomplete options={areas} value={formData.area} onChange={(_, v) => setFormData({...formData, area: v || ''})} renderInput={(params) => <TextField {...params} label="Área de Destino" size="small" />} />
                    <Autocomplete options={providers} value={formData.provider} onChange={(_, v) => setFormData({...formData, provider: v || ''})} renderInput={(params) => <TextField {...params} label="Proveedor" size="small" />} />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Factura</label>
                        <Switch size="small" checked={formData.invoiceStatus} onChange={e => setFormData({...formData, invoiceStatus: e.target.checked})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Pedido</label>
                        <Switch size="small" checked={formData.productStatus} onChange={e => setFormData({...formData, productStatus: e.target.checked})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-6">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">balance</span>
                    Detalles Fiscales
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Autorización" size="small" fullWidth value={formData.authCode} onChange={e => setFormData({...formData, authCode: e.target.value})} />
                    <TextField label="N° Factura" size="small" fullWidth value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
                    <DatePicker label="Fecha Factura" value={formData.invoiceDateObj} onChange={(v) => setFormData({...formData, invoiceDateObj: v})} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                    <TextField label="Código Control" size="small" fullWidth value={formData.controlCode} onChange={e => setFormData({...formData, controlCode: e.target.value})} />
                  </div>
                  <Autocomplete options={purchaseTypes} value={formData.purchaseType} onChange={(_, v) => setFormData({...formData, purchaseType: v || ''})} renderInput={(params) => <TextField {...params} label="Tipo de Compra" size="small" />} />
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-zinc-900 uppercase">Crédito Fiscal</p>
                    <Switch checked={formData.hasFiscalCredit} onChange={e => setFormData({...formData, hasFiscalCredit: e.target.checked})} />
                  </div>
                  <TextField label="N° DUI/DIM" size="small" fullWidth value={formData.duiNumber} onChange={e => setFormData({...formData, duiNumber: e.target.value})} />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">calculate</span>
                      </div>
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Desglose de Importes y Tasas</p>
                    </div>
                    <button 
                      onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                      className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:bg-white/50 px-3 py-1 rounded-lg transition-all"
                    >
                      {showFinancialDetails ? 'Contraer' : 'Expandir'}
                      <span className="material-symbols-outlined text-lg">{showFinancialDetails ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>
                  <Collapse in={showFinancialDetails}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">IEHD</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.iehdAmount} onChange={e => setFormData({...formData, iehdAmount: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">IPJ</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.ipjAmount} onChange={e => setFormData({...formData, ipjAmount: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Tasas</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.tasas} onChange={e => setFormData({...formData, tasas: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Otros No CF</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.othersNoFiscalCredit} onChange={e => setFormData({...formData, othersNoFiscalCredit: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Exentos</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.exemptAmount} onChange={e => setFormData({...formData, exemptAmount: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Tasa Cero</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.zeroTaxAmount} onChange={e => setFormData({...formData, zeroTaxAmount: parseFloat(e.target.value) || 0})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Gift Card</label><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-400 transition-all" value={formData.giftCardAmount} onChange={e => setFormData({...formData, giftCardAmount: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                  </Collapse>
                  {!showFinancialDetails && (
                    <p className="text-[9px] text-indigo-300 font-bold uppercase italic tracking-widest ml-11">Importes adicionales colapsados para mayor claridad.</p>
                  )}
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                  <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recepción de Productos</p>
                    <button onClick={handleAddProduct} className="flex items-center gap-2 text-[9px] font-black text-primary uppercase hover:bg-primary/5 px-4 py-2 rounded-xl transition-all"><span className="material-symbols-outlined text-lg">add_circle</span>Añadir Fila</button>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-white text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50"><td className="px-6 py-4">Producto</td><td className="px-6 py-4 w-32">P. Unitario</td><td className="px-6 py-4 w-32">Cant. Recibida</td><td className="px-6 py-4 w-32">Descuento</td><td className="px-6 py-4 w-32">ICE</td><td className="px-6 py-4 w-20"></td></tr></thead>
                      <tbody className="divide-y divide-zinc-50">
                        {formData.products.map((p) => (
                          <tr key={p.id} className="group">
                            <td className="px-6 py-2"><Autocomplete options={availableProducts} value={p.name} onChange={(_, v) => handleUpdateProduct(p.id, 'name', v || '')} renderInput={(params) => <TextField {...params} variant="standard" size="small" slotProps={{ input: { ...(params as any).slotProps?.input, disableUnderline: true } }} sx={{ '& input': { fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' } }} />} /></td>
                            <td className="px-6 py-2"><input type="number" className="w-full bg-transparent text-[12px] font-black outline-none border-b border-transparent focus:border-zinc-200" value={p.unitPrice} onChange={e => handleUpdateProduct(p.id, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                            <td className="px-6 py-2"><input type="number" className="w-full bg-transparent text-[12px] font-black outline-none border-b border-transparent focus:border-zinc-200" value={p.qtyReceived} onChange={e => handleUpdateProduct(p.id, 'qtyReceived', parseFloat(e.target.value) || 0)} /></td>
                            <td className="px-6 py-2 text-rose-500"><input type="number" className="w-full bg-transparent text-[12px] font-black outline-none border-b border-transparent focus:border-zinc-200" value={p.discount} onChange={e => handleUpdateProduct(p.id, 'discount', parseFloat(e.target.value) || 0)} /></td>
                            <td className="px-6 py-2 text-blue-500"><input type="number" className="w-full bg-transparent text-[12px] font-black outline-none border-b border-transparent focus:border-zinc-200" value={p.ice} onChange={e => handleUpdateProduct(p.id, 'ice', parseFloat(e.target.value) || 0)} /></td>
                            <td className="px-6 py-2 text-right"><IconButton onClick={() => handleRemoveProduct(p.id)} size="small" className="opacity-0 group-hover:opacity-100 text-zinc-200 hover:text-rose-500"><span className="material-symbols-outlined text-lg">delete</span></IconButton></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col md:flex-row justify-between gap-8 items-end">
                    <div className="flex flex-wrap gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm min-w-[140px]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Monto ICE</p><p className="text-xl font-black text-blue-600">{totals.totalICE.toFixed(2)}</p></div>
                      <div className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm min-w-[140px]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Base CF</p><p className="text-xl font-black text-emerald-600">{totals.baseCF.toFixed(2)}</p></div>
                    </div>
                    <div className="w-full md:w-80 space-y-3">
                      <div className="flex justify-between text-[11px] font-black uppercase text-zinc-400"><span>Subtotal</span><span>{totals.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[11px] font-black uppercase text-rose-400"><span>Descuento</span><span>-{totals.totalDiscount.toFixed(2)}</span></div>
                      <Divider /><div className="flex justify-between items-center py-2"><span className="text-[12px] font-black uppercase text-zinc-900">Total a Pagar</span><span className="text-3xl font-black text-zinc-900 tracking-tight">{totals.total.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white rounded-[2rem] border border-zinc-100 shadow-sm space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 w-full space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Método de Pago</label><Autocomplete options={['POR PAGAR', 'AL CONTADO', 'ANTICIPO']} value={formData.paymentMethod} onChange={(_, v) => setFormData({...formData, paymentMethod: v as any || 'POR PAGAR'})} renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />} /></div>
                    <div className="flex items-center gap-4 px-6 py-3 bg-zinc-50 rounded-2xl border border-zinc-100"><div><p className="text-[10px] font-black text-zinc-900 uppercase">Pago Realizado</p><p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">¿Confirmar comprobante?</p></div><Switch checked={formData.isPaid} onChange={e => setFormData({...formData, isPaid: e.target.checked})} /></div>
                  </div>
                  {formData.isPaid && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300"><Autocomplete options={paymentForms} renderInput={(params) => <TextField {...params} label="Forma de Pago" size="small" />} /><Autocomplete options={paymentSources} renderInput={(params) => <TextField {...params} label="Origen Recurso" size="small" />} /><Autocomplete options={bankAccounts} renderInput={(params) => <TextField {...params} label="Cuenta Banco" size="small" />} /><DatePicker label="F. Comprobante" slotProps={{ textField: { size: 'small', fullWidth: true } }} /></div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 4, bgcolor: 'white', borderTop: '1px solid', borderColor: 'zinc-100' }}>
            <div className="flex flex-1 items-center justify-between">
              <div className="flex gap-3">
                <div className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center gap-2"><p className="text-[9px] font-black text-zinc-400 uppercase">Registro:</p><select className="bg-transparent text-[9px] font-black uppercase outline-none text-zinc-900" value={formData.registryComplete} onChange={e => setFormData({...formData, registryComplete: e.target.value as any})}><option>INCOMPLETO</option><option>COMPLETO</option></select></div>
                <div className="px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center gap-2"><p className="text-[9px] font-black text-zinc-400 uppercase">Inventario:</p><Switch size="small" checked={formData.inventoryRegistry} onChange={e => setFormData({...formData, inventoryRegistry: e.target.checked})} /></div>
              </div>
              <div className="flex gap-2"><Button onClick={() => setIsModalOpen(false)} sx={{ color: 'zinc-400', fontWeight: 900, fontSize: '10px', px: 3 }}>Cerrar</Button><button onClick={handleSave} className="h-10 px-8 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-[0.1em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><span className="material-symbols-outlined text-lg">save</span>Finalizar</button></div>
            </div>
          </DialogActions>
        </Dialog>

        {/* Camera Simulator */}
        <Dialog open={isCameraOpen} onClose={() => setIsCameraOpen(false)} slotProps={{ paper: { sx: { borderRadius: '2rem', p: 0, overflow: 'hidden', maxWidth: '400px' } } }}>
          <div className="relative bg-black aspect-[9/16] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black animate-pulse opacity-50" /><div className="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-[scan_3s_infinite]" />
            <div className="z-10 text-center space-y-6 px-10"><div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-primary animate-spin mx-auto" /><div><p className="text-white font-black uppercase tracking-[0.2em] text-xs">Escaneando Factura...</p><p className="text-zinc-500 text-[10px] font-bold uppercase mt-2">No mueva el documento</p></div></div>
            <div className="absolute top-10 left-10 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" /><div className="absolute top-10 right-10 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" /><div className="absolute bottom-10 left-10 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" /><div className="absolute bottom-10 right-10 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2"><button onClick={() => handleScanComplete()} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-md active:scale-90 transition-all" /></div>
          </div>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>{snackbar.message}</Alert>
        </Snackbar>

        <style>{`@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
      </div>
    </LocalizationProvider>
  );
};

export default RegistroFacturasInsumos;

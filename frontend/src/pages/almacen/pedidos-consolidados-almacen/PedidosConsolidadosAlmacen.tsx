import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, IconButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';

interface PedidoItem {
  id: number;
  product: string;
  detail: string;
  stock: number;
  unit: string;
  warehouseValues: Record<string, number>;
  total: number;
}

const initialData: PedidoItem[] = [
  { id: 1, product: 'Chispas de Chocolate', detail: '104172 CHIPS...', stock: 93.00, unit: 'Kilogramo', warehouseValues: { 'Panadería': 0, 'Tortas': 30, 'Masas': 0 }, total: 30 },
  { id: 2, product: 'Bolsa para porcionar 12x20 N', detail: '12X20 SPP...', stock: 9040.00, unit: 'Paquete', warehouseValues: { 'Panadería': 10, 'Tortas': 0, 'Masas': 5 }, total: 15 },
  { id: 3, product: 'Azúcar Impalpable', detail: 'AZUCAR IMPALPABLE X 22 KG...', stock: 49.00, unit: 'Kilogramo', warehouseValues: { 'Panadería': 0, 'Tortas': 2, 'Masas': 0 }, total: 2 },
  { id: 4, product: 'Canela en Rama', detail: 'CANELA H1 SUPER...', stock: 33.32, unit: 'Kilogramo', warehouseValues: { 'Panadería': 0.2, 'Tortas': 0, 'Masas': 0 }, total: 0.2 },
  { id: 5, product: 'Crema de Leche', detail: 'CREMA DE LECHE UHT X 1 L.', stock: 238.00, unit: 'Unidad', warehouseValues: { 'Panadería': 0, 'Tortas': 4, 'Masas': 5 }, total: 9 },
  { id: 6, product: 'Queso Crema', detail: 'CREMA P\' UNTAR BONLE...', stock: 95.00, unit: 'Unidad', warehouseValues: { 'Panadería': 0, 'Tortas': 15, 'Masas': 0 }, total: 15 },
];

const PedidosConsolidadosAlmacen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>(['Panadería', 'Tortas']);
  const [selectedArea, setSelectedArea] = useState<string | null>('PLANTA');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [tableData, setTableData] = useState<PedidoItem[]>(initialData);

  const availableWarehouses = ['Panadería', 'Tortas', 'Pies', 'Bizcochos', 'Esencias', 'Frutas'];
  const availableAreas = ['PLANTA', 'DESPACHO', 'ADMINISTRACION', 'RECEPCION'];

  const sucursales = [
    { nombre: 'Salamanca', estado: 'Pendiente' },
    { nombre: 'Pando', estado: 'Pendiente' },
    { nombre: 'Jordán', estado: 'Pendiente' },
    { nombre: 'Hupermall', estado: 'Pendiente' },
    { nombre: 'Cine', estado: 'Pendiente' },
    { nombre: 'América Este', estado: 'Pendiente' },
    { nombre: 'América Oeste', estado: 'Pendiente' },
    { nombre: 'Fidel Anze', estado: 'Pendiente' },
    { nombre: 'Lincoln', estado: 'Pendiente' },
  ];

  const handleValueChange = (id: number, warehouse: string, newValue: string) => {
    const val = parseFloat(newValue) || 0;
    setTableData(prev => prev.map(item => {
      if (item.id === id) {
        const newWarehouseValues = { ...item.warehouseValues, [warehouse]: val };
        // Calculate new total based on ALL warehouse values (even those not selected if they exist, 
        // but typically only selected ones matter for the user's focus)
        // Let's sum only the values for selected warehouses to keep it intuitive
        const newTotal = Object.entries(newWarehouseValues)
          .filter(([name]) => selectedWarehouses.includes(name))
          .reduce((sum, [_, v]) => sum + v, 0);

        return { ...item, warehouseValues: newWarehouseValues, total: newTotal };
      }
      return item;
    }));
  };

  // Recalculate totals whenever selectedWarehouses change
  useEffect(() => {
    setTableData(prev => prev.map(item => {
      const newTotal = Object.entries(item.warehouseValues)
        .filter(([name]) => selectedWarehouses.includes(name))
        .reduce((sum, [_, v]) => sum + v, 0);
      return { ...item, total: newTotal };
    }));
  }, [selectedWarehouses]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface animate-in fade-in duration-500">
      <div className="px-8 py-10 bg-white border-b border-zinc-200 shrink-0 shadow-sm relative z-10">
        <div className="flex flex-col gap-2 mb-4 -mt-6">
          <p className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Pedidos Consolidados</p>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2 min-w-[320px]">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Almacenes</label>
            <Autocomplete
              multiple
              options={availableWarehouses}
              value={selectedWarehouses}
              onChange={(_, v) => setSelectedWarehouses(v)}
              renderInput={(params) => <TextField {...params} size="small" placeholder="Seleccionar almacenes..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/50' } }} />}
              size="small"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Área</label>
            <Autocomplete
              options={availableAreas}
              value={selectedArea}
              onChange={(_, v) => setSelectedArea(v)}
              renderInput={(params) => <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/50' } }} />}
              size="small"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
            <DatePicker
              value={selectedDate}
              onChange={(v) => setSelectedDate(v)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: 'zinc.50/50' } }
                }
              }}
            />
          </div>

          <div className="flex items-end">
            <button className="bg-zinc-900 hover:bg-primary text-white h-[40px] px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              Filtrar
            </button>
          </div>

          {/* <div className="flex items-end ml-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white border-2 border-primary text-primary h-[40px] px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-primary hover:text-white transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">fact_check</span>
              Aceptación por Sucursal
            </button>
          </div> */}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-10 custom-scrollbar bg-zinc-50/50">
        <div className="bg-white border border-zinc-200 rounded-[3rem] shadow-sm overflow-hidden min-w-max">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <td className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">PRODUCTO</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">PRODUCTO DETALLE</td>

                {/* Dynamic Warehouse Columns */}
                {selectedWarehouses.map(wh => (
                  <td key={wh} className="px-6 py-6 text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center bg-primary/5 border-x border-zinc-100/50">
                    {wh}
                  </td>
                ))}

                <td className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">SOLICITADO EN</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">STOCK</td>
                <td className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">TOTAL</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tableData.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/50 transition-all duration-300 group">
                  <td className="px-10 py-6">
                    <div className="font-black text-zinc-900 text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{item.product}</div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.detail}</td>

                  {/* Dynamic Warehouse Inputs */}
                  {selectedWarehouses.map(wh => (
                    <td key={wh} className="px-6 py-4 bg-primary/5 border-x border-zinc-100/50">
                      <input
                        type="number"
                        className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-black text-center text-zinc-900 outline-none focus:border-primary transition-all"
                        value={item.warehouseValues[wh] || 0}
                        onChange={(e) => handleValueChange(item.id, wh, e.target.value)}
                      />
                    </td>
                  ))}

                  <td className="px-10 py-6 text-[9px] font-black uppercase text-zinc-300 tracking-[0.2em]">{item.unit}</td>
                  <td className="px-8 py-6 text-right font-black text-xs text-zinc-900">{item.stock.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right font-black text-sm text-primary">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-8 py-6 bg-white border-t border-zinc-200 flex justify-between items-center shrink-0 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.2em]">Total Productos</span>
            <span className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">{tableData.length} Ítems</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.2em]">Volumen Consolidado</span>
            <span className="text-2xl font-black text-primary tracking-tighter uppercase">{tableData.reduce((acc, curr) => acc + curr.total, 0).toFixed(1)} Unidades</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            Exportar Excel
          </button>
          <button className="bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl shadow-zinc-900/20">
            <span className="material-symbols-outlined text-sm">print</span>
            Imprimir Listado
          </button>
        </div>
      </div>

      {/* Acceptance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-100 animate-in zoom-in-95 duration-300">
            <div className="bg-primary px-10 py-8 flex items-center justify-between">
              <p className="text-white font-black text-2xl tracking-tighter uppercase">Aceptación por Sucursal</p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-10">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-10 italic">
                Revise y confirme la recepción de pedidos para cada sucursal antes de la consolidación final.
              </p>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                {sucursales.map((suc, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 group hover:border-primary transition-all">
                    <span className="text-sm font-black text-zinc-900 uppercase tracking-tight">{suc.nombre}</span>
                    <div className="flex gap-3">
                      <button className="px-6 py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Aceptar
                      </button>
                      <button className="px-6 py-2.5 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">cancel</span> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-10 py-8 bg-zinc-50/50 border-t border-zinc-100 flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Cerrar
              </button>
              <button className="px-10 py-4 bg-zinc-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-zinc-900/20 hover:bg-primary transition-all active:scale-[0.98]">
                Finalizar Revisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosConsolidadosAlmacen;

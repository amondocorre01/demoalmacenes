import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const ListaPreciosInsumos: React.FC = () => {
  const [filterDate, setFilterDate] = useState<Dayjs | null>(dayjs('2026-03-25'));

  const data = [
    { product: 'Huevo AA Blanco', recipeQty: '233.5617', recipeUnit: 'Gramo', price: '1.402337', purchasePresentation: 'Paquete', stdQty: '483.00', stdUnit: 'Kilogramo', adjQty: '1000.00', adjUnit: 'Gramo', unitCost: '2.900', invoiceDate: '25-03-2026', icon: 'egg' },
    { product: 'Leche Entera', recipeQty: '150.0000', recipeUnit: 'Mililitro', price: '3.200000', purchasePresentation: 'Bolsa', stdQty: '1000.00', stdUnit: 'Litro', adjQty: '1000.00', adjUnit: 'Mililitro', unitCost: '4.150', invoiceDate: '24-03-2026', icon: 'opacity' },
    { product: 'Harina Trigo Extra', recipeQty: '500.2500', recipeUnit: 'Gramo', price: '0.850000', purchasePresentation: 'Bolsa', stdQty: '25.00', stdUnit: 'Bulto', adjQty: '25000.00', adjUnit: 'Gramo', unitCost: '1.120', invoiceDate: '20-03-2026', icon: 'cookie' },
    { product: 'Mantequilla Sin Sal', recipeQty: '125.0000', recipeUnit: 'Gramo', price: '8.402337', purchasePresentation: 'Unidad', stdQty: '1.00', stdUnit: 'Bloque 500g', adjQty: '500.00', adjUnit: 'Gramo', unitCost: '12.450', invoiceDate: '18-03-2026', icon: 'inventory' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-3xl font-extrabold text-zinc-900 tracking-tight uppercase">Lista precios productos insumos</p>
          <p className="text-zinc-500 mt-1">Gestión técnica y control de costos de materia prima.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 shadow-sm transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <div className="md:col-span-6 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Filtrar por Producto</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">restaurant_menu</span>
            <select className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none font-medium text-zinc-900">
              <option>Torta de Chocolate</option>
              <option>Cheesecake de Frutos Rojos</option>
              <option>Muffin de Vainilla</option>
              <option>Croissant de Mantequilla</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="md:col-span-3 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Rango de Fecha</label>
          <DatePicker
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    '& fieldset': { border: '1px solid #e4e4e7' },
                  },
                  '& .MuiInputBase-input': {
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }
                }
              }
            }}
          />
        </div>
        <div className="md:col-span-3 bg-primary p-5 rounded-xl border border-red-700 shadow-lg shadow-red-200 flex flex-col justify-center">
          <p className="text-red-100 text-[10px] font-bold uppercase tracking-wider mb-1">Costo Promedio Actual</p>
          <div className="flex items-end gap-2 text-white">
            <span className="text-xl font-black">Bs. 40,18</span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mb-1 flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[10px]">trending_up</span> 2.4%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Producto</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cantidad Receta</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Unidad Receta</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Precio</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Presentación Compra</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cantidad Estándar</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unidad E Compra</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cant. Adecuación</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unidad A Compra</td>
                <td className="px-4 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Costo Unitario</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha Factura</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Acción</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-red-50/30 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 uppercase whitespace-nowrap">{item.product}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-zinc-600">{item.recipeQty}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded uppercase">{item.recipeUnit}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-zinc-900">Bs. {item.price}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold text-zinc-500 px-2 py-1 border border-zinc-200 rounded uppercase">{item.purchasePresentation}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-zinc-600">{item.stdQty}</td>
                  <td className="px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.stdUnit}</td>
                  <td className="px-4 py-4 text-sm font-mono text-zinc-600">{item.adjQty}</td>
                  <td className="px-4 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.adjUnit}</td>
                  <td className="px-4 py-4 text-sm font-black text-primary">Bs. {item.unitCost}</td>
                  <td className="px-4 py-4 text-xs text-zinc-500 font-medium">{item.invoiceDate}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="p-1 hover:bg-white rounded transition-all text-zinc-400 hover:text-primary">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Mostrando <span className="text-zinc-900 font-bold">{data.length}</span> de <span className="text-zinc-900 font-bold">84</span> registros técnicos</p>
          <div className="flex gap-2">
            <button className="p-2 border border-zinc-200 rounded bg-white text-zinc-400 hover:text-zinc-700 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 border border-primary bg-primary text-white text-xs font-bold rounded">1</button>
            <button className="px-3 py-1 border border-zinc-200 rounded bg-white text-zinc-600 text-xs font-bold hover:bg-zinc-50">2</button>
            <button className="px-3 py-1 border border-zinc-200 rounded bg-white text-zinc-600 text-xs font-bold hover:bg-zinc-50">3</button>
            <button className="p-2 border border-zinc-200 rounded bg-white text-zinc-400 hover:text-zinc-700">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaPreciosInsumos;





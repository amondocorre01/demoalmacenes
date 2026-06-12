import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const DevolucionAlmacen: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());

  const data = [
    { date: '12 Oct 2023', warehouse: 'BIZCOCHOS', reason: 'Producto Dañado en Tránsito', status: 'Recibido', statusColor: 'bg-green-100 text-green-700' },
    { date: '12 Oct 2023', warehouse: 'CHEESECAKE', reason: 'Vencimiento de Lote', status: 'Pendiente', statusColor: 'bg-amber-100 text-amber-700' },
    { date: '11 Oct 2023', warehouse: 'ESENCIAS', reason: 'Exceso de Stock (Campaña)', status: 'Recibido', statusColor: 'bg-green-100 text-green-700' },
    { date: '11 Oct 2023', warehouse: 'FRUTAS', reason: 'Error de Despacho', status: 'Pendiente', statusColor: 'bg-amber-100 text-amber-700' },
    { date: '10 Oct 2023', warehouse: 'GALLETAS', reason: 'Devolución de Cliente B2B', status: 'Recibido', statusColor: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-3xl font-black text-on-surface tracking-tight uppercase">Devolución Almacen</p>
          <p className="text-stone-500 text-sm mt-1">Gestión y registro de retornos de inventario.</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-red-200">
          <span className="material-symbols-outlined text-lg">add_circle</span>
          REGISTRAR DEVOLUCIÓN
        </button>
      </div>

      <div className="bg-white p-6 rounded border border-stone-200 mb-8 flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Almacén</label>
          <select className="border border-stone-200 rounded p-2 text-sm focus:ring-primary focus:border-primary">
            <option>Todos los almacenes</option>
            <option>BIZCOCHOS</option>
            <option>CHEESECAKE</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Fecha Inicio</label>
          <DatePicker
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.25rem',
                    '& fieldset': { borderColor: '#e7e5e4' },
                  }
                }
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Fecha Fin</label>
          <DatePicker
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{
              textField: {
                size: 'small',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.25rem',
                    '& fieldset': { borderColor: '#e7e5e4' },
                  }
                }
              }
            }}
          />
        </div>
        <div className="bg-stone-50 px-6 py-2 rounded border border-stone-100 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-tight">Total Registros</p>
          <p className="text-xl font-black text-primary">156</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors self-end">
          Filtrar
        </button>
      </div>

      <div className="bg-white rounded border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Log de Devoluciones</p>
          <div className="flex gap-2">
            <button className="p-1.5 text-stone-400 hover:text-stone-600 border border-stone-200 rounded">
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
            <button className="p-1.5 text-stone-400 hover:text-stone-600 border border-stone-200 rounded">
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50/30">
                <td className="px-6 py-4">Fecha</td>
                <td className="px-6 py-4">Almacén</td>
                <td className="px-6 py-4">Motivo</td>
                <td className="px-6 py-4">Estado</td>
                <td className="px-6 py-4 text-right">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                  <td className="px-6 py-4 text-xs text-stone-600 font-medium">{item.date}</td>
                  <td className="px-6 py-4 text-xs text-on-surface uppercase font-semibold">{item.warehouse}</td>
                  <td className="px-6 py-4 text-xs text-stone-500 italic">{item.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-widest">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-stone-50/30 border-t border-stone-100 flex items-center justify-between">
          <p className="text-[10px] text-stone-500 font-medium uppercase tracking-widest">Mostrando {data.length} de 156 devoluciones</p>
          <div className="flex items-center gap-1">
            <button className="p-1 text-stone-400 hover:text-on-surface disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-xs font-bold bg-primary text-white rounded">1</span>
            <button className="p-1 text-stone-400 hover:text-on-surface">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevolucionAlmacen;





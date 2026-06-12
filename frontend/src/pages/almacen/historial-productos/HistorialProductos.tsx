import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const HistorialProductos: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('2023-10-01'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs('2023-10-31'));

  const movements = [
    { type: 'Entrada de Planta', in: '3.00', out: '-1.00', stock: '2.00', presentation: '200.00 gr', unit: 'Unidad', date: '16-01-2026', time: '13:27:40', expiry: '14-04-2026', user: 'CT', username: 'CRISTHIAN TERAN', status: 'Completado', statusColor: 'bg-green-100 text-green-700 border-green-200', icon: 'login', iconColor: 'bg-green-100 text-green-700' },
    { type: 'Entrada de Planta', in: '3.00', out: '0.00', stock: '3.00', presentation: '200.00 gr', unit: 'Unidad', date: '20-01-2026', time: '09:20:06', expiry: '14-04-2026', user: 'CT', username: 'CRISTHIAN TERAN', status: 'Completado', statusColor: 'bg-green-100 text-green-700 border-green-200', icon: 'login', iconColor: 'bg-green-100 text-green-700' },
    { type: 'Transferencia', in: '2.00', out: '0.00', stock: '2.00', presentation: '200.00 gr', unit: 'Unidad', date: '19-02-2026', time: '09:33:09', expiry: '05-05-2026', user: 'MV', username: 'MARVIN VALVERDE', status: 'En Tránsito', statusColor: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'swap_horiz', iconColor: 'bg-orange-100 text-orange-700' },
    { type: 'Salida Directa', in: '0.00', out: '-2.00', stock: '1.00', presentation: '500.00 gr', unit: 'Unidad', date: '24-02-2026', time: '11:14:25', expiry: '14-04-2026', user: 'CT', username: 'CRISTHIAN TERAN', status: 'Ajuste Manual', statusColor: 'bg-red-100 text-red-700 border-red-200', icon: 'logout', iconColor: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-8">
        <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Historial prod. en almacén</p>
        <p className="text-sm text-zinc-500 mt-1">Gestión detallada de movimientos y auditoría de inventario</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Almacén Origen/Destino</label>
          <div className="relative">
            <select className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer text-zinc-900 font-medium">
              <option>Todos los Almacenes</option>
              <option>Almacén A-1 (Planta Central)</option>
              <option>Almacén B-3 (Sucursal Norte)</option>
              <option>Almacén Central (Logística)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Familia de Productos</label>
          <div className="relative">
            <select className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer text-zinc-900 font-medium">
              <option>Todos los Productos</option>
              <option>Café Grano Tostado</option>
              <option>Filtros V60</option>
              <option>Cápsulas Lungo</option>
              <option>Packaging y Bolsas</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha Inicio</label>
          <DatePicker
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
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
                    padding: '10px 12px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }
                }
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha Fin</label>
          <DatePicker
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
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
                    padding: '10px 12px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200">
                <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Movimiento</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Cant. Ingreso</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Cant. Utilizada</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Stock Final</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Presentación</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha Registro</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vencimiento</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Responsable</td>
                <td className="px-4 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado / Tipo</td>
                <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {movements.map((m, idx) => (
                <tr key={idx} className="group hover:bg-red-50/30 transition-all duration-200">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.iconColor}`}>
                        <span className="material-symbols-outlined text-lg">{m.icon}</span>
                      </div>
                      <p className="font-bold text-zinc-900 uppercase text-xs">{m.type}</p>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right font-black text-zinc-900">{m.in}</td>
                  <td className={`px-4 py-5 text-right font-bold ${m.out !== '0.00' ? 'text-red-500' : 'text-zinc-300'}`}>{m.out}</td>
                  <td className="px-4 py-5 text-right">
                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-800 rounded font-black text-xs">{m.stock}</span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-700 uppercase text-xs">{m.presentation}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">{m.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-xs">
                    <div className="flex flex-col">
                      <span className="text-zinc-600 font-bold">{m.date}</span>
                      <span className="text-[10px] text-zinc-400">{m.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-amber-700 font-bold text-[10px] uppercase bg-amber-50 px-2 py-1 rounded border border-amber-100">{m.expiry}</span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600 uppercase">{m.user}</div>
                      <span className="uppercase text-[10px] font-bold text-zinc-600 truncate max-w-[120px]">{m.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${m.statusColor}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-red-50 rounded-full transition-all">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Registros <span className="text-zinc-900 font-black">1-20</span> de <span className="text-zinc-900 font-black">1,248</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-black">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-bold hover:bg-zinc-50 transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-bold hover:bg-zinc-50 transition-colors">3</button>
              <span className="px-1 text-zinc-400 text-xs font-bold">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-bold hover:bg-zinc-50 transition-colors">62</button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-5 group hover:border-green-200 transition-colors">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Entradas del Mes</div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">12.450 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Kilos</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-5 group hover:border-red-200 transition-colors">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Salidas del Mes</div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">8.920 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Kilos</span></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-5 group hover:border-blue-200 transition-colors">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>swap_horiz</span>
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Transferencias</div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">4.115 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Operac.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialProductos;





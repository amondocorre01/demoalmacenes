import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const DesperdicioInsumos: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('2026-04-10'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs('2026-04-10'));

  const records = [
    { warehouse: 'CHEESECAKE', date: '2026-04-10', product: 'GALLETA DE VAINILLA PARA BASES-RI', qty: '5,850.00', unit: 'Gramo', expiry: '2024-12-05', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
    { warehouse: 'CHEESECAKE', date: '2026-04-10', product: 'GALLETA DE VAINILLA PARA BASES-RI', qty: '9,500.00', unit: 'Gramo', expiry: '2024-12-05', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
    { warehouse: 'CHEESECAKE', date: '2026-04-10', product: 'WAFFLES-RI', qty: '13.00', unit: 'Unidad', expiry: '2025-12-07', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
    { warehouse: 'BIZCOCHOS', date: '2026-04-10', product: 'ACEITE', qty: '1,799.00', unit: 'Mililitro', expiry: '2026-01-17', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
    { warehouse: 'BIZCOCHOS', date: '2026-04-10', product: 'PLATO BEX DE 18 CM', qty: '100.00', unit: 'Unidad', expiry: '2025-11-09', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
    { warehouse: 'CHEESECAKE', date: '2026-04-10', product: 'AZUCAR', qty: '2,275.00', unit: 'Gramo', expiry: '2025-05-21', user: 'HELEN V SIÃ‘ANI VERA', initial: 'H' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-black text-stone-900 tracking-tight uppercase">Desperdicio de insumos vencidos</p>
            <p className="text-stone-500 mt-1">Análisis detallado de pérdidas por expiración en almacén central y sucursales.</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-lg">add</span>
              Nuevo Desperdicio
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-black text-stone-500">Almacenes</label>
              <div className="flex flex-wrap gap-1 p-2 border border-stone-200 rounded-lg bg-stone-50 cursor-pointer min-h-[42px] items-center">
                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">CHEESECAKE <span className="material-symbols-outlined text-[14px]">close</span></span>
                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">BIZCOCHOS <span className="material-symbols-outlined text-[14px]">close</span></span>
                <span className="text-stone-400 text-xs ml-auto material-symbols-outlined">expand_more</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-black text-stone-500">Fecha Inicio</label>
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fafaf9',
                        borderRadius: '0.5rem',
                        '& fieldset': { border: '1px solid #e7e5e4' },
                      },
                      '& .MuiInputBase-input': {
                        padding: '10px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-black text-stone-500">Fecha Fin</label>
              <DatePicker
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fafaf9',
                        borderRadius: '0.5rem',
                        '& fieldset': { border: '1px solid #e7e5e4' },
                      },
                      '& .MuiInputBase-input': {
                        padding: '10px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {records.map((record, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col hover:border-red-200 transition-colors">
                  <div className="bg-stone-50/80 p-4 border-b border-stone-100 flex justify-between items-center">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${record.warehouse === 'CHEESECAKE' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'}`}>
                      {record.warehouse}
                    </span>
                    <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Reg: {record.date}</div>
                  </div>
                  <div className="p-5 flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-1">Producto</p>
                      <p className="text-sm font-bold text-stone-900 line-clamp-1">{record.product}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-1">Cantidad</p>
                        <p className="text-sm font-bold text-stone-900">{record.qty} <span className="text-[10px] text-stone-500 uppercase">{record.unit}</span></p>
                        <div>
                          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-1">Vencimiento</p>
                          <p className="text-sm font-black text-primary">{record.expiry}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">{record.initial}</div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-stone-600 uppercase truncate">{record.user}</p>
                          <p className="text-[9px] text-stone-400 font-medium uppercase">Usuario Responsable</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Mostrando {records.length} de 32 registros</p>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-400">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black">1</button>
                <button className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-400 font-black text-xs">2</button>
                <button className="w-8 h-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-400">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <p className="font-bold text-stone-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Almacenes con Mayor Pérdida (Registros)
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-stone-700">CHEESECAKE</span>
                  <span className="text-primary">5 Registros</span>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '71%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-stone-700">BIZCOCHOS</span>
                    <span className="text-primary">2 Registros</span>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-400 h-full rounded-full" style={{ width: '29%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesperdicioInsumos;





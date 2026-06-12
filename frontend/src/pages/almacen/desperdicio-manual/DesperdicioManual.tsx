import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const DesperdicioManual: React.FC = () => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs('2023-10-24'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs('2023-10-24'));

  const records = [
    { warehouse: 'BIZCOCHOS', product: 'ACEITE', description: 'ACEITE 4.5 LTRS', qty: '4500.00', unit: 'Mililitro', expiry: '2025-05-13', observation: 'Desperdicio por mal estado del producto.', user: 'ADOLFO MONDOCORRE', initial: 'AM', userColor: 'bg-zinc-100 text-zinc-600' },
    { warehouse: 'PANINIS', product: 'PEPINILLOS', description: 'PEPINILLOS AL VINAGRE 820 GR', qty: '820.00', unit: 'Gramo', expiry: '2025-11-09', observation: 'en mal estado', user: 'HELEN V SIÃ‘ANI', initial: 'HV', userColor: 'bg-red-100 text-red-600' },
    { warehouse: 'BIZCOCHOS', product: 'LECHE EVAPORADA', description: 'LECHE EVAP.ENRIQ.CON VIT. A-D 400ML LATA', qty: '400.00', unit: 'Mililitro', expiry: '2026-11-12', observation: 'en mal estado', user: 'HELEN V SIÃ‘ANI', initial: 'HV', userColor: 'bg-red-100 text-red-600' },
    { warehouse: 'FRUTAS', product: 'BOLSA DE BASURA GRANDE', description: 'OLA BOLSA 75L 78X95', qty: '10.00', unit: 'Unidad', expiry: '2026-11-02', observation: 'vino mal de fabrica', user: 'HELEN V SIÃ‘ANI', initial: 'HV', userColor: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex justify-between items-end">
          <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Registro de Desperdicio Manual</p>
          <p className="text-zinc-500 mt-1">Control detallado de mermas por daño o manipulación no programada.</p>
          <button className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-red-500/10 uppercase">
            <span className="material-symbols-outlined">add_circle</span>
            NUEVO REGISTRO
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

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
          {records.map((record, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Almacén</p>
                <p className="text-sm font-bold text-zinc-900">{record.warehouse}</p>
                <span className="bg-red-50 text-red-700 text-[9px] font-black px-2 py-1 rounded-full border border-red-100 uppercase">Desperdicio Manual</span>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Producto</p>
                  <p className="text-sm font-bold text-zinc-900">{record.product}</p>
                  <p className="text-[11px] text-zinc-500">{record.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cant. Desperdiciada</p>
                    <p className="text-sm font-black text-primary">{record.qty} <span className="text-[10px] text-zinc-500 font-normal">{record.unit}</span></p>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vencimiento</p>
                      <p className="text-sm font-medium text-zinc-700">{record.expiry}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descripción</p>
                      <p className="text-xs text-zinc-600 line-clamp-2">{record.observation}</p>
                    </div>
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${record.userColor}`}>{record.initial}</div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase truncate max-w-[120px]">{record.user}</span>
                      </div>
                      <button className="text-zinc-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">visibility</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mostrando {records.length} de 128 registros</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-zinc-400"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black">1</button>
            <button className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-zinc-400 font-black text-xs">2</button>
            <button className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-colors text-zinc-400"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesperdicioManual;





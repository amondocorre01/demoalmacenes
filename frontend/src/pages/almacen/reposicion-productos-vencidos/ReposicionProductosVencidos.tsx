import React from 'react';


const ReposicionProductosVencidos: React.FC = () => {
  const data = [
    { warehouse: 'GALLETAS', regDate: '2026-04-09 13:59:59', expiryDate: '2026-05-06', product: 'GALLETA DE CHISPAS DE CHOCOLATE-RI', qty: '1.00', unit: 'Unidad', price: '2.16', total: '2.16', user: 'Pepito Gonzales', isCritical: true },
    { warehouse: 'GALLETAS', regDate: '2026-04-09 13:59:59', expiryDate: '2027-03-01', product: 'POLVO DE HORNEAR', qty: '83.00', unit: 'Gramo', price: '2.57', total: '2.57', user: 'Sin asignar', isCritical: false },
    { warehouse: 'GALLETAS', regDate: '2026-04-09 13:59:59', expiryDate: '2026-05-05', product: 'BROWNIE-RI', qty: '1.00', unit: 'Unidad', price: '3.7', total: '3.7', user: 'Sin asignar', isCritical: true },
    { warehouse: 'GALLETAS', regDate: '2026-04-09 13:59:59', expiryDate: '2026-09-07', product: 'SAL', qty: '10.00', unit: 'Gramo', price: '0.03', total: '0.03', user: 'Sin asignar', isCritical: false },
    { warehouse: 'BIZCOCHOS', regDate: '2026-04-09 14:30:39', expiryDate: '2027-03-21', product: 'AZUCAR', qty: '2010.00', unit: 'Gramo', price: '12.07', total: '12.07', user: 'Sin asignar', isCritical: false },
    { warehouse: 'BIZCOCHOS', regDate: '2026-04-09 14:30:39', expiryDate: '2027-01-21', product: 'PAPEL TOALLA', qty: '1.00', unit: 'Unidad', price: '29.1', total: '29.1', user: 'Sin asignar', isCritical: false },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Almacén</label>
          <div className="relative">
            <select className="appearance-none w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
              <option>Todos los almacenes</option>
              <option>Almacén Central Sur</option>
              <option>Almacén Refrigerados</option>
              <option>Sede Las Mercedes</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-zinc-400 pointer-events-none text-lg">expand_more</span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Año</label>
          <div className="relative">
            <select className="appearance-none w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
              <option>2026</option>
              <option>2023</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-zinc-400 pointer-events-none text-lg">expand_more</span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Mes</label>
          <div className="relative">
            <select className="appearance-none w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
              <option>Abril</option>
              <option>Octubre</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-zinc-400 pointer-events-none text-lg">expand_more</span>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Estado</label>
          <div className="relative">
            <select className="appearance-none w-full bg-zinc-50 border border-zinc-200 text-xs font-semibold rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
              <option>Todos los estados</option>
              <option>Crítica</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2 text-zinc-400 pointer-events-none text-lg">expand_more</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <p className="font-black text-zinc-900 uppercase text-sm tracking-tight">PRODUCTOS PARA REPOSICION</p>
          <div className="flex gap-2">
            <button className="text-[10px] font-bold px-3 py-1 bg-primary text-white rounded-full shadow-sm uppercase tracking-widest">Todos</button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Almacen</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Fecha registro</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Fecha vencimiento</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Producto</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-center">Cantidad</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Medida</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-right">Precio consumo interno</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-right">Total asumido</td>
                <td className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Usuario reponsable</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-zinc-700">{item.warehouse}</td>
                  <td className="px-6 py-4 text-zinc-500 font-mono">{item.regDate}</td>
                  <td className={`px-6 py-4 font-bold ${item.isCritical ? 'text-primary' : 'text-zinc-600'}`}>{item.expiryDate}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{item.product}</td>
                  <td className="px-6 py-4 font-bold text-center">{item.qty}</td>
                  <td className="px-6 py-4 uppercase tracking-widest font-medium text-zinc-500">{item.unit}</td>
                  <td className="px-6 py-4 font-bold text-right text-zinc-700">{item.price}</td>
                  <td className="px-6 py-4 font-bold text-right text-zinc-700">{item.total}</td>
                  <td className={`px-6 py-4 ${item.user === 'Sin asignar' ? 'italic text-zinc-300' : 'font-medium text-zinc-900'}`}>
                    {item.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50/30">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Mostrando {data.length} de 6 registros</p>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:bg-zinc-100 transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary text-white text-xs font-bold transition-all active:scale-95">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:bg-zinc-100 transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReposicionProductosVencidos;





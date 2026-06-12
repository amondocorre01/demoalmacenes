import React from 'react';


const ConfigDeclaracion: React.FC = () => {
  const data = [
    { group: 'AZUCAR MORENA EN SACHETS', product: 'AZUCAR MORENA DE 6 GR PERSONALIDADO CAPRESSO # 4630938491151', unit: 'MILILITRO' },
    { group: 'BICARBONATO', product: 'Bicarbonato de Sodio', unit: 'GRAMO' },
    { group: 'BOLSA 12X20', product: 'BOLSA DE GALLETA 12X20(BULTO)', unit: 'UNIDAD' },
    { group: 'BOLSA 12X20', product: 'BOLSA DE GALLETA 12X20(UNIDAD)', unit: 'UNIDAD' },
    { group: 'BOLSA 6X15', product: '6X15 SPP - 6X15 N', unit: 'UNIDAD' },
    { group: 'BOLSA 6X15', product: 'JABAS 6X15 PPN', unit: 'UNIDAD' },
    { group: 'BOLSA DE BASURA GRANDE', product: 'OLA BOLSA 75L 78X95', unit: 'UNIDAD' },
    { group: 'BOLSA DE BASURA GRANDE', product: 'SUPERIOR BOLSA BASURA 75 X 95 CM (75lt) x 10 unid', unit: 'UNIDAD' },
    { group: 'BOLSA DE BASURA GRANDE', product: 'SUPERIOR BOLSA DE BASURA 75X95CM (75LT)', unit: 'UNIDAD' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-8">
        <p className="text-3xl font-extrabold text-zinc-900 tracking-tight uppercase">Configuración Declaración</p>
        <p className="text-zinc-500 mt-1">Gestione las unidades de medida para la declaración de productos por grupo.</p>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Grupo</td>
                <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Producto</td>
                <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-64">Unidad Declaración</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 uppercase">{item.group}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 uppercase">{item.product}</td>
                  <td className="px-6 py-4">
                    <select
                      className="w-full bg-zinc-50 border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary py-2 px-3 font-medium outline-none transition-all"
                      defaultValue={item.unit}
                    >
                      <option>MILILITRO</option>
                      <option>GRAMO</option>
                      <option>UNIDAD</option>
                      <option>KILOGRAMO</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            Mostrando <span className="text-zinc-900">{data.length}</span> de <span className="text-zinc-900">{data.length}</span> productos</p>
          <div className="flex gap-2">
            <button className="p-2 border border-zinc-200 rounded bg-white text-zinc-400 hover:text-zinc-700 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 border border-primary bg-primary text-white text-[10px] font-bold rounded">1</button>
            <button className="p-2 border border-zinc-200 rounded bg-white text-zinc-400 hover:text-zinc-700 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigDeclaracion;

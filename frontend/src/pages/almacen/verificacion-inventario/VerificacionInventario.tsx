import React from 'react';


const VerificacionInventario: React.FC = () => {
  const data = [
    { product: 'CHOCOLATE PUMP-RI', facturado: 'CHOCOLATE PUMP-RI', stock: 0, unit: 'Unidad', note: '-', declQty: 0.00, declUnit: 'Unidad', observation: '-' },
    { product: 'CILANTRO', facturado: 'CILANTRO', stock: 0, unit: 'AMARRO', note: '-', declQty: 0.00, declUnit: 'Gramo', observation: '-' },
    { product: 'CINTA DE EMBALAJE', facturado: 'CINTA DE EMBALAJE', stock: 0, unit: 'Unidad', note: 'DOCENA', declQty: 0.00, declUnit: 'Unidad', observation: '-' },
    { product: 'CINTA DE PAPEL NAVIDAD', facturado: 'CINTA DE PAPEL DORADA', stock: 1940.00, unit: 'Rollo', note: 'VIENE EN CM', declQty: 0.00, declUnit: '-', observation: '-' },
    { product: 'CINTA DORADA COPOS NAVIDAD', facturado: 'CINTA DORADA COPOS', stock: 1369.00, unit: 'Rollo', note: 'VIENE EN CM', declQty: 0.00, declUnit: '-', observation: '-' },
    { product: 'CLAVO DE OLOR EN POLVO', facturado: 'CLAVO DE OLOR EN POLVO', stock: 3660.00, unit: 'Unidad', note: 'GR', declQty: 0.00, declUnit: 'Gramo', observation: '-' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col mb-8 gap-4">
        <div>
          <p className="text-3xl font-black tracking-tight text-zinc-900 uppercase">Verificación de Inventario</p>
        </div>

        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Fecha</label>
            <select className="bg-white border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[200px]">
              <option>24 May 2024</option>
              <option>23 May 2024</option>
              <option>22 May 2024</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Almacén</label>
            <select className="bg-white border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-w-[200px]">
              <option>Principal - CDMX</option>
              <option>Materia Prima</option>
              <option>Productos Terminados</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden mb-8">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full table-auto">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">PRODUCTO</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">PRODUCTO FACTURADO</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">STOCK</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">UNIDAD MEDIDA</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">MEDIDA NOTA</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">CANTIDAD DECLARADA</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">UNIDAD DECLARACIÓN</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">OBSERVACIÓN INVENTARIO</td>
                <td className="px-3 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">CANT. VERIFICADA</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-[11px] font-medium text-zinc-600">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap">{item.product}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{item.facturado}</td>
                  <td className="px-3 py-3 font-bold text-zinc-900 text-right">{item.stock.toFixed(2)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{item.unit}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{item.note}</td>
                  <td className="px-3 py-3 text-right">{item.declQty.toFixed(2)}</td>
                  <td className="px-3 py-3 text-center">{item.declUnit}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{item.observation}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <input
                      className="w-24 bg-white border border-zinc-200 rounded-lg py-1 px-2 text-[11px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-right"
                      placeholder="0.00"
                      type="number"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerificacionInventario;




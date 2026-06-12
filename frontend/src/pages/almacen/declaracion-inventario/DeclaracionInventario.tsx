import React from 'react';


const DeclaracionInventario: React.FC = () => {
  const data = [
    { product: 'BOLSA DE BASURA GRANDE', facturado: 'OLA BOLSA 75L 78X95', stock: 0.00, unit: 'Paquete', note: '', declUnit: 'Unidad', value: 0 },
    { product: 'BOLSA DE BASURA GRANDE', facturado: 'SUPERIOR BOLSA DE BASURA 75X95CM (75LT)', stock: 110.00, unit: 'Paquete', note: 'BOLSA DE BASURA NEGRA GRANDE POR PQT', declUnit: 'Unidad', value: 110 },
    { product: 'BOLSAS BLANCAS 35X65 B. BL', facturado: 'JABAS 35X65 B. BL', stock: 2.00, unit: 'Paquete', note: '', declUnit: 'Paquete', value: 2 },
    { product: 'BOLSAS BLANCAS 35X65 B. BL', facturado: '35X65 BB - 35X65 B BLANCO', stock: 17.00, unit: 'Paquete', note: '', declUnit: 'Paquete', value: 17 },
    { product: 'BOM BRIL', facturado: 'BOM BRIL LANA ACERO 14X80', stock: 0.00, unit: 'Unidad', note: 'BOM BRIL', declUnit: 'Unidad', value: 0 },
    { product: 'CANELA EN POLVO', facturado: 'CANELA MOLIDA X1 KG # 3964894047805', stock: 3094.00, unit: 'Kilogramo', note: '', declUnit: 'Gramo', value: 3094 },
    { product: 'CREMA DE LECHE', facturado: 'CREMA DE LECHE UHT X 1 L.', stock: 1300.00, unit: 'Unidad', note: '', declUnit: 'Mililitro', value: 1300 },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <p className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Nueva Declaración de Inventario</p>
        <p className="text-zinc-500 mt-1">Ingrese los conteos manuales para el cierre de inventario oficial.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Almacén de Origen</label>
          <div className="relative">
            <select className="w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-900 focus:ring-primary focus:border-primary py-3 px-4 appearance-none">
              <option selected>PANADERIA</option>
              <option>Almacén Central (Quito)</option>
              <option>Centro de Distribución Guayaquil</option>
              <option>Bodega Materia Prima Sur</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">warehouse</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">ULTIMA BUSQUEDA</label>
          <div className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">schedule</span>
            <span>24 Mayo, 2024 - 10:30 AM</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Producto</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Producto Facturado</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center">Stock</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Unidad Medida</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Medida Nota</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Unidad Declaración</td>
                <td className="px-4 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center">Cantidad Declarada</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-zinc-900">{item.product}</td>
                  <td className="px-4 py-4 text-zinc-600">{item.facturado}</td>
                  <td className="px-4 py-4 text-center font-bold text-zinc-900">{item.stock.toFixed(2)}</td>
                  <td className="px-4 py-4 text-zinc-600 uppercase text-[11px] font-medium">{item.unit}</td>
                  <td className="px-4 py-4 text-zinc-400 italic text-[10px]">{item.note}</td>
                  <td className="px-4 py-4"><span className="text-zinc-600 uppercase text-[11px] font-medium">{item.declUnit}</span></td>
                  <td className="px-4 py-4">
                    <input className="w-24 mx-auto block bg-zinc-50 border border-zinc-300 rounded text-center font-bold focus:ring-primary focus:border-primary py-1.5" type="number" defaultValue={item.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mb-12">
        <button className="px-8 py-4 bg-zinc-200 text-zinc-700 font-bold rounded-lg hover:bg-zinc-300 transition-all uppercase tracking-widest text-xs">
          Guardar Borrador
        </button>
        <button className="px-8 py-4 bg-primary text-white font-black rounded-lg hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-widest text-xs shadow-lg shadow-red-600/20 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Finalizar Declaración
        </button>
      </div>
    </div>
  );
};

export default DeclaracionInventario;
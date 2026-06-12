import React from 'react';


const PreRegistroProductos: React.FC = () => {
  const products = [
    { warehouse: 'SUPERVISIÓN', product: 'Açaí', stock: 1, order: '1.00', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Brownie sin Helado', stock: 6, order: '5', produced: 3, status: 'EN CURSO', statusColor: 'bg-blue-100 text-blue-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Canela líquida', stock: 8, order: '2', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Cheesecake', stock: 1, order: '1', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Copoazú', stock: 4, order: '2', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Dulce de leche', stock: 15, order: '10', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Durazno', stock: 3, order: '3', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Frutilla', stock: 2, order: '2', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Galleta de Avena', stock: 20, order: '16', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
    { warehouse: 'SUPERVISIÓN', product: 'Galleta de Chips de chocolate', stock: 47, order: '46', produced: 0, status: 'PENDIENTE', statusColor: 'bg-yellow-100 text-yellow-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-3xl font-black text-zinc-900 tracking-tight mb-2 uppercase">Pre - Registro- Productos-Insumos</p>
          <p className="text-neutral-500 max-w-2xl">Módulo de gestión de requerimientos y control de producción para insumos de planta industrial.</p>
        </div>
        <div className="w-full md:w-72">
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 ml-1">Almacén</label>
          <div className="relative group">
            <select className="w-full h-12 pl-4 pr-10 bg-white border border-neutral-200 rounded shadow-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer font-medium text-zinc-900">
              <option>SUPERVISIÓN</option>
              <option>PLANTA PROCESAMIENTO</option>
              <option>DESPACHO CENTRAL</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-hover:text-primary transition-colors">unfold_more</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-lg">list_alt</span>
              </div>
              <p className="font-black text-zinc-900 text-sm uppercase tracking-wider">PRODUCTOS SOLICITADOS</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest">Almacen</td>
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest">Producto</td>
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest text-center">Cantidad Stock en Planta</td>
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest text-center">Cantidad Pedido</td>
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest text-center">Cantidad Producida</td>
                  <td className="px-6 py-4 text-[11px] font-black text-neutral-500 uppercase tracking-widest text-right">Estado</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-neutral-600 uppercase">{p.warehouse}</td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-900">{p.product}</td>
                    <td className="px-6 py-4 text-sm text-center font-mono">{p.stock}</td>
                    <td className="px-6 py-4 text-sm text-center font-mono font-bold text-primary">{p.order}</td>
                    <td className="px-6 py-4 text-sm text-center font-mono">{p.produced}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 ${p.statusColor} text-[10px] font-bold rounded`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tighter">Mostrando {products.length} de 10 productos solicitados</span>
            <div className="flex items-center space-x-1">
              <button className="p-1 text-neutral-400 hover:text-primary disabled:opacity-30" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="w-8 h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded">1</span>
              <button className="p-1 text-neutral-400 hover:text-primary">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Órdenes Activas</p>
              <p className="text-2xl font-black text-zinc-900">24</p>
              <p className="text-xs text-primary font-bold mt-1">+12% vs ayer</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-neutral-100 text-neutral-600 rounded">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Insumos Requeridos</p>
              <p className="text-2xl font-black text-zinc-900">112.5 kg</p>
              <p className="text-xs text-neutral-500 mt-1">Estimado total del lote</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-neutral-900 text-white rounded">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Eficiencia Planta</p>
              <p className="text-2xl font-black text-zinc-900">94.2%</p>
              <p className="text-xs text-green-600 font-bold mt-1">Rendimiento Óptimo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreRegistroProductos;





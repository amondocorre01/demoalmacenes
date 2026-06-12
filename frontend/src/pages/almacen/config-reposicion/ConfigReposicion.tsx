import React, { useState } from 'react';

interface Cargo {
  name: string;
  active: boolean;
}

interface Category {
  id: number;
  title: string;
  count: string;
  icon: string;
  color: string;
  cargos?: Cargo[];
}

const ConfigReposicion: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      title: 'Reposiciones de Sucursales',
      count: '23 Cargos Asignados',
      icon: 'store',
      color: 'bg-orange-100 text-orange-600',
      cargos: [
        { name: 'Administrador de Sucursal', active: true },
        { name: 'Vendedor de Sucursal', active: false },
      ]
    },
    {
      id: 2,
      title: 'Reposiciones de Planta',
      count: '23 Cargos Asignados',
      icon: 'factory',
      color: 'bg-orange-500 text-white',
      cargos: [
        { name: 'Analista de calidad de planta de producción', active: true },
        { name: 'Auxiliar de almacen', active: false },
        { name: 'Auxiliar de logística', active: false },
        { name: 'Encargado de producción', active: false },
        { name: 'Jefa de Cocina', active: true },
        { name: 'Jefe de planta de producción', active: true },
        { name: 'Jefe de producción', active: true },
        { name: 'Operario de producción', active: true },
      ],
    },
  ]);

  const [expandedId, setExpandedId] = useState<number | null>(2); // Default open Planta

  const toggleCategory = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCargo = (catId: number, cargoIndex: number) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId && cat.cargos) {
        const newCargos = [...cat.cargos];
        newCargos[cargoIndex] = { ...newCargos[cargoIndex], active: !newCargos[cargoIndex].active };
        return { ...cat, cargos: newCargos };
      }
      return cat;
    }));
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 pb-20">
      <div className="mb-12">
        <p className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none mb-2">Configuración de Reposición</p>
        <p className="text-zinc-500 font-medium">Gestione los permisos y cargos autorizados para los procesos de reposición de inventario.</p>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden transition-all duration-300">
            {/* Header / Trigger */}
            <div 
              onClick={() => toggleCategory(cat.id)}
              className={`p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors ${expandedId === cat.id ? 'bg-zinc-50/50' : ''}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color} shadow-sm`}>
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <div>
                  <p className="text-xl font-black text-zinc-900 uppercase tracking-tight">{cat.title}</p>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">{cat.count}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 mr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm group-focus-within:text-primary transition-colors">search</span>
                        <input
                            className="pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-black w-48 focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase tracking-widest placeholder:text-zinc-300"
                            placeholder="Buscar..."
                            type="text"
                        />
                    </div>
                    <button className="bg-zinc-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg active:scale-95">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Añadir
                    </button>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedId === cat.id ? 'rotate-180 bg-zinc-100 text-zinc-900' : 'text-zinc-400'}`}>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            {/* Collapse Content */}
            <div className={`grid transition-all duration-500 ease-in-out ${expandedId === cat.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="p-8 pt-0 border-t border-zinc-100">
                  <div className="flex items-center gap-2 mb-6 text-primary font-black text-[10px] tracking-[0.2em] uppercase pt-6">
                    <span className="material-symbols-outlined text-sm">filter_list</span>
                    Cargos Autorizados
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cat.cargos?.map((cargo, cIdx) => (
                      <div
                        key={cIdx}
                        className={`group border rounded-2xl p-5 flex items-center justify-between transition-all duration-300 ${cargo.active ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-50/50 border-zinc-100 grayscale opacity-60'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${cargo.active ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                            <span className="material-symbols-outlined text-xl">account_circle</span>
                          </div>
                          <div className="max-w-[140px]">
                            <p className="text-[11px] font-black text-zinc-900 leading-tight uppercase tracking-tight">{cargo.name}</p>
                            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[8px] font-black rounded-md uppercase tracking-widest ${cargo.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}>
                              {cargo.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => toggleCargo(cat.id, cIdx)}
                          className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 shadow-inner ${cargo.active ? 'bg-primary' : 'bg-zinc-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${cargo.active ? 'translate-x-5' : ''}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigReposicion;

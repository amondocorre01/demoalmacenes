import React, { useState } from 'react';
import ModalRegistroGrupoProducto from './components/ModalRegistroGrupoProducto';


interface GrupoProducto {
  id: number;
  nombre: string;
  tipo: string;
  unidad: string;
  estado: 'Activo' | 'Inactivo';
}

const RegistroGrupoProducto: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grupos] = useState<GrupoProducto[]>([
    { id: 1, nombre: 'Aceite', tipo: 'INSUMOS', unidad: 'Litros (L)', estado: 'Activo' },
    { id: 2, nombre: 'Harina', tipo: 'INSUMOS', unidad: 'Kilogramos (kg)', estado: 'Activo' },
    { id: 3, nombre: 'Vasos', tipo: 'INSUMOS', unidad: 'Unidades (u)', estado: 'Inactivo' },
    { id: 4, nombre: 'Azúcar', tipo: 'INSUMOS', unidad: 'Kilogramos (kg)', estado: 'Activo' },
  ]);

  return (
    <div className="p-1 max-w-1xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-1">
        <div>
          <p className="text-4xl font-black tracking-tighter text-zinc-900 uppercase leading-none">Registro de Grupo del Producto</p>
          <div className="mt-0">
            <p className="text-zinc-500 max-w-2xl font-medium">
              Administre y supervise las agrupaciones técnicas de sus componentes de producción para optimizar el control de existencias.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-zinc-900 hover:bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Registrar Nuevo Grupo
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Grupos Existentes</p>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-zinc-400 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-zinc-400 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl">download</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <td className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nombre del Grupo</td>
                <td className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tipo</td>
                <td className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Unidad</td>
                <td className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estado</td>
                <td className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Acciones</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {grupos.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-zinc-900 uppercase tracking-tight">{grupo.nombre}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="px-3 py-1 rounded-full bg-zinc-100 text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200">
                      {grupo.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">{grupo.unidad}</td>
                  <td className="px-6 py-6">
                    <span className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${grupo.estado === 'Activo' ? 'text-green-600' : 'text-primary'}`}>
                      <span className={`w-2 h-2 rounded-full ${grupo.estado === 'Activo' ? 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(157,0,19,0.4)]'}`}></span>
                      {grupo.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-300 hover:text-primary hover:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-zinc-50/30 text-center">
          <button className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-primary transition-colors">
            Ver todos los grupos registrados
          </button>
        </div>
      </div>

      {/* Registration Modal */}
      <ModalRegistroGrupoProducto 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          console.log('Saved:', data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default RegistroGrupoProducto;

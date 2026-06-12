import React, { useState } from 'react';


interface TreeItemProps {
  label: string;
  qty: string;
  unit: string;
  isOpen?: boolean;
  children?: React.ReactNode;
  isRoot?: boolean;
}

const TreeItem: React.FC<TreeItemProps> = ({ label, qty, unit, isOpen: initialOpen = false, children, isRoot = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <div
        className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors cursor-pointer ${isRoot ? 'bg-white hover:bg-zinc-50' : 'hover:bg-zinc-100/50'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="col-span-7 flex items-center gap-3">
          {children ? (
            <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${isRoot ? 'text-primary font-bold' : 'text-zinc-400'}`}>
              chevron_right
            </span>
          ) : <span className="w-6"></span>}
          <span className={`${isRoot ? 'font-bold text-zinc-900' : 'text-sm font-medium text-zinc-700'} uppercase`}>{label}</span>
        </div>
        <div className={`col-span-2 text-right font-mono ${isRoot ? 'font-semibold' : 'text-sm text-zinc-600'}`}>{qty}</div>
        <div className={`col-span-2 ${isRoot ? 'text-sm text-zinc-500' : 'text-xs text-zinc-400'} uppercase font-bold tracking-tighter`}>{unit}</div>
        <div className="col-span-1 flex justify-end">
          {isRoot && <span className="material-symbols-outlined text-zinc-400">more_vert</span>}
        </div>
      </div>
      {isOpen && children && (
        <div className="bg-zinc-50/50 pl-10 relative divide-y divide-zinc-200/30">
          <div className="absolute left-[1.15rem] top-0 bottom-0 w-0.5 bg-primary/20"></div>
          {children}
        </div>
      )}
    </div>
  );
};

const ListaGeneralRecetas: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <p className="text-2xl font-bold text-zinc-900 tracking-tight uppercase">Lista General de Recetas Almacenes</p>
        <p className="text-zinc-500 text-sm mt-1">Gestión jerárquica de insumos y productos finales</p>
      </div>

      <div className="bg-white p-6 border border-zinc-200 mb-8 shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Almacén</label>
            <select className="w-full h-11 px-4 border border-zinc-200 focus:ring-primary focus:border-primary rounded-lg bg-zinc-50 text-sm font-medium">
              <option>SELECCIONAR ALMACÉN</option>
              <option>TORTAS</option>
              <option>REPOSTERÍA</option>
              <option>PANADERÍA</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Producto Final</label>
            <select className="w-full h-11 px-4 border border-zinc-200 focus:ring-primary focus:border-primary rounded-lg bg-zinc-50 text-sm font-medium">
              <option>TODOS LOS PRODUCTOS</option>
              <option>Torta de Chocolate</option>
              <option>Cheesecake Frutos Rojos</option>
            </select>
          </div>
          <button className="h-11 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-red-200 uppercase text-xs">
            <span className="material-symbols-outlined text-sm">search</span>
            BUSCAR
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 overflow-hidden rounded-xl shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <div className="col-span-7">Descripción del Insumo / Producto</div>
          <div className="col-span-2 text-right">Cantidad</div>
          <div className="col-span-2">Unidad</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-zinc-100">
          <TreeItem label="TORTA DE CHOCOLATE - MASTER" qty="1.000" unit="UNIDAD" isRoot isOpen>
            <TreeItem label="BIZCOCHO RELLENO CHOCOLATE-RI" qty="0.450" unit="KILO" />
            <TreeItem label="GANACHE DE COBERTURA ESPECIAL" qty="0.200" unit="KILO" isOpen>
              <TreeItem label="Chocolate Bitter 60%" qty="0.120" unit="KILO" />
              <TreeItem label="Crema de Leche Industrial" qty="0.080" unit="LITRO" />
            </TreeItem>
            <TreeItem label="DECORACIÓN CEREZAS MARRASQUINO" qty="6.000" unit="UNIDAD" />
          </TreeItem>

          <TreeItem label="CHEESECAKE FRUTOS ROJOS" qty="1.000" unit="UNIDAD" isRoot>
            <TreeItem label="BASE DE GALLETA" qty="0.150" unit="KILO" />
          </TreeItem>

          <TreeItem label="TORTA TRES LECHES" qty="1.000" unit="UNIDAD" isRoot />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Total Recetas</div>
            <div className="text-xl font-black text-zinc-900">124</div>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-400" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Almacenes</div>
            <div className="text-xl font-black text-zinc-900">08</div>
          </div>
        </div>
        <div className="md:col-span-2 bg-zinc-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Última Actualización</div>
            <div className="text-lg font-medium">Hoy, 10:45 AM</div>
          </div>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-widest">
            SINCRONIZAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListaGeneralRecetas;





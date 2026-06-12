import React, { useState } from 'react';
import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import logo from '../img/logo.png';

interface FlatMenuItem {
  id: number;
  nombre: string;
  ruta: string;
  icono: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}

const menuItems: FlatMenuItem[] = [
  // ALMACÉN: CONFIGURACIÓN
  { id: 311, nombre: 'Crear almacén', ruta: '/almacen/crear', icono: 'add_home' },
  { id: 312, nombre: 'Crear receta almacén', ruta: '/almacen/crear-receta', icono: 'receipt_long' },
  { id: 313, nombre: 'Asignar Producto Almacén', ruta: '/almacen/asignar-producto', icono: 'assignment_ind' },
  { id: 314, nombre: 'Recetas Intermedias', ruta: '/almacen/recetas-intermedias', icono: 'cookie' },
  { id: 315, nombre: 'Lista General de Recetas', ruta: '/almacen/lista-recetas', icono: 'menu_book' },
  { id: 316, nombre: 'Productos intermedios', ruta: '/almacen/productos-intermedios', icono: 'inventory_2' },

  // ALMACÉN: OPERACIONES
  { id: 321, nombre: 'Pedidos consolidados almacén', ruta: '/almacen/pedidos-consolidados-almacen', icono: 'inventory' },
  { id: 322, nombre: 'Solicitud Almacén', ruta: '/almacen/solicitud', icono: 'description' },
  { id: 323, nombre: 'Transferencia almacén', ruta: '/almacen/transferencia', icono: 'swap_horiz' },
  { id: 324, nombre: 'Transferencia Almacén Insumos', ruta: '/almacen/transferencia-insumos', icono: 'move_item' },
  { id: 325, nombre: 'Devolución Almacén', ruta: '/almacen/devolucion', icono: 'assignment_return' },
  { id: 326, nombre: 'Registrar producción', ruta: '/almacen/registro-produccion', icono: 'precision_manufacturing' },

  // ALMACÉN: CONTROL E INVENTARIO
  { id: 331, nombre: 'Inventario almacén', ruta: '/almacen/inventario', icono: 'warehouse' },
  { id: 332, nombre: 'Productos producidos', ruta: '/almacen/productos-producidos', icono: 'fact_check' },
  { id: 333, nombre: 'Historial prod. en almacén', ruta: '/almacen/historial', icono: 'history' },
  { id: 334, nombre: 'Declaración de Inventario', ruta: '/almacen/declaracion', icono: 'rate_review' },
  { id: 335, nombre: 'Verificación inventario almacén', ruta: '/almacen/verificacion', icono: 'fact_check' },
  { id: 336, nombre: 'Insertar insumos almacén', ruta: '/almacen/insertar-insumos', icono: 'input' },
  { id: 337, nombre: 'Retirar insumos almacén', ruta: '/almacen/retirar-insumos', icono: 'output' },

  // AUDITORÍA
  { id: 405, nombre: 'Configuración reposición', ruta: '/almacen/config-reposicion-area', icono: 'settings' },
  { id: 407, nombre: 'Reposición vencidos (Almacén)', ruta: '/auditoria/reposicion-vencidos-almacen', icono: 'hourglass_empty' },
  { id: 412, nombre: 'Desperdicio insumos vencidos', ruta: '/auditoria/desperdicio-vencidos-almacen', icono: 'delete' },
  { id: 413, nombre: 'Desperdicio manual almacén', ruta: '/auditoria/desperdicio-manual-almacen', icono: 'delete_forever' },

  // COMPRAS
  { id: 505, nombre: 'Lista precios insumos', ruta: '/compras/lista-precios', icono: 'sell' },

  // CONFIGURACIÓN
  { id: 601, nombre: 'Registro de Producto', ruta: '/config/registro-producto', icono: 'add_box' },
  { id: 610, nombre: 'Guía Registro de Producto', ruta: '/config/guia-registro', icono: 'chrome_reader_mode' },
  { id: 602, nombre: 'Pre-Registro Insumos', ruta: '/config/pre-registro', icono: 'app_registration' },
  { id: 603, nombre: 'Registro Grupo Producto', ruta: '/config/registro-grupo', icono: 'category' }
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onCloseMobile }) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const location = useLocation();

  const handleLogoClick = () => {
    onCloseMobile();
  };

  const handleLinkClick = () => {
    onCloseMobile();
  };

  const renderMenuItems = () => {
    return menuItems.map((item) => {
      return (
        <NavLink
          key={item.id}
          to={item.ruta}
          onClick={handleLinkClick}
          onMouseEnter={() => isCollapsed && setHoveredItem(item.id)}
          onMouseLeave={() => isCollapsed && setHoveredItem(null)}
          className={({ isActive: linkActive }) => `relative flex items-center rounded-xl transition-all duration-300 font-headline mb-1 group cursor-pointer ${
            isCollapsed 
              ? 'justify-center w-12 h-12 mx-auto' 
              : 'w-full px-3 py-3'
          } ${
            linkActive
              ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
        >
          {({ isActive: linkActive }) => (
            <>
              {linkActive && !isCollapsed && (
                <span className="absolute left-0 top-1 bottom-1 w-1.5 bg-white rounded-r-full shadow-lg" />
              )}
              <div className="flex items-center space-x-3">
                <span className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-110 ${
                  linkActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-primary'
                }`}>
                  {item.icono}
                </span>
                {!isCollapsed && (
                  <span className={`tracking-widest uppercase font-bold text-left leading-tight text-[10px] ${
                    linkActive ? 'text-white font-black' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-primary'
                  }`}>
                    {item.nombre}
                  </span>
                )}
              </div>

              {isCollapsed && hoveredItem === item.id && (
                <div className="fixed left-20 top-auto bg-zinc-950 text-white dark:bg-zinc-900 text-[10px] tracking-widest font-bold uppercase px-3 py-2 rounded-lg shadow-2xl border border-zinc-800 dark:border-zinc-700 z-[100] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200 font-headline whitespace-nowrap">
                  {item.nombre}
                </div>
              )}
            </>
          )}
        </NavLink>
      );
    });
  };

  return (
    <div className={`h-full flex flex-col bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200/50 dark:border-zinc-800 transition-all duration-300 shadow-2xl overflow-hidden w-full`}>
      {/* Header */}
      <div className="p-1 shrink-0 border-b border-zinc-200/20">
        <div className="flex justify-center py-4 relative">
          <Link to="/dashboard" onClick={handleLogoClick}>
            <img
              alt="Capresso Logo"
              className={`transition-all duration-300 object-contain ${isCollapsed ? 'h-8' : 'h-16'}`}
              src={logo}
            />
          </Link>
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform lg:flex hidden"
            >
              <span className="material-symbols-outlined text-xs">chevron_left</span>
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex items-center space-x-3 mb-4 bg-white/80 dark:bg-white/5 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm animate-in fade-in duration-500">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 p-0.5 shrink-0 border border-primary/20">
              <img
                alt="Helen Avatar"
                className="w-full h-full rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQj0voCHDsaBuDnhr-XqFgzkbX9rTwYrXhUKi9PKCnB8ioef-SwiCzBShIqSRT2BX8ZDx4f0bjpVWl7laaGlDHGn5au_binZh9ev8lckGLKqPWhRjMNwvwXxgbQaaOpUb_PUfu0QxJ1OSOQjRWIltD7iTxiFc2cip1Gy6EjFybK-FucezmW9aH-_kRS33C0aK2y5yHn_lnnjV0bbWZwBugGJ05tr-jkCMp-76q2b2nOROUs6ILpOpTP168dhUEsAjDx_T1zc4N5vY"
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-headline text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white truncate">Helen</p>
              <p className="text-[10px] text-primary font-bold uppercase truncate tracking-tighter font-headline">Jefe de Producción</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <div className="space-y-1">{renderMenuItems()}</div>
      </nav>

      {/* Footer */}
      <div className="p-1 shrink-0 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200/50">
        <button
          onClick={() => navigate('/help')}
          className={`w-full flex items-center space-x-3 px-1 py-1 text-zinc-500 hover:text-primary transition-all rounded-lg hover:bg-zinc-200 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          {!isCollapsed && <span className="font-headline text-[10px] tracking-widest uppercase font-semibold">Ayuda</span>}
        </button>
      </div>
    </div>
  );
};

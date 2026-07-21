import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import logo from '../img/logo.png';
import { api } from '../../config/api';
import { Popover, CircularProgress } from '@mui/material';
import { Apps } from '@mui/icons-material';
import ConsoleLogMessage from '../../config/console';

const USE_DYNAMIC_MENU = false;

interface ApiMenuItem {
  id: number;
  nombre: string;
  tipo?: string;
  icono: string;
  orden?: number;
  ruta: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}

// Menú fallback estático original del proyecto Almacén
const staticMenuItems: ApiMenuItem[] = [
  // ALMACÉN: CONFIGURACIÓN
  { id: 311, nombre: 'Crear almacén', ruta: '/almacen/crear', icono: 'add_home', orden: 1 },
  { id: 312, nombre: 'Crear receta almacén', ruta: '/almacen/crear-receta', icono: 'receipt_long', orden: 2 },
  { id: 313, nombre: 'Asignar Producto Almacén', ruta: '/almacen/asignar-producto', icono: 'assignment_ind', orden: 3 },
  { id: 314, nombre: 'Recetas Intermedias', ruta: '/almacen/recetas-intermedias', icono: 'cookie', orden: 4 },
  { id: 315, nombre: 'Lista General de Recetas', ruta: '/almacen/lista-recetas', icono: 'menu_book', orden: 5 },
  { id: 316, nombre: 'Productos intermedios', ruta: '/almacen/productos-intermedios', icono: 'inventory_2', orden: 6 },

  // ALMACÉN: OPERACIONES
  { id: 321, nombre: 'Pedidos consolidados almacén', ruta: '/almacen/pedidos-consolidados-almacen', icono: 'inventory', orden: 7 },
  { id: 322, nombre: 'Solicitud Almacén', ruta: '/almacen/solicitud', icono: 'description', orden: 8 },
  { id: 323, nombre: 'Transferencia almacén', ruta: '/almacen/transferencia', icono: 'swap_horiz', orden: 9 },
  { id: 324, nombre: 'Transferencia Almacén Insumos', ruta: '/almacen/transferencia-insumos', icono: 'move_item', orden: 10 },
  { id: 325, nombre: 'Devolución Almacén', ruta: '/almacen/devolucion', icono: 'assignment_return', orden: 11 },
  { id: 326, nombre: 'Registrar producción', ruta: '/almacen/registro-produccion', icono: 'precision_manufacturing', orden: 12 },

  // ALMACÉN: CONTROL E INVENTARIO
  { id: 331, nombre: 'Inventario almacén', ruta: '/almacen/inventario', icono: 'warehouse', orden: 13 },
  { id: 332, nombre: 'Productos producidos', ruta: '/almacen/productos-producidos', icono: 'fact_check', orden: 14 },
  { id: 333, nombre: 'Historial prod. en almacén', ruta: '/almacen/historial', icono: 'history', orden: 15 },
  { id: 334, nombre: 'Declaración de Inventario', ruta: '/almacen/declaracion', icono: 'rate_review', orden: 16 },
  { id: 335, nombre: 'Verificación inventario almacén', ruta: '/almacen/verificacion', icono: 'fact_check', orden: 17 },
  { id: 336, nombre: 'Insertar insumos almacén', ruta: '/almacen/insertar-insumos', icono: 'input', orden: 18 },
  { id: 337, nombre: 'Retirar insumos almacén', ruta: '/almacen/retirar-insumos', icono: 'output', orden: 19 },

  // AUDITORÍA
  { id: 405, nombre: 'Configuración reposición', ruta: '/almacen/config-reposicion-area', icono: 'settings', orden: 20 },
  { id: 407, nombre: 'Reposición vencidos (Almacén)', ruta: '/auditoria/reposicion-vencidos-almacen', icono: 'hourglass_empty', orden: 21 },
  { id: 412, nombre: 'Desperdicio insumos vencidos', ruta: '/auditoria/desperdicio-vencidos-almacen', icono: 'delete', orden: 22 },
  { id: 413, nombre: 'Desperdicio manual almacén', ruta: '/auditoria/desperdicio-manual-almacen', icono: 'delete_forever', orden: 23 },

  // COMPRAS
  { id: 505, nombre: 'Lista precios insumos', ruta: '/compras/lista-precios', icono: 'sell', orden: 24 },

  // CONFIGURACIÓN
  { id: 601, nombre: 'Registro de Producto', ruta: '/config/registro-producto', icono: 'add_box', orden: 25 },
  { id: 610, nombre: 'Guía Registro de Producto', ruta: '/config/guia-registro', icono: 'chrome_reader_mode', orden: 26 },
  { id: 602, nombre: 'Pre-Registro Insumos', ruta: '/config/pre-registro', icono: 'app_registration', orden: 27 },
  { id: 603, nombre: 'Registro Grupo Producto', ruta: '/config/registro-grupo', icono: 'category', orden: 28 },
  { id: 604, nombre: 'Registro Facturas Insumos', ruta: '/almacen/registro-facturas-insumos', icono: 'receipt_long', orden: 29 }
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onCloseMobile }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const location = useLocation();

  // Launcher de aplicaciones (popover)
  const [appsAnchorEl, setAppsAnchorEl] = useState<null | HTMLElement>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const handleOpenApps = (event: React.MouseEvent<HTMLElement>) => {
    setAppsAnchorEl(event.currentTarget);
  };

  const handleCloseApps = () => {
    setAppsAnchorEl(null);
  };

  const handleLogoClick = () => {
    onCloseMobile();
  };

  const handleLinkClick = () => {
    onCloseMobile();
  };

  // Obtener aplicaciones disponibles
  const fetchApps = async () => {
    const cachedApps = sessionStorage.getItem('launcher_applications');
    if (cachedApps) {
      setApps(JSON.parse(cachedApps));
      return;
    }

    setLoadingApps(true);
    try {
      console.log('[Sidebar] Obteniendo aplicaciones desde API /applications...');
      const response = await api.get('/applications');
      if (response && response.data) {
        const data = Array.isArray(response.data) ? response.data : (response.data.applications || []);
        const visibleApps = data.filter((app: any) => app.VISIBLE_LAUNCHER && app.ACTIVA)
          .sort((a: any, b: any) => (a.ORDEN_LAUNCHER || 0) - (b.ORDEN_LAUNCHER || 0));
        sessionStorage.setItem('launcher_applications', JSON.stringify(visibleApps));
        setApps(visibleApps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      const fallbackApps = [
        {
          "ID_APP": 5,
          "NOMBRE": "Gestor de Permisos",
          "DESCRIPCION": "Sistema centralizado para la gestión de usuarios, roles, aplicaciones, módulos, funcionalidades y permisos del ecosistema Capresso",
          "URL_BASE": "http://localhost:3005",
          "URL_ICONO": "/icons/reports.svg"
        },
        {
          "ID_APP": 3,
          "NOMBRE": "Reportes BI",
          "DESCRIPCION": "Reportes y análisis de datos",
          "URL_BASE": "http://localhost:3007",
          "URL_ICONO": "/icons/reports.svg"
        },
        {
          "ID_APP": 2007,
          "NOMBRE": "Administración RRHH Capresso",
          "DESCRIPCION": "Frontend administrativo RRHH integrado a AuthSystem",
          "URL_BASE": "https://rrhh.capressocafe.com",
          "URL_ICONO": "/icons/users.svg"
        },
        {
          "ID_APP": 2012,
          "NOMBRE": "Gestion Products Planta",
          "DESCRIPCION": "gestion de productos y pedidos de planta",
          "URL_BASE": "http://localhost:3070",
          "URL_ICONO": null
        }
      ];
      sessionStorage.setItem('launcher_applications', JSON.stringify(fallbackApps));
      setApps(fallbackApps);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Cargar perfil del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserProfile(parsed);
        ConsoleLogMessage(" usuario: ", parsed);
      } catch (e) {
        console.error('[Sidebar] Error parseando usuario de localStorage:', e);
      }
    }
  }, []);

  // Cargar menú dinámico o estático
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        if (!USE_DYNAMIC_MENU) {
          throw new Error('El menú dinámico está desactivado (USE_DYNAMIC_MENU = false)');
        }

        const cacheKey = 'sidebar_menu_dynamic';
        const cachedMenu = sessionStorage.getItem(cacheKey);
        if (cachedMenu) {
          console.log('[Sidebar] Cargando menú dinámico desde caché...');
          setMenuItems(JSON.parse(cachedMenu));
          setLoading(false);
          return;
        }

        console.log('[Sidebar] Obteniendo menú desde API /menu...');
        const response = await api.get('/menu');
        const data = response.data;
        console.log('[Sidebar] Datos recibidos de /menu:', data);

        if (data) {
          sessionStorage.setItem('user_menu_raw', JSON.stringify(data));
          let itemsToUse: ApiMenuItem[] = [];
          if (Array.isArray(data)) {
            itemsToUse = data;
          } else if (data.modulos && Array.isArray(data.modulos)) {
            itemsToUse = data.modulos
              .filter((m: any) => m.visibleMenu && m.activo)
              .map((m: any) => ({
                id: m.id,
                nombre: m.nombre,
                tipo: 'acceso',
                icono: m.icono || 'circle',
                orden: m.orden || 0,
                ruta: m.rutaBase ? (m.rutaBase.startsWith('/') ? m.rutaBase : `/${m.rutaBase}`) : '/dashboard'
              }));
          }

          if (itemsToUse.length > 0) {
            const sortedData = itemsToUse.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            sessionStorage.setItem(cacheKey, JSON.stringify(sortedData));
            setMenuItems(sortedData);

            if (!Array.isArray(data) && data.usuario) {
              setUserProfile(data.usuario);
              localStorage.setItem('user', JSON.stringify(data.usuario));
            }
          } else {
            console.warn('[Sidebar] Respuesta de /menu no contiene módulos válidos, usando fallback.');
            throw new Error('La respuesta del menú no contiene datos válidos');
          }
        } else {
          throw new Error('La respuesta de la API está vacía');
        }
      } catch (error) {
        console.warn('[Sidebar] /menu no disponible o desactivado, usando menú fallback:', error);

        const cacheKey = 'sidebar_menu_static';
        const cachedMenu = sessionStorage.getItem(cacheKey);
        if (cachedMenu) {
          console.log('[Sidebar] Cargando menú estático desde caché...');
          setMenuItems(JSON.parse(cachedMenu));
          setLoading(false);
          return;
        }

        const sortedFallback = staticMenuItems.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        sessionStorage.setItem(cacheKey, JSON.stringify(sortedFallback));
        setMenuItems(sortedFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200/50 dark:border-zinc-800 transition-all duration-300 shadow-2xl overflow-hidden w-full">
      {/* Header */}
      <div className="p-1 shrink-0 border-b border-zinc-200/25">
        <div className="flex justify-center py-2 relative">
          {!isCollapsed && (
            <button
              onClick={handleOpenApps}
              className="absolute left-0.5 top-1/4 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors flex items-center justify-center animate-in fade-in"
              title="Aplicaciones"
            >
              <Apps className="w-8 h-8" sx={{ color: 'var(--primary)' }} />
            </button>
          )}

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

        {/* Popover for Apps */}
        <Popover
          open={Boolean(appsAnchorEl)}
          anchorEl={appsAnchorEl}
          onClose={handleCloseApps}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          slotProps={{
            paper: {
              className: "rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 mt-2 max-w-[340px]"
            }
          }}
        >
          <div className="mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider font-headline">Aplicaciones Capresso</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 w-[300px]">
            {loadingApps ? (
              <div className="col-span-3 py-6 flex flex-col items-center justify-center gap-2">
                <CircularProgress size={20} className="text-primary" />
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-headline">Cargando...</span>
              </div>
            ) : apps.length === 0 ? (
              <div className="col-span-3 py-4 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-headline">
                Sin aplicaciones disponibles
              </div>
            ) : (
              apps.map((app) => {
                const initials = app.NOMBRE ? app.NOMBRE.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'APP';

                return (
                  <a
                    key={app.ID_APP}
                    href={app.URL_BASE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCloseApps}
                    className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 group transition-all duration-300 relative cursor-pointer"
                    title={`${app.NOMBRE}: ${app.DESCRIPCION || ''}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/10 to-red-500/20 dark:from-rose-500/5 dark:to-red-500/10 flex items-center justify-center border border-red-500/10 group-hover:scale-105 group-hover:shadow-md group-hover:border-red-500/35 transition-all duration-300 shrink-0">
                      {app.URL_ICONO ? (
                        <img
                          src={app.URL_ICONO}
                          alt={app.NOMBRE}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallbackText = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                            if (fallbackText) fallbackText.removeAttribute('style');
                          }}
                          className="w-7 h-7 object-contain"
                        />
                      ) : null}
                      <span
                        className="fallback-initials text-xs font-black text-red-600 dark:text-red-400 font-headline"
                        style={app.URL_ICONO ? { display: 'none' } : undefined}
                      >
                        {initials}
                      </span>
                    </div>
                    <span className="mt-2 text-[9px] font-black text-zinc-700 dark:text-zinc-300 uppercase leading-tight tracking-tighter w-full group-hover:text-primary transition-colors font-headline line-clamp-2 h-7 whitespace-normal text-center">
                      {app.NOMBRE}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </Popover>

        {!isCollapsed && (
          <div className="flex items-center space-x-3 mb-4 bg-white/80 dark:bg-white/5 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm animate-in fade-in duration-500">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 p-0.5 shrink-0 border border-primary/20">
              <img
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover"
                src={userProfile?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAQj0voCHDsaBuDnhr-XqFgzkbX9rTwYrXhUKi9PKCnB8ioef-SwiCzBShIqSRT2BX8ZDx4f0bjpVWl7laaGlDHGn5au_binZh9ev8lckGLKqPWhRjMNwvwXxgbQaaOpUb_PUfu0QxJ1OSOQjRWIltD7iTxiFc2cip1Gy6EjFybK-FucezmW9aH-_kRS33C0aK2y5yHn_lnnjV0bbWZwBugGJ05tr-jkCMp-76q2b2nOROUs6ILpOpTP168dhUEsAjDx_T1zc4N5vY"}
              />
            </div>
            <div className="overflow-hidden">
              <p className="font-headline text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white truncate">
                {userProfile?.name || userProfile?.nombre || userProfile?.nombres || 'User'}
              </p>
              <p className="text-[10px] text-primary font-bold uppercase truncate tracking-tighter font-headline">
                {userProfile?.rol || 'Almacén'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-1">
        {loading ? (
          <div className="space-y-4 animate-pulse px-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full"></div>
            ))}
          </div>
        ) : (
          menuItems.map((node) => {
            const isActive = location.pathname === node.ruta;
            return (
              <NavLink
                key={node.id}
                to={node.ruta}
                onClick={handleLinkClick}
                title={isCollapsed ? node.nombre : undefined}
                className={({ isActive: linkActive }) =>
                  `relative flex items-center w-full text-left px-3 py-2.5 text-[10px] tracking-widest uppercase transition-all duration-300 rounded-xl font-headline group cursor-pointer ${linkActive
                    ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02] font-black'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`
                }
              >
                <div className="flex items-center space-x-3 w-full">
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-primary'
                      }`}
                  >
                    {node.icono}
                  </span>
                  {!isCollapsed && (
                    <span className="tracking-widest uppercase font-bold text-left leading-tight text-[9px] truncate">
                      {node.nombre}
                    </span>
                  )}
                </div>

                {isCollapsed && hoveredItem === node.id && (
                  <div className="fixed left-20 top-auto bg-zinc-950 text-white dark:bg-zinc-900 text-[10px] tracking-widest font-bold uppercase px-3 py-2 rounded-lg shadow-2xl border border-zinc-800 dark:border-zinc-700 z-[100] pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200 font-headline whitespace-nowrap">
                    {node.nombre}
                  </div>
                )}
              </NavLink>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-1 shrink-0 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200/50">
        <button
          onClick={() => navigate('/help')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-zinc-500 hover:text-primary transition-all rounded-lg hover:bg-zinc-200 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          {!isCollapsed && <span className="font-headline text-[10px] tracking-widest uppercase font-semibold">Ayuda</span>}
        </button>
      </div>
    </div>
  );
};

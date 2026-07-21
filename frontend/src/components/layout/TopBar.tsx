import React, { useState, useEffect } from 'react';
import { Menu, Search, User, Sun, Moon } from 'lucide-react';
import { useColorScheme } from '@mui/material/styles';
import { Menu as MuiMenu, MenuItem } from '@mui/material';
import { authService } from '../../config/api';
import { useNotificationContext } from '../../context/NotificationContext';
import NotificationBell from '../notifications/NotificationBell';
import NotificationError from '../notifications/NotificationError';
import NotificationToast from '../notifications/NotificationToast';
import { subscribeToPush } from '../../utils/pushNotifications';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { mode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { error, clearError } = useNotificationContext();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await authService.logout();
    } finally {
      window.location.href = '/';
    }
  };

  useEffect(() => {
    subscribeToPush().catch((err) => console.error('[Push] Error:', err));
  }, []);

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 h-16 flex items-center justify-between px-4 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
        </button>
        {/* <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Buscar..."
          />
        </div> */}
      </div>
      <div className="flex items-center gap-2">
        {/* Selector de Modo Oscuro / Modo Claro */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-300 flex items-center justify-center"
          aria-label="Cambiar tema"
          title={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {mode === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        <NotificationBell />
        <NotificationError error={error} onDismiss={clearError} />
        <NotificationToast />
        <div className="h-8 w-px bg-gray-200 dark:bg-zinc-800 mx-2"></div>
        <button
          onClick={handleOpenUserMenu}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300/10 dark:border-zinc-700/30">
            <User className="w-5 h-5 text-gray-550 dark:text-zinc-400" />
          </div>
          {/* <span className="hidden md:block text-sm font-medium text-gray-700">Usuario</span> */}
        </button>
        <MuiMenu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
        </MuiMenu>
      </div>
    </header>
  );
};




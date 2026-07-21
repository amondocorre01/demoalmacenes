import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const userJson = searchParams.get('user');
    const error = searchParams.get('error');

    if (success === 'true') {
      console.log('[AuthCallback] Login exitoso, guardando sesión...');
      sessionStorage.clear(); // Limpiar caché de sesión de usuario previo

      if (userJson) {
        try {
          const parsedUser = JSON.parse(userJson);

          // Guardar usuario en localStorage SIEMPRE.
          // El token (access_token) ya está guardado como cookie httpOnly "gp_auth"
          // por el backend — no es necesario guardarlo aquí.
          // Con withCredentials: true en axios, la cookie se envía automáticamente
          // en cada petición y el auth middleware la valida.
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('[AuthCallback] Usuario guardado en localStorage:', parsedUser.email || parsedUser.nombre || 'OK');

        } catch (e) {
          console.error('[AuthCallback] Error al parsear datos de usuario:', e);
          // Guardar un objeto mínimo para que el interceptor sepa que hay sesión
          localStorage.setItem('user', JSON.stringify({ authenticated: true }));
        }
      } else {
        // No vino user en el URL pero el login fue exitoso (la cookie gp_auth ya está)
        // Guardar un marcador mínimo de sesión
        console.warn('[AuthCallback] Login exitoso pero sin datos de usuario en URL. Marcando sesión activa.');
        localStorage.setItem('user', JSON.stringify({ authenticated: true }));
      }

      // Redirigir al dashboard o a la ruta previa guardada
      const redirectPath = localStorage.getItem('auth_redirect_path') || '/dashboard';
      localStorage.removeItem('auth_redirect_path');
      navigate(redirectPath, { replace: true });

    } else {
      console.error('[AuthCallback] Error de autenticación:', error || 'Desconocido');
      // Limpiar cualquier dato de sesión previo
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Redirigir al help/home público
      navigate('/help', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Procesando inicio de sesión...</h2>
      <p className="text-zinc-500 text-sm">Validando credenciales con AuthSystem.</p>
    </div>
  );
};

export default AuthCallback;

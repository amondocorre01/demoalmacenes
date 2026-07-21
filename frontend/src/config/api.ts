import axios from 'axios';

// Control de login del sistema (false = Modo Diseño, true = Conectar con AuthSystem)
export const ENABLE_AUTH = true;

export const API_URL = import.meta.env.VITE_API_URL || '';

// Normalizar la URL base para asegurar que termine en /api y así coincida con el backend
const getBaseURL = (url: string): string => {
  if (!url) return '/api';
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed === '/api' || trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

// Crear instancia configurada de Axios con soporte de cookies.
// withCredentials: true → envía la cookie gp_auth automáticamente en cada petición.
export const api = axios.create({
  baseURL: getBaseURL(API_URL),
  withCredentials: true,
});

// Función para generar strings aleatorios seguros (para state/nonce OAuth)
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  let fallback = '';
  for (let i = 0; i < length; i += 1) {
    fallback += chars[Math.floor(Math.random() * chars.length)];
  }
  return fallback;
};

// Interceptor de RESPUESTA: manejar errores 401 de forma inteligente.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Si el login está desactivado, evitamos la redirección
      if (!ENABLE_AUTH) {
        console.warn(
          '[api] Modo Diseño activo (ENABLE_AUTH = false). Redirección de Auth evitada en:',
          originalRequest.url
        );
        return Promise.reject(error);
      }

      // ¿El usuario tiene sesión activa?
      const hasActiveSession = !!localStorage.getItem('user');

      if (hasActiveSession) {
        console.warn(
          '[api] 401 con sesión activa en:',
          originalRequest.url,
          '→ Token expirado o inválido. Forzando re-autenticación.'
        );
        // Limpiamos los datos de sesión para que fluya hacia la redirección
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.clear();
      }

      // Sin sesión activa → iniciar flujo de login con AuthSystem
      const rawLoginUrl = import.meta.env.VITE_AUTH_LOGIN_URL || 'http://localhost:3003/login';
      const loginUrl = new URL(rawLoginUrl);

      const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || 'gestion-planta';
      loginUrl.searchParams.append('client_id', CLIENT_ID);

      const redirectUri =
        import.meta.env.VITE_OAUTH_CALLBACK_URL || 'http://localhost:3071/api/auth/callback';
      loginUrl.searchParams.append('redirect_uri', redirectUri);

      const state = generateRandomString(32);
      const nonce = generateRandomString(32);

      // Registrar state/nonce en el backend antes de redirigir
      try {
        const backendBase = API_URL === '/api' ? '' : API_URL;
        await fetch(`${backendBase}/api/auth/oauth-state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, nonce, client_id: CLIENT_ID, frontend_url: window.location.origin }),
        });
      } catch (stateError) {
        console.error('[api] No se pudo registrar el state antes del login:', stateError);
      }

      loginUrl.searchParams.append('state', state);
      loginUrl.searchParams.append('nonce', nonce);

      localStorage.setItem('auth_redirect_path', window.location.pathname);
      console.log('[api] Sin sesión → redirigiendo a AuthSystem:', loginUrl.toString());
      sessionStorage.clear();
      window.location.href = loginUrl.toString();
    }

    return Promise.reject(error);
  }
);

export const authService = {
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
    }
  }
};

export default api;

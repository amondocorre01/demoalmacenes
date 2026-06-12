/**
 * Obtiene el perfil del usuario actual desde localStorage o decodificando el token JWT.
 */
const getPerfil = (): string => {
  // Intentar obtener perfil guardado directamente en localStorage
  const perfilDirecto = localStorage.getItem('PERFIL') || localStorage.getItem('perfil');
  if (perfilDirecto) return perfilDirecto;

  // Si no existe, intentar extraerlo del token JWT
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt');
    if (token) {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      // Decodificar caracteres especiales
      const jsonPayload = decodeURIComponent(
        decodedPayload
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userData = JSON.parse(jsonPayload);
      const user = Array.isArray(userData) ? userData[0] : userData;
      return user?.PERFIL || user?.TIPO_USUARIO || '';
    }
  } catch (e) {
    // Ignorar errores de decodificación
  }
  return '';
};

// Determinar si estamos en desarrollo local
const isLocal =
  import.meta.env.DEV ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

/**
 * Muestra el mensaje en consola si se está en desarrollo local,
 * o si el perfil del usuario es 'Global' o 'Sistemas'.
 */
export const ConsoleLogMessage = (message: string, ...values: any[]): void => {
  const perfil = getPerfil().toUpperCase();
  const esPerfilValido = perfil === 'GLOBAL' || perfil === 'SISTEMAS';

  if (isLocal || esPerfilValido) {
    console.log(message, ...values);
  }
};

export default ConsoleLogMessage;

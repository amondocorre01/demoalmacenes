import Swal from 'sweetalert2';
import { AxiosError } from 'axios';


/**
 * Configuración centralizada de SweetAlert2 para el proyecto.
 * Utiliza las variables de diseño (colores y fuentes) definidas en el sistema.
 */

export const MySwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[2rem] border-none shadow-2xl bg-surface',
    title: 'text-2xl font-black uppercase tracking-tighter text-zinc-900 font-headline',
    htmlContainer: 'text-zinc-600 font-medium font-body',
    confirmButton: 'bg-primary text-on-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 mx-2 shadow-lg shadow-primary/20',
    cancelButton: 'bg-zinc-200 text-zinc-800 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:bg-zinc-300 mx-2',
    actions: 'mt-6',
    icon: 'border-none',
  },
  buttonsStyling: false,
  background: 'var(--surface)',
  color: 'var(--on-surface)',
});

// Helper de Toasts (Notificaciones rápidas)
export const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-xl border border-zinc-100 bg-white/80 backdrop-blur-md',
    title: 'text-sm font-bold text-zinc-800 ml-2',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

/**
 * Utilidades de alertas preconfiguradas
 */
export const showAlert = {
  success: (title: string, text?: string) => {
    return MySwal.fire({
      icon: 'success',
      title,
      text,
      iconColor: '#5ab375ff', //'var(--primary)',
    });
  },

  error: (title: string, text?: string) => {
    return MySwal.fire({
      icon: 'error',
      title,
      text,
      iconColor: 'var(--error)',
    });
  },

  warning: (title: string, text?: string) => {
    return MySwal.fire({
      icon: 'warning',
      title,
      text,
      iconColor: '#f59e0b', // Amber 500
    });
  },

  confirm: async (title: string, text: string, confirmText = 'Confirmar') => {
    const result = await MySwal.fire({
      title,
      text,
      icon: 'question',
      iconColor: 'var(--tertiary)',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    return result.isConfirmed;
  },

  loading: (title: string, text = 'Por favor espera...') => {
    return MySwal.fire({
      title,
      text,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  toast: (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    return Toast.fire({
      icon,
      title
    });
  }
};

interface ApiError {
  message?: string;
}

export const handleApiError = (error: unknown) => {
  const err = error as AxiosError<ApiError>;

  let message = 'Ha ocurrido un error inesperado.';

  if (err.response) {
    const { status, data } = err.response;
    message = data?.message || message;

    switch (status) {
      case 400:
        message = "Error 400. Datos faltantes o inválidos. ";
        break;
      case 401:
        message = "No autorizado. Inicia sesión nuevamente.";
        break;
      case 403:
        message = "Acceso denegado. No tienes permisos.";
        break;
      case 404:
        message = "Recurso no encontrado.";
        break;
      case 422:
        message = "Error de validación. Revisa los datos.";
        break;
      case 500:
        message = "Error 500. Contactar con soporte.";
        break;
      default:
        message = `Error inesperado (${status}): ` + message;
    }

  } else if (err.request) {
    message = 'No se recibió respuesta del servidor. Verifica tu conexión o Contactar con soporte.';
  } else if (err.message) {
    message = 'Error de red: ' + err.message;
  }

  MySwal.fire({
    icon: 'error',
    title: '',
    text: message,
    iconColor: 'var(--error)',
  });
};


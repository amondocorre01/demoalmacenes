/**
 * useDesperdicioManual.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Registro de Desperdicio Manual de Insumos
 *
 * Propósito:
 * Servicio para consultar el historial de desperdicios manuales (id_estado = 14),
 * obtener el catálogo de productos con stock disponible por almacén y procesar
 * la transacción de registro de desperdicio manual de productos.
 *
 * APIs Utilizadas:
 * ┌─────┬────────┬───────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Endpoint                                      │ Descripción                                             │
 * ├─────┼────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/inventario/declaracion/almacenes          │ Listar almacenes autorizados del usuario                │
 * │  2  │ GET    │ /v1/inventario/rep-desp/desperdicios          │ Listar desperdicios (id_estado: 14 estático)            │
 * │  3  │ GET    │ /v1/inventario/rep-desp/productos-stock      │ Productos con stock disponible en almacén seleccionado │
 * │  4  │ POST   │ /v1/inventario/rep-desp/desperdiciar          │ Procesar transacción de desperdicio manual              │
 * └─────┴────────┴───────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de desperdicios con id_estado fijo en 14 para consultar exclusivamente desperdicios manuales.
 * - Validación de stock disponible antes de agregar productos al lote de desperdicio.
 * - Transacción de guardado masivo de productos seleccionados por almacén.
 */

import { handleApiError, showAlert } from '../../../../config/alerts';
import api, { API_URL } from '../../../../config/api';

/**
 * Helper para resolver URL completa de imágenes del backend.
 * Soporta URLs absolutas, base64 y rutas relativas como:
 * /uploads/documentacion/desperdicio/almacen/archivo.jpg
 */
export const getImageUrl = (img?: string | null): string | null => {
  if (!img) return null;
  const trimmed = String(img).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // Si ya es una URL absoluta o base64
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('data:application/pdf') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Extraer la URL base del backend sin el sufijo /api
  let backendBase = API_URL ? API_URL.replace(/\/+$/, '').replace(/\/api$/, '') : '';
  if (!backendBase && typeof window !== 'undefined') {
    backendBase = window.location.origin;
  }

  // Si la ruta ya incluye /uploads o uploads
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBase}${cleanPath}`;
  }

  // Si solo viene el nombre del archivo
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendBase}/uploads/documentacion/desperdicio/almacen${cleanPath}`;
};

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
  nombre?: string;
  NOMBRE?: string;
  [key: string]: any;
}

export interface DesperdicioManualItem {
  ID_PLANTA_DESPERDICIO_ALMACEN: number;
  ID_DESPERDICIO_ALMACEN?: number;
  ID_DESPERDICIO?: number;
  ID_PLANTA_ALMACEN?: number;
  ALMACEN?: string;
  DESCRICION?: string;
  FECHA_REGISTRO: string;
  FECHA_VENCIMIENTO?: string;
  PRODUCTO?: string;
  NOMBRE_PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  DETALLE?: string;
  OBSERVACION?: string;
  CANTIDAD: number;
  UNIDAD_MEDIDA?: string;
  MEDIDA?: string;
  PRECIO_PRODUCTO?: number;
  PRECIO_CONSUMO_INTERNO?: number;
  PRECIO?: number;
  TOTAL_ASUMIDO?: number;
  PRECIO_ASUMIDO_EMPLEADO?: number;
  TOTAL?: number;
  ID_USUARIO_ASUMIDO?: number | null;
  USUARIO_ASUMIDO?: string | null;
  USUARIO_REGISTRA?: string | null;
  USUARIO?: string | null;
  DESCRIPCION_ESTADO?: string;
  ESTADO?: number | string;
  [key: string]: any;
}

export interface FechaStockItem {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO?: string;
  CANTIDAD_ADECUACION?: number;
  PROD_PRIMARIO?: number;
  STOCK: number;
  FECHA_VENCIMIENTO: string;
}

export interface ProductoStockItem {
  ID_PRODUCTO: number;
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO?: string;
  NOMBRE_PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  PRODUCTO_DETALLE?: string;
  FECHA_VENCIMIENTO?: string;
  CANTIDAD?: number;
  STOCK?: number;
  CANTIDAD_ADECUACION?: number;
  PROD_PRIMARIO?: number;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_E?: string;
  UNIDAD_MEDIDA_A?: string;
  MEDIDA?: string;
  PEDIDO_DECIMAL?: number;
  PRECIO?: number;
  IMAGEN?: string;
  FECHAS?: FechaStockItem[];
  [key: string]: any;
}

export interface DesperdiciosManualParams {
  almacenes?: string | number[];
  fecha_inicio?: string;
  fecha_fin?: string;
  id_estado?: number;
}

export interface DesperdiciarItemPayload {
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO?: string;
  FECHA_VENCIMIENTO: string;
  CANTIDAD: number;
  CANTIDAD_ADECUACION?: number;
  PROD_PRIMARIO?: number;
  DETALLE?: string;
  IMAGEN?: string;
}

export interface DesperdiciarManualPayload {
  id_almacen: number;
  productos: DesperdiciarItemPayload[];
}

export const useDesperdicioManualServices = () => {
  /**
   * 1. Obtiene la lista de almacenes autorizados para el usuario
   */
  const loadApiGetAlmacenes = async (idPlantaAlmacen = 0): Promise<AlmacenItem[]> => {
    try {
      const respuesta = await api.get<any>(
        '/v1/inventario/declaracion/almacenes',
        {
          params: { id_planta_almacen: idPlantaAlmacen },
        }
      );
      if (Array.isArray(respuesta.data)) {
        return respuesta.data;
      }
      if (respuesta.data && Array.isArray(respuesta.data.datos)) {
        return respuesta.data.datos;
      }
      if (respuesta.data && Array.isArray(respuesta.data.data)) {
        return respuesta.data.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  };

  /**
   * 2. Obtiene la lista de desperdicios manuales con id_estado: 14 estático
   */
  const loadApiGetDesperdicios = async (
    params: DesperdiciosManualParams
  ): Promise<DesperdicioManualItem[]> => {
    try {
      const almacenesParam = Array.isArray(params.almacenes)
        ? (params.almacenes.length === 0 ? '' : params.almacenes.join(','))
        : (params.almacenes || '');

      const respuesta = await api.get<{ success?: boolean; data: DesperdicioManualItem[] }>(
        '/v1/inventario/rep-desp/desperdicios',
        {
          params: {
            almacenes: almacenesParam,
            fecha_inicio: params.fecha_inicio || '',
            fecha_fin: params.fecha_fin || '',
            id_estado: 14, // Estado 14 fijo según especificación
          },
        }
      );

      if (respuesta.data && Array.isArray(respuesta.data.data)) {
        return respuesta.data.data;
      }
      if (Array.isArray(respuesta.data)) {
        return respuesta.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  };

  /**
   * 3. Obtiene los productos con stock disponible en un almacén
   */
  const loadApiGetProductosStock = async (
    idAlmacen: number
  ): Promise<ProductoStockItem[]> => {
    try {
      const respuesta = await api.get<{ success?: boolean; data: ProductoStockItem[] }>(
        '/v1/inventario/rep-desp/productos-stock',
        {
          params: { id_almacen: idAlmacen },
        }
      );

      if (respuesta.data && Array.isArray(respuesta.data.data)) {
        return respuesta.data.data;
      }
      if (Array.isArray(respuesta.data)) {
        return respuesta.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  };

  /**
   * 4. Procesa la transacción de desperdicio manual de productos
   */
  const loadApiDesperdiciar = async (
    payload: DesperdiciarManualPayload
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const respuesta = await api.post<any>(
        '/v1/inventario/rep-desp/desperdiciar',
        payload
      );

      if (respuesta.data && (respuesta.data.success || respuesta.status === 200 || respuesta.status === 201)) {
        return {
          success: true,
          message: respuesta.data.message || 'Desperdicio registrado correctamente.',
        };
      }
      return {
        success: false,
        message: respuesta.data?.message || 'Error al procesar el desperdicio.',
      };
    } catch (error) {
      handleApiError(error);
      return { success: false };
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetDesperdicios,
    loadApiGetProductosStock,
    loadApiDesperdiciar,
  };
};
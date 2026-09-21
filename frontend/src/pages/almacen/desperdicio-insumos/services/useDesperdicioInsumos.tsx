/**
 * useDesperdicioInsumos.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Desperdicio de Insumos Vencidos
 *
 * Propósito:
 * Servicio para consultar el historial de desperdicios de insumos (id_estado = 12),
 * obtener la lista de productos vencidos por almacén/fecha y procesar la transacción
 * de registro masivo de desperdicios vencidos.
 *
 * APIs Utilizadas:
 * ┌─────┬────────┬───────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Endpoint                                      │ Descripción                                             │
 * ├─────┼────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/inventario/declaracion/almacenes          │ Listar almacenes autorizados del usuario                │
 * │  2  │ GET    │ /v1/inventario/rep-desp/desperdicios          │ Listar desperdicios de insumos (id_estado: 12 estático) │
 * │  3  │ GET    │ /v1/inventario/rep-desp/productos-vencidos   │ Listar productos vencidos para modal de registro        │
 * │  4  │ POST   │ /v1/inventario/rep-desp/desperdiciar-vencidos │ Procesar desperdicio de productos vencidos              │
 * └─────┴────────┴───────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de desperdicios con id_estado fijo en 12 para consultar exclusivamente mermas e insumos vencidos.
 * - Soporte para selección individual o múltiple de almacenes.
 * - Validación de stock y fecha de expiración en el modal previo al registro de la transacción.
 */

import { handleApiError, showAlert } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
  nombre?: string;
  NOMBRE?: string;
  [key: string]: any;
}

export interface DesperdicioInsumoItem {
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
  USUARIO?: string | null;
  DESCRIPCION_ESTADO?: string;
  ESTADO?: number | string;
  [key: string]: any;
}

export interface ProductoVencidoItem {
  ID_PLANTA_ALMACEN: number;
  ALMACEN?: string;
  DESCRICION?: string;
  ID_PRODUCTO: number;
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO: string;
  NOMBRE_PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  FECHA_VENCIMIENTO: string;
  CANTIDAD: number;
  CANTIDAD_ADECUACION?: number;
  UNIDAD_MEDIDA?: string;
  MEDIDA?: string;
  PROD_PRIMARIO?: number;
  PRECIO?: number;
  TOTAL?: number;
  STOCK?: number;
  [key: string]: any;
}

export interface DesperdiciosInsumosParams {
  almacenes?: string | number[];
  fecha_inicio?: string;
  fecha_fin?: string;
  id_estado?: number;
}

export interface DesperdiciarVencidosPayload {
  almacenes: number[];
  fecha: string;
}

export const useDesperdicioInsumosServices = () => {
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
   * 2. Obtiene la lista de desperdicios de insumos con id_estado: 12 estático
   */
  const loadApiGetDesperdicios = async (
    params: DesperdiciosInsumosParams
  ): Promise<DesperdicioInsumoItem[]> => {
    try {
      const almacenesParam = Array.isArray(params.almacenes)
        ? (params.almacenes.length === 0 ? '' : params.almacenes.join(','))
        : (params.almacenes || '');

      const respuesta = await api.get<{ success?: boolean; data: DesperdicioInsumoItem[] }>(
        '/v1/inventario/rep-desp/desperdicios',
        {
          params: {
            almacenes: almacenesParam,
            fecha_inicio: params.fecha_inicio || '',
            fecha_fin: params.fecha_fin || '',
            id_estado: 12, // Estado 12 fijo según especificación
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
   * 3. Obtiene la lista de productos vencidos para el modal de desperdicio
   */
  const loadApiGetProductosVencidos = async (params: {
    almacenes?: string | number[];
    fecha: string;
  }): Promise<ProductoVencidoItem[]> => {
    try {
      const almacenesParam = Array.isArray(params.almacenes)
        ? (params.almacenes.length === 0 ? '' : params.almacenes.join(','))
        : (params.almacenes || '');

      const respuesta = await api.get<{ success?: boolean; data: ProductoVencidoItem[] }>(
        '/v1/inventario/rep-desp/productos-vencidos',
        {
          params: {
            almacenes: almacenesParam,
            fecha: params.fecha,
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
   * 4. Registra la transacción de desperdiciar productos vencidos
   */
  const loadApiDesperdiciarProductosVencidos = async (
    payload: DesperdiciarVencidosPayload
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const respuesta = await api.post<{ success: boolean; message: string }>(
        '/v1/inventario/rep-desp/desperdiciar-vencidos',
        payload
      );
      return {
        success: respuesta.data?.success ?? true,
        message: respuesta.data?.message || 'Se guardó correctamente la información.',
      };
    } catch (error: any) {
      handleApiError(error);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Error al procesar desperdicio',
      };
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetDesperdicios,
    loadApiGetProductosVencidos,
    loadApiDesperdiciarProductosVencidos,
  };
};
/**
 * useReposicionUsuarioAlmacen.tsx
 * 
 * Hook de servicios para la gestión y auditoría de reposiciones de productos en almacén,
 * registro de reposiciones por stock y asignación de responsables.
 * 
 * APIs:
 * 1. GET  /v1/inventario/declaracion/almacenes               -> Listar almacenes autorizados
 * 2. GET  /v1/inventario/rep-desp/reposiciones               -> Listar reposiciones (con id_estado: 15 estático)
 * 3. GET  /v1/inventario/rep-desp/productos-stock            -> Productos con stock en almacén para reposición
 * 4. POST /v1/inventario/rep-desp/registrar-reposicion       -> Registrar reposición (transacción)
 * 5. POST /v1/inventario/rep-desp/asignar-responsable-reposicion (o asignar-responsable-desperdicio) -> Asignar responsable
 */

import { useCallback } from 'react';
import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
  nombre?: string;
}

export interface UsuarioItem {
  ID_USUARIO: number;
  NOMBRE_COMPLETO: string;
  USUARIO?: string;
  CARGO?: string;
  PERFIL?: string;
}

export interface ReposicionItem {
  ID_PLANTA_REPOSICION_ALMACEN: number;
  ID_REPOSICION_ALMACEN?: number;
  ID_PLANTA_ALMACEN: number;
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
  PRECIO_CONSUMO_INTERNO?: number;
  PRECIO?: number;
  TOTAL_ASUMIDO?: number;
  TOTAL?: number;
  ID_USUARIO_ASUMIDO?: number | null;
  USUARIO_ASUMIDO?: string | null;
  USUARIO?: string | null;
  USUARIOS?: UsuarioItem[];
  DETALLE?: string;
  ESTADO?: number | string;
}

export interface ReposicionesParams {
  almacenes?: string | number[];
  fecha_inicio?: string;
  fecha_fin?: string;
  id_estado?: string | number; // 15 estático
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
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO: string;
  NOMBRE_PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  PRODUCTO_DETALLE?: string;
  GRUPO?: string;
  FECHA_VENCIMIENTO: string;
  STOCK: number;
  CANTIDAD?: number;
  CANTIDAD_ADECUACION?: number;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_A?: string;
  UNIDAD_MEDIDA_E?: string;
  MEDIDA?: string;
  PROD_PRIMARIO?: number;
  PRECIO_CONSUMO_INTERNO?: number;
  PRECIO?: number;
  PEDIDO_DECIMAL?: boolean | number;
  FECHAS?: FechaStockItem[];
}

export interface RegistrarReposicionPayload {
  id_almacen: number;
  productos: Array<{
    ID_PRODUCTO_DETALLE: number;
    ID_PRODUCTO: number;
    ID_PRODUCTO_INTERMEDIO: number;
    PRODUCTO: string;
    FECHA_VENCIMIENTO: string;
    CANTIDAD: number;
    CANTIDAD_ADECUACION?: number;
    PROD_PRIMARIO?: number;
    DETALLE?: string;
  }>;
}

export interface AsignarResponsablePayload {
  id_reposicion_almacen?: number;
  id_desperdicio_alamcen?: number;
  id_usuario: number;
}

export const useReposicionUsuarioAlmacenServices = () => {
  /**
   * 1. GET /v1/inventario/declaracion/almacenes
   * Obtiene la lista de almacenes autorizados del usuario
   */
  const loadApiGetAlmacenes = useCallback(async (idPlantaAlmacen = 0): Promise<AlmacenItem[]> => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/declaracion/almacenes', {
        params: { id_planta_almacen: idPlantaAlmacen },
      });
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
  }, []);

  /**
   * 2. GET /v1/inventario/rep-desp/reposiciones
   * Listar reposiciones registradas con id_estado: 15 estático
   */
  const loadApiGetReposiciones = useCallback(async (params: ReposicionesParams): Promise<ReposicionItem[]> => {
    try {
      const almacenesParam = Array.isArray(params.almacenes)
        ? (params.almacenes.length === 0 ? '' : params.almacenes.join(','))
        : (params.almacenes || '');

      const respuesta = await api.get<{ success?: boolean; data: ReposicionItem[] }>(
        '/v1/inventario/rep-desp/reposiciones',
        {
          params: {
            almacenes: almacenesParam,
            fecha_inicio: params.fecha_inicio || '',
            fecha_fin: params.fecha_fin || '',
            id_estado: '15', // Valor estático obligatorio
          },
        }
      );

      return respuesta.data?.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }, []);

  /**
   * 3. GET /v1/inventario/rep-desp/productos-stock
   * Obtiene la lista de productos con stock en un almacén para realizar reposiciones
   */
  const loadApiGetProductosStock = useCallback(async (idAlmacen: number): Promise<ProductoStockItem[]> => {
    try {
      const respuesta = await api.get<{ success?: boolean; data: ProductoStockItem[] }>(
        '/v1/inventario/rep-desp/productos-stock',
        {
          params: { id_almacen: idAlmacen },
        }
      );
      return respuesta.data?.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }, []);

  /**
   * 4. POST /v1/inventario/rep-desp/registrar-reposicion
   * Registra una reposición de productos en almacén (transaccional)
   */
  const loadApiRegistrarReposicion = useCallback(
    async (payload: RegistrarReposicionPayload): Promise<{ success: boolean; message: string }> => {
      try {
        const respuesta = await api.post<{ success: boolean; message: string }>(
          '/v1/inventario/rep-desp/registrar-reposicion',
          payload
        );
        return respuesta.data || { success: true, message: 'Se guardó correctamente la información.' };
      } catch (error) {
        handleApiError(error);
        return { success: false, message: 'Ocurrió un error al registrar la reposición.' };
      }
    },
    []
  );

  /**
   * 5. POST /v1/inventario/rep-desp/asignar-responsable-reposicion (o desperdicio)
   * Asigna el usuario responsable que asume el costo de la reposición
   */
  const loadApiAsignarResponsable = useCallback(
    async (idReposicionAlmacen: number, idUsuario: number): Promise<{ success: boolean; message: string }> => {
      try {
        // Intentar primero con la ruta de reposición
        try {
          const resp = await api.post<{ success: boolean; message: string }>(
            '/v1/inventario/rep-desp/asignar-responsable-reposicion',
            {
              id_reposicion_almacen: idReposicionAlmacen,
              id_usuario: idUsuario,
            }
          );
          return resp.data;
        } catch {
          // Fallback a asignar-responsable-desperdicio si aplica
          const respFallback = await api.post<{ success: boolean; message: string }>(
            '/v1/inventario/rep-desp/asignar-responsable-desperdicio',
            {
              id_desperdicio_alamcen: idReposicionAlmacen,
              id_usuario: idUsuario,
            }
          );
          return respFallback.data;
        }
      } catch (error) {
        handleApiError(error);
        return { success: false, message: 'No se pudo asignar el responsable.' };
      }
    },
    []
  );

  return {
    loadApiGetAlmacenes,
    loadApiGetReposiciones,
    loadApiGetProductosStock,
    loadApiRegistrarReposicion,
    loadApiAsignarResponsable,
  };
};

export default useReposicionUsuarioAlmacenServices;

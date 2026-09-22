/**
 * useReposicionSucAlmacenProd.tsx
 * ─────────────────────────────────────────────────────────────
 * Hook de servicios para la gestión de reposición de productos por sucursal / canal de venta,
 * consulta de ventas asociadas a reposición y asignación de empleados responsables.
 *
 * APIs Utilizadas:
 * 1. GET /v1/reposicion/canales-venta
 *    - Obtiene los canales de venta disponibles para reposición (filtrados por perfil si aplica).
 * 2. GET /v1/reposicion/ventas?fecha_inicio&fecha_fin&id_nombre_lista_precio
 *    - Obtiene el listado de ventas de reposición en el rango de fechas, lista de empleados autorizados
 *      y la bandera de permiso de edición (editar: true/false según el límite de 2 días).
 * 3. PUT /v1/reposicion/ventas
 *    - Actualiza el empleado asignado a las ventas de reposición seleccionadas y registra auditoría (log).
 */

import { useCallback } from 'react';
import api from '../../../../config/api';
import { handleApiError, showAlert } from '../../../../config/alerts';

export interface CanalVentaItem {
  ID_NOMBRE_LISTA_PRECIOS?: number;
  ID_NOMBRE_LISTA_PRECIO?: number;
  id_nombre_lista_precio?: number;
  NOMBRE_LISTA_PRECIOS?: string;
  NOMBRE?: string;
  nombre?: string;
  ESTADO?: number;
  [key: string]: any;
}

export interface EmpleadoItem {
  ID_EMPLEADO: number;
  NOMBRE_COMPLETO: string;
  CI?: string;
  [key: string]: any;
}

export interface ProductoVentaItem {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_PRODUCIDO?: number;
  NOMBRE_PRODUCTO?: string;
  PRODUCTO?: string;
  nombre_producto?: string;
  producto?: string;
  CANTIDAD?: number | string;
  cantidad?: number | string;
  PRECIO?: number | string;
  PRECIO_VENTA?: number | string;
  PRECIO_UNITARIO?: number | string;
  precio?: number | string;
  TOTAL?: number | string;
  total?: number | string;
  UNIDAD_MEDIDA?: string;
  MEDIDA?: string;
  [key: string]: any;
}

export interface VentaReposicionItem {
  ID_VENTAS_REPOSICION_SUCURSAL?: number | string;
  ID_VENTA_REPOSICION?: number | string;
  id_venta_reposicion?: number | string;
  ID_VENTA?: number | string;
  FECHA?: string;
  FECHA_REGISTRO?: string;
  FECHA_VENTA?: string;
  fecha?: string;
  ID_NOMBRE_LISTA_PRECIOS?: number;
  id_nombre_lista_precio?: number;
  NOMBRE_LISTA_PRECIOS?: string;
  SUCURSAL?: string;
  CANAL_VENTA?: string;
  canal_venta?: string;
  TOTAL?: number | string;
  TOTAL_VENTA?: number | string;
  TOTAL_ASUMIDO?: number | string;
  total?: number | string;
  ID_EMPLEADO_ASUMIDO?: number | null;
  id_empleado?: number | null;
  EMPLEADO?: string;
  EMPLEADO_ASUMIDO?: string;
  NOMBRE_COMPLETO?: string;
  PRODUCTOS?: ProductoVentaItem[] | string;
  OBSERVACION?: string;
  CLIENTE?: string;
  [key: string]: any;
}

export interface VentasReposicionResponse {
  data: VentaReposicionItem[];
  empleados: EmpleadoItem[];
  editar: boolean;
}

export interface GetVentasParams {
  fecha_inicio: string;
  fecha_fin: string;
  id_nombre_lista_precio?: number;
}

export interface UpdateVentaItemPayload {
  id_venta_reposicion: number | string;
  id_empleado: number;
}

export const useReposicionSucAlmacenProductosServices = () => {

  /**
   * 1. GET /v1/reposicion/canales-venta
   * Lista los canales de venta disponibles para reposición
   */
  const loadApiGetCanalesVenta = useCallback(async (): Promise<CanalVentaItem[]> => {
    try {
      const response = await api.get('/v1/reposicion/canales-venta');
      if (response.data && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener canales de venta:', error);
      handleApiError(error);
      return [];
    }
  }, []);

  /**
   * 2. GET /v1/reposicion/ventas
   * Obtiene las ventas de reposición, la lista de empleados autorizados y la bandera de edición
   */
  const loadApiGetVentas = useCallback(
    async (params: GetVentasParams): Promise<VentasReposicionResponse> => {
      try {
        const response = await api.get('/v1/reposicion/ventas', {
          params: {
            fecha_inicio: params.fecha_inicio,
            fecha_fin: params.fecha_fin,
            id_nombre_lista_precio: params.id_nombre_lista_precio ?? 0,
          },
        });

        const resData = response.data || {};
        const rawData = resData.data || [];
        const empleados = Array.isArray(resData.empleados) ? resData.empleados : [];
        const editar = typeof resData.editar === 'boolean' ? resData.editar : false;

        const data: VentaReposicionItem[] = (Array.isArray(rawData) ? rawData : []).map(
          (item: any) => {
            let parsedProductos: ProductoVentaItem[] = [];
            if (Array.isArray(item.PRODUCTOS)) {
              parsedProductos = item.PRODUCTOS;
            } else if (typeof item.PRODUCTOS === 'string') {
              try {
                parsedProductos = JSON.parse(item.PRODUCTOS);
              } catch {
                parsedProductos = [];
              }
            }

            return {
              ...item,
              PRODUCTOS: parsedProductos,
            };
          }
        );

        return {
          data,
          empleados,
          editar,
        };
      } catch (error) {
        console.error('Error al obtener ventas de reposición:', error);
        handleApiError(error);
        return {
          data: [],
          empleados: [],
          editar: false,
        };
      }
    },
    []
  );

  /**
   * 3. PUT /v1/reposicion/ventas
   * Asigna el empleado a las ventas de reposición y registra log de auditoría
   */
  const loadApiUpdateVentas = useCallback(
    async (ventas: UpdateVentaItemPayload[]): Promise<{ success: boolean; message: string }> => {
      try {
        if (!ventas || ventas.length === 0) {
          showAlert.error('Atención', 'No hay ventas para actualizar.');
          return { success: false, message: 'No hay ventas' };
        }

        const response = await api.put('/v1/reposicion/ventas', { ventas });
        const result = response.data || {};

        if (result.success) {
          return {
            success: true,
            message: result.message || 'Se guardó correctamente la información.',
          };
        }

        return {
          success: false,
          message: result.message || 'No se pudo guardar la información.',
        };
      } catch (error) {
        console.error('Error al actualizar ventas de reposición:', error);
        handleApiError(error);
        return {
          success: false,
          message: 'Error al comunicarse con el servidor.',
        };
      }
    },
    []
  );

  return {
    loadApiGetCanalesVenta,
    loadApiGetVentas,
    loadApiUpdateVentas,
  };
};
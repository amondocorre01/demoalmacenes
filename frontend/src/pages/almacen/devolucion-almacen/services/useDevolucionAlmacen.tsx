/**
 * useDevolucionAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Devolución de Almacén
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                 │ Descripción                                     │
 * ├─────┼────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/devolucion-producto/areas                │ Listar áreas habilitadas para el usuario        │
 * │  2  │ GET    │ /v1/devolucion-producto/almacenes            │ Listar almacenes asignados al usuario           │
 * │  3  │ GET    │ /v1/devolucion-producto/almacenes/activos    │ Listar almacenes activos                        │
 * │  4  │ GET    │ /v1/devolucion-producto/productos-stock      │ Stock de productos disponibles para devolución  │
 * │  5  │ POST   │ /v1/devolucion-producto/devoluciones         │ Registrar nueva devolución de productos         │
 * │  6  │ GET    │ /v1/devolucion-producto/devoluciones         │ Listar historial de devoluciones con filtros    │
 * └─────┴────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de consultas por almacén y rango de fechas (YYYY-MM-DD).
 * - Selección obligatoria de Almacén y Área para consultar stock real a devolver.
 * - Validación estricta para evitar devolver cantidades mayores al stock disponible.
 * - Registro estructurado con array de productos con detalle, cantidades y fecha.
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface DevolucionItem {
  ID_DOCUMENTO_DEVOLUCION?: number;
  ID_PLANTA_ALMACEN_DOCUMENTO?: number;
  ID_DEVOLUCION?: number;
  ID_PLANTA_ALMACEN?: number;
  ID_AREA?: number;
  FECHA_REGISTRO: string;
  HORA_REGISTRO?: string;
  ALMACEN?: string;
  NOMBRE_ALMACEN?: string;
  AREA?: string;
  NOMBRE_AREA?: string;
  USUARIO?: string;
  NOMBRE_USUARIO?: string;
  ESTADO?: number | string;
  MOTIVO?: string;
  OBSERVACION?: string;
  DETALLE?: Array<{
    ID_PRODUCTO?: number;
    ID_PRODUCTO_DETALLE?: number;
    PRODUCTO?: string;
    PRODUCTO_DETALLE?: string;
    DEVUELTO?: Array<{
      CANTIDAD?: number;
      FECHA_VENCIMIENTO?: string;
    }>;
    NOMBRE?: string;
    CANTIDAD?: number;
    CANTIDAD_DEVUELTA?: number;
    CANTIDAD_ADECUACION?: number | string;
    UNIDAD_MEDIDA?: string;
    UNIDAD_MEDIDA_A?: string;
    LOTE?: string;
    FECHA_VENCIMIENTO?: string;
  }>;
}

export interface FechaStockDevolucion {
  ID_PRODUCTO?: number;
  CANTIDAD: number;
  FECHA_VENCIMIENTO: string;
}

export interface ProductoStockDevolucion {
  ID_PRODUCTO: number;
  PRODUCTO?: string;
  PRODUCTO_DETALLE?: string;
  NOMBRE_DETALLE?: string;
  UNIDAD_MEDIDA_E?: string;
  CANTIDAD?: number;
  STOCK?: number;
  CANTIDAD_ADECUACION?: number;
  ID_PRODUCTO_DETALLE: number;
  PEDIDO_DECIMAL?: boolean | number;
  FECHAS?: FechaStockDevolucion[];
  NOMBRE?: string;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_A?: string;
  LOTE?: string;
  FECHA_VENCIMIENTO?: string;
}

export interface RegistrarDevolucionPayload {
  id_planta_almacen: number;
  id_area: number;
  productos: Array<{
    id_producto: number;
    id_producto_detalle: number;
    cantidad_adecuacion: number;
    cantidad: number;
    fecha: string;
    producto: string;
  }>;
}

export const useDevolucionAlmacenesServices = () => {
  /**
   * 1. GET /v1/devolucion-producto/areas
   * Retorna las áreas habilitadas para el usuario autenticado.
   */
  const loadApiGetAreas = async () => {
    try {
      const respuesta = await api.get<any>('/v1/devolucion-producto/areas');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /v1/devolucion-producto/almacenes
   * Retorna los almacenes asignados al usuario autenticado.
   */
  const loadApiGetAlmacenes = async () => {
    try {
      const respuesta = await api.get<any>('/v1/devolucion-producto/almacenes');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. GET /v1/devolucion-producto/almacenes/activos
   * Retorna el catálogo general de almacenes activos.
   */
  const loadApiGetAlmacenesActivos = async () => {
    try {
      const respuesta = await api.get<any>('/v1/devolucion-producto/almacenes/activos');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. GET /v1/devolucion-producto/productos-stock?id_planta_almacen=X&id_area=Y
   * Retorna el stock de productos disponibles para devolución.
   */
  const loadApiGetProductosStock = async (idPlantaAlmacen: number | string, idArea: number | string) => {
    try {
      const respuesta = await api.get<any>('/v1/devolucion-producto/productos-stock', {
        params: {
          id_planta_almacen: idPlantaAlmacen,
          id_area: idArea,
        },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. POST /v1/devolucion-producto/devoluciones
   * Registra una nueva devolución de productos en el almacén.
   */
  const loadApiRegistrarDevolucion = async (payload: RegistrarDevolucionPayload) => {
    try {
      const respuesta = await api.post<any>('/v1/devolucion-producto/devoluciones', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 6. GET /v1/devolucion-producto/devoluciones?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z
   * Retorna el historial de devoluciones según filtros.
   */
  const loadApiGetDevoluciones = async (params: {
    id_planta_almacen?: number | string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    try {
      const respuesta = await api.get<any>('/v1/devolucion-producto/devoluciones', {
        params,
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAreas,
    loadApiGetAlmacenes,
    loadApiGetAlmacenesActivos,
    loadApiGetProductosStock,
    loadApiRegistrarDevolucion,
    loadApiGetDevoluciones,
  };
};
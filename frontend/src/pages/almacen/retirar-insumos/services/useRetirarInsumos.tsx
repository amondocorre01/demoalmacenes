/**
 * useRetirarInsumos.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Retiro de Insumos (Ajustes de Inventario por Descuento)
 *
 * APIs utilizadas:
 * ┌─────┬────────┬─────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                                                │ Descripción                                            │
 * ├─────┼────────┼─────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/ajustes/stock?id_planta_almacen=X                               │ Consultar stock disponible de productos en el almacén  │
 * │  2  │ GET    │ /inventario/ajustes/descontados?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z │ Listar historial de salidas/descuentos de inventario   │
 * │  3  │ POST   │ /inventario/ajustes/descontar                                               │ Registrar retiro/descuento de stock (transacción)      │
 * │  4  │ GET    │ /inventario/declaracion/almacenes?id_planta_almacen=0                       │ Listar almacenes asignados al usuario                  │
 * └─────┴────────┴─────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Consulta de stock en tiempo real para evitar descontar cantidades mayores a las disponibles.
 * - Registro con motivo/detalle obligatorio para auditoría de mermas y ajustes.
 * - Filtro de historial por almacén y rango de fechas (YYYY-MM-DD).
 * - Manejo centralizado de alertas y confirmaciones con SweetAlert2.
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION?: string;
  nombre?: string;
  NOMBRE?: string;
  [key: string]: any;
}

export interface ProductoStockAjuste {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  PRODUCTO_DETALLE?: string;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_E?: string;
  ID_UNIDAD_MEDIDA?: number;
  STOCK?: number;
  CANTIDAD?: number;
  CANTIDAD_ADECUACION?: number;
  [key: string]: any;
}

export interface HistorialRetiroItem {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO?: string;
  PRODUCTO_DETALLE?: string;
  CANTIDAD: number;
  UNIDAD_MEDIDA?: string;
  USUARIO_REGISTRA?: string;
  FECHA_VENCIMIENTO?: string;
  DETALLE?: string;
  [key: string]: any;
}

export interface ProductoDescontarPayload {
  id_producto?: number;
  id_producto_detalle?: number;
  id_producto_intermedio?: number;
  cantidad: number;
  detalle?: string;
  producto?: string;
}

export interface DescontarStockPayload {
  id_planta_almacen: number;
  productos: ProductoDescontarPayload[];
}

export const useRetirarInsumosServices = () => {
  /**
   * 1. GET /inventario/declaracion/almacenes?id_planta_almacen=0
   * Retorna los almacenes asignados al usuario autenticado.
   */
  const loadApiGetAlmacenes = async (idPlantaAlmacen = 0) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/declaracion/almacenes', {
        params: { id_planta_almacen: idPlantaAlmacen },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /inventario/ajustes/stock?id_planta_almacen=X
   * Consulta el stock disponible de productos en el almacén.
   */
  const loadApiGetStockAlmacen = async (idPlantaAlmacen: number) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/ajustes/stock', {
        params: { id_planta_almacen: idPlantaAlmacen },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. GET /inventario/ajustes/descontados?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z
   * Retorna el historial de productos retirados/descontados de inventario.
   */
  const loadApiGetProductosDescontados = async (
    idPlantaAlmacen: number,
    fechaInicio: string,
    fechaFin: string
  ) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/ajustes/descontados', {
        params: {
          id_planta_almacen: idPlantaAlmacen,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. POST /inventario/ajustes/descontar
   * Registra el retiro o descuento manual de stock en el almacén.
   */
  const loadApiDescontarStock = async (payload: DescontarStockPayload) => {
    try {
      const respuesta = await api.post<any>('/v1/inventario/ajustes/descontar', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetStockAlmacen,
    loadApiGetProductosDescontados,
    loadApiDescontarStock,
  };
};
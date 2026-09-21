/**
 * useHistorialProductos.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Historial de Productos en Almacén
 *
 * APIs utilizadas:
 * ┌─────┬────────┬─────────────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                                                    │ Descripción                                             │
 * ├─────┼────────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/reportes/almacenes?id_planta_almacen=0                              │ Listar almacenes asignados al usuario autenticado       │
 * │  2  │ GET    │ /inventario/ajustes/stock?id_planta_almacen=:idAlmacen                          │ Listar catálogo de productos y stock del almacén        │
 * │  3  │ GET    │ /inventario/reportes/historial                                                  │ Consultar historial detallado de movimientos de almacén │
 * └─────┴────────┴─────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Parámetros query de Historial:
 * - id_planta_almacen (número, requerido)
 * - id_producto_detalle (número, opcional, default 0)
 * - id_producto_intermedio (número, opcional, default 0)
 * - fecha_inicio (string YYYY-MM-DD, opcional)
 * - fecha_fin (string YYYY-MM-DD, opcional)
 *
 * Controles Clave:
 * - Selección reactiva de almacenes del usuario activo.
 * - Catálogo autocompletable de productos filtrados por almacén.
 * - Filtro por rango de fechas (YYYY-MM-DD) sin desfase de zona horaria.
 * - Manejo robusto de errores mediante handleApiError centralizado.
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION?: string;
  nombre?: string;
  ESTADO?: number;
}

export interface ProductoStockItem {
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO?: string;
  NOMBRE?: string;
  CODIGO?: string;
  STOCK?: number | string;
  UNIDAD_MEDIDA?: string;
  ID_UNIDAD_MEDIDA?: number;
  CATEGORIA?: string;
  SUB_CATEGORIA?: string;
}

export interface HistorialDetalleSubItem {
  ID_ALMACEN_INVENTARIO?: number;
  CANTIDAD?: number;
  CANTIDAD_UTILIZADA?: number;
  FECHA_VENCIMIENTO?: string;
  LOTE?: string;
  UNIDAD_MEDIDA?: string;
}

export interface HistorialInventarioItem {
  ID_ALMACEN_INVENTARIO?: number;
  ID_PLANTA_ALMACEN?: number;
  ALMACEN?: string;
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO?: string;
  NOMBRE?: string;
  CANTIDAD?: number | string;
  CANTIDAD_UTILIZADA?: number | string;
  CANTIDAD_INGRESO?: number | string;
  CANTIDAD_SALIDA?: number | string;
  ESTADO_INGRESO?: number; // 1 = Ingreso / Entrada, 0/2 = Salida / Descuento
  STOCK?: number | string;
  STOCK_FINAL?: number | string;
  UNIDAD_MEDIDA?: string;
  PRESENTACION?: string;
  FECHA_REGISTRO?: string;
  FECHA_VENCIMIENTO?: string;
  LOTE?: string;
  USUARIO?: string;
  USUARIO_REGISTRO?: string;
  NOMBRE_USUARIO?: string;
  TIPO_MOVIMIENTO?: string;
  MOTIVO?: string;
  ID_ESTADO?: number;
  DETALLE?: HistorialDetalleSubItem[];
}

export interface HistorialInventarioParams {
  id_planta_almacen: number;
  id_producto_detalle?: number;
  id_producto_intermedio?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export const useHistorialProductosServices = () => {
  /**
   * 1. GET /inventario/reportes/almacenes?id_planta_almacen=0
   * Retorna los almacenes asignados al usuario autenticado.
   */
  const loadApiGetAlmacenesUsuario = async (idPlantaAlmacen = 0) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/reportes/almacenes', {
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
   * Retorna el catálogo de productos con stock y presentaciones del almacén.
   */
  const loadApiGetProductosStockAlmacen = async (idPlantaAlmacen: number | string) => {
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
   * 3. GET /inventario/reportes/historial
   * Retorna el historial detallado de movimientos de inventario según filtros.
   */
  const loadApiGetHistorialInventario = async (params: HistorialInventarioParams) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/reportes/historial', {
        params: {
          id_planta_almacen: params.id_planta_almacen,
          id_producto_detalle: params.id_producto_detalle || 0,
          id_producto_intermedio: params.id_producto_intermedio || 0,
          fecha_inicio: params.fecha_inicio || '',
          fecha_fin: params.fecha_fin || '',
        },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenesUsuario,
    loadApiGetProductosStockAlmacen,
    loadApiGetHistorialInventario,
  };
};
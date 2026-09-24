/**
 * useInventarioAlmacen.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Inventario de Almacén
 *
 * APIs utilizadas:
 * ┌─────┬────────┬─────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                                │ Descripción                                             │
 * ├─────┼────────┼─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/reportes/almacenes?id_planta_almacen=0          │ Listar almacenes asignados al usuario autenticado       │
 * │  2  │ GET    │ /inventario/reportes/:idAlmacen/inventario?tipo_group=1     │ Listar inventario de productos por almacén y grupo      │
 * │  3  │ GET    │ /inventario/reportes/:idAlmacen/productos                   │ Listar productos habilitados en almacén (materia prima) │
 * │  4  │ GET    │ /inventario/reportes/:idAlmacen/productos-especiales        │ Listar productos especiales para conversión (ingreso)   │
 * │  5  │ POST   │ /inventario/reportes/:idAlmacen/depreciar                   │ Registrar conversión / depreciación de productos        │
 * │  6  │ GET    │ /inventario/reportes/:idAlmacen/depreciados                 │ Listar historial de conversiones / productos depreciados│
 * │  7  │ GET    │ /inventario/rep-desp/productos-vencidos                     │ Listar productos vencidos del almacén                   │
 * └─────┴────────┴─────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Consulta dinámica del inventario por almacén activo del usuario.
 * - Soporte de agrupación de inventario por grupo / categoría.
 * - Desglose de lotes y fechas de vencimiento por producto.
 * - Validación y registro de transformación de materia prima a producto procesado (conversión/depreciación).
 * - Historial filtrable de conversiones por rango de fechas (YYYY-MM-DD).
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
}

export interface InventarioDetalleItem {
  ID_ALMACEN_INVENTARIO?: number;
  ID_PRODUCTO?: number;
  ID_PRODUCTO_DETALLE?: number;
  CANTIDAD?: number;
  CANTIDAD_UTILIZADA?: number;
  DISPONIBLE?: number;
  STOCK_LOTE?: number;
  FECHA_REGISTRO?: string;
  FECHA_VENCIMIENTO?: string;
  USUARIO_REGISTRA?: string;
  DESCRICION?: string;
  LOTE?: string;
  UNIDAD_MEDIDA?: string;
  ID_ESTADO?: number;
}

export interface InventarioItem {
  ID_PRODUCTO: number;
  ID_PRODUCTO_DETALLE?: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO: string;
  NOMBRE?: string;
  NOMBRE_DETALLE?: string | null;
  CODIGO?: string;
  SKU?: string;
  CATEGORIA?: string;
  SUB_CATEGORIA?: string;
  CANTIDAD?: number;
  STOCK?: number | string;
  CANTIDAD_ADECUACION?: number;
  FECHA_VENCIMIENTO?: string;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_A?: string;
  UNIDAD_MEDIDA_D?: string;
  UNIDAD_MEDIDA_E?: string;
  ESTADO?: number | string;
  DETALLE?: InventarioDetalleItem[];
}

export interface ProductoAlmacenItem {
  ID_PRODUCTO: number;
  ID_PRODUCTO_INTERMEDIO?: number;
  PRODUCTO: string;
  ESTADO?: number;
  STOCK?: number | string;
  CANTIDAD?: number | string;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_A?: string;
  UNIDAD_MEDIDA_E?: string;
}

export interface ProductoEspecialItem {
  ID_PRODUCTO: number;
  NOMBRE: string;
  UNIDAD_MEDIDA?: string;
  ID_UNIDAD_MEDIDA?: number;
}

export interface DepreciarProductoPayload {
  id_producto_salida: number;
  id_producto_ingreso: number;
  cantidad_salida: number;
  cantidad_ingreso: number;
}

export interface ProductoDepreciadoItem {
  ID_PLANTA_PRODUCTO_CONVERCION?: number;
  ID_PLANTA_ALMACEN: number;
  ALMACEN?: string;
  ID_PRODUCTO_INGRESO: number;
  PRODUCTO_INGRESO?: string;
  ID_PRODUCTO_SALIDA: number;
  PRODUCTO_SALIDA?: string;
  CANTIDAD_INGRESO: number;
  CANTIDAD_SALIDA: number;
  UNIDAD_MEDIDA_INGRESO?: string;
  UNIDAD_MEDIDA_SALIDA?: string;
  FECHA_REGISTRO: string;
}

export interface ProductoVencidoItem {
  ID_ALMACEN_INVENTARIO?: number;
  ID_PLANTA_ALMACEN?: number;
  ALMACEN?: string;
  ID_PRODUCTO?: number;
  PRODUCTO?: string;
  CANTIDAD?: number;
  UNIDAD_MEDIDA?: string;
  FECHA_VENCIMIENTO?: string;
}

export const useInventarioAlmacenesServices = () => {
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
   * 2. GET /inventario/reportes/:idAlmacen/inventario?tipo_group=1
   * Retorna el inventario consolidado del almacén.
   */
  const loadApiGetInventarioAlmacen = async (idAlmacen: number | string, tipoGroup = 1) => {
    try {
      const respuesta = await api.get<any>(`/v1/inventario/reportes/${idAlmacen}/inventario`, {
        params: { tipo_group: tipoGroup },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. GET /inventario/reportes/:idAlmacen/productos
   * Retorna los productos base/materia prima asignados al almacén para conversión saliente.
   */
  const loadApiGetProductosAlmacen = async (idAlmacen: number | string) => {
    try {
      const respuesta = await api.get<any>(`/v1/inventario/reportes/${idAlmacen}/productos`);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. GET /inventario/reportes/:idAlmacen/productos-especiales
   * Retorna los productos especiales habilitados para conversión entrante.
   */
  const loadApiGetProductosEspeciales = async (idAlmacen: number | string) => {
    try {
      const respuesta = await api.get<any>(`/v1/inventario/reportes/${idAlmacen}/productos-especiales`);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. POST /inventario/reportes/:idAlmacen/depreciar
   * Registra la transformación o conversión (depreciación) de un producto a otro.
   */
  const loadApiDepreciarProducto = async (
    idAlmacen: number | string,
    payload: DepreciarProductoPayload
  ) => {
    try {
      const respuesta = await api.post<any>(`/v1/inventario/reportes/${idAlmacen}/depreciar`, payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 6. GET /inventario/reportes/:idAlmacen/depreciados?fecha_inicio=&fecha_fin=
   * Retorna el historial de productos convertidos / depreciados en el almacén.
   */
  const loadApiGetProductosDepreciados = async (
    idAlmacen: number | string,
    fechaInicio = '',
    fechaFin = ''
  ) => {
    try {
      const respuesta = await api.get<any>(`/v1/inventario/reportes/${idAlmacen}/depreciados`, {
        params: {
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
   * 7. GET /inventario/rep-desp/productos-vencidos?almacenes=X&fecha=YYYY-MM-DD
   * Retorna los productos vencidos en inventario.
   */
  const loadApiGetProductosVencidos = async (almacenes?: number | string, fecha = '') => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/rep-desp/productos-vencidos', {
        params: {
          almacenes: almacenes !== undefined && almacenes !== null ? String(almacenes) : '',
          fecha: fecha || '',
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
    loadApiGetInventarioAlmacen,
    loadApiGetProductosAlmacen,
    loadApiGetProductosEspeciales,
    loadApiDepreciarProducto,
    loadApiGetProductosDepreciados,
    loadApiGetProductosVencidos,
  };
};
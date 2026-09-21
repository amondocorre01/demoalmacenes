/**
 * useIngresoManualStock.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Ingreso Manual de Stock (Ajustes de Inventario)
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                                             │ Descripción                                            │
 * ├─────┼────────┼──────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/ajustes/stock?id_planta_almacen=X                            │ Consultar catálogo y stock de productos del almacén    │
 * │  2  │ GET    │ /inventario/ajustes/agregados?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z │ Listar historial de ingresos manuales con filtros     │
 * │  3  │ POST   │ /inventario/ajustes/agregar                                              │ Registrar nuevo ingreso manual de stock (transacción)  │
 * │  4  │ GET    │ /inventario/declaracion/almacenes?id_planta_almacen=0                    │ Listar almacenes asignados al usuario                  │
 * └─────┴────────┴──────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Filtro de historial por almacén y rango de fechas (YYYY-MM-DD).
 * - Carga de catálogo de insumos para selección autocompletable en el modal de nuevo ingreso.
 * - Validación de cantidades positivas (> 0), fechas de vencimiento válidas y lote opcional.
 * - Confirmación y alertas centralizadas con SweetAlert2.
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

export interface HistorialIngresoItem {
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

export interface ProductoAgregarPayload {
  id_producto?: number;
  id_producto_detalle?: number;
  id_producto_intermedio?: number;
  cantidad: number;
  fecha_vencimiento: string;
  id_unidad_medida: number;
  producto?: string;
  lote?: string;
}

export interface AgregarStockPayload {
  id_planta_almacen: number;
  productos: ProductoAgregarPayload[];
}

export const useIngresoManualStockServices = () => {
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
   * Consulta el stock y catálogo de productos disponibles en el almacén.
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
   * 3. GET /inventario/ajustes/agregados?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z
   * Retorna el historial de productos ingresados manualmente.
   */
  const loadApiGetProductosAgregados = async (
    idPlantaAlmacen: number,
    fechaInicio: string,
    fechaFin: string
  ) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/ajustes/agregados', {
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
   * 4. POST /inventario/ajustes/agregar
   * Registra un nuevo ingreso manual de productos al stock del almacén.
   */
  const loadApiAgregarStock = async (payload: AgregarStockPayload) => {
    try {
      const respuesta = await api.post<any>('/v1/inventario/ajustes/agregar', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetStockAlmacen,
    loadApiGetProductosAgregados,
    loadApiAgregarStock,
  };
};
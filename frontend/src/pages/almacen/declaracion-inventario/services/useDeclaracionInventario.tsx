/**
 * useDeclaracionInventario.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Declaración de Inventario
 *
 * APIs utilizadas:
 * ┌─────┬────────┬────────────────────────────────────────────────────────┬───────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                           │ Descripción                                   │
 * ├─────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/declaracion/almacenes?id_planta_almacen=0  │ Listar almacenes asignados al usuario         │
 * │  2  │ GET    │ /inventario/declaracion/:idAlmacen?fecha=YYYY-MM-DD    │ Obtener declaración de inventario por fecha   │
 * │  3  │ POST   │ /inventario/declaracion/:idAlmacen                     │ Guardar / Actualizar declaración de inventario│
 * └─────┴────────┴────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Consulta de stock e inventario declarado por almacén y fecha seleccionada.
 * - Validación para asegurar que la declaración se realice en la fecha actual antes de guardar.
 * - Registro estructurado con array de productos (id_producto, id_producto_detalle, id_producto_intermedio, cantidad, cantidad_adecuacion, observacion).
 */

import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION?: string;
  nombre?: string;
  NOMBRE?: string;
  ESTADO?: number;
  FECHA_REGISTRO?: string;
  [key: string]: any;
}

export interface DeclaracionProductoItem {
  ID_PRODUCTO: number;
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO_INTERMEDIO: number;
  PRODUCTO: string;
  PRODUCTO_FACTURADO?: string;
  FACTURADO?: string;
  NOMBRE_FACTURADO?: string;
  STOCK?: number;
  STOCK_SISTEMA?: number;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_E?: string;
  MEDIDA_NOTA?: string;
  NOTA?: string;
  UNIDAD_DECLARACION?: string;
  UNIDAD_MEDIDA_A?: string;
  CANTIDAD?: number;
  CANTIDAD_DECLARADA?: number;
  CANTIDAD_ADECUACION?: number;
  OBSERVACION?: string;
  ID_ALMACEN_DOCUMENTO_INVENTARIO?: number;
  ID_ALMACEN_DECLARACION_INVENTARIO?: number;
  // Campos de edición en cliente:
  cantidad_declarada?: number | string;
  observacion_declaracion?: string;
  [key: string]: any;
}

export interface DeclaracionDocumento {
  ID_ALMACEN_DOCUMENTO_INVENTARIO?: number;
  ID_PLANTA_ALMACEN?: number;
  FECHA_REGISTRO?: string;
  FECHA_MODIFICACION?: string;
  FECHA_VERIFICACION?: string;
  ESTADO_VERIFICACION?: boolean | number;
  ESTADO?: number;
  [key: string]: any;
}

export interface UltimaVerificacion {
  ID_ALMACEN_DOCUMENTO_INVENTARIO?: number;
  ID_PLANTA_ALMACEN?: number;
  FECHA_REGISTRO?: string;
  FECHA_VERIFICACION?: string;
  ESTADO_VERIFICACION?: boolean | number;
  [key: string]: any;
}

export interface DeclaracionResponse {
  success: boolean;
  id_documento: number;
  documento?: DeclaracionDocumento | null;
  ulitimo_verificacion?: UltimaVerificacion | null;
  dias: number;
  productos: DeclaracionProductoItem[];
  message?: string;
}

export interface GuardarDeclaracionPayload {
  fecha?: string;
  productos: Array<{
    id_producto: number;
    id_producto_detalle: number;
    id_producto_intermedio: number;
    cantidad: number;
    cantidad_adecuacion: number;
    observacion?: string;
    producto?: string;
  }>;
}

export const useDeclaracionInventarioServices = () => {
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
   * 2. GET /inventario/declaracion/:idAlmacen?fecha=YYYY-MM-DD
   * Obtiene la declaración de inventario del almacén para una fecha determinada.
   */
  const loadApiGetDeclaracion = async (idAlmacen: number, fecha?: string): Promise<DeclaracionResponse | null> => {
    try {
      const respuesta = await api.get<DeclaracionResponse>(`/v1/inventario/declaracion/${idAlmacen}`, {
        params: { fecha: fecha || '' },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. POST /inventario/declaracion/:idAlmacen
   * Guarda o actualiza la declaración de inventario del almacén.
   */
  const loadApiGuardarDeclaracion = async (idAlmacen: number, payload: GuardarDeclaracionPayload) => {
    try {
      const respuesta = await api.post<any>(`/v1/inventario/declaracion/${idAlmacen}`, payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetDeclaracion,
    loadApiGuardarDeclaracion,
  };
};
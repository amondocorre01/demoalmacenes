/**
 * useVerificacionInventario.tsx
 * ─────────────────────────────────────────────────────────────
 * Módulo: Verificación de Declaración de Inventario
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                                 │ Descripción                                      │
 * ├─────┼────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
 * │  1  │ GET    │ /inventario/verif-declaracion/almacenes?id_planta_almacen=0  │ Listar almacenes asignados al usuario            │
 * │  2  │ GET    │ /inventario/verif-declaracion/:idAlmacen?fecha=YYYY-MM-DD    │ Obtener declaración a verificar por fecha        │
 * │  3  │ POST   │ /inventario/verif-declaracion/:idAlmacen                     │ Guardar verificación y procesar ajustes/descuadres│
 * │  4  │ GET    │ /inventario/verif-declaracion/:idAlmacen/verificadas         │ Listar declaraciones verificadas del almacén     │
 * └─────┴────────┴──────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Consulta de la declaración registrada para auditar cantidades declaradas vs stock de sistema.
 * - Registro de la verificación que automáticamente calcula discrepancias, actualiza kardex y genera desperdicios por descuadre.
 * - Validación para asegurar que la verificación se realice sobre la fecha actual y no se repita en documentos ya verificados.
 * - Consulta de historial de almacenes y sus estados de última verificación.
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
  ULTIMA_VERIFICACION?: {
    ID_ALMACEN_DOCUMENTO_INVENTARIO?: number;
    ID_PLANTA_ALMACEN?: number;
    FECHA_REGISTRO?: string;
    FECHA_VERIFICACION?: string;
    ESTADO_VERIFICACION?: boolean | number;
    [key: string]: any;
  } | null;
  DIAS?: number;
  [key: string]: any;
}

export interface VerificacionProductoItem {
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
  CANTIDAD?: number; // Cantidad declarada por el usuario en Declaración
  CANTIDAD_DECLARADA?: number;
  CANTIDAD_VERIFICADA?: number;
  CANTIDAD_ADECUACION?: number;
  OBSERVACION?: string;
  ID_ALMACEN_DOCUMENTO_INVENTARIO?: number;
  ID_ALMACEN_DECLARACION_INVENTARIO?: number;
  // Campos de edición y cálculo en cliente:
  cantidad_verificada?: number | string;
  observacion_verificacion?: string;
  [key: string]: any;
}

export interface VerificacionDocumento {
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

export interface VerificacionResponse {
  success: boolean;
  id_documento: number;
  documento?: VerificacionDocumento | null;
  ulitimo_verificacion?: UltimaVerificacion | null;
  dias: number;
  productos: VerificacionProductoItem[];
  message?: string;
}

export interface GuardarVerificacionPayload {
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

export const useVerificacionInventarioServices = () => {
  /**
   * 1. GET /inventario/verif-declaracion/almacenes?id_planta_almacen=0
   * Retorna los almacenes asignados al usuario autenticado.
   */
  const loadApiGetAlmacenes = async (idPlantaAlmacen = 0) => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/verif-declaracion/almacenes', {
        params: { id_planta_almacen: idPlantaAlmacen },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /inventario/verif-declaracion/:idAlmacen?fecha=YYYY-MM-DD
   * Obtiene la declaración de inventario del almacén para auditar/verificar.
   */
  const loadApiGetDeclaracion = async (idAlmacen: number, fecha?: string): Promise<VerificacionResponse | null> => {
    try {
      const respuesta = await api.get<VerificacionResponse>(`/v1/inventario/verif-declaracion/${idAlmacen}`, {
        params: { fecha: fecha || '' },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. POST /inventario/verif-declaracion/:idAlmacen
   * Guarda y aprueba la verificación de la declaración de inventario.
   */
  const loadApiGuardarVerificacion = async (idAlmacen: number, payload: GuardarVerificacionPayload) => {
    try {
      const respuesta = await api.post<any>(`/v1/inventario/verif-declaracion/${idAlmacen}`, payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. GET /inventario/verif-declaracion/:idAlmacen/verificadas
   * Lista las declaraciones y almacenes verificados con cálculo de días.
   */
  const loadApiGetDeclaracionesVerificadas = async (idAlmacen: number) => {
    try {
      const respuesta = await api.get<any>(`/v1/inventario/verif-declaracion/${idAlmacen}/verificadas`);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetDeclaracion,
    loadApiGuardarVerificacion,
    loadApiGetDeclaracionesVerificadas,
  };
};
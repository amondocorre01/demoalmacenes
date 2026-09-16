import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

/**
 * useTransferenciaAlmacenServices
 * ─────────────────────────────────────────────────────────────
 * Vista: Transferencia de Productos Intermedios
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                 │ Descripción                                     │
 * ├─────┼────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/transferencia/usuarios/almacenes         │ Almacenes asignados al usuario autenticado      │
 * │  2  │ GET    │ /v1/transferencia/almacenes-activos          │ Catálogo de todos los almacenes activos         │
 * │  3  │ POST   │ /v1/transferencia/registrar-transferencia    │ Registrar transferencia de stock                │
 * │  4  │ GET    │ /v1/transferencia/pi/transferencias          │ Listar transferencias de Productos Intermedios  │
 * │  5  │ GET    │ /v1/transferencia/pi/stock                   │ Stock disponible de PI por almacén              │
 * └─────┴────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Selección de Almacén Origen y Almacén Destino (no pueden ser iguales).
 * - Carga dinámica del stock real de productos intermedios del almacén origen.
 * - Validación para evitar transferir cantidades superiores al stock disponible.
 * - Registro con transacción en backend (salida de origen y entrada en destino).
 */

export interface TransferenciaItem {
  ID_DOCUMENTO_TRANSFERENCIA: number;
  ID_PLANTA_ALMACEN?: number;
  ID_PLANTA_ALMACEN_DESTINO?: number;
  FECHA_REGISTRO: string;
  HORA_REGISTRO?: string;
  ORIGEN?: string;
  DESTINO?: string;
  ALMACEN_ORIGEN?: string;
  ALMACEN_DESTINO?: string;
  USUARIO?: string;
  NOMBRE_USUARIO?: string;
  ESTADO?: number | string;
  ENVIO?: number;
  DETALLE?: Array<{
    ID_PRODUCTO_INTERMEDIO?: number;
    ID_PRODUCTO_DETALLE?: number;
    PRODUCTO?: string;
    PRODUCTO_INTERMEDIO?: string;
    PRODUCTO_DETALLE?: string;
    NOMBRE?: string;
    CANTIDAD_TRANFERIDA?: number;
    CANTIDAD?: number;
    UNIDAD_MEDIDA?: string;
    LOTE?: string;
    FECHA_VENCIMIENTO?: string;
  }>;
}

export interface ProductoIntermedioStock {
  ID_PRODUCTO_INTERMEDIO: number;
  NOMBRE: string;
  STOCK: number;
  CANTIDAD_ADECUACION?: number;
  UNIDAD_MEDIDA?: string;
  ID_UNIDAD_MEDIDA?: number;
  REQUIERE_LOTEO?: number;
}

export const useTransferenciaAlmacenServices = () => {
  /**
   * 1. GET /v1/transferencia/usuarios/almacenes
   * Retorna los almacenes asignados al usuario autenticado.
   */
  const loadApiGetAlmacenesUsuario = async () => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/usuarios/almacenes');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /v1/transferencia/almacenes-activos
   * Retorna la lista global de almacenes activos para destino.
   */
  const loadApiGetAlmacenesActivos = async () => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/almacenes-activos');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. POST /v1/transferencia/registrar-transferencia
   * Registra una transferencia de productos intermedios entre almacenes.
   */
  const loadApiRegistrarTransferencia = async (payload: {
    id_planta_almacen: number;
    id_planta_almacen_destino: number;
    productos: Array<{
      id_producto_intermedio: number;
      id_producto_detalle?: number;
      cantidad_adecuacion?: number;
      cantidad: number;
      id_unidad_medida?: number;
      producto?: string;
    }>;
  }) => {
    try {
      const respuesta = await api.post<any>('/v1/transferencia/registrar-transferencia', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. GET /v1/transferencia/pi/transferencias
   * Lista el historial de transferencias de productos intermedios con filtros.
   */
  const loadApiGetTransferenciasPI = async (params: {
    id_planta_almacen: number | string;
    fecha_inicio: string;
    fecha_fin: string;
  }) => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/pi/transferencias', { params });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. GET /v1/transferencia/pi/stock
   * Retorna los productos intermedios con su stock disponible en el almacén seleccionado.
   */
  const loadApiGetStockPI = async (idPlantaAlmacen: number | string) => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/pi/stock', {
        params: { id_planta_almacen: idPlantaAlmacen },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenesUsuario,
    loadApiGetAlmacenesActivos,
    loadApiRegistrarTransferencia,
    loadApiGetTransferenciasPI,
    loadApiGetStockPI,
  };
};

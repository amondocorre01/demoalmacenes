import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

/**
 * useTransferenciaAlmacenInsumosServices
 * ─────────────────────────────────────────────────────────────
 * Vista: Transferencia de Insumos
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                 │ Descripción                                     │
 * ├─────┼────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/transferencia/usuarios/almacenes         │ Almacenes asignados al usuario autenticado      │
 * │  2  │ GET    │ /v1/transferencia/almacenes-activos          │ Catálogo de todos los almacenes activos         │
 * │  3  │ POST   │ /v1/transferencia/registrar-transferencia    │ Registrar transferencia de insumos              │
 * │  4  │ GET    │ /v1/transferencia/insumos/transferencias     │ Listar transferencias de Insumos                │
 * │  5  │ GET    │ /v1/transferencia/insumos/stock              │ Stock disponible de Insumos por almacén         │
 * └─────┴────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Selección de Almacén Origen y Almacén Destino (no pueden ser iguales).
 * - Carga dinámica del stock real de insumos / materias primas del almacén origen.
 * - Validación para evitar transferir cantidades superiores al stock disponible.
 * - Registro con transacción en backend (salida de origen y entrada en destino).
 */

export interface TransferenciaInsumoItem {
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
    ID_PRODUCTO_DETALLE?: number;
    PRODUCTO?: string;
    NOMBRE?: string;
    CANTIDAD_TRANFERIDA?: number;
    CANTIDAD?: number;
    UNIDAD_MEDIDA?: string;
    LOTE?: string;
    FECHA_VENCIMIENTO?: string;
  }>;
}

export interface ProductoInsumoStock {
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO?: number;
  NOMBRE?: string;
  PRODUCTO?: string;
  STOCK: number;
  CANTIDAD_ADECUACION?: number;
  UNIDAD_MEDIDA?: string;
  UNIDAD_MEDIDA_A?: string;
  ID_UNIDAD_MEDIDA?: number;
}

export const useTransferenciaAlmacenInsumosServices = () => {
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
   * Registra una transferencia de insumos entre almacenes.
   */
  const loadApiRegistrarTransferencia = async (payload: {
    id_planta_almacen: number;
    id_planta_almacen_destino: number;
    productos: Array<{
      id_producto_intermedio?: number;
      id_producto_detalle: number;
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
   * 4. GET /v1/transferencia/insumos/transferencias
   * Lista el historial de transferencias de insumos con filtros.
   */
  const loadApiGetTransferenciasInsumos = async (params: {
    id_planta_almacen: number | string;
    fecha_inicio: string;
    fecha_fin: string;
  }) => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/insumos/transferencias', { params });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. GET /v1/transferencia/insumos/stock
   * Retorna los insumos con su stock disponible en el almacén seleccionado.
   */
  const loadApiGetStockInsumos = async (idPlantaAlmacen: number | string) => {
    try {
      const respuesta = await api.get<any>('/v1/transferencia/insumos/stock', {
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
    loadApiGetTransferenciasInsumos,
    loadApiGetStockInsumos,
  };
};

/**
 * usePedidosAlmacenSegunSucursales.tsx
 * 
 * Hook de servicios para la gestión de pedidos y solicitudes de traspaso entre almacenes
 * según requerimientos de sucursales.
 * 
 * Endpoints:
 * 1. GET   /v1/pedido-almacen/solicitantes                 -> Almacenes solicitantes con sus destinos
 * 2. GET   /v1/pedido-almacen/productos                    -> Catálogo de productos e intermedios con stock
 * 3. GET   /v1/pedido-almacen/solicitudes                  -> Listado de solicitudes con filtros
 * 4. GET   /v1/pedido-almacen/solicitudes/:id              -> Detalle completo de una solicitud
 * 5. POST  /v1/pedido-almacen/solicitudes                  -> Registrar nueva solicitud
 * 6. PUT   /v1/pedido-almacen/solicitudes                  -> Editar cantidades de solicitud pendiente
 * 7. PATCH /v1/pedido-almacen/solicitudes/enviar           -> Despachar / Enviar solicitud transferida
 * 8. PATCH /v1/pedido-almacen/solicitudes/recibir          -> Confirmar recepción de solicitud
 * 9. PATCH /v1/pedido-almacen/solicitudes/:id/cancelar     -> Cancelar solicitud
 */

import { useCallback } from 'react';
import api from '../../../../config/api';
import { handleApiError, showAlert } from '../../../../config/alerts';

export interface AlmacenDestino {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
}

export interface AlmacenSolicitante {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  DESTINOS: AlmacenDestino[];
}

export interface ProductoCatalogoItem {
  ID_PLANTA_ALMACEN: number;
  ID_PRODUCTO: number;
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO_INTERMEDIO: number;
  GRUPO: string;
  PRODUCTO: string;
  CANTIDAD_ESTANDAR: number;
  CANTIDAD_ADECUACION: number;
  UNIDAD_MEDIDA_E: string;
  UNIDAD_MEDIDA_A: string;
  PRESENTACION: string;
  STOCK: number;
  PEDIDO_DECIMAL?: boolean | number;
}

export interface SolicitudDetalleItem {
  ID_ALMACEN_SOLICITUD_DETALLE: number;
  CANTIDAD_SOLICITADA: number;
  CANTIDAD_ENVIADA: number;
  CANTIDAD_ACEPTADA: number;
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO_INTERMEDIO: number;
  ID_UNIDAD: number;
  ESTADO_SOLICITUD: number;
  GRUPO: string;
  PRODUCTO: string;
  CANTIDAD_ESTANDAR: number;
  CANTIDAD_ADECUACION: number;
  UNIDAD_MEDIDA_E: string;
  UNIDAD_MEDIDA_A: string;
  STOCK?: number;
  PEDIDO_DECIMAL?: boolean | number;
}

export interface SolicitudRegistroItem {
  FECHA: string;
  ID_USUARIO: number;
  ID_ESTADO: number;
  NOMBRE_COMPLETO: string;
}

export interface SolicitudPedidoAlmacenItem {
  ID_ALMACEN_SOLICITUD_DOCUMENTO: number;
  ID_ALMACEN_SOLICITANTE: number;
  ID_ALMACEN_DESTINO: number;
  ALMACEN_SOLICITANTE: string;
  ALMACEN_DESTINO: string;
  FECHA_REGISTRO: string;
  HORA_REGISTRO: string;
  FECHA_A_ENTREGAR: string;
  ID_USUARIO: number;
  ESTADO: number; // 1: Solicitado / Pendiente, 2: Enviado / En Tránsito, 3: Recibido / Entregado, 4: Cancelado
  DETALLE: SolicitudDetalleItem[];
  REGISTROS?: SolicitudRegistroItem[];
}

export interface CrearSolicitudPayload {
  id_almacen_solicitante: number;
  id_almacen_destino: number;
  fecha_entrega: string;
  productos: Array<{
    id_producto_detalle: number;
    id_producto_intermedio: number;
    id_unidad: number;
    cantidad: number;
    producto?: string;
  }>;
}

export interface EditarSolicitudPayload {
  id_documento: number;
  productos: Array<{
    id_producto_detalle: number;
    id_producto_intermedio: number;
    cantidad: number;
    producto?: string;
  }>;
}

export interface EnviarSolicitudPayload {
  id_documento: number;
  detalles: Array<{
    id_detalle: number;
    cantidad_enviada: number;
  }>;
}

export interface RecibirSolicitudPayload {
  id_documento: number;
  detalles: Array<{
    id_detalle: number;
    cantidad_aceptada: number;
  }>;
}

export const usePedidosAlmacenSegunSucursalesServices = () => {
  /**
   * 1. GET /v1/pedido-almacen/solicitantes
   * Obtiene la lista de almacenes que el usuario tiene habilitados para solicitar y sus almacenes destino.
   */
  const loadApiGetAlmacenesSolicitantes = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; almacenes: AlmacenSolicitante[] }>(
        '/v1/pedido-almacen/solicitantes'
      );
      return response.data?.almacenes || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }, []);

  /**
   * 2. GET /v1/pedido-almacen/productos
   * Obtiene los productos disponibles con stock del almacén destino seleccionado.
   */
  const loadApiGetProductos = useCallback(
    async (idAlmacen: number, idAlmacenSolicitante: number, tipo: 'all' | 'insumo' | 'intermedio' = 'all') => {
      try {
        const response = await api.get<{ success: boolean; productos: ProductoCatalogoItem[] }>(
          '/v1/pedido-almacen/productos',
          {
            params: {
              id_almacen: idAlmacen,
              id_almacen_solicitante: idAlmacenSolicitante,
              tipo,
            },
          }
        );
        return response.data?.productos || [];
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },
    []
  );

  /**
   * 3. GET /v1/pedido-almacen/solicitudes
   * Obtiene el listado de solicitudes filtrado por almacén solicitante, destino y rango de fechas.
   */
  const loadApiGetSolicitudes = useCallback(
    async (params: {
      id_almacen_solicitante?: number;
      id_almacen_destino?: number;
      fecha_inicio?: string;
      fecha_fin?: string;
    }) => {
      try {
        const response = await api.get<{ success: boolean; solicitudes?: SolicitudPedidoAlmacenItem[]; message?: string }>(
          '/v1/pedido-almacen/solicitudes',
          { params }
        );
        if (response.data?.success && Array.isArray(response.data.solicitudes)) {
          return response.data.solicitudes;
        }
        return [];
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },
    []
  );

  /**
   * 4. GET /v1/pedido-almacen/solicitudes/:id
   * Obtiene el detalle completo y registros de trazabilidad de una solicitud.
   */
  const loadApiGetSolicitudById = useCallback(async (idDocumento: number) => {
    try {
      const response = await api.get<{ success: boolean; solicitud?: SolicitudPedidoAlmacenItem; message?: string }>(
        `/v1/pedido-almacen/solicitudes/${idDocumento}`
      );
      if (response.data?.success && response.data.solicitud) {
        return response.data.solicitud;
      }
      return null;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }, []);

  /**
   * 5. POST /v1/pedido-almacen/solicitudes
   * Registra una nueva solicitud de pedido entre almacenes.
   */
  const loadApiCrearSolicitud = useCallback(async (payload: CrearSolicitudPayload) => {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        id_documento?: number;
        productos?: Array<{ producto: string; solicitado: number; stock: number; id_producto_detalle?: number }>;
      }>('/v1/pedido-almacen/solicitudes', payload);
      return response.data;
    } catch (error: any) {
      if (error?.response?.data && (error.response.data.success === false || error.response.data.productos || error.response.data.message)) {
        return error.response.data;
      }
      handleApiError(error);
      return { success: false, message: 'Error al registrar solicitud.' };
    }
  }, []);

  /**
   * 6. PUT /v1/pedido-almacen/solicitudes
   * Modifica las cantidades de productos de una solicitud pendiente.
   */
  const loadApiEditarSolicitud = useCallback(async (payload: EditarSolicitudPayload) => {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        productos?: Array<{ producto: string; solicitado: number; stock: number; id_producto_detalle?: number }>;
      }>('/v1/pedido-almacen/solicitudes', payload);
      return response.data;
    } catch (error: any) {
      if (error?.response?.data && (error.response.data.success === false || error.response.data.productos || error.response.data.message)) {
        return error.response.data;
      }
      handleApiError(error);
      return { success: false, message: 'Error al editar solicitud.' };
    }
  }, []);

  /**
   * 7. PATCH /v1/pedido-almacen/solicitudes/enviar
   * Realiza el despacho/envío de productos y transfiere el inventario.
   */
  const loadApiEnviarSolicitud = useCallback(async (payload: EnviarSolicitudPayload) => {
    try {
      const response = await api.patch<{
        success: boolean;
        message: string;
        productos?: Array<{ id_detalle: number; producto: string; solicitado: number; stock: number }>;
      }>('/v1/pedido-almacen/solicitudes/enviar', payload);
      return response.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, message: 'Error al enviar solicitud.' };
    }
  }, []);

  /**
   * 8. PATCH /v1/pedido-almacen/solicitudes/recibir
   * Confirma la recepción de las cantidades aceptadas en el almacén solicitante.
   */
  const loadApiRecibirSolicitud = useCallback(async (payload: RecibirSolicitudPayload) => {
    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        '/v1/pedido-almacen/solicitudes/recibir',
        payload
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, message: 'Error al recibir solicitud.' };
    }
  }, []);

  /**
   * 9. PATCH /v1/pedido-almacen/solicitudes/:id/cancelar
   * Cancela una solicitud en estado pendiente.
   */
  const loadApiCancelarSolicitud = useCallback(async (idDocumento: number) => {
    try {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/v1/pedido-almacen/solicitudes/${idDocumento}/cancelar`
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
      return { success: false, message: 'Error al cancelar solicitud.' };
    }
  }, []);

  return {
    loadApiGetAlmacenesSolicitantes,
    loadApiGetProductos,
    loadApiGetSolicitudes,
    loadApiGetSolicitudById,
    loadApiCrearSolicitud,
    loadApiEditarSolicitud,
    loadApiEnviarSolicitud,
    loadApiRecibirSolicitud,
    loadApiCancelarSolicitud,
  };
};

export default usePedidosAlmacenSegunSucursalesServices;

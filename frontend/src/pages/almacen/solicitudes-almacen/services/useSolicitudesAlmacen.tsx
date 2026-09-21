import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

/**
 * useSolicitudesAlmacenServices
 * ─────────────────────────────────────────────────────────────
 * Vista: Solicitudes de Almacén
 *
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                 │ Descripción                                     │
 * ├─────┼────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 * │  1  │ GET    │ /v1/pedidos/almacenes                        │ Almacenes asignados al usuario autenticado      │
 * │  2  │ GET    │ /v1/pedidos/productos-planta-almacen         │ Catálogo de productos y stock por almacén/área  │
 * │  3  │ GET    │ /v1/pedidos/inventario-planta                │ Inventario disponible de planta                 │
 * │  4  │ POST   │ /v1/pedidos/solicitudes                      │ Registrar nueva solicitud de almacén            │
 * │  5  │ PUT    │ /v1/pedidos/solicitudes                      │ Editar solicitud de almacén existente           │
 * │  6  │ GET    │ /v1/pedidos/pedidos-almacen                  │ Listar pedidos/solicitudes con filtros          │
 * │  7  │ GET    │ /v1/inventario/produccion/areas              │ Áreas habilitadas para el usuario               │
 * └─────┴────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────┘
 *
 * Controles Clave:
 * - Selección obligatoria de Área y Almacén para cargar la lista de productos y validar stock disponible en planta.
 * - Validación estricta para no permitir solicitar cantidades superiores al stock disponible en inventario.
 * - Formato de fechas: Envío en formato ISO 'YYYY-MM-DD' al backend y visualización 'DD/MM/YYYY' en interfaz.
 * - El payload de productos se estructura como un mapa indexado por ID_PRODUCTO_DETALLE: { [id]: { cantidad, id_detalle? } }.
 */

export interface SolicitudAlmacenItem {
  ID_PLANTA_ALMACEN_DOCUMENTO: number;
  FECHA_REGISTRO: string;
  HORA_REGISTRO: string;
  FECHA_A_ENTREGAR: string;
  ALMACEN: string;
  NOMBRE_USUARIO: string;
  AREA: string;
  ESTADO: number | string;
  ID_AREA?: number;
  ID_PLANTA_ALMACEN?: number;
  DETALLE?: Array<{
    ID_PLANTA_ALMACEN_DETALLE?: number;
    ID_PRODUCTO_DETALLE: number;
    PRODUCTO: string;
    CANTIDAD_SOLICITADA: number;
    CANTIDAD_ENTREGADA?: number;
    CANTIDAD_ENVIADA?: number | string;
    UNIDAD_MEDIDA?: string;
    PRESENTACION?: string;
    ESTADO?: number;
  }>;
}

export interface ProductoPlantaAlmacen {
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO: number;
  NOMBRE: string;
  PRODUCTO: string;
  UNIDAD_MEDIDA: string;
  PRESENTACION: string;
  CANTIDAD_MEDIDA: number | string;
  UNIDAD_MEDIDA_A: string;
  PEDIDO_DECIMAL: number;
  STOCK: number;
}

export const useSolicitudesAlmacenServices = () => {
  /**
   * 1. GET /v1/pedidos/almacenes
   * Retorna los almacenes asignados al usuario autenticado (via token JWT).
   */
  const loadApiGetAlmacenesUsuario = async () => {
    try {
      const respuesta = await api.get<any>('/v1/pedidos/almacenes');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 2. GET /v1/pedidos/productos-planta-almacen?id_area=X&id_planta_almacen=Y
   * Retorna los productos habilitados para el almacén y área seleccionados con su stock actual.
   */
  const loadApiGetProductosPlantaAlmacen = async (idArea: number | string, idPlantaAlmacen: number | string) => {
    try {
      const respuesta = await api.get<any>('/v1/pedidos/productos-planta-almacen', {
        params: {
          id_area: idArea,
          id_planta_almacen: idPlantaAlmacen,
        },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 3. GET /v1/pedidos/inventario-planta?id_area=X&id_planta_almacen_documento=Y
   * Retorna el mapa de inventario disponible por producto detalle.
   */
  const loadApiGetInventarioPlanta = async (idArea: number | string, idDocumento: number | string = 0) => {
    try {
      const respuesta = await api.get<any>('/v1/pedidos/inventario-planta', {
        params: {
          id_area: idArea,
          id_planta_almacen_documento: idDocumento,
        },
      });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 4. POST /v1/pedidos/solicitudes
   * Registra una nueva solicitud de almacén con sus productos y cantidades.
   */
  const loadApiEnviarSolicitud = async (payload: {
    id_planta_almacen: number;
    id_area: number;
    fecha_entrega: string;
    productos: Record<string | number, { cantidad: number }>;
  }) => {
    try {
      const respuesta = await api.post<any>('/v1/pedidos/solicitudes', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 5. PUT /v1/pedidos/solicitudes
   * Edita las cantidades de una solicitud existente.
   */
  const loadApiEditarSolicitud = async (payload: {
    id_documento: number;
    id_area: number;
    productos: Record<string | number, { cantidad: number; id_detalle?: number }>;
  }) => {
    try {
      const respuesta = await api.put<any>('/v1/pedidos/solicitudes', payload);
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 6. GET /v1/pedidos/pedidos-almacen
   * Retorna la lista de pedidos con filtros aplicados (almacén, rango de fechas).
   */
  const loadApiGetPedidosAlmacen = async (params: {
    id_planta_almacen?: number;
    almacenes?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    try {
      const respuesta = await api.get<any>('/v1/pedidos/pedidos-almacen', { params });
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  /**
   * 7. GET /v1/inventario/produccion/areas
   * Retorna las áreas activas con permiso para el usuario autenticado.
   */
  const loadApiGetAreasUsuario = async () => {
    try {
      const respuesta = await api.get<any>('/v1/inventario/produccion/areas');
      return respuesta.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  };

  return {
    loadApiGetAlmacenesUsuario,
    loadApiGetProductosPlantaAlmacen,
    loadApiGetInventarioPlanta,
    loadApiEnviarSolicitud,
    loadApiEditarSolicitud,
    loadApiGetPedidosAlmacen,
    loadApiGetAreasUsuario,
  };
};

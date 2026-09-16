import { handleApiError } from '../../../../config/alerts';
import api from '../../../../config/api';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN: number;
  DESCRICION: string;
  ESTADO?: number;
  nombre?: string;
}

export interface UsuarioItem {
  ID_USUARIO: number;
  NOMBRE_COMPLETO: string;
  USUARIO?: string;
  CARGO?: string;
  PERFIL?: string;
}

export interface DesperdicioItem {
  ID_PLANTA_DESPERDICIO_ALMACEN: number;
  ID_DESPERDICIO_ALMACEN?: number;
  ID_DESPERDICIO?: number;
  ID_PLANTA_ALMACEN?: number;
  ALMACEN?: string;
  DESCRICION?: string;
  FECHA_REGISTRO: string;
  FECHA_VENCIMIENTO?: string;
  PRODUCTO?: string;
  NOMBRE_PRODUCTO?: string;
  NOMBRE_DETALLE?: string;
  CANTIDAD: number;
  UNIDAD_MEDIDA?: string;
  MEDIDA?: string;
  PRECIO_CONSUMO_INTERNO?: number;
  PRECIO?: number;
  TOTAL_ASUMIDO?: number;
  TOTAL?: number;
  ID_USUARIO_ASUMIDO?: number | null;
  USUARIO_ASUMIDO?: string | null;
  USUARIO?: string | null;
  USUARIOS?: UsuarioItem[];
  CRITICO?: boolean | number;
  ESTADO?: number | string;
}

export interface DesperdiciosParams {
  almacenes?: string | number[];
  fecha_inicio?: string;
  fecha_fin?: string;
  id_estado?: number;
}

export interface AsignarResponsablePayload {
  id_desperdicio_alamcen: number;
  id_usuario: number;
}

export const useReposicionProductosVencidosServices = () => {
  /**
   * Obtiene la lista de almacenes autorizados para el usuario
   */
  const loadApiGetAlmacenes = async (idPlantaAlmacen = 0): Promise<AlmacenItem[]> => {
    try {
      const respuesta = await api.get<any>(
        '/v1/inventario/declaracion/almacenes',
        {
          params: { id_planta_almacen: idPlantaAlmacen },
        }
      );
      if (Array.isArray(respuesta.data)) {
        return respuesta.data;
      }
      if (respuesta.data && Array.isArray(respuesta.data.datos)) {
        return respuesta.data.datos;
      }
      if (respuesta.data && Array.isArray(respuesta.data.data)) {
        return respuesta.data.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  };

  /**
   * Obtiene la lista de desperdicios según filtros
   */
  const loadApiGetDesperdicios = async (params: DesperdiciosParams): Promise<DesperdicioItem[]> => {
    try {
      const almacenesParam = Array.isArray(params.almacenes)
        ? (params.almacenes.length === 0 ? '' : params.almacenes.join(','))
        : (params.almacenes || '');

      const respuesta = await api.get<{ success?: boolean; data: DesperdicioItem[] }>(
        '/v1/inventario/rep-desp/desperdicios',
        {
          params: {
            almacenes: almacenesParam,
            fecha_inicio: params.fecha_inicio || '',
            fecha_fin: params.fecha_fin || '',
            id_estado: params.id_estado ?? 0,
          },
        }
      );

      if (respuesta.data && Array.isArray(respuesta.data.data)) {
        return respuesta.data.data;
      }
      if (Array.isArray(respuesta.data)) {
        return respuesta.data;
      }
      return [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  };

  /**
   * Asigna el responsable de un desperdicio
   */
  const loadApiAsignarResponsableDesperdicio = async (payload: AsignarResponsablePayload): Promise<boolean> => {
    try {
      const respuesta = await api.post<{ success: boolean; message: string }>(
        '/v1/inventario/rep-desp/asignar-responsable-desperdicio',
        payload
      );
      return respuesta.data?.success ?? true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  };

  return {
    loadApiGetAlmacenes,
    loadApiGetDesperdicios,
    loadApiAsignarResponsableDesperdicio,
  };
};
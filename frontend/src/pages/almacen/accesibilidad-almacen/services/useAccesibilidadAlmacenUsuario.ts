import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export interface AlmacenItem {
  ID_PLANTA_ALMACEN?: number;
  ID_ALMACEN?: number;
  id_almacen?: number;
  DESCRICION?: string;
  DESCRIPCION?: string;
  NOMBRE?: string;
  ALMACEN?: string;
  ESTADO?: number;
  [key: string]: any;
}

export interface UsuarioAccesibilidadAlmacen {
  ID_USUARIO: number;
  NOMBRE_COMPLETO: string;
  ALMACENES?: AlmacenItem[];
  [key: string]: any;
}

export const useAccesibilidadAlmacenUsuario = () => {
  // 1. GET /v1/almacen/activos - Listar almacenes activos
  const getAlmacenesActivos = async (): Promise<AlmacenItem[]> => {
    try {
      const res = await api.get('/v1/almacen/activos');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      if (res.data && Array.isArray(res.data.almacenes)) {
        return res.data.almacenes;
      }
      return res.data?.data || [];
    } catch (error) {
      console.error('Error cargando almacenes activos:', error);
      handleApiError(error);
      return [];
    }
  };

  // 2. GET /v1/seguridad/accesibilidad-almacen - Listar accesibilidad por usuario
  const getAccesibilidadAlmacenes = async (): Promise<UsuarioAccesibilidadAlmacen[]> => {
    try {
      const res = await api.get('/v1/seguridad/accesibilidad-almacen');
      if (res.data && Array.isArray(res.data.usuarios)) {
        return res.data.usuarios;
      }
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return res.data?.data || [];
    } catch (error) {
      console.error('Error cargando accesibilidad de almacenes:', error);
      handleApiError(error);
      return [];
    }
  };

  // 3. POST /v1/seguridad/acceso-almacen - Asignar o revocar permiso de almacén a usuario
  const setAccesoAlmacen = async (idAlmacen: number, idUsuario: number, estado: number) => {
    try {
      const res = await api.post('/v1/seguridad/acceso-almacen', {
        id_almacen: idAlmacen,
        id_usuario: idUsuario,
        estado: estado,
      });
      return res.data;
    } catch (error) {
      console.error('Error al cambiar acceso de almacén:', error);
      handleApiError(error);
      return { success: false };
    }
  };

  return {
    getAlmacenesActivos,
    getAccesibilidadAlmacenes,
    setAccesoAlmacen,
  };
};

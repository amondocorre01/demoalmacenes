import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export interface ProductoDeclaracionItem {
  ID_PRODUCTO_DETALLE: number;
  ID_PRODUCTO: number;
  NOMBRE_DETALLE: string;
  PRODUCTO: string;
  PRESENTACION?: string;
  ID_UNIDAD_MEDIDA_ESTANDAR: number;
  UNIDAD_MEDIDA_E: string;
  ID_UNIDAD_MEDIDA_ADECUACION: number;
  UNIDAD_MEDIDA_A: string;
  ID_UNIDAD_MEDIDA_DECLARACION?: number | null;
  UNIDAD_MEDIDA_D?: string;
  UNIDAD_DECLARACION?: string;
  CANTIDAD_ADECUACION?: number;
  ESTADO?: number;
  NOTA?: string;
}

export const useConfiguracionDeclaracionServices = () => {
  // 1. GET /v1/configuracion/declaracion/productos - Listar productos para configuración de declaración
  const loadApiGetProductosDeclaracion = async (): Promise<ProductoDeclaracionItem[]> => {
    try {
      const res = await api.get('/v1/configuracion/declaracion/productos');
      if (res.data && Array.isArray(res.data.productos)) {
        return res.data.productos;
      }
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return res.data?.data || [];
    } catch (error) {
      console.error('Error cargando productos de declaración:', error);
      handleApiError(error);
      return [];
    }
  };

  // 2. PUT /v1/configuracion/declaracion/:idProductoDetalle/unidad-medida - Actualizar unidad de medida de declaración
  const loadApiActualizarUnidadMedida = async (
    idProductoDetalle: number,
    idUnidadMedida: number,
    nota: string = ''
  ): Promise<{ status: boolean; message: string }> => {
    try {
      const res = await api.put(`/v1/configuracion/declaracion/${idProductoDetalle}/unidad-medida`, {
        id_unidad_medida: idUnidadMedida,
        nota
      });
      return {
        status: res.data?.status ?? true,
        message: res.data?.message || 'Se guardó correctamente la información.'
      };
    } catch (error: any) {
      console.error('Error actualizando unidad de medida de declaración:', error);
      handleApiError(error);
      return {
        status: false,
        message: error?.response?.data?.message || 'Error al actualizar unidad de medida'
      };
    }
  };

  // 3. GET /v1/configuracion/producto-almacen/almacenes - Listar almacenes configurados
  const loadApiGetAlmacenes = async (): Promise<any[]> => {
    try {
      const res = await api.get('/v1/configuracion/producto-almacen/almacenes');
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('Error cargando almacenes:', error);
      handleApiError(error);
      return [];
    }
  };

  return {
    loadApiGetProductosDeclaracion,
    loadApiActualizarUnidadMedida,
    loadApiGetAlmacenes
  };
};

export default useConfiguracionDeclaracionServices;

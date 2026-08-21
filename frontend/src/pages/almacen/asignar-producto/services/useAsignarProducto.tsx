import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export const useAsignarProductoServices = () => {
    // 1. GET /v1/almacen/activos - Listar almacenes activos
    const loadApiGetAlmacenesActivos = async (): Promise<any[]> => {
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

    // 2. GET /v1/configuracion/producto-almacen/:idAlmacen/productos - Obtener productos de un almacén
    const loadApiGetProductosAlmacen = async (idAlmacen: number): Promise<any[]> => {
        try {
            const res = await api.get(`/v1/configuracion/producto-almacen/${idAlmacen}/productos`);
            if (res.data && Array.isArray(res.data)) {
                return res.data;
            }
            if (res.data && Array.isArray(res.data.productos)) {
                return res.data.productos;
            }
            return res.data?.data || [];
        } catch (error) {
            console.error('Error cargando productos de almacén:', error);
            handleApiError(error);
            return [];
        }
    };

    // 3. POST /v1/configuracion/producto-almacen/:idAlmacen/productos - Asignar productos a un almacén
    const loadApiAsignarProductosAlmacen = async (idAlmacen: number, payloadData: any): Promise<any> => {
        try {
            const res = await api.post(`/v1/configuracion/producto-almacen/${idAlmacen}/productos`, payloadData);
            return res.data;
        } catch (error) {
            console.error('Error asignando productos a almacén:', error);
            handleApiError(error);
            return null;
        }
    };

    return {
        loadApiGetAlmacenesActivos,
        loadApiGetProductosAlmacen,
        loadApiAsignarProductosAlmacen,
    };
};

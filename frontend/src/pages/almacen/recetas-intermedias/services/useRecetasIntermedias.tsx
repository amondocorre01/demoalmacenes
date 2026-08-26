import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export const useRecetasIntermediasServices = () => {
    // 1. GET /v1/recetas-intermedias/usuarios/almacenes
    const loadApiGetAlmacenesUsuario = async () => {
        try {
            const respuesta = await api.get<any>('/v1/recetas-intermedias/usuarios/almacenes');
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 2. GET /v1/recetas-intermedias/unidades-medida
    const loadApiGetUnidadesMedida = async () => {
        try {
            const respuesta = await api.get<any>('/v1/recetas-intermedias/unidades-medida');
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 3. GET /v1/recetas-intermedias/productos-receta?codigo_tipo=1
    const loadApiGetProductosForReceta = async (codigoTipo: string | number = 1) => {
        try {
            const respuesta = await api.get<any>(`/v1/recetas-intermedias/productos-receta?codigo_tipo=${codigoTipo}`);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 4. GET /v1/recetas-intermedias/receta-intermedio/:id
    const loadApiGetRecetaIntermedio = async (id: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/recetas-intermedias/receta-intermedio/${id}`);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 5. GET /v1/recetas-intermedias/almacenes/productos?id_planta_almacen=:id
    const loadApiGetProductosIntermediosByAlmacen = async (idAlmacen: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/recetas-intermedias/almacenes/productos?id_planta_almacen=${idAlmacen}`);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 6. GET /v1/recetas-intermedias/productos-intermedios
    const loadApiGetProductosIntermediosActivos = async () => {
        try {
            const respuesta = await api.get<any>('/v1/recetas-intermedias/productos-intermedios');
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 7. POST /v1/recetas-intermedias/recetas-intermedias (Crear Receta / Medida Intermedia)
    const loadApiSaveRecetaIntermedio = async (payload: any) => {
        try {
            const respuesta = await api.post<any>('/v1/recetas-intermedias/recetas-intermedias', payload);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 8. PUT /v1/recetas-intermedias/recetas-intermedias/:id (Editar Receta / Medida Intermedia)
    const loadApiEditarRecetaIntermedio = async (id: number | string, payload: any) => {
        try {
            const respuesta = await api.put<any>(`/v1/recetas-intermedias/recetas-intermedias/${id}`, payload);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 9. POST /v1/recetas-intermedias/recetas-intermedias/productos (Agregar/actualizar productos en receta)
    const loadApiAgregarProductosRI = async (payload: any) => {
        try {
            const respuesta = await api.post<any>('/v1/recetas-intermedias/recetas-intermedias/productos', payload);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // 10. POST /v1/recetas-intermedias/asignar-almacen (Vincular producto intermedio a almacén)
    const loadApiAsignarProductoIntAlmacen = async (payload: any) => {
        try {
            const respuesta = await api.post<any>('/v1/recetas-intermedias/asignar-almacen', payload);
            return respuesta.data;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    };

    // Legacy fallback wrapper
    const loadApiGetAlmacenesActivos = async (): Promise<any[]> => {
        const data = await loadApiGetAlmacenesUsuario();
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return Array.isArray(data) ? data : [];
    };

    return {
        loadApiGetAlmacenesUsuario,
        loadApiGetUnidadesMedida,
        loadApiGetProductosForReceta,
        loadApiGetRecetaIntermedio,
        loadApiGetProductosIntermediosByAlmacen,
        loadApiGetProductosIntermediosActivos,
        loadApiSaveRecetaIntermedio,
        loadApiEditarRecetaIntermedio,
        loadApiAgregarProductosRI,
        loadApiAsignarProductoIntAlmacen,
        loadApiGetAlmacenesActivos
    };
};


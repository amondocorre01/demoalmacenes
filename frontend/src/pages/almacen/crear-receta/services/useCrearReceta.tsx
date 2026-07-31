import { handleApiError } from '../../../../config/alerts'
import api from '../../../../config/api'

export const useNewRecetaAlmacenesServices = () => {
    // 1. GET /almacen - Listar almacenes con recetas
    const loadApiGetAlmacenes = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**-RECETA ALMACEN
/almacen/list_almacen_usuario
/almacen/getRecetaByAlamcen
/almacen/get_productos_categoria_2
/almacen/listar_productosIntermediosActivos
/almacen/getProductosForReceta
/almacen/save_receta */

    /*| # | Método | Nueva Ruta (Node.js) | Ruta Original PHP | Descripción |
    |---|--------|----------------------|-------------------|-------------|
    | 3 | `GET` | `/almacen-receta/usuarios/almacenes` | `POST /almacen/list_almacen_usuario` | Listar almacenes del usuario |
    | 4 | `GET` | `/almacen-receta/productos-categoria-2` | `POST /almacen/get_productos_categoria_2` | Obtener productos categoria 2 |
    | 5 | `GET` | `/almacen-receta/productos-receta?codigo_tipo=X` | `POST /almacen/getProductosForReceta` | Obtener productos para receta |
    | 6 | `GET` | `/almacen-receta/recetas?id_sub_2=X` | `POST /almacen/get_receta` | Obtener recetas por subcategoria |
    | 7 | `GET` | `/almacen-receta/productos-intermedios-activos` | `POST /almacen/listar_productosIntermediosActivos` | Listar productos intermedios*/

    const loadApiGetAlmacenesUsuario = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen-receta/usuarios/almacenes')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiGetProductosCategoria2 = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen-receta/productos-categoria-2')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiGetProductosForReceta = async (codigoTipo: string | number) => {
        try {
            const respuesta = await api.get<any>(`/v1/almacen-receta/productos-receta?codigo_tipo=${codigoTipo}`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiGetRecetas = async (idSub2: string | number) => {
        try {
            const respuesta = await api.get<any>(`/v1/almacen-receta/recetas?id_sub_2=${idSub2}`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiGetProductosIntermediosActivos = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen-receta/productos-intermedios-activos')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiGetRecetaByAlmacen = async (id: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/almacen-receta/almacenes/${id}/recetas`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiSaveReceta = async (payload: any) => {
        try {
            const respuesta = await api.post<any>('/v1/almacen-receta/recetas', payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiUpdateReceta = async (id: number | string, payload: any) => {
        try {
            const respuesta = await api.put<any>(`/v1/almacen-receta/recetas/${id}`, payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiUpdateProductoReceta = async (id: number | string, payload: any) => {
        try {
            const respuesta = await api.patch<any>(`/v1/almacen-receta/recetas/${id}/producto`, payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    const loadApiUpdateEstadoRecetaAlmacen = async (payload: any) => {
        try {
            const respuesta = await api.patch<any>('/v1/almacen-receta/recetas-almacen/estado', payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    return {
        loadApiGetAlmacenes,
        loadApiGetAlmacenesUsuario,
        loadApiGetProductosCategoria2,
        loadApiGetProductosForReceta,
        loadApiGetRecetas,
        loadApiGetProductosIntermediosActivos,
        loadApiGetRecetaByAlmacen,
        loadApiSaveReceta,
        loadApiUpdateReceta,
        loadApiUpdateProductoReceta,
        loadApiUpdateEstadoRecetaAlmacen
    }
}
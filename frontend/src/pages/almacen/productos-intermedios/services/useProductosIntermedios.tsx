import { handleApiError } from '../../../../config/alerts'
import api from '../../../../config/api'

/**
 * useProductosIntermediosServices
 * ─────────────────────────────────────────────────────────────
 * Vista: Productos Intermedios
 * 
 * APIs utilizadas:
 * ┌─────┬────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 * │  #  │ Método │ Ruta Node.js                                 │ Descripción                                     │
 * ├─────┼────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 * │  1  │ GET    │ /productos-intermedios/usuarios/almacenes    │ Listar almacenes del usuario autenticado (token)│
 * │  2  │ GET    │ /productos-intermedios/unidades-medida       │ Listar unidades de medida activas               │
 * │  3  │ GET    │ /productos-intermedios                       │ Listar productos intermedios con recetas        │
 * │  4  │ GET    │ /productos-intermedios/recetas?id_sub_2=X    │ Obtener recetas por subcategoría 2              │
 * │  5  │ GET    │ /productos-intermedios/almacenes/:id/recetas │ Obtener recetas vinculadas a un almacén         │
 * │  6  │ GET    │ /productos-intermedios/receta-intermedio/:id │ Obtener receta de producto intermedio (SP)      │
 * │  7  │ POST   │ /productos-intermedios                       │ Crear producto intermedio                       │
 * │  8  │ PUT    │ /productos-intermedios/:id                   │ Editar producto intermedio                      │
 * │  9  │ PATCH  │ /productos-intermedios/recetas-almacen/estado│ Cambiar estado receta-almacen                   │
 * └─────┴────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────┘
 * 
 * Controles clave:
 * - Al crear/editar un producto intermedio se pueden enviar almacenes (id_planta_almacen)
 *   para vincularlo automáticamente en ese almacén.
 * - El campo `requiere_loteo` determina si el PI necesita número de lote en producción.
 * - El campo `duracion` (días) es requerido y debe ser un entero positivo.
 * - El campo `porcentaje_desperdicio` es opcional (0-100).
 */
export const useProductosIntermediosServices = () => {

    /**
     * 1. GET /productos-intermedios/usuarios/almacenes
     * Retorna los almacenes asignados al usuario autenticado (via token JWT).
     */
    const loadApiGetAlmacenesUsuario = async () => {
        try {
            const respuesta = await api.get<any>('/v1/productos-intermedios/usuarios/almacenes')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 2. GET /productos-intermedios/unidades-medida
     * Retorna las unidades de medida activas del sistema.
     */
    const loadApiGetUnidadesMedida = async () => {
        try {
            const respuesta = await api.get<any>('/v1/productos-intermedios/unidades-medida')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 3. GET /productos-intermedios
     * Retorna todos los productos intermedios activos, con sus almacenes y recetas vinculadas.
     * Cada item incluye:
     *   - ID_PRODUCTO_INTERMEDIO, NOMBRE, DURACION, ESTADO, ESTADO_PRODUCCION
     *   - PORCENTAJE_DESPERDICIO, PRODUCTO_PRIMARIO, NOTA, REQUIERE_LOTEO
     *   - ALMACENES: Array<{ ID_PLANTA_ALMACEN, DESCRICION, ESTADO }>
     *   - RECETAS: Array<{ ID_PLANTA_RI_PI, ... }>
     */
    const loadApiGetProductosIntermedios = async () => {
        try {
            const respuesta = await api.get<any>('/v1/productos-intermedios')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 4. GET /productos-intermedios/recetas?id_sub_2=X
     * Retorna las recetas de la subcategoría 2 especificada.
     * @param idSub2 - ID de la subcategoría 2
     */
    const loadApiGetRecetasBySub2 = async (idSub2: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/productos-intermedios/recetas?id_sub_2=${idSub2}`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 5. GET /productos-intermedios/almacenes/:id/recetas
     * Retorna las recetas vinculadas a un almacén específico.
     * @param id - ID del almacén (ID_PLANTA_ALMACEN)
     */
    const loadApiGetRecetasByAlmacen = async (id: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/productos-intermedios/almacenes/${id}/recetas`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 6. GET /productos-intermedios/receta-intermedio/:id
     * Obtiene la receta completa de un producto intermedio (SP).
     * @param id - ID del producto intermedio (ID_PRODUCTO_INTERMEDIO)
     */
    const loadApiGetRecetaIntermedio = async (id: number | string) => {
        try {
            const respuesta = await api.get<any>(`/v1/productos-intermedios/receta-intermedio/${id}`)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 7. POST /productos-intermedios - Crear producto intermedio
     * Campos requeridos por el backend (createProductoIntermedioSchema):
     *   - nombre: string (requerido, mín. 1 char)
     *   - duracion: number (entero positivo, días de duración)
     *   - porcentaje_desperdicio?: number (default: 0)
     *   - producto_primario?: number (0|1, default: 0)
     *   - nota?: string (default: '')
     *   - estado_produccion?: number (0|1, default: 0)
     *   - requiere_loteo?: number (0|1, default: 0)
     *   - id_planta_almacen?: number (default: 0, lo vincula a ese almacén al crear)
     */
    const loadApiCrearProductoIntermedio = async (payload: {
        nombre: string
        duracion: number
        porcentaje_desperdicio?: number
        producto_primario?: number
        nota?: string
        estado_produccion?: number
        requiere_loteo?: number
        id_planta_almacen?: number
    }) => {
        try {
            const respuesta = await api.post<any>('/v1/productos-intermedios', payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 8. PUT /productos-intermedios/:id - Editar producto intermedio
     * Campos requeridos por el backend (updateProductoIntermedioSchema):
     *   - nombre: string (requerido)
     *   - estado?: number (0|1, default: 0)
     *   - duracion: number (entero positivo)
     *   - porcentaje_desperdicio?: number (default: 0)
     *   - producto_primario?: number (0|1, default: 0)
     *   - nota?: string (default: '')
     *   - estado_produccion?: number (0|1, default: 0)
     *   - requiere_loteo?: number (0|1, default: 0)
     * Nota: no incluye id_planta_almacen (la vinculación se maneja con otro endpoint)
     */
    const loadApiEditarProductoIntermedio = async (id: number | string, payload: {
        nombre: string
        estado?: number
        duracion: number
        porcentaje_desperdicio?: number
        producto_primario?: number
        nota?: string
        estado_produccion?: number
        requiere_loteo?: number
    }) => {
        try {
            const respuesta = await api.put<any>(`/v1/productos-intermedios/${id}`, payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 9. PATCH /productos-intermedios/recetas-almacen/estado
     * Cambia el estado de una receta de almacén (activo/inactivo).
     * Campos (updateEstadoRecetaAlmacenSchema):
     *   - id_planta_receta_almacen?: number (ID de receta-almacen)
     *   - id_almacen_producto_intermedio?: number (ID de PI-almacen)
     *   - estado: number (0|1)
     */
    const loadApiUpdateEstadoRecetaAlmacen = async (payload: {
        id_planta_receta_almacen?: number
        id_almacen_producto_intermedio?: number
        estado: number
    }) => {
        try {
            const respuesta = await api.patch<any>('/v1/productos-intermedios/recetas-almacen/estado', payload)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    return {
        loadApiGetAlmacenesUsuario,
        loadApiGetUnidadesMedida,
        loadApiGetProductosIntermedios,
        loadApiGetRecetasBySub2,
        loadApiGetRecetasByAlmacen,
        loadApiGetRecetaIntermedio,
        loadApiCrearProductoIntermedio,
        loadApiEditarProductoIntermedio,
        loadApiUpdateEstadoRecetaAlmacen,
    }
}

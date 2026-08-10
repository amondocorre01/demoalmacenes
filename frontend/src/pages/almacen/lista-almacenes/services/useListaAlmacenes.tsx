import { handleApiError } from '../../../../config/alerts'
import api from '../../../../config/api'

export const useListaAlmacenesServices = () => {
    // 1. GET /almacen - Listar almacenes con recetas, config y campos extendidos
    const getAlmacenes = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    // 2. GET /almacen/activos - Listar almacenes activos (para selector solicita_a)
    const getAlmacenesActivos = async () => {
        try {
            const respuesta = await api.get<any>('/v1/almacen/activos')
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 3. POST /almacen - Crear nuevo almacen
     * Campos requeridos por el backend:
     *   - almacen: string (nombre)
     *   - estado_produccion?: number (0|1)
     *   - solicitud_planta?: number (0|1) — deshabilitado si gestion_pi = 1
     *   - gestion_pi?: number (0|1) — si es 1, solicitud_planta y entrega_planta deben ser 0
     *   - entrega_planta?: number (0|1) — deshabilitado si gestion_pi = 1
     *   - solicita_a?: Array<{ id_almacen: number; estado: number }> — almacenes a los que puede solicitar
     *   - puede_solicitarle?: Array<{ id_almacen: number; estado: number }> — almacenes que le pueden solicitar
     */
    const createAlmacen = async (data: {
        almacen: string
        estado_produccion?: number
        solicitud_planta?: number
        gestion_pi?: number
        entrega_planta?: number
        solicita_a?: { id_almacen: number; estado: number }[]
        puede_solicitarle?: { id_almacen: number; estado: number }[]
    }) => {
        try {
            const respuesta = await api.post<any>('/v1/almacen', data)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    /**
     * 4. PUT /almacen/:id - Editar almacen existente
     * Campos aceptados por el backend:
     *   - almacen?: string (nombre)
     *   - estado?: number (0|1)
     *   - estado_produccion?: number (0|1)
     *   - solicitud_planta?: number (0|1) — deshabilitado si gestion_pi = 1
     *   - gestion_pi?: number (0|1) — si es 1, solicitud_planta y entrega_planta deben ser 0
     *   - entrega_planta?: number (0|1) — deshabilitado si gestion_pi = 1
     *   - solicita_a?: Array<{ id_almacen: number; estado: number }>
     *   - puede_solicitarle?: Array<{ id_almacen: number; estado: number }>
     */
    const updateAlmacen = async (id: number, data: {
        almacen?: string
        estado?: number
        estado_produccion?: number
        solicitud_planta?: number
        gestion_pi?: number
        entrega_planta?: number
        solicita_a?: { id_almacen: number; estado: number }[]
        puede_solicitarle?: { id_almacen: number; estado: number }[]
    }) => {
        try {
            const respuesta = await api.put<any>(`/v1/almacen/${id}`, data)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    // 5. PATCH /almacen/recetas-almacen/estado - Cambiar estado receta almacen
    const updateEstadoRecetaAlmacen = async (data: {
        id_planta_receta_almacen?: number
        id_almacen_producto_intermedio?: number
        estado: number
    }) => {
        try {
            const respuesta = await api.patch<any>('/v1/almacen/recetas-almacen/estado', data)
            return respuesta.data
        } catch (error) {
            handleApiError(error)
            return null
        }
    }

    return {
        getAlmacenes,
        getAlmacenesActivos,
        createAlmacen,
        updateAlmacen,
        updateEstadoRecetaAlmacen
    }
}

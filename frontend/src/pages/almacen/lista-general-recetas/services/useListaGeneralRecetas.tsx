/**
 * useListaGeneralRecetas.tsx
 * 
 * Servicio centralizado para el módulo de Lista General de Recetas y Recetas Intermedias.
 * 
 * ────────────────────────────────────────────────────────────────────────────────
 * 📊 ESTADO DE MIGRACIÓN DE APIS AL BACKEND NODE.JS (/v1)
 * ────────────────────────────────────────────────────────────────────────────────
 * 
 * 🏢 1. Almacenes y Asignaciones
 * # | Función Service                             | Endpoint Legacy (PHP)                          | Endpoint Migrado (Node.js REST)                      | Estado Node
 * --+---------------------------------------------+------------------------------------------------+------------------------------------------------------+------------
 * 1 | loadApiListarAlmacen                        | POST /almacen/list_almacen_usuario             | GET /v1/recetas-intermedias/usuarios/almacenes       | ✅ MIGRADO
 * 2 | loadApiListarProductosSegunAlmacen          | POST /almacen/getRecetaByAlamcen               | GET /v1/recetas-intermedias/almacenes/:id/recetas   | ✅ MIGRADO
 * 3 | loadApiListarProductosIntermediosAlmacen   | POST /almacen/listar_productosIntermediosByAl...| GET /v1/recetas-intermedias/almacenes/productos      | ✅ MIGRADO
 * 4 | loadApiRelacionarAlmacenProductosIntermedios| POST /almacen/asignar_productoIntAlmacen       | POST /v1/recetas-intermedias/asignar-almacen         | ✅ MIGRADO
 * 5 | loadApiCambioEstadoAlmacenProducto          | POST /almacen/set_estado_receta_almacen        | PATCH /v1/almacen-receta/recetas-almacen/estado       | ✅ MIGRADO
 * 
 * 🍲 2. Productos Intermedios y Recetas Intermedias
 * # | Función Service                             | Endpoint Legacy (PHP)                          | Endpoint Migrado (Node.js REST)                      | Estado Node
 * --+---------------------------------------------+------------------------------------------------+------------------------------------------------------+------------
 * 6 | loadApiListarNomReceta                      | POST /almacen/listar_productos_intermedios     | GET /v1/recetas-intermedias/productos                | ✅ MIGRADO
 * 7 | loadApiListarProductosIntermediosActivos    | POST /almacen/listar_productosIntermediosAct...| GET /v1/recetas-intermedias/productos-intermedios    | ✅ MIGRADO
 * 8 | loadApiRegistrarProductoIntermedio          | POST /almacen/crear_productos_intermedio       | POST /v1/recetas-intermedias                         | ✅ MIGRADO
 * 9 | loadApiEditarProductoIntermedio             | POST /almacen/editar_productos_intermedio      | PUT /v1/productos-intermedios/:id                    | ✅ MIGRADO
 * 10| loadApiListadoProductoRECETA                 | POST /almacen/get_receta_intermedio            | GET /v1/recetas-intermedias/receta-intermedio/:id    | ✅ MIGRADO
 * 11| loadApiCrearRECETAproductoIntermedio         | POST /almacen/crear_receta_intermedio          | POST /v1/recetas-intermedias/recetas-intermedias     | ✅ MIGRADO
 * 12| loadApiEditarMedidaProductoIntermedio        | POST /almacen/editarRecetaIntermedio           | PUT /v1/recetas-intermedias/recetas-intermedias/:id  | ✅ MIGRADO
 * 13| loadApiAgregarRecetaProductosIntermedio     | POST /almacen/agregarProductosRI               | POST /v1/recetas-intermedias/recetas-intermedias/pr..| ✅ MIGRADO
 * 14| loadApiClonarRecetaProductosIntermedio      | POST /almacen/clonarRecetaRI                   | -- NO EXISTE EN BACKEND NODE --                      | ❌ NO MIGRADO
 * 15| loadApiCambioEstadoRecetaProductosIntermedio| POST /almacen/editarEstadoRecetaIntermedia     | PATCH /v1/almacen-receta/recetas-almacen/estado       | ✅ MIGRADO
 * 16| loadApiRegistroProduntoIntermedioAndReceta   | POST /almacen/crearProductoIntermedioAndAddRe..| -- NO EXISTE EN BACKEND NODE (Usar 8 + 11)           | ❌ NO MIGRADO
 * 
 * 📋 3. Recetas Generales y Productos
 * # | Función Service                             | Endpoint Legacy (PHP)                          | Endpoint Migrado (Node.js REST)                      | Estado Node
 * --+---------------------------------------------+------------------------------------------------+------------------------------------------------------+------------
 * 17| loadApiListarRecetasGenerales               | POST /almacen/listRecetasCascada               | GET /v1/recetas-intermedias/recetas                  | ✅ MIGRADO
 * 18| loadApiListarProductosForReceta             | POST /almacen/getProductosForReceta            | GET /v1/recetas-intermedias/productos-receta        | ✅ MIGRADO
 * 19| loadApiListarProductosReceta                | POST /almacen/get_receta                       | GET /v1/almacen-receta/recetas                       | ✅ MIGRADO
 * 20| loadApiListarProductosRelacion              | POST /almacen/get_productos_categoria_2        | GET /v1/recetas-intermedias/productos-categoria-2   | ✅ MIGRADO
 * 21| loadApiAgregarRecetaAlmacen                 | POST /almacen/save_receta                      | POST /v1/almacen-receta/recetas                      | ✅ MIGRADO
 * 
 * 📐 4. Unidades de Medida y Seguridad / Permisos
 * # | Función Service                             | Endpoint Legacy (PHP)                          | Endpoint Migrado (Node.js REST)                      | Estado Node
 * --+---------------------------------------------+------------------------------------------------+------------------------------------------------------+------------
 * 22| loadApiUnidadesMedida                       | POST /planta/list_unidad_medida                | GET /v1/recetas-intermedias/unidades-medida          | ✅ MIGRADO
 * 23| loadApiPermisoReporte                       | POST /seguridad/get_permisos_ventas            | -- NO EXISTE EN BACKEND NODE --                      | ❌ NO MIGRADO
 * 24| loadApiPermisoEtiquetaUsuario               | POST /config/control/listControlByUsuarioAcceso| -- NO EXISTE EN BACKEND NODE --                      | ❌ NO MIGRADO
 * 
 * ────────────────────────────────────────────────────────────────────────────────
 * 🚨 RESUMEN DE APIS PENDIENTES DE MIGRACIÓN EN EL BACKEND NODE.JS:
 * 1. ❌ loadApiClonarRecetaProductosIntermedio (POST /almacen/clonarRecetaRI)
 * 2. ❌ loadApiRegistroProduntoIntermedioAndReceta (POST /almacen/crearProductoIntermedioAndAddReceta)
 * ────────────────────────────────────────────────────────────────────────────────
 */

import api from '../../../../config/api';
import { handleApiError } from '../../../../config/alerts';

export const useListaGeneralRecetasServices = () => {

    // 1. GET /v1/recetas-intermedias/usuarios/almacenes - Listar almacenes del usuario
    const loadApiListarAlmacen = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/usuarios/almacenes');
            return Array.isArray(res.data) ? res.data : (res.data?.almacenes || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar almacenes del usuario:', error);
            handleApiError(error);
            return [];
        }
    };

    // 2. GET /v1/recetas-intermedias/almacenes/:id/recetas - Recetas por almacén
    const loadApiListarProductosSegunAlmacen = async (idAlmacen: number): Promise<any[]> => {
        try {
            const res = await api.get(`/v1/recetas-intermedias/almacenes/${idAlmacen}/recetas`);
            return Array.isArray(res.data) ? res.data : (res.data?.recetas || res.data?.data || []);
        } catch (error) {
            console.error('Error al obtener recetas por almacén:', error);
            handleApiError(error);
            return [];
        }
    };

    // 3. GET /v1/recetas-intermedias/almacenes/productos - Productos intermedios asignados a un almacén
    const loadApiListarProductosIntermediosAlmacen = async (idPlantaAlmacen?: number): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/almacenes/productos', {
                params: { id_planta_almacen: idPlantaAlmacen }
            });
            return Array.isArray(res.data) ? res.data : (res.data?.productos || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar productos intermedios por almacén:', error);
            handleApiError(error);
            return [];
        }
    };

    // 4. POST /v1/recetas-intermedias/asignar-almacen - Asignar producto intermedio a almacén
    const loadApiRelacionarAlmacenProductosIntermedios = async (payload: { id_planta_almacen: number; id_producto_intermedio: number }): Promise<any> => {
        try {
            const res = await api.post('/v1/recetas-intermedias/asignar-almacen', payload);
            return res.data;
        } catch (error) {
            console.error('Error al asignar producto intermedio a almacén:', error);
            handleApiError(error);
            return null;
        }
    };

    // 5. PATCH /v1/almacen-receta/recetas-almacen/estado - Cambiar estado de receta en almacén
    const loadApiCambioEstadoAlmacenProducto = async (payload: { id_receta: number; id_planta_almacen: number; estado: number }): Promise<any> => {
        try {
            const res = await api.patch('/v1/almacen-receta/recetas-almacen/estado', payload);
            return res.data;
        } catch (error) {
            console.error('Error al cambiar estado de receta en almacén:', error);
            handleApiError(error);
            return null;
        }
    };

    // 6. GET /v1/recetas-intermedias/productos - Catálogo de productos intermedios
    const loadApiListarNomReceta = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/productos');
            return Array.isArray(res.data) ? res.data : (res.data?.productos || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar productos intermedios:', error);
            handleApiError(error);
            return [];
        }
    };

    // 7. GET /v1/recetas-intermedias/productos-intermedios - Productos intermedios activos
    const loadApiListarProductosIntermediosActivos = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/productos-intermedios');
            return Array.isArray(res.data) ? res.data : (res.data?.productos || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar productos intermedios activos:', error);
            handleApiError(error);
            return [];
        }
    };

    // 8. POST /v1/recetas-intermedias - Crear producto intermedio
    const loadApiRegistrarProductoIntermedio = async (payload: any): Promise<any> => {
        try {
            const res = await api.post('/v1/recetas-intermedias', payload);
            return res.data;
        } catch (error) {
            console.error('Error al registrar producto intermedio:', error);
            handleApiError(error);
            return null;
        }
    };

    // 9. PUT /v1/productos-intermedios/:id - Editar producto intermedio
    const loadApiEditarProductoIntermedio = async (id: number, payload: any): Promise<any> => {
        try {
            const res = await api.put(`/v1/productos-intermedios/${id}`, payload);
            return res.data;
        } catch (error) {
            console.error('Error al editar producto intermedio:', error);
            handleApiError(error);
            return null;
        }
    };

    // 10. GET /v1/recetas-intermedias/receta-intermedio/:id - Detalle de receta intermedia
    const loadApiListadoProductoRECETA = async (idRecetaIntermedia: number): Promise<any> => {
        try {
            const res = await api.get(`/v1/recetas-intermedias/receta-intermedio/${idRecetaIntermedia}`);
            return res.data;
        } catch (error) {
            console.error('Error al obtener detalle de receta intermedia:', error);
            handleApiError(error);
            return null;
        }
    };

    // 11. POST /v1/recetas-intermedias/recetas-intermedias - Crear cabecera de receta intermedia
    const loadApiCrearRECETAproductoIntermedio = async (payload: any): Promise<any> => {
        try {
            const res = await api.post('/v1/recetas-intermedias/recetas-intermedias', payload);
            return res.data;
        } catch (error) {
            console.error('Error al crear receta intermedia:', error);
            handleApiError(error);
            return null;
        }
    };

    // 12. PUT /v1/recetas-intermedias/recetas-intermedias/:id - Editar cabecera de receta intermedia
    const loadApiEditarMedidaProductoIntermedio = async (id: number, payload: any): Promise<any> => {
        try {
            const res = await api.put(`/v1/recetas-intermedias/recetas-intermedias/${id}`, payload);
            return res.data;
        } catch (error) {
            console.error('Error al editar receta intermedia:', error);
            handleApiError(error);
            return null;
        }
    };

    // 13. POST /v1/recetas-intermedias/recetas-intermedias/productos - Agregar ingredientes a receta intermedia
    const loadApiAgregarRecetaProductosIntermedio = async (payload: any): Promise<any> => {
        try {
            const res = await api.post('/v1/recetas-intermedias/recetas-intermedias/productos', payload);
            return res.data;
        } catch (error) {
            console.error('Error al agregar productos a receta intermedia:', error);
            handleApiError(error);
            return null;
        }
    };

    // 14. ❌ NO MIGRADO A NODE: Clonar receta intermedia
    const loadApiClonarRecetaProductosIntermedio = async (_payload: any): Promise<any> => {
        console.warn('⚠️ La API "loadApiClonarRecetaProductosIntermedio" (clonarRecetaRI) no ha sido migrada aún al backend Node.js');
        return { success: false, message: 'API clonarRecetaRI no migrada a Node.js' };
    };

    // 15. PATCH /v1/almacen-receta/recetas-almacen/estado - Estado de receta intermedia
    const loadApiCambioEstadoRecetaProductosIntermedio = async (payload: { id_receta: number; id_planta_almacen: number; estado: number }): Promise<any> => {
        try {
            const res = await api.patch('/v1/almacen-receta/recetas-almacen/estado', payload);
            return res.data;
        } catch (error) {
            console.error('Error al cambiar estado de receta intermedia:', error);
            handleApiError(error);
            return null;
        }
    };

    // 16. ❌ NO MIGRADO A NODE: Registro compuesto de producto intermedio + receta
    const loadApiRegistroProduntoIntermedioAndReceta = async (_payload: any): Promise<any> => {
        console.warn('⚠️ La API "loadApiRegistroProduntoIntermedioAndReceta" (crearProductoIntermedioAndAddReceta) no ha sido migrada a Node.js. Use loadApiRegistrarProductoIntermedio y loadApiCrearRECETAproductoIntermedio por separado.');
        return { success: false, message: 'API crearProductoIntermedioAndAddReceta no migrada a Node.js' };
    };

    // 17. GET /v1/recetas-intermedias/recetas - Listar recetas generales / cascada
    const loadApiListarRecetasGenerales = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/recetas');
            return Array.isArray(res.data) ? res.data : (res.data?.recetas || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar recetas generales:', error);
            handleApiError(error);
            return [];
        }
    };

    // 18. GET /v1/recetas-intermedias/productos-receta - Catálogo de productos para recetas
    const loadApiListarProductosForReceta = async (codigoTipo: number = 1): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/productos-receta', {
                params: { codigo_tipo: codigoTipo }
            });
            return Array.isArray(res.data) ? res.data : (res.data?.productos || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar productos para receta:', error);
            handleApiError(error);
            return [];
        }
    };

    // 19. GET /v1/almacen-receta/recetas - Receta por subcategoría
    const loadApiListarProductosReceta = async (idReceta?: number): Promise<any> => {
        try {
            const res = await api.get('/v1/almacen-receta/recetas', {
                params: { id_receta: idReceta }
            });
            return res.data;
        } catch (error) {
            console.error('Error al listar productos de receta:', error);
            handleApiError(error);
            return null;
        }
    };

    // 20. GET /v1/recetas-intermedias/productos-categoria-2 - Productos nivel categoría 2
    const loadApiListarProductosRelacion = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/productos-categoria-2');
            return Array.isArray(res.data) ? res.data : (res.data?.productos || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar productos por categoría:', error);
            handleApiError(error);
            return [];
        }
    };

    // 21. POST /v1/almacen-receta/recetas - Guardar receta asociándola a almacén
    const loadApiAgregarRecetaAlmacen = async (payload: any): Promise<any> => {
        try {
            const res = await api.post('/v1/almacen-receta/recetas', payload);
            return res.data;
        } catch (error) {
            console.error('Error al agregar receta a almacén:', error);
            handleApiError(error);
            return null;
        }
    };

    // 22. GET /v1/recetas-intermedias/unidades-medida - Catálogo de unidades de medida
    const loadApiUnidadesMedida = async (): Promise<any[]> => {
        try {
            const res = await api.get('/v1/recetas-intermedias/unidades-medida');
            return Array.isArray(res.data) ? res.data : (res.data?.unidades || res.data?.data || []);
        } catch (error) {
            console.error('Error al listar unidades de medida:', error);
            handleApiError(error);
            return [];
        }
    };

    // 23. ❌ NO MIGRADO A NODE: Permisos de reportes y ventas
    const loadApiPermisoReporte = async (_payload?: any): Promise<any> => {
        console.warn('⚠️ La API "loadApiPermisoReporte" (get_permisos_ventas) no ha sido migrada aún al backend Node.js');
        return { success: false, message: 'API get_permisos_ventas no migrada a Node.js' };
    };

    // 24. ❌ NO MIGRADO A NODE: Control de permisos de UI / etiquetas por usuario
    const loadApiPermisoEtiquetaUsuario = async (_payload?: any): Promise<any> => {
        console.warn('⚠️ La API "loadApiPermisoEtiquetaUsuario" (listControlByUsuarioAcceso) no ha sido migrada aún al backend Node.js');
        return { success: false, message: 'API listControlByUsuarioAcceso no migrada a Node.js' };
    };

    return {
        loadApiListarAlmacen,
        loadApiListarProductosSegunAlmacen,
        loadApiListarProductosIntermediosAlmacen,
        loadApiRelacionarAlmacenProductosIntermedios,
        loadApiCambioEstadoAlmacenProducto,
        loadApiListarNomReceta,
        loadApiListarProductosIntermediosActivos,
        loadApiRegistrarProductoIntermedio,
        loadApiEditarProductoIntermedio,
        loadApiListadoProductoRECETA,
        loadApiCrearRECETAproductoIntermedio,
        loadApiEditarMedidaProductoIntermedio,
        loadApiAgregarRecetaProductosIntermedio,
        loadApiClonarRecetaProductosIntermedio,
        loadApiCambioEstadoRecetaProductosIntermedio,
        loadApiRegistroProduntoIntermedioAndReceta,
        loadApiListarRecetasGenerales,
        loadApiListarProductosForReceta,
        loadApiListarProductosReceta,
        loadApiListarProductosRelacion,
        loadApiAgregarRecetaAlmacen,
        loadApiUnidadesMedida,
        loadApiPermisoReporte,
        loadApiPermisoEtiquetaUsuario,
    };
};
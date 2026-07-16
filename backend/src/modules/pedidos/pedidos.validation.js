const { z } = require('zod');

// getProductosPlantaAlmacen - GET con query params
const productosPlantaAlmacenQuery = z.object({
    id_area: z.coerce.number().int().positive('id_area es requerido'),
    id_planta_almacen: z.coerce.number().int().positive('id_planta_almacen es requerido')
}).passthrough();

// getInventarioPlanta - GET con query params
const inventarioPlantaQuery = z.object({
    id_area: z.coerce.number().int().positive('id_area es requerido'),
    id_planta_almacen_documento: z.coerce.number().int().nonnegative().optional().default(0)
}).passthrough();

// enviarSolicitudAlmacen - POST
const solicitudProductoItem = z.object({
    cantidad: z.number().nonnegative().optional().default(0)
}).passthrough();

const enviarSolicitudBody = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    id_area: z.number().int().positive('id_area es requerido'),
    fecha_entrega: z.string().min(1, 'fecha_entrega es requerida'),
    productos: z.record(solicitudProductoItem).refine(
        (obj) => Object.keys(obj).length > 0,
        'Se requiere al menos un producto'
    )
}).passthrough();

// editarSolicitudAlmacen - PUT
const editarSolicitudBody = z.object({
    id_documento: z.number().int().positive('id_documento es requerido'),
    id_area: z.number().int().positive('id_area es requerido'),
    productos: z.record(z.object({
        cantidad: z.number().nonnegative(),
        id_detalle: z.number().int().nonnegative().optional().default(0)
    }).passthrough()).refine(
        (obj) => Object.keys(obj).length > 0,
        'Se requiere al menos un producto'
    )
}).passthrough();

// listPedidosAlmacen - GET con query params
const pedidosAlmacenQuery = z.object({
    id_planta_almacen: z.coerce.number().int().nonnegative().optional().default(0),
    fecha_inicio: z.coerce.string().optional().default(''),
    fecha_fin: z.coerce.string().optional().default(''),
    almacenes: z.coerce.string().optional().default('')
}).passthrough();

// get_permisos_reporte - GET con query params
const permisosReporteQuery = z.object({
    id_ventas_acceso: z.coerce.number().int().positive('id_ventas_acceso es requerido'),
    id_usuario: z.coerce.number().int().positive('id_usuario es requerido')
}).passthrough();

module.exports = {
    productosPlantaAlmacenQuery,
    inventarioPlantaQuery,
    enviarSolicitudBody,
    editarSolicitudBody,
    pedidosAlmacenQuery,
    permisosReporteQuery
};

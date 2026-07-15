const { z } = require('zod');

// producto-almacen: listarProductosAlmacen - GET /:idAlmacen/productos
const idAlmacenParams = z.object({
    idAlmacen: z.coerce.number().int().positive('idAlmacen es requerido..')
}).passthrough();

// producto-almacen: asignarProductoAlmacen - POST /:idAlmacen/productos
const asignarProductoBody = z.object({
    id_producto: z.number().int().nonnegative().optional().default(0),
    id_producto_intermedio: z.number().int().nonnegative().optional().default(0),
    estado: z.number().int().nonnegative().optional().default(0)
}).passthrough();

// declaracion: actualizarUnidadMedida - PUT /:idProductoDetalle/unidad-medida
const actualizarUnidadMedidaBody = z.object({
    id_unidad_medida: z.number().int().positive('id_unidad_medida es requerido'),
    nota: z.string().optional().default('')
}).passthrough();

// declaracion: actualizarUnidadMedida - params
const idProductoDetalleParams = z.object({
    idProductoDetalle: z.coerce.number().int().positive('idProductoDetalle es requerido')
}).passthrough();

module.exports = {
    idAlmacenParams,
    asignarProductoBody,
    actualizarUnidadMedidaBody,
    idProductoDetalleParams
};

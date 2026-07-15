const { z } = require('zod');

// listarProductosStock - POST con id_planta_almacen, id_proveedor
const listarProductosStockBody = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    id_proveedor: z.number().int().nonnegative().optional().default(0)
}).passthrough();

// registrarDevolucionProducto - POST con id_planta_almacen, id_area, productos[]
const devolucionProductoItemSchema = z.object({
    id_producto: z.number().int().nonnegative().optional().default(0),
    id_producto_detalle: z.number().int().nonnegative().optional().default(0),
    cantidad: z.number().nonnegative('cantidad es requerido'),
    cantidad_adecuacion: z.number().int().positive().optional().default(1),
    fecha: z.string().min(1, 'fecha es requerida'),
    producto: z.string().optional().default('')
}).passthrough();

const registrarDevolucionBody = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    id_area: z.number().int().positive('id_area es requerido'),
    productos: z.array(devolucionProductoItemSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

// listarDevoluciones - POST con id_planta_almacen, fecha_inicio, fecha_fin
const listarDevolucionesBody = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    fecha_inicio: z.string().min(1, 'fecha_inicio es requerida'),
    fecha_fin: z.string().min(1, 'fecha_fin es requerida')
}).passthrough();

module.exports = {
    listarProductosStockBody,
    registrarDevolucionBody,
    listarDevolucionesBody
};

const { z } = require('zod');

const productoAgregarSchema = z.object({
    id_producto: z.number().optional().default(0),
    id_producto_detalle: z.number().optional().default(0),
    id_producto_intermedio: z.number().optional().default(0),
    cantidad: z.number().positive('cantidad es requerida'),
    fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_vencimiento formato YYYY-MM-DD'),
    id_unidad_medida: z.number().int().positive('id_unidad_medida es requerido'),
    producto: z.string().optional().default('')
}).passthrough();

const productoDescontarSchema = z.object({
    id_producto: z.number().optional().default(0),
    id_producto_detalle: z.number().optional().default(0),
    id_producto_intermedio: z.number().optional().default(0),
    cantidad: z.number().positive('cantidad es requerida'),
    detalle: z.string().optional().default(''),
    producto: z.string().optional().default('')
}).passthrough();

const stockAlmacenSchema = z.object({
    id_planta_almacen: z.coerce.number().int().positive('id_planta_almacen es requerido')
}).passthrough();

const agregarStockSchema = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    productos: z.array(productoAgregarSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

const descontarStockSchema = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    productos: z.array(productoDescontarSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

const listarAjustesSchema = z.object({
    id_planta_almacen: z.coerce.number().int().positive('id_planta_almacen es requerido'),
    fecha_inicio: z.string().min(1, 'fecha_inicio es requerida'),
    fecha_fin: z.string().min(1, 'fecha_inicio es requerida')
}).passthrough();

module.exports = {
    stockAlmacenSchema,
    agregarStockSchema,
    descontarStockSchema,
    listarAjustesSchema
};

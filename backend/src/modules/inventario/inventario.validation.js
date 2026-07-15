const { z } = require('zod');

const idAlmacenQuery = z.object({
    id_planta_almacen: z.coerce.number().int().nonnegative().optional().default(0)
}).passthrough();

const idAlmacenFechaQuery = z.object({
    fecha: z.string().optional().default('')
}).passthrough();

const productosDeclaracionItemSchema = z.object({
    id_producto: z.number().int().nonnegative().optional().default(0),
    id_producto_detalle: z.number().int().nonnegative().optional().default(0),
    id_producto_intermedio: z.number().int().nonnegative().optional().default(0),
    cantidad: z.number().nonnegative().optional().default(0),
    cantidad_adecuacion: z.number().nonnegative().optional().default(1),
    observacion: z.string().optional().default('')
}).passthrough();

const guardarDeclaracionBodySchema = z.object({
    fecha: z.string().optional().default(''),
    productos: z.array(productosDeclaracionItemSchema).optional().default([])
}).passthrough();

const guardarVerificacionBodySchema = z.object({
    fecha: z.string().optional().default(''),
    productos: z.array(productosDeclaracionItemSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

const idAlmacenInventarioQuery = z.object({
    tipo_group: z.coerce.number().int().nonnegative().optional().default(1)
}).passthrough();

const depreciarProductoBodySchema = z.object({
    id_producto_salida: z.number().int().positive('id_producto_salida es requerido'),
    id_producto_ingreso: z.number().int().positive('id_producto_ingreso es requerido'),
    cantidad_salida: z.number().nonnegative('cantidad_salida es requerido'),
    cantidad_ingreso: z.number().nonnegative('cantidad_ingreso es requerido')
}).passthrough();

const listarDepreciadosQuery = z.object({
    fecha_inicio: z.string().optional().default(''),
    fecha_fin: z.string().optional().default('')
}).passthrough();

module.exports = {
    idAlmacenQuery,
    idAlmacenFechaQuery,
    guardarDeclaracionBodySchema,
    guardarVerificacionBodySchema,
    idAlmacenInventarioQuery,
    depreciarProductoBodySchema,
    listarDepreciadosQuery
};

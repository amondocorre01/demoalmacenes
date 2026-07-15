const { z } = require('zod');

const createAlmacenSchema = z.object({
    almacen: z.string().min(1, 'El nombre del almacen es requerido'),
    estado_produccion: z.number().optional().default(0)
}).passthrough();

const updateAlmacenSchema = z.object({
    almacen: z.string().optional().default(''),
    estado: z.number().optional().default(0),
    estado_produccion: z.number().optional().default(0)
}).passthrough();

const productosRecetaQuerySchema = z.object({
    codigo_tipo: z.coerce.number().int().optional().default(0)
}).passthrough();

const recetasQuerySchema = z.object({
    id_sub_2: z.coerce.number().int().positive('id_sub_2 es requerido')
}).passthrough();

const productoRecetaItemSchema = z.object({
    id_producto: z.number().optional().default(0),
    id_producto_intermedio: z.number().optional().default(0),
    cantidad: z.number().optional().default(0),
    id_unidad_medida: z.number().optional().default(1),
    estado: z.number().optional().default(0)
}).passthrough();

const createRecetaSchema = z.object({
    nombre: z.string().optional().default(''),
    id_sub_categoria_2: z.number().int().positive('id_sub_categoria_2 es requerido'),
    id_planta_almacen: z.number().optional().default(0),
    productos: z.array(productoRecetaItemSchema).optional().default([])
}).passthrough();

const updateProductoRecetaSchema = z.object({
    id_producto: z.number().optional().default(0),
    id_producto_intermedio: z.number().optional().default(0),
    estado: z.number().optional().default(0)
}).passthrough();

const productoSetRecetaItemSchema = z.object({
    id_planta_producto_receta: z.number().optional().default(0),
    cantidad: z.number().optional().default(0),
    id_unidad_medid: z.number().optional().default(0)
}).passthrough();

const updateRecetaSchema = z.object({
    id_sub_categoria_2: z.number().int().positive('id_sub_categoria_2 es requerido'),
    nombre: z.string().optional().default(''),
    estado: z.number().optional().default(0),
    id_planta_almacen: z.number().optional().default(0),
    productos: z.array(productoSetRecetaItemSchema).optional().default([])
}).passthrough();

const updateEstadoRecetaAlmacenSchema = z.object({
    id_planta_receta_almacen: z.number().optional().default(0),
    id_almacen_producto_intermedio: z.number().optional().default(0),
    estado: z.number().optional().default(0)
}).passthrough();

module.exports = {
    createAlmacenSchema,
    updateAlmacenSchema,
    productosRecetaQuerySchema,
    recetasQuerySchema,
    createRecetaSchema,
    updateRecetaSchema,
    updateProductoRecetaSchema,
    updateEstadoRecetaAlmacenSchema
};

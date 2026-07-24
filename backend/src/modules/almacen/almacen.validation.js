const { z } = require('zod');

const configAlmacenItemSchema = z.object({
    id_almacen: z.number().int().positive('id_almacen es requerido'),
    estado: z.number().optional().default(1)
}).passthrough();

const createAlmacenSchema = z.object({
    almacen: z.string().min(1, 'El nombre del almacen es requerido'),
    estado_produccion: z.number().optional().default(0),
    solicitud_planta: z.number().optional().default(0),
    gestion_pi: z.number().optional().default(0),
    entrega_planta: z.number().optional().default(0),
    solicita_a: z.array(configAlmacenItemSchema).optional().default([]),
    puede_solicitarle: z.array(configAlmacenItemSchema).optional().default([])
}).passthrough().refine(
    (data) => !(data.gestion_pi === 1 && (data.entrega_planta === 1 || data.solicitud_planta === 1)),
    { message: 'Si GESTION_PI esta activo, ENTREGA_PLANTA y SOLICITUD_PLANTA deben estar desactivados.' }
);

const updateAlmacenSchema = z.object({
    almacen: z.string().optional().default(''),
    estado: z.number().optional().default(0),
    estado_produccion: z.number().optional().default(0),
    solicitud_planta: z.number().optional().default(0),
    gestion_pi: z.number().optional().default(0),
    entrega_planta: z.number().optional().default(0),
    solicita_a: z.array(configAlmacenItemSchema).optional().default([]),
    puede_solicitarle: z.array(configAlmacenItemSchema).optional().default([])
}).passthrough().refine(
    (data) => !(data.gestion_pi === 1 && (data.entrega_planta === 1 || data.solicitud_planta === 1)),
    { message: 'Si GESTION_PI esta activo, ENTREGA_PLANTA y SOLICITUD_PLANTA deben estar desactivados.' }
);

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

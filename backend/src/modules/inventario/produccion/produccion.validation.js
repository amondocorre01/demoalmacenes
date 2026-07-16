const { z } = require('zod');

const recetaQuerySchema = z.object({
    tipo: z.coerce.number().int().optional().nullable().default(null)
}).passthrough();

const productosProducidosQuerySchema = z.object({
    id_planta_almacen: z.coerce.number().int().nonnegative().optional().default(0),
    fecha_inicio: z.string().optional().default(''),
    fecha_fin: z.string().optional().default('')
}).passthrough();

const productoItemSchema = z.object({
    id_planta_receta: z.number().int().nonnegative().optional().default(0),
    id_planta_almacen: z.number().int().nonnegative().optional().default(0),
    id_producto_intermedio: z.number().int().nonnegative().optional().default(0),
    id_sub_categoria_2: z.number().int().nonnegative().optional().default(0),
    id_area: z.number().int().nonnegative().optional().default(0),
    cantidad_producida: z.number().nonnegative('cantidad_producida debe ser >= 0'),
    cantidad_desperdicio: z.number().nonnegative().optional().default(0),
    cant_AE: z.number().nonnegative().optional().default(1),
    detalle: z.string().optional().default(''),
    idEstado: z.number().int().optional().default(4),
    imagen: z.string().optional().default(''),
    producto: z.string().optional().default('')
}).passthrough();

const registrarProductosBodySchema = z.object({
    id_area: z.number().int().nonnegative().optional().default(0),
    productos: z.array(productoItemSchema).min(1, 'Ingrese por lo menos un producto a producir')
}).passthrough();

module.exports = {
    recetaQuerySchema,
    productosProducidosQuerySchema,
    registrarProductosBodySchema
};

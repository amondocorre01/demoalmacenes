const { z } = require('zod');

const createProductoIntermedioSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    duracion: z.number().int().positive('Campo duracion no valida'),
    porcentaje_desperdicio: z.number().optional().default(0),
    producto_primario: z.number().optional().default(0),
    nota: z.string().optional().default(''),
    estado_produccion: z.number().optional().default(0),
    id_planta_almacen: z.number().optional().default(0)
}).passthrough();

const updateProductoIntermedioSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    estado: z.number().optional().default(0),
    duracion: z.number().int().positive('Campo duracion no valida'),
    porcentaje_desperdicio: z.number().optional().default(0),
    producto_primario: z.number().optional().default(0),
    nota: z.string().optional().default(''),
    estado_produccion: z.number().optional().default(0)
}).passthrough();

const recetasQuerySchema = z.object({
    id_sub_2: z.coerce.number().int().positive('id_sub_2 es requerido')
}).passthrough();

const updateEstadoRecetaAlmacenSchema = z.object({
    id_planta_receta_almacen: z.number().optional().default(0),
    id_almacen_producto_intermedio: z.number().optional().default(0),
    estado: z.number().optional().default(0)
}).passthrough();

module.exports = {
    createProductoIntermedioSchema,
    updateProductoIntermedioSchema,
    recetasQuerySchema,
    updateEstadoRecetaAlmacenSchema
};

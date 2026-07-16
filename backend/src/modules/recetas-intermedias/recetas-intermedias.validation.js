const { z } = require('zod');


const crearProductoIntermedioSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    duracion: z.number().int().positive('Campo duracion no valida'),
    porcentaje_desperdicio: z.number().optional().default(0),
    producto_primario: z.number().optional().default(0),
    nota: z.string().optional().default(''),
    estado_produccion: z.number().optional().default(0),
    id_planta_almacen: z.number().optional().default(0)
}).passthrough();

const asignarProductoIntAlmacenSchema = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    id_producto_intermedio: z.number().int().positive('id_producto_intermedio es requerido'),
    estado: z.number().optional().default(1)
}).passthrough();

const crearRecetaIntermedioSchema = z.object({
    id_producto_intermedio: z.number().int().positive('id_producto_intermedio es requerido'),
    cantidad_e: z.number().positive('cantidad_e es requerida'),
    id_unidad_medida_e: z.number().int().positive('id_unidad_medida_e es requerido'),
    cantidad_a: z.number().positive('cantidad_a es requerida'),
    id_unidad_medida_a: z.number().int().positive('id_unidad_medida_a es requerido')
}).passthrough();

const editarRecetaIntermedioSchema = z.object({
    cantidad_e: z.number().positive('cantidad_e es requerida'),
    id_unidad_medida_e: z.number().int().positive('id_unidad_medida_e es requerido'),
    cantidad_a: z.number().positive('cantidad_a es requerida'),
    id_unidad_medida_a: z.number().int().positive('id_unidad_medida_a es requerido')
}).passthrough();

const agregarProductosRISchema = z.object({
    id_planta_ri_pi: z.number().int().positive('id_planta_ri_pi es requerido'),
    productos: z.array(z.object({
        id_producto: z.number().optional().default(0),
        id_producto_intermedio: z.number().optional().default(0),
        id_unidad_medida: z.number().optional().default(0),
        cantidad: z.number().optional().default(0),
        num_receta: z.number().optional().default(0),
        estado: z.number().optional().default(0)
    }).passthrough()).min(1, 'Se requiere al menos un producto')
}).passthrough();

module.exports = {
    crearProductoIntermedioSchema,
    asignarProductoIntAlmacenSchema,
    crearRecetaIntermedioSchema,
    editarRecetaIntermedioSchema,
    agregarProductosRISchema
};

const { z } = require('zod');

// ── Query schemas (GET) ──

const almacenesQuerySchema = z.object({
    almacenes: z.string().optional().default(''),
    fecha_inicio: z.string().optional().default(''),
    fecha_fin: z.string().optional().default(''),
    id_estado: z.coerce.number().optional().default(0)
});

const productosVencidosQuerySchema = z.object({
    almacenes: z.string().optional().default(''),
    fecha: z.string().optional().default('')
});

const idAlmacenQuerySchema = z.object({
    id_almacen: z.coerce.number().int().positive('id_almacen es requerido')
});

const reposicionesQuerySchema = z.object({
    almacenes: z.string().optional().default(''),
    fecha_inicio: z.string().optional().default(''),
    fecha_fin: z.string().optional().default(''),
    id_estado: z.string().optional().default('')
});

// ── Body schemas (POST) ──

const desperdiciarVencidosSchema = z.object({
    almacenes: z.array(z.number()).optional().default([]),
    fecha: z.string().min(1, 'fecha es requerida')
}).passthrough();

const productoDesperdiciarSchema = z.object({
    ID_PRODUCTO_DETALLE: z.number(),
    ID_PRODUCTO: z.number(),
    ID_PRODUCTO_INTERMEDIO: z.number(),
    PRODUCTO: z.string().optional().default(''),
    FECHA_VENCIMIENTO: z.string(),
    CANTIDAD: z.number().positive(),
    CANTIDAD_ADECUACION: z.number().optional().default(1),
    PROD_PRIMARIO: z.number().optional().default(0),
    DETALLE: z.string().optional().default(''),
    IMAGEN: z.string().optional().default('')
}).passthrough();

const desperdiciarProductosSchema = z.object({
    id_almacen: z.number().int().positive('id_almacen es requerido'),
    productos: z.array(productoDesperdiciarSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

const asignarResponsableDesperdicioSchema = z.object({
    id_desperdicio_alamcen: z.number().int().positive('id_desperdicio_alamcen es requerido'),
    id_usuario: z.number().int().positive('id_usuario es requerido')
}).passthrough();

const asignarResponsableReposicionSchema = z.object({
    id_reposicion_almacen: z.number().int().positive('id_reposicion_almacen es requerido'),
    id_usuario: z.number().int().positive('id_usuario es requerido')
}).passthrough();

module.exports = {
    almacenesQuerySchema,
    productosVencidosQuerySchema,
    idAlmacenQuerySchema,
    reposicionesQuerySchema,
    desperdiciarVencidosSchema,
    desperdiciarProductosSchema,
    asignarResponsableDesperdicioSchema,
    asignarResponsableReposicionSchema
};

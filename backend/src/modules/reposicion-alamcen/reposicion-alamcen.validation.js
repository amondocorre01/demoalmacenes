const { z } = require('zod');

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

const canalesQuerySchema = z.object({}).passthrough();

const ventasQuerySchema = z.object({
    id_nombre_lista_precio: z.coerce.number().int().optional().default(0),
    fecha_inicio: z.string().regex(fechaRegex, 'fecha_inicio debe tener formato YYYY-MM-DD'),
    fecha_fin: z.string().regex(fechaRegex, 'fecha_fin debe tener formato YYYY-MM-DD')
}).passthrough();

const ventaItemSchema = z.object({
    id_venta_reposicion: z.union([
        z.number().int().positive(),
        z.string().min(1)
    ]),
    id_empleado: z.number().int().positive('id_empleado es requerido')
}).passthrough();

const updateVentasSchema = z.object({
    ventas: z.array(ventaItemSchema).optional().default([])
}).passthrough();

module.exports = {
    canalesQuerySchema,
    ventasQuerySchema,
    updateVentasSchema
};
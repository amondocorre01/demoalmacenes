const { z } = require('zod');

const productoTransferenciaSchema = z.object({
    id_producto_intermedio: z.number().optional().default(0),
    id_producto_detalle: z.number().optional().default(0),
    cantidad_adecuacion: z.number().optional().default(1),
    cantidad: z.number().positive('cantidad es requerida'),
    id_unidad_medida: z.number().optional().default(0),
    producto: z.string().optional().default('')
}).passthrough();

const registrarTransferenciaSchema = z.object({
    id_planta_almacen: z.number().int().positive('id_planta_almacen es requerido'),
    id_planta_almacen_destino: z.number().int().positive('id_planta_almacen_destino es requerido'),
    productos: z.array(productoTransferenciaSchema).min(1, 'Se requiere al menos un producto')
}).passthrough();

const stockAlmacenSchema = z.object({
    id_planta_almacen: z.coerce.number().int().positive('id_planta_almacen es requerido')
}).passthrough();

const listarTransferenciasSchema = z.object({
    id_planta_almacen: z.coerce.number().int().positive('id_planta_almacen es requerido'),
    fecha_inicio: z.string().min(1, 'fecha_inicio es requerida'),
    fecha_fin: z.string().min(1, 'fecha_fin es requerida')
}).passthrough();

module.exports = {
    registrarTransferenciaSchema,
    stockAlmacenSchema,
    listarTransferenciasSchema
};

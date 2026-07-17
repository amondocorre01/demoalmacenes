const { z } = require('zod');

const setAccesoAlmacenBodySchema = z.object({
    id_almacen: z.number().int().positive('id_almacen es requerido'),
    id_usuario: z.number().int().positive('id_usuario es requerido'),
    estado: z.number().int().nonnegative().optional().default(0)
}).passthrough();

module.exports = { setAccesoAlmacenBodySchema };

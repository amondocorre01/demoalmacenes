const { z } = require('zod');

const listarQuery = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    page_size: z.coerce.number().int().positive().max(100).optional().default(20),
    q: z.string().max(100).optional().default('')
}).passthrough();

const idParam = z.object({
    id: z.coerce.number().int().positive('ID inválido')
});

const notifyDataSchema = z.object({
    titulo: z.string().min(1, 'titulo es requerido').max(200),
    mensaje: z.string().min(1, 'mensaje es requerido').max(500),
    tipo: z.string().max(30).optional().default('info'),
    referenciaId: z.number().int().nullable().optional().default(null),
    referenciaModulo: z.string().max(50).nullable().optional().default(null)
}).passthrough();

const notifyBodySchema = z.object({
    userIds: z.array(z.number().int().positive()).min(1, 'Se requiere al menos un userId'),
    data: notifyDataSchema
});

const notifyBroadcastSchema = z.object({
    data: notifyDataSchema,
    filtros: z.object({
        roles: z.array(z.string().min(1)).optional()
    }).optional().nullable()
}).passthrough();

const ALLOWED_ID_FIELDS = ['ID_EXTERNO', 'EMAIL', 'CODIGO'];

const notifyByIdsSchema = z.object({
    externalIds: z.array(z.union([z.string(), z.number()])).min(1, 'Se requiere al menos un externalId'),
    idField: z.string().optional().default('ID_EXTERNO'),
    data: notifyDataSchema
}).passthrough();

const limpiarPushBody = z.object({
    diasInactivos: z.number().int().positive().max(365).optional().default(30)
}).passthrough();

const limpiarNotifBody = z.object({
    mesesAntiguedad: z.number().int().positive().max(120).optional().default(6)
}).passthrough();

module.exports = {
    listarQuery,
    idParam,
    notifyBodySchema,
    notifyBroadcastSchema,
    notifyByIdsSchema,
    limpiarPushBody,
    limpiarNotifBody,
    ALLOWED_ID_FIELDS
};

const { z } = require('zod');

const listarQuery = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    page_size: z.coerce.number().int().positive().max(100).optional().default(20),
    q: z.string().max(100).optional().default('')
}).passthrough();

const idParam = z.object({
    id: z.coerce.number().int().positive('ID inválido')
});

module.exports = { listarQuery, idParam };

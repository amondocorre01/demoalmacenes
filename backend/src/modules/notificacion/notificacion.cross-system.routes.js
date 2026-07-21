const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { apiKeyAuth, requirePermission } = require('../../middleware/apiKeyAuth');
const { notificar, notificarAUsuarios } = require('../../helpers/notification.helper');
const { query } = require('../../config/database');
const logger = require('../../helpers/logger');
const { validate } = require('../../middleware/validate');
const { notifyBodySchema, notifyBroadcastSchema, notifyByIdsSchema, ALLOWED_ID_FIELDS } = require('./notificacion.validation');

const notifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Demasiadas solicitudes, intente de nuevo en 1 minuto' },
    standardHeaders: true,
    legacyHeaders: false
});

const broadcastLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Demasiadas solicitudes de broadcast, intente de nuevo en 1 minuto' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/',
    notifyLimiter,
    apiKeyAuth,
    requirePermission('notify:send'),
    validate(notifyBodySchema),
    async (req, res) => {
        try {
            const { userIds, data } = req.body;

            const enrichedData = {
                ...data,
                sistemaOrigen: req.apiKey.sistema,
                referenciaModulo: data.referenciaModulo || req.apiKey.sistema
            };

            const ids = await notificarAUsuarios(userIds, enrichedData);

            logger.info(`[CrossSystem] Notificación de "${req.apiKey.sistema}" → usuarios: ${userIds.join(',')} | IDs: ${ids.join(',')}`);

            res.json({
                success: true,
                message: `Notificación enviada a ${ids.length} usuario(s)`,
                notificacionIds: ids,
                sistema: req.apiKey.sistema
            });
        } catch (err) {
            logger.error('[CrossSystem] Error:', { error: err.message });
            res.status(500).json({ success: false, message: 'Error al enviar notificación' });
        }
    }
);

router.post('/broadcast',
    broadcastLimiter,
    apiKeyAuth,
    requirePermission('notify:broadcast'),
    validate(notifyBroadcastSchema),
    async (req, res) => {
        try {
            const { data, filtros } = req.body;

            let userIds = [];

            if (filtros?.roles) {
                const rolesResult = await query(`
                    SELECT DISTINCT ur.ID_USUARIO
                    FROM USUARIOS_ROLES ur
                    JOIN ROLES r ON r.ID_ROL = ur.ID_ROL
                    WHERE r.CODIGO_ROL IN (${filtros.roles.map((_, i) => `@rol${i}`).join(',')})
                `, filtros.roles.map((r, i) => ({ name: `rol${i}`, value: r })), 'planta');
                userIds = rolesResult.recordset.map(r => r.ID_USUARIO);
            } else {
                const allResult = await query(`
                    SELECT ID_USUARIO FROM USUARIOS WHERE ESTADO = 1
                `, [], 'planta');
                userIds = allResult.recordset.map(r => r.ID_USUARIO);
            }

            if (userIds.length === 0) {
                return res.json({
                    success: true,
                    message: 'No se encontraron usuarios destino',
                    count: 0
                });
            }

            const enrichedData = {
                ...data,
                sistemaOrigen: req.apiKey.sistema,
                referenciaModulo: data.referenciaModulo || req.apiKey.sistema
            };

            const ids = await notificarAUsuarios(userIds, enrichedData);

            logger.info(`[CrossSystem] Broadcast de "${req.apiKey.sistema}" → ${ids.length} usuarios | IDs: ${ids.join(',')}`);

            res.json({
                success: true,
                message: `Broadcast enviado a ${ids.length} usuario(s)`,
                notificacionIds: ids,
                sistema: req.apiKey.sistema
            });
        } catch (err) {
            logger.error('[CrossSystem Broadcast] Error:', { error: err.message });
            res.status(500).json({ success: false, message: 'Error al enviar broadcast' });
        }
    }
);

router.post('/by-ids',
    notifyLimiter,
    apiKeyAuth,
    requirePermission('notify:send'),
    validate(notifyByIdsSchema),
    async (req, res) => {
        try {
            const { externalIds, idField, data } = req.body;

            if (!ALLOWED_ID_FIELDS.includes(idField)) {
                return res.status(400).json({
                    success: false,
                    message: `Campo idField no permitido. Valores permitidos: ${ALLOWED_ID_FIELDS.join(', ')}`
                });
            }

            const placeholders = externalIds.map((_, i) => `@ext${i}`).join(',');
            const params = externalIds.map((id, i) => ({ name: `ext${i}`, value: id }));

            const result = await query(`
                SELECT ID_USUARIO FROM USUARIOS
                WHERE ${idField} IN (${placeholders}) AND ESTADO = 1
            `, params, 'planta');

            const userIds = result.recordset.map(r => r.ID_USUARIO);

            if (userIds.length === 0) {
                return res.json({
                    success: true,
                    message: 'No se encontraron usuarios con esos IDs externos',
                    matched: 0
                });
            }

            const enrichedData = {
                ...data,
                sistemaOrigen: req.apiKey.sistema,
                referenciaModulo: data.referenciaModulo || req.apiKey.sistema
            };

            const ids = await notificarAUsuarios(userIds, enrichedData);

            res.json({
                success: true,
                message: `Notificación enviada a ${ids.length} usuario(s)`,
                notificacionIds: ids,
                matched: userIds.length,
                sistema: req.apiKey.sistema
            });
        } catch (err) {
            logger.error('[CrossSystem ByIds] Error:', { error: err.message });
            res.status(500).json({ success: false, message: 'Error al enviar notificación' });
        }
    }
);

module.exports = router;

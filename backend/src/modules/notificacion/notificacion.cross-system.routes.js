const express = require('express');
const router = express.Router();
const { apiKeyAuth, requirePermission } = require('../../middleware/apiKeyAuth');
const { notificar, notificarAUsuarios } = require('../../helpers/notification.helper');
const { query } = require('../../config/database');

router.post('/',
    apiKeyAuth,
    requirePermission('notify:send'),
    async (req, res) => {
        try {
            const { userIds, data } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'userIds debe ser un array con al menos un ID'
                });
            }

            if (!data || !data.titulo || !data.mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'data.titulo y data.mensaje son requeridos'
                });
            }

            const enrichedData = {
                ...data,
                sistemaOrigen: req.apiKey.sistema,
                referenciaModulo: data.referenciaModulo || req.apiKey.sistema
            };

            const ids = await notificarAUsuarios(userIds, enrichedData);

            console.log(`[CrossSystem] Notificación de "${req.apiKey.sistema}" → usuarios: ${userIds.join(',')} | IDs: ${ids.join(',')}`);

            res.json({
                success: true,
                message: `Notificación enviada a ${ids.length} usuario(s)`,
                notificacionIds: ids,
                sistema: req.apiKey.sistema
            });
        } catch (err) {
            console.error('[CrossSystem] Error:', err.message);
            res.status(500).json({ success: false, message: 'Error al enviar notificación' });
        }
    }
);

router.post('/broadcast',
    apiKeyAuth,
    requirePermission('notify:broadcast'),
    async (req, res) => {
        try {
            const { data, filtros } = req.body;

            if (!data || !data.titulo || !data.mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'data.titulo y data.mensaje son requeridos'
                });
            }

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

            console.log(`[CrossSystem] Broadcast de "${req.apiKey.sistema}" → ${ids.length} usuarios | IDs: ${ids.join(',')}`);

            res.json({
                success: true,
                message: `Broadcast enviado a ${ids.length} usuario(s)`,
                notificacionIds: ids,
                sistema: req.apiKey.sistema
            });
        } catch (err) {
            console.error('[CrossSystem Broadcast] Error:', err.message);
            res.status(500).json({ success: false, message: 'Error al enviar broadcast' });
        }
    }
);

router.post('/by-ids',
    apiKeyAuth,
    requirePermission('notify:send'),
    async (req, res) => {
        try {
            const { externalIds, idField, data } = req.body;

            if (!externalIds || !Array.isArray(externalIds) || externalIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'externalIds debe ser un array con al menos un ID'
                });
            }

            if (!data || !data.titulo || !data.mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'data.titulo y data.mensaje son requeridos'
                });
            }

            const field = idField || 'ID_EXTERNO';
            const placeholders = externalIds.map((_, i) => `@ext${i}`).join(',');
            const params = externalIds.map((id, i) => ({ name: `ext${i}`, value: id }));

            const result = await query(`
                SELECT ID_USUARIO FROM USUARIOS
                WHERE ${field} IN (${placeholders}) AND ESTADO = 1
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
            console.error('[CrossSystem ByIds] Error:', err.message);
            res.status(500).json({ success: false, message: 'Error al enviar notificación' });
        }
    }
);

module.exports = router;

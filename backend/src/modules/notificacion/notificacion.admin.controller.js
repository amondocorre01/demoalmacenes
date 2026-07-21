const { tryCatch } = require('../../helpers/asyncHandler');
const logger = require('../../helpers/logger');
const PushRepo = require('./push-suscripcion.repository');
const AdminRepo = require('./notificacion.admin.repository');

const listarApiKeys = tryCatch(async (req, res) => {
    const apiKeys = await AdminRepo.listarApiKeys();
    res.json({ success: true, datos: apiKeys });
});

const revocarApiKey = tryCatch(async (req, res) => {
    const { id } = req.params;
    const revocada = await AdminRepo.revocarApiKey(parseInt(id));
    res.json({
        success: revocada,
        message: revocada ? 'API Key revocada' : 'No encontrada'
    });
});

const limpiarPush = tryCatch(async (req, res) => {
    const { diasInactivos } = req.body;
    const eliminadas = await PushRepo.limpiar(diasInactivos);
    logger.info(`Push Cleanup: ${eliminadas} suscripciones desactivadas (> ${diasInactivos} días)`);
    res.json({ success: true, desactivadas: eliminadas, message: `${eliminadas} suscripciones inactivas desactivadas` });
});

const diagnosticarPush = tryCatch(async (req, res) => {
    const stats = await PushRepo.contarPorUsuario();
    const total = stats.reduce((sum, s) => sum + s.TOTAL, 0);
    const activas = stats.reduce((sum, s) => sum + (s.ACTIVAS || 0), 0);

    res.json({
        success: true,
        datos: {
            totalSuscripciones: total,
            totalActivas: activas,
            totalInactivas: total - activas,
            usuariosConSuscripcion: stats.length,
            porUsuario: stats
        }
    });
});

const limpiarNotificaciones = tryCatch(async (req, res) => {
    const { mesesAntiguedad } = req.body;
    const eliminadas = await AdminRepo.limpiarNotificacionesAntiguas(mesesAntiguedad);
    logger.info(`Notificaciones Cleanup: ${eliminadas} notificaciones eliminadas (> ${mesesAntiguedad} meses)`);
    res.json({ success: true, eliminadas, message: `${eliminadas} notificaciones antiguas eliminadas` });
});

module.exports = { listarApiKeys, revocarApiKey, limpiarPush, diagnosticarPush, limpiarNotificaciones };

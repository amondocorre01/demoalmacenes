const { tryCatch } = require('../../helpers/asyncHandler');
const { query } = require('../../config/database');
const PushRepo = require('./push-suscripcion.repository');

const listarApiKeys = tryCatch(async (req, res) => {
    if (!req.user?.isGlobalAdmin) {
        return res.status(403).json({ success: false, message: 'Solo administradores' });
    }

    const result = await query(`
        EXEC SP_NOTIFICACION_API_KEY_LISTAR
    `, [], 'planta');

    res.json({ success: true, datos: result.recordset });
});

const revocarApiKey = tryCatch(async (req, res) => {
    if (!req.user?.isGlobalAdmin) {
        return res.status(403).json({ success: false, message: 'Solo administradores' });
    }

    const { id } = req.params;
    const result = await query(`
        EXEC SP_NOTIFICACION_API_KEY_REVOCAR @idApiKey
    `, [{ name: 'idApiKey', value: parseInt(id) }], 'planta');

    res.json({
        success: result.recordset[0]?.affected > 0,
        message: result.recordset[0]?.affected > 0 ? 'API Key revocada' : 'No encontrada'
    });
});

const limpiarPush = tryCatch(async (req, res) => {
    if (!req.user?.isGlobalAdmin) {
        return res.status(403).json({ success: false, message: 'Solo administradores' });
    }

    const dias = parseInt(req.body.diasInactivos) || 30;
    const eliminadas = await PushRepo.limpiar(dias);

    console.log(`[Push Cleanup] ${eliminadas} suscripciones desactivadas (> ${dias} días)`);
    res.json({ success: true, desactivadas: eliminadas, message: `${eliminadas} suscripciones inactivas desactivadas` });
});

const diagnosticarPush = tryCatch(async (req, res) => {
    if (!req.user?.isGlobalAdmin) {
        return res.status(403).json({ success: false, message: 'Solo administradores' });
    }

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

module.exports = { listarApiKeys, revocarApiKey, limpiarPush, diagnosticarPush };

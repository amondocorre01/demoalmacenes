const { query } = require('../../config/database');

class NotificacionAdminRepository {

    async listarApiKeys() {
        const result = await query(`
            EXEC SP_NOTIFICACION_API_KEY_LISTAR
        `, [], 'planta');
        return result.recordset || [];
    }

    async revocarApiKey(idApiKey) {
        const result = await query(`
            EXEC SP_NOTIFICACION_API_KEY_REVOCAR @idApiKey
        `, [{ name: 'idApiKey', value: idApiKey }], 'planta');
        return result.recordset[0]?.affected > 0;
    }

    async limpiarNotificacionesAntiguas(mesesAntiguedad = 6) {
        const result = await query(`
            EXEC SP_NOTIFICACION_LIMPIAR_ANTIGUAS @mesesAntiguedad
        `, [{ name: 'mesesAntiguedad', value: mesesAntiguedad }], 'planta');
        return result.recordset[0]?.eliminadas || 0;
    }
}

module.exports = new NotificacionAdminRepository();

const { query } = require('../../config/database');

class PushSuscripcionRepository {

    async guardar(idUsuario, endpoint, p256dh, auth) {
        const result = await query(`
            EXEC SP_PUSH_SUSCRIPCION_GUARDAR @idUsuario, @endpoint, @p256dh, @auth
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'endpoint', value: endpoint },
            { name: 'p256dh', value: p256dh },
            { name: 'auth', value: auth }
        ]);
        return result.recordset[0]?.id || result.recordset[0]?.affected > 0;
    }

    async eliminar(endpoint) {
        const result = await query(`
            EXEC SP_PUSH_SUSCRIPCION_ELIMINAR @endpoint
        `, [{ name: 'endpoint', value: endpoint }]);
        return result.recordset[0]?.affected > 0;
    }

    async obtenerPorUsuario(idUsuario) {
        const result = await query(`
            EXEC SP_PUSH_SUSCRIPCION_OBTENER @idUsuario
        `, [{ name: 'idUsuario', value: idUsuario }]);
        return result.recordset || [];
    }

    async obtenerTodas() {
        const result = await query(`
            EXEC SP_PUSH_SUSCRIPCION_TODAS
        `);
        return result.recordset || [];
    }

    async limpiar(diasInactivos = 30) {
        const result = await query(`
            EXEC SP_PUSH_SUSCRIPCION_LIMPIAR @diasInactivos
        `, [{ name: 'diasInactivos', value: diasInactivos }]);
        return result.recordset[0]?.desactivadas || 0;
    }

    async contarPorUsuario(idUsuario = null) {
        const params = idUsuario
            ? [{ name: 'idUsuario', value: idUsuario }]
            : [];
        const sql = idUsuario
            ? 'EXEC SP_PUSH_SUSCRIPCION_CONTAR @idUsuario'
            : 'EXEC SP_PUSH_SUSCRIPCION_CONTAR';
        const result = await query(sql, params);
        return result.recordset || [];
    }
}

module.exports = new PushSuscripcionRepository();

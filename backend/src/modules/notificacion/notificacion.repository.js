const { query } = require('../../config/database');

class NotificacionRepository {

    async registrar(idUsuarioOrigen, idUsuarioDestino, tipo, titulo, mensaje, referenciaId, referenciaModulo) {
        const result = await query(`
            EXEC SP_NOTIFICACION_REGISTRAR @idOrigen, @idDestino, @tipo, @titulo, @mensaje, @refId, @refModulo
        `, [
            { name: 'idOrigen', value: idUsuarioOrigen },
            { name: 'idDestino', value: idUsuarioDestino },
            { name: 'tipo', value: tipo },
            { name: 'titulo', value: titulo },
            { name: 'mensaje', value: mensaje },
            { name: 'refId', value: referenciaId },
            { name: 'refModulo', value: referenciaModulo }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async listar(idUsuario, page, pageSize, q = '') {
        const pool = await require('../../config/database').getPool();
        const request = pool.request();
        request.multiple = true;

        request.input('idUsuario', idUsuario);
        request.input('page', page);
        request.input('pageSize', pageSize);
        request.input('q', q);

        const result = await request.query(`
            EXEC SP_NOTIFICACION_LISTAR @idUsuario, @page, @pageSize, @q
        `);

        const metaRow = result.recordsets[0]?.[0];
        const total = metaRow?.TOTAL_COUNT ?? 0;
        const noLeidas = metaRow?.NO_LEIDAS ?? 0;
        const records = result.recordsets[1] || [];

        return { records, total, noLeidas };
    }

    async contarNoLeidas(idUsuario) {
        const result = await query(`
            EXEC SP_NOTIFICACION_NO_LEIDAS @idUsuario
        `, [{ name: 'idUsuario', value: idUsuario }]);
        return result.recordset[0]?.TOTAL || 0;
    }

    async marcarLeida(idNotificacion, idUsuario) {
        const result = await query(`
            EXEC SP_NOTIFICACION_MARCAR_LEIDA @id, @idUsuario
        `, [
            { name: 'id', value: idNotificacion },
            { name: 'idUsuario', value: idUsuario }
        ]);
        return result.recordset[0]?.affected > 0;
    }

    async marcarTodasLeidas(idUsuario) {
        const result = await query(`
            EXEC SP_NOTIFICACION_MARCAR_TODAS_LEIDAS @idUsuario
        `, [{ name: 'idUsuario', value: idUsuario }]);
        return result.recordset[0]?.affected > 0;
    }
}

module.exports = new NotificacionRepository();

const Repo = require('./notificacion.repository');
const { notificationEmitter } = require('../../helpers/notification.helper');

class NotificacionService {

    constructor() {
        notificationEmitter.on('nueva', async (userId, data) => {
            try {
                await Repo.registrar(
                    data.usuarioOrigen || null,
                    userId,
                    data.tipo,
                    data.titulo,
                    data.mensaje,
                    data.referenciaId || null,
                    data.referenciaModulo || null
                );
            } catch (err) {
                console.error('[Notificacion] Error al guardar en BD:', err.message);
            }
        });
    }

    async listar(idUsuario, page = 1, pageSize = 20, q = '') {
        const result = await Repo.listar(idUsuario, page, pageSize, q);
        return {
            notificaciones: result.records,
            total: result.total,
            noLeidas: result.noLeidas
        };
    }

    async contarNoLeidas(idUsuario) {
        return await Repo.contarNoLeidas(idUsuario);
    }

    async marcarLeida(idNotificacion, idUsuario) {
        return await Repo.marcarLeida(idNotificacion, idUsuario);
    }

    async marcarTodasLeidas(idUsuario) {
        return await Repo.marcarTodasLeidas(idUsuario);
    }
}

module.exports = new NotificacionService();

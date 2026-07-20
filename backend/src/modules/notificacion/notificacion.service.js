const Repo = require('./notificacion.repository');

class NotificacionService {

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

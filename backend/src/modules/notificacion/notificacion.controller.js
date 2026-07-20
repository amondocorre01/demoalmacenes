const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const { notificar } = require('../../helpers/notification.helper');
const Service = require('./notificacion.service');
const PushRepo = require('./push-suscripcion.repository');

const listar = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { page, page_size, q } = req.query;
    const result = await Service.listar(
        idUsuario,
        parseInt(page) || 1,
        parseInt(page_size) || 20,
        q || ''
    );
    res.json({
        success: true,
        datos: result.notificaciones,
        total: result.total,
        noLeidas: result.noLeidas,
        page: parseInt(page) || 1,
        page_size: parseInt(page_size) || 20
    });
});

const contarNoLeidas = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const total = await Service.contarNoLeidas(idUsuario);
    res.json({ success: true, total });
});

const marcarLeida = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id } = req.params;
    const result = await Service.marcarLeida(parseInt(id), idUsuario);
    res.json({ success: result, message: result ? 'Marcada como leída' : 'No encontrada' });
});

const marcarTodasLeidas = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    await Service.marcarTodasLeidas(idUsuario);
    res.json({ success: true, message: 'Todas marcadas como leídas' });
});

const enviarPrueba = tryCatch(async (req, res) => {
    if (req.user?.isGlobalAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Solo administradores pueden enviar notificaciones de prueba'
        });
    }

    const idUsuario = getUserId(req);
    const { titulo, mensaje, tipo, targetUserId } = req.body;

    const destId = targetUserId || idUsuario;

    console.log(`[TEST] Admin ${idUsuario} enviando notificación de prueba a usuario ${destId}`);

    notificar(destId, {
        tipo: tipo || 'prueba',
        titulo: titulo || 'Notificación de prueba',
        mensaje: mensaje || 'Esta es una notificación de prueba desde el panel de admin',
        referenciaId: null,
        referenciaModulo: 'sistema',
        usuarioOrigen: idUsuario
    });

    res.json({ success: true, message: 'Notificación de prueba enviada', targetUserId: destId });
});

const pushSubscribe = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);

    if (!idUsuario) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ success: false, message: 'Datos de suscripción incompletos' });
    }

    await PushRepo.guardar(idUsuario, endpoint, keys.p256dh, keys.auth);
    console.log(`[Push] Suscripción guardada para usuario ${idUsuario}`);
    res.json({ success: true, message: 'Suscripción push registrada' });
});

const pushUnsubscribe = tryCatch(async (req, res) => {
    const { endpoint } = req.body;

    if (!endpoint) {
        return res.status(400).json({ success: false, message: 'Endpoint requerido' });
    }

    await PushRepo.eliminar(endpoint);
    console.log(`[Push] Suscripción eliminada`);
    res.json({ success: true, message: 'Suscripción eliminada' });
});

module.exports = {
    listar,
    contarNoLeidas,
    marcarLeida,
    marcarTodasLeidas,
    enviarPrueba,
    pushSubscribe,
    pushUnsubscribe
};

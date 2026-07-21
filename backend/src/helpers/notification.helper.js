const { Server } = require('socket.io');
const webpush = require('web-push');
const cookie = require("cookie");
const logger = require('./logger');

let io = null;

function initSocketIO(httpServer, corsOptions) {
    io = new Server(httpServer, corsOptions);

    io.use(async (socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers.cookie || "");
            const token = cookies.gp_auth || socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Token de autenticación requerido'));
            }

            const authSystemUrl = process.env.AUTH_SYSTEM_URL || 'http://localhost:3001';
            const verifyEndpoint = process.env.AUTH_VERIFY_ENDPOINT || '/api/auth/verify';

            const response = await fetch(`${authSystemUrl}${verifyEndpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return next(new Error('Token inválido o expirado'));
            }

            const userData = await response.json();
            socket.userId = userData.user?.id || userData.user?.id_usuario || userData.user?.ID_USUARIO;
            socket.userName = userData.user?.nombre || userData.user?.email || 'unknown';

            if (!socket.userId) {
                return next(new Error('No se pudo identificar el usuario'));
            }

            next();
        } catch (err) {
            logger.error('[Socket.IO Auth] Error:', { error: err.message });
            next(new Error('Error de autenticación'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        const room = `user:${userId}`;

        socket.join(room);
        logger.info(`[Socket.IO] Usuario ${userId} (${socket.userName}) conectado → sala ${room}`);

        socket.on('register', (requestedUserId) => {
            if (requestedUserId !== userId) {
                logger.warn(`[Socket.IO] Usuario ${userId} intentó registrarse como ${requestedUserId} - bloqueado`);
                socket.emit('error', { message: 'No puedes registrarte como otro usuario' });
                return;
            }
            socket.join(room);
            logger.info(`[Socket.IO] Usuario ${userId} registrado en sala ${room}`);
        });

        socket.on('disconnect', () => {
            logger.info(`[Socket.IO] Usuario ${userId} desconectado`);
        });
    });

    logger.info('[Socket.IO] Servidor de notificaciones inicializado con JWT auth');
    return io;
}

function configurarVapid(publicKey, privateKey, subject) {
    if (publicKey && privateKey && subject) {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        logger.info('[Push] VAPID configurado correctamente');
    }
}

async function enviarPush(userId, data) {
    logger.info(`[Push] Iniciando envío push para usuario ${userId}...`);
    try {
        const PushRepo = require('../modules/notificacion/push-suscripcion.repository');
        const suscripciones = await PushRepo.obtenerPorUsuario(userId);
        logger.info(`[Push] Suscripciones encontradas: ${suscripciones.length}`);

        const resultados = await Promise.allSettled(
            suscripciones.map(async (sub) => {
                const subscription = {
                    endpoint: sub.ENDPOINT,
                    keys: { p256dh: sub.P256DH, auth: sub.AUTH }
                };

                await webpush.sendNotification(subscription, JSON.stringify({
                    title: data.titulo,
                    body: data.mensaje,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    data: {
                        notificacionId: data.ID_NOTIFICACION || null,
                        modulo: data.referenciaModulo,
                        id: data.referenciaId,
                        url: data.url || '',
                        sistemaOrigen: data.sistemaOrigen || null
                    }
                }));

                return sub.ENDPOINT;
            })
        );

        let eliminadas = 0;
        resultados.forEach((r, i) => {
            if (r.status === 'rejected') {
                const statusCode = r.reason?.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    PushRepo.eliminar(suscripciones[i].ENDPOINT);
                    eliminadas++;
                } else {
                    logger.error(`[Push] Error enviando a ${userId}: ${r.reason?.message}`);
                }
            }
        });

        const enviadas = resultados.filter(r => r.status === 'fulfilled').length;
        if (enviadas > 0 || eliminadas > 0) {
            logger.info(`[Push] Usuario ${userId}: ${enviadas} enviadas, ${eliminadas} expiradas eliminadas`);
        }
    } catch (err) {
        logger.error('[Push] Error obteniendo suscripciones:', { error: err.message });
    }
}

async function notificar(userId, data) {
    let id = null;

    const frontendUrl = data.url || process.env.FRONTEND_URL || '';
    const modulo = data.referenciaModulo || '';
    const refId = data.referenciaId || '';
    const notifUrl = frontendUrl
        ? `${frontendUrl}/${modulo}${refId ? '/' + refId : ''}`
        : `/${modulo}${refId ? '/' + refId : ''}`;

    try {
        const NotifRepo = require('../modules/notificacion/notificacion.repository');
        id = await NotifRepo.registrar(
            data.usuarioOrigen || null,
            userId,
            data.tipo,
            data.titulo,
            data.mensaje,
            data.referenciaId || null,
            data.referenciaModulo || null,
            notifUrl
        );
    } catch (err) {
        logger.error('[Notif] Error guardando en BD:', { error: err.message });
    }

    const dataConId = {
        ...data,
        ID_NOTIFICACION: id,
        url: notifUrl,
        timestamp: new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '')
    };

    if (io) {
        const room = `user:${userId}`;
        logger.info(`[Socket.IO] Enviando notificación #${id} a sala ${room}: "${data.titulo}"`);
        io.to(room).emit('notificacion:nueva', dataConId);
    } else {
        logger.warn('[Socket.IO] io es null, no se puede enviar');
    }

    enviarPush(userId, dataConId);

    return id;
}

async function notificarAUsuarios(userIds, data) {
    if (!userIds || userIds.length === 0) return [];

    const resultados = await Promise.allSettled(
        userIds.map(id => notificar(id, data))
    );

    const ids = [];
    const fallidas = [];

    resultados.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
            ids.push(r.value);
        } else {
            fallidas.push({ userId: userIds[i], error: r.reason?.message || r.reason });
        }
    });

    if (fallidas.length > 0) {
        logger.error(`[Notificar] ${fallidas.length}/${userIds.length} notificaciones fallaron`);
        fallidas.forEach(f => logger.error(`  → Usuario ${f.userId}: ${f.error}`));
    }

    return ids;
}

function getIO() {
    return io;
}

module.exports = {
    initSocketIO,
    configurarVapid,
    notificar,
    notificarAUsuarios,
    getIO
};

const { EventEmitter } = require('events');
const { Server } = require('socket.io');
const webpush = require('web-push');

const notificationEmitter = new EventEmitter();
let io = null;

function initSocketIO(httpServer, corsOptions) {
    io = new Server(httpServer, corsOptions);

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.query?.token;

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
            console.error('[Socket.IO Auth] Error:', err.message);
            next(new Error('Error de autenticación'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        const room = `user:${userId}`;

        socket.join(room);
        console.log(`[Socket.IO] Usuario ${userId} (${socket.userName}) conectado → sala ${room}`);

        socket.on('register', (requestedUserId) => {
            if (requestedUserId !== userId) {
                console.warn(`[Socket.IO] Usuario ${userId} intentó registrarse como ${requestedUserId} - bloqueado`);
                socket.emit('error', { message: 'No puedes registrarte como otro usuario' });
                return;
            }
            socket.join(room);
            console.log(`[Socket.IO] Usuario ${userId} registrado en sala ${room}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Usuario ${userId} desconectado`);
        });
    });

    console.log('[Socket.IO] Servidor de notificaciones inicializado con JWT auth');
    return io;
}

function configurarVapid(publicKey, privateKey, subject) {
    if (publicKey && privateKey && subject) {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        console.log('[Push] VAPID configurado correctamente');
    }
}

async function enviarPush(userId, data) {
    console.log(`[Push] Iniciando envío push para usuario ${userId}...`);
    try {
        const PushRepo = require('../modules/notificacion/push-suscripcion.repository');
        const suscripciones = await PushRepo.obtenerPorUsuario(userId);
        console.log(`[Push] Suscripciones encontradas: ${suscripciones.length}`);

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
                    badge: 'https://sistemageneral.capressocafe.com/assets/logo1-c75ff556.png',
                    data: {
                        modulo: data.referenciaModulo,
                        id: data.referenciaId,
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
                    console.error(`[Push] Error enviando a ${userId}:`, r.reason?.message);
                }
            }
        });

        const enviadas = resultados.filter(r => r.status === 'fulfilled').length;
        if (enviadas > 0 || eliminadas > 0) {
            console.log(`[Push] Usuario ${userId}: ${enviadas} enviadas, ${eliminadas} expiradas eliminadas`);
        }
    } catch (err) {
        console.error('[Push] Error obteniendo suscripciones:', err.message);
    }
}

function notificar(userId, data) {
    if (io) {
        const room = `user:${userId}`;
        console.log(`[Socket.IO] Enviando notificación a sala ${room}: "${data.titulo}"`);
        io.to(room).emit('notificacion:nueva', {
            ...data,
            timestamp: new Date().toISOString()
        });
    } else {
        console.log('[Socket.IO] io es null, no se puede enviar');
    }

    enviarPush(userId, data);

    notificationEmitter.emit('nueva', userId, data);
}

async function notificarAUsuarios(userIds, data) {
    if (!userIds || userIds.length === 0) return;

    const enrichedData = {
        ...data,
        timestamp: new Date().toISOString()
    };

    const resultados = await Promise.allSettled(
        userIds.map(id => notificar(id, enrichedData))
    );

    const fallidas = resultados.filter(r => r.status === 'rejected');
    if (fallidas.length > 0) {
        console.error(`[Notificar] ${fallidas.length}/${userIds.length} notificaciones fallaron`);
        fallidas.forEach((r, i) => {
            console.error(`  → Error:`, r.reason?.message);
        });
    }
}

function getIO() {
    return io;
}

module.exports = {
    initSocketIO,
    configurarVapid,
    notificar,
    notificarAUsuarios,
    notificationEmitter,
    getIO
};

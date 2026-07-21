const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { validateQuery, validateParams } = require('../../middleware/validate');
const { listarQuery, idParam } = require('./notificacion.validation');
const Controller = require('./notificacion.controller');

const testLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Demasiadas solicitudes de prueba, intente de nuevo en 1 minuto' },
    standardHeaders: true,
    legacyHeaders: false
});

const pushLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, message: 'Demasiadas solicitudes de push, intente de nuevo en 1 minuto' },
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/', validateQuery(listarQuery), Controller.listar);
router.get('/no-leidas', Controller.contarNoLeidas);
router.patch('/:id/leer', validateParams(idParam), Controller.marcarLeida);
router.patch('/leer-todas', Controller.marcarTodasLeidas);
router.post('/test', testLimiter, Controller.enviarPrueba);
router.post('/push/subscribe', pushLimiter, Controller.pushSubscribe);
router.post('/push/unsubscribe', pushLimiter, Controller.pushUnsubscribe);

module.exports = router;

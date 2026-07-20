const express = require('express');
const router = express.Router();
const { validateQuery, validateParams } = require('../../middleware/validate');
const { listarQuery, idParam } = require('./notificacion.validation');
const Controller = require('./notificacion.controller');

router.get('/', validateQuery(listarQuery), Controller.listar);
router.get('/no-leidas', Controller.contarNoLeidas);
router.patch('/:id/leer', validateParams(idParam), Controller.marcarLeida);
router.patch('/leer-todas', Controller.marcarTodasLeidas);
router.post('/test', Controller.enviarPrueba);
router.post('/push/subscribe', Controller.pushSubscribe);
router.post('/push/unsubscribe', Controller.pushUnsubscribe);

module.exports = router;

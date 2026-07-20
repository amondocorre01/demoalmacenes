const express = require('express');
const router = express.Router();
const { validateParams } = require('../../middleware/validate');
const { idParam } = require('./notificacion.validation');
const AdminController = require('./notificacion.admin.controller');

router.get('/api-keys', AdminController.listarApiKeys);
router.patch('/api-keys/:id/revocar', validateParams(idParam), AdminController.revocarApiKey);

router.post('/push/limpiar', AdminController.limpiarPush);
router.get('/push/diagnostico', AdminController.diagnosticarPush);

module.exports = router;

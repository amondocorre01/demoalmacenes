const express = require('express');
const router = express.Router();
const { validate, validateParams } = require('../../middleware/validate');
const { idParam, limpiarPushBody, limpiarNotifBody } = require('./notificacion.validation');
const AdminController = require('./notificacion.admin.controller');

const requireAdmin = (req, res, next) => {
    if (!req.user?.isGlobalAdmin) {
        return res.status(403).json({ success: false, message: 'Solo administradores' });
    }
    next();
};

router.get('/api-keys', requireAdmin, AdminController.listarApiKeys);
router.patch('/api-keys/:id/revocar', requireAdmin, validateParams(idParam), AdminController.revocarApiKey);

router.post('/push/limpiar', requireAdmin, validate(limpiarPushBody), AdminController.limpiarPush);
router.get('/push/diagnostico', requireAdmin, AdminController.diagnosticarPush);

router.post('/limpiar-antiguas', requireAdmin, validate(limpiarNotifBody), AdminController.limpiarNotificaciones);

module.exports = router;

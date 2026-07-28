const express = require('express');
const router = express.Router();
const { validate, validateQuery, validateParams } = require('../../middleware/validate');
const Controller = require('./pedido-almacen.controller');
const {
    listarProductosQuery,
    crearSolicitudBody,
    listarSolicitudesQuery,
    idParam,
    editarSolicitudBody,
    enviarSolicitudBody,
    recibirSolicitudBody
} = require('./pedido-almacen.validation');

router.get('/solicitantes', Controller.listAlmacenesSolicitantes);
router.get('/productos', validateQuery(listarProductosQuery), Controller.listProductos);
router.post('/solicitudes', validate(crearSolicitudBody), Controller.crearSolicitud);
router.get('/solicitudes', validateQuery(listarSolicitudesQuery), Controller.listarSolicitudes);
router.get('/solicitudes/:id', validateParams(idParam), Controller.getSolicitud);
router.put('/solicitudes', validate(editarSolicitudBody), Controller.editarSolicitud);
router.patch('/solicitudes/enviar', validate(enviarSolicitudBody), Controller.enviarSolicitud);
router.patch('/solicitudes/recibir', validate(recibirSolicitudBody), Controller.recibirSolicitud);
router.patch('/solicitudes/:id/cancelar', validateParams(idParam), Controller.cancelarSolicitud);

module.exports = router;

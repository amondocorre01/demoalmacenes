const express = require('express');
const router = express.Router();
const ConsolidadosController = require('./consolidados.controller');

router.get('/listar-pedidos', ConsolidadosController.listarPedidos);
router.patch('/guardar-cambios', ConsolidadosController.guardarCambios);

module.exports = router;

const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./transferencia.controller');
const {
    registrarTransferenciaSchema,
    stockAlmacenSchema,
    listarTransferenciasSchema
} = require('./transferencia.validation');

// ── Compartido PI/Insumos ──
router.get('/usuarios/almacenes', Controller.listAlmacenUsuario);
router.get('/almacenes-activos', Controller.listAlmacenActivos);
router.post('/registrar-transferencia', validate(registrarTransferenciaSchema), Controller.registrarTransferencia);

// ── Productos Intermedios ──
router.get('/pi/transferencias', validateQuery(listarTransferenciasSchema), Controller.listarTransferenciasProductos);
router.get('/pi/stock', validateQuery(stockAlmacenSchema), Controller.listarProductosIntermedioStock);

// ── Insumos ──
router.get('/insumos/transferencias', validateQuery(listarTransferenciasSchema), Controller.listarTransferenciasInsumos);
router.get('/insumos/stock', validateQuery(stockAlmacenSchema), Controller.listarProductosInsumoStock);

module.exports = router;

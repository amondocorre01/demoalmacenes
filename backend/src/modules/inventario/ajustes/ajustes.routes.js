const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./ajustes.controller');
const {
    stockAlmacenSchema,
    agregarStockSchema,
    descontarStockSchema,
    listarAjustesSchema
} = require('./ajustes.validation');

// GET
router.get('/stock', validateQuery(stockAlmacenSchema), Controller.listarProductosStockAlmacen);
router.get('/agregados', validateQuery(listarAjustesSchema), Controller.listarProductosAgregados);
router.get('/descontados', validateQuery(listarAjustesSchema), Controller.listarProductosDescontados);

// POST
router.post('/agregar', validate(agregarStockSchema), Controller.agregarStock);
router.post('/descontar', validate(descontarStockSchema), Controller.descontarStock);

module.exports = router;

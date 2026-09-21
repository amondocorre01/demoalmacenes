const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./reposicion-alamcen.controller');
const {
    canalesQuerySchema,
    ventasQuerySchema,
    updateVentasSchema
} = require('./reposicion-alamcen.validation');

router.get('/canales-venta', validateQuery(canalesQuerySchema), Controller.getCanalesVenta);
router.get('/ventas', validateQuery(ventasQuerySchema), Controller.getVentas);
router.put('/ventas', validate(updateVentasSchema), Controller.updateVentas);

module.exports = router;
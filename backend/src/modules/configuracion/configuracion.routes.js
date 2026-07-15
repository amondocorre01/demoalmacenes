const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const { idAlmacenParams, asignarProductoBody, actualizarUnidadMedidaBody, idProductoDetalleParams } = require('./configuracion.validation');
const Controller = require('./configuracion.controller');

// producto-almacen
router.get('/producto-almacen/almacenes', Controller.listAlmacenes);
router.get('/producto-almacen/:idAlmacen/productos',  Controller.listarProductosAlmacen);
router.post('/producto-almacen/:idAlmacen/productos', validate(asignarProductoBody), Controller.asignarProductoAlmacen);

// declaracion
router.get('/declaracion/productos', Controller.listProductosForAlmacen);
router.put('/declaracion/:idProductoDetalle/unidad-medida', validate(actualizarUnidadMedidaBody), Controller.actualizarUnidadMedidaDeclaracion);

module.exports = router;

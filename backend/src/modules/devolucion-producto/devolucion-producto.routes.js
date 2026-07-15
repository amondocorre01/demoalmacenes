const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const {
    listarProductosStockBody,
    registrarDevolucionBody,
    listarDevolucionesBody
} = require('./devolucion-producto.validation');
const Controller = require('./devolucion-producto.controller');

router.get('/areas', Controller.getAreasByUsuario);
router.get('/almacenes', Controller.listAlmacenes);
router.get('/almacenes/activos', Controller.listAlmacenActivos);
router.get('/productos-stock', Controller.listarProductosStock);
router.post('/devoluciones', validate(registrarDevolucionBody), Controller.registrarDevolucionProducto);
// GET /api/devolucion-producto/devoluciones?id_planta_almacen=X&fecha_inicio=Y&fecha_fin=Z
router.get('/devoluciones', Controller.listarDevoluciones);

module.exports = router;

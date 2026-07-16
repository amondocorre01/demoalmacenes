const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const {
    productosPlantaAlmacenQuery,
    inventarioPlantaQuery,
    enviarSolicitudBody,
    editarSolicitudBody,
    pedidosAlmacenQuery,
    permisosReporteQuery
} = require('./pedidos.validation');
const Controller = require('./pedidos.controller');
router.get('/almacenes', Controller.listAlmacenUsuario);
router.get('/productos-planta-almacen', Controller.getProductosPlantaAlmacen);
router.get('/inventario-planta', validateQuery(inventarioPlantaQuery), Controller.getInventarioPlanta);
router.post('/solicitudes', validate(enviarSolicitudBody), Controller.enviarSolicitudAlmacen);
router.put('/solicitudes', validate(editarSolicitudBody), Controller.editarSolicitudAlmacen);
router.get('/pedidos-almacen', validateQuery(pedidosAlmacenQuery), Controller.listPedidosAlmacen);
//router.get('/permisos-reporte', validateQuery(permisosReporteQuery), Controller.getPermisosReporte);

module.exports = router;

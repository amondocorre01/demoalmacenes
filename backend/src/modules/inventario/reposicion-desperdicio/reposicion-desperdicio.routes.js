const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./reposicion-desperdicio.controller');
const {
    almacenesQuerySchema,
    productosVencidosQuerySchema,
    idAlmacenQuerySchema,
    desperdiciarVencidosSchema,
    desperdiciarProductosSchema,
    asignarResponsableDesperdicioSchema,
    asignarResponsableReposicionSchema,
    reposicionesQuerySchema
} = require('./reposicion-desperdicio.validation');

// ── Desperdicios (GET) ──
router.get('/desperdicios', validateQuery(almacenesQuerySchema), Controller.listarDesperdicios);
router.get('/productos-vencidos', validateQuery(productosVencidosQuerySchema), Controller.getProductosVencidos);
router.get('/productos-vencidos-agrupados', Controller.getProductosVencidosGroup);
router.get('/productos-stock', validateQuery(idAlmacenQuerySchema), Controller.getProductosAlmacenStock);

// ── Desperdicios (POST) ──
router.post('/desperdiciar-vencidos', validate(desperdiciarVencidosSchema), Controller.desperdiciarProductosVencidos);
router.post('/desperdiciar', validate(desperdiciarProductosSchema), Controller.desperdiciarProductos);
router.post('/asignar-responsable-desperdicio', validate(asignarResponsableDesperdicioSchema), Controller.asignarResponsableDesperdicio);

// ── Reposiciones (GET) ──
router.get('/reposiciones', validateQuery(reposicionesQuerySchema), Controller.listarReposiciones);

// ── Reposiciones (POST) ──
router.post('/registrar-reposicion', validate(desperdiciarProductosSchema), Controller.registrarReposicion);
router.post('/asignar-responsable-reposicion', validate(asignarResponsableReposicionSchema), Controller.asignarResponsableReposicion);

module.exports = router;

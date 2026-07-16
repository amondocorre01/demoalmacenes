const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./produccion.controller');
const {
    recetaQuerySchema,
    productosProducidosQuerySchema,
    registrarProductosBodySchema
} = require('./produccion.validation');

router.get('/areas', Controller.getAreasByUsuario);
router.get('/almacenes', Controller.listAlmacen);
router.get('/almacenes-usuario', Controller.listAlmacenUsuario);
router.get('/almacenes/:idAlmacen/recetas', validateQuery(recetaQuerySchema), Controller.getRecetaByAlmacen);
router.get('/productos-producidos', validateQuery(productosProducidosQuerySchema), Controller.getProductosProducidos);
router.post('/registrar-productos', validate(registrarProductosBodySchema), Controller.registrarProductosProducidos);

module.exports = router;

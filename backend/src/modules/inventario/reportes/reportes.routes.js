const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./reportes.controller');
const {
    idAlmacenQuery,
    idAlmacenInventarioQuery,
    depreciarProductoBodySchema,
    listarDepreciadosQuery
} = require('../inventario.validation');

router.get('/almacenes', validateQuery(idAlmacenQuery), Controller.listAlmacenUsuario);
router.get('/:idAlmacen/inventario', validateQuery(idAlmacenInventarioQuery), Controller.listInventarioAlmacen);
router.get('/:idAlmacen/productos', Controller.listarProductosAlmacen);
router.get('/:idAlmacen/productos-especiales', Controller.listarProductosEspeciales);
router.post('/:idAlmacen/depreciar', validate(depreciarProductoBodySchema), Controller.depreciarProducto);
router.get('/:idAlmacen/depreciados', validateQuery(listarDepreciadosQuery), Controller.listarProductosDepreciados);

module.exports = router;

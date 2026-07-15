const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./declaracion.controller');
const {
    idAlmacenQuery,
    idAlmacenFechaQuery,
    guardarDeclaracionBodySchema
} = require('../inventario.validation');

router.get('/almacenes', validateQuery(idAlmacenQuery), Controller.listAlmacenUsuario);
router.get('/:idAlmacen', validateQuery(idAlmacenFechaQuery), Controller.obtenerDeclaracionAlmacen);
router.post('/:idAlmacen', validate(guardarDeclaracionBodySchema), Controller.guardarDeclaracionAlmacen);

module.exports = router;

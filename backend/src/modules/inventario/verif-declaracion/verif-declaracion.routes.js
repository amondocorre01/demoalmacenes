const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../../middleware/validate');
const Controller = require('./verif-declaracion.controller');
const {
    idAlmacenQuery,
    idAlmacenFechaQuery,
    guardarVerificacionBodySchema
} = require('../inventario.validation');

router.get('/almacenes', validateQuery(idAlmacenQuery), Controller.listAlmacenUsuario);
router.get('/:idAlmacen', validateQuery(idAlmacenFechaQuery), Controller.obtenerDeclaracionAlmacen);
router.post('/:idAlmacen', validate(guardarVerificacionBodySchema), Controller.guardarVerificacionDeclaracionAlmacen);
router.get('/:idAlmacen/verificadas', Controller.listarDeclaVerificadaAlmacen);

module.exports = router;

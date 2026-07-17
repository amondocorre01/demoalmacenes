const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validate');
const Controller = require('./seguridad.controller');
const { setAccesoAlmacenBodySchema } = require('./seguridad.validation');

router.get('/accesibilidad-almacen', Controller.getAccesibilidadAlmacen);
router.post('/acceso-almacen', validate(setAccesoAlmacenBodySchema), Controller.setAccesoAlmacen);

module.exports = router;

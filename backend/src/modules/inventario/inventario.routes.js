const express = require('express');
const router = express.Router();

const declaracionRoutes = require('./declaracion/declaracion.routes');
const verifDeclaracionRoutes = require('./verif-declaracion/verif-declaracion.routes');
const reportesRoutes = require('./reportes/reportes.routes');
const ajustesRoutes = require('./ajustes/ajustes.routes');

router.use('/declaracion', declaracionRoutes);
router.use('/verif-declaracion', verifDeclaracionRoutes);
router.use('/reportes', reportesRoutes);
router.use('/ajustes', ajustesRoutes);


module.exports = router;

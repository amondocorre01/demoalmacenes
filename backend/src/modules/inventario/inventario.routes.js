const express = require('express');
const router = express.Router();

const declaracionRoutes = require('./declaracion/declaracion.routes');
const verifDeclaracionRoutes = require('./verif-declaracion/verif-declaracion.routes');
const reportesRoutes = require('./reportes/reportes.routes');
const ajustesRoutes = require('./ajustes/ajustes.routes');
const reposicionDesperdicioRoutes = require('./reposicion-desperdicio/reposicion-desperdicio.routes');
const produccionRoutes = require('./produccion/produccion.routes');

router.use('/declaracion', declaracionRoutes);
router.use('/verif-declaracion', verifDeclaracionRoutes);
router.use('/reportes', reportesRoutes);
router.use('/ajustes', ajustesRoutes);
router.use('/rep-desp', reposicionDesperdicioRoutes);
router.use('/produccion', produccionRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./productos-intermedios.controller');
const {
    createProductoIntermedioSchema,
    updateProductoIntermedioSchema,
    recetasQuerySchema,
    recetaIntermedioSchema,
    updateEstadoRecetaAlmacenSchema
} = require('./productos-intermedios.validation');

router.get('/usuarios/almacenes', Controller.listAlmacenUsuario);
router.get('/unidades-medida', Controller.listUnidadMedida);
router.get('/', Controller.listarProductosIntermedios);
router.get('/recetas', validateQuery(recetasQuerySchema), Controller.getRecetas);
router.get('/almacenes/:id/recetas', Controller.getRecetaByAlmacen);
router.get('/receta-intermedio/:id', Controller.getRecetaIntermedio);
router.post('/', validate(createProductoIntermedioSchema), Controller.crearProductoIntermedio);
router.put('/:id', validate(updateProductoIntermedioSchema), Controller.editarProductoIntermedio);
router.patch('/recetas-almacen/estado', validate(updateEstadoRecetaAlmacenSchema), Controller.updateEstadoRecetaAlmacen);

module.exports = router;

const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./almacen.controller');
const {
    createAlmacenSchema,
    updateAlmacenSchema,
    productosRecetaQuerySchema,
    recetasQuerySchema,
    createRecetaSchema,
    updateRecetaSchema,
    updateProductoRecetaSchema,
    updateEstadoRecetaAlmacenSchema
} = require('./almacen.validation');

router.get('/activos', Controller.listAlmacenActivos);
router.get('/', Controller.listAlmacen);
router.get('/productos-categoria-2', Controller.getProductosCategoria2);
router.get('/productos-receta', validateQuery(productosRecetaQuerySchema), Controller.getProductosForReceta);
router.get('/recetas', validateQuery(recetasQuerySchema), Controller.getRecetas);
router.post('/', validate(createAlmacenSchema), Controller.createAlmacen);
router.put('/:id', validate(updateAlmacenSchema), Controller.updateAlmacen);
router.post('/recetas', validate(createRecetaSchema), Controller.createReceta);
router.put('/recetas/:id', validate(updateRecetaSchema), Controller.updateReceta);
router.patch('/recetas/:id/producto', validate(updateProductoRecetaSchema), Controller.updateProductoReceta);
router.patch('/recetas-almacen/estado', validate(updateEstadoRecetaAlmacenSchema), Controller.updateEstadoRecetaAlmacen);

module.exports = router;

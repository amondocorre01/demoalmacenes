const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./almacen-receta.controller');
const {
    createAlmacenSchema,
    updateAlmacenSchema,
    productosRecetaQuerySchema,
    recetasQuerySchema,
    createRecetaSchema,
    updateRecetaSchema,
    updateProductoRecetaSchema,
    updateEstadoRecetaAlmacenSchema
} = require('./almacen-receta.validation');

router.get('/activos', Controller.listAlmacenActivos);
router.get('/', Controller.listAlmacen);
router.get('/usuarios/almacenes', Controller.listAlmacenUsuario);
router.get('/productos-categoria-2', Controller.getProductosCategoria2);
router.get('/productos-receta', validateQuery(productosRecetaQuerySchema), Controller.getProductosForReceta);
router.get('/recetas', validateQuery(recetasQuerySchema), Controller.getRecetas);
router.get('/productos-intermedios-activos', Controller.getProductosIntermediosActivos);
router.get('/almacenes/:id/recetas', Controller.getRecetaByAlmacen);
router.post('/', validate(createAlmacenSchema), Controller.createAlmacen);
router.put('/:id', validate(updateAlmacenSchema), Controller.updateAlmacen);
router.post('/recetas', validate(createRecetaSchema), Controller.createReceta);
router.put('/recetas/:id', validate(updateRecetaSchema), Controller.updateReceta);
router.patch('/recetas/:id/producto', validate(updateProductoRecetaSchema), Controller.updateProductoReceta);
router.patch('/recetas-almacen/estado', validate(updateEstadoRecetaAlmacenSchema), Controller.updateEstadoRecetaAlmacen);

module.exports = router;

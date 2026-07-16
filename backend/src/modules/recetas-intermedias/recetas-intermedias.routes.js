const express = require('express');
const router = express.Router();
const { validate, validateQuery } = require('../../middleware/validate');
const Controller = require('./recetas-intermedias.controller');
const {
    crearProductoIntermedioSchema,
    asignarProductoIntAlmacenSchema,
    crearRecetaIntermedioSchema,
    editarRecetaIntermedioSchema,
    agregarProductosRISchema
} = require('./recetas-intermedias.validation');

// GET
router.get('/usuarios/almacenes', Controller.listAlmacenUsuario);
router.get('/unidades-medida', Controller.listUnidadMedida);
router.get('/productos-receta', Controller.getProductosForReceta);
router.get('/productos-intermedios', Controller.listarProductosIntermediosActivos);
router.get('/productos-categoria-2', Controller.getProductosCategoria2);
router.get('/productos', Controller.listarProductosIntermedios);
router.get('/recetas', Controller.getRecetas);
router.get('/almacenes/:id/recetas', Controller.getRecetaByAlmacen);
router.get('/receta-intermedio/:id', Controller.getRecetaIntermedio);
router.get('/almacenes/productos', Controller.listarProductosIntermediosByAlmacen);

// POST
router.post('/', validate(crearProductoIntermedioSchema), Controller.crearProductoIntermedio);
router.post('/asignar-almacen', validate(asignarProductoIntAlmacenSchema), Controller.asignarProductoIntAlmacen);
router.post('/recetas-intermedias', validate(crearRecetaIntermedioSchema), Controller.crearRecetaIntermedio);
router.post('/recetas-intermedias/productos', validate(agregarProductosRISchema), Controller.agregarProductosRI);

// PUT
router.put('/recetas-intermedias/:id', validate(editarRecetaIntermedioSchema), Controller.editarRecetaIntermedio);

module.exports = router;

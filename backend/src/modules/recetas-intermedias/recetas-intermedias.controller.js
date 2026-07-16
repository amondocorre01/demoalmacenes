const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./recetas-intermedias.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const data = await Service.listAlmacenUsuario(idUsuario);
    res.json({ success: true, data });
});

const listUnidadMedida = tryCatch(async (req, res) => {
    const data = await Service.listUnidadMedida();
    res.json({ success: true, data });
});

const getProductosForReceta = tryCatch(async (req, res) => {
    const {codigo_tipo} = req.query;
    const data = await Service.getProductosForReceta(codigo_tipo);
    res.json({ success: true, data });
});

const listarProductosIntermediosActivos = tryCatch(async (req, res) => {
    const data = await Service.listarProductosIntermediosActivos();
    res.json({ success: true, data });
});

const getProductosCategoria2 = tryCatch(async (req, res) => {
    const data = await Service.getProductosCategoria2();
    res.json({ success: true, data });
});

const listarProductosIntermedios = tryCatch(async (req, res) => {
    const data = await Service.listarProductosIntermedios();
    res.json({ success: true, data });
});

const asignarProductoIntAlmacen = tryCatch(async (req, res) => {
    const result = await Service.asignarProductoIntAlmacen(req.body);
    res.json({ success: true, message: result.message });
});

const crearProductoIntermedio = tryCatch(async (req, res) => {
    const result = await Service.crearProductoIntermedio(req.body);
    res.status(201).json({ success: true, ...result });
});

const listarProductosIntermediosByAlmacen = tryCatch(async (req, res) => {
    const {id_planta_almacen=0} = req.query;
    const data = await Service.listarProductosIntermediosByAlmacen(id_planta_almacen);
    res.json({ success: true, data });
});

const getRecetas = tryCatch(async (req, res) => {
    const data = await Service.getRecetas(req.query);
    res.json({ success: true, data });
});

const getRecetaByAlmacen = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const data = await Service.getRecetaByAlmacen(id);
    res.json({ success: true, data });
});

const getRecetaIntermedio = tryCatch(async (req, res) => {
    const data = await Service.getRecetaIntermedio(req.params.id);
    res.json({ success: true, data });
});

const crearRecetaIntermedio = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.crearRecetaIntermedio(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

const editarRecetaIntermedio = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idUsuario = getUserId(req);
    const result = await Service.editarRecetaIntermedio(id, req.body, idUsuario);
    res.json({ success: true, message: result.message });
});

const agregarProductosRI = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.agregarProductosRI(req.body, idUsuario);
    res.json({ success: true, message: result.message });
});

module.exports = {
    listAlmacenUsuario,
    listUnidadMedida,
    getProductosForReceta,
    listarProductosIntermediosActivos,
    getProductosCategoria2,
    listarProductosIntermedios,
    asignarProductoIntAlmacen,
    crearProductoIntermedio,
    listarProductosIntermediosByAlmacen,
    getRecetas,
    getRecetaByAlmacen,
    getRecetaIntermedio,
    crearRecetaIntermedio,
    editarRecetaIntermedio,
    agregarProductosRI
};

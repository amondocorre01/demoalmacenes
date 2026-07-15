const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./almacen-receta.service');

const listAlmacenActivos = tryCatch(async (req, res) => {
    const data = await Service.listAlmacenActivos();
    res.json({ success: true, data });
});

const listAlmacen = tryCatch(async (req, res) => {
    const data = await Service.listAlmacen();
    res.json({ success: true, data });
});

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const data = await Service.listAlmacenUsuario(idUsuario);
    res.json({ success: true, data });
});

const getProductosCategoria2 = tryCatch(async (req, res) => {
    const data = await Service.getProductosCategoria2();
    res.json({ success: true, data });
});

const getProductosForReceta = tryCatch(async (req, res) => {
    const data = await Service.getProductosForReceta(req.query);
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

const getProductosIntermediosActivos = tryCatch(async (req, res) => {
    const data = await Service.getProductosIntermediosActivos();
    res.json({ success: true, data });
});

const createAlmacen = tryCatch(async (req, res) => {
    const result = await Service.createAlmacen(req.body);
    res.status(201).json({ success: true, data: result });
});

const updateAlmacen = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await Service.updateAlmacen(id, req.body);
    res.json({ success: true, message: result.message });
});

const createReceta = tryCatch(async (req, res) => {
    const result = await Service.createReceta(req.body);
    res.status(201).json({ success: true, ...result });
});

const updateReceta = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await Service.updateReceta(id, req.body);
    res.json({ success: true, message: result.message });
});

const updateProductoReceta = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await Service.updateProductoReceta(id, req.body);
    res.json({ success: true, message: result.message });
});

const updateEstadoRecetaAlmacen = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await Service.updateEstadoRecetaAlmacen(id, req.body);
    res.json({ success: true, message: result.message });
});

module.exports = {
    listAlmacenActivos,
    listAlmacen,
    listAlmacenUsuario,
    getProductosCategoria2,
    getProductosForReceta,
    getRecetas,
    getRecetaByAlmacen,
    getProductosIntermediosActivos,
    createAlmacen,
    updateAlmacen,
    createReceta,
    updateReceta,
    updateProductoReceta,
    updateEstadoRecetaAlmacen
};

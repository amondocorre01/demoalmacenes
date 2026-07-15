const { tryCatch } = require('../../helpers/asyncHandler');
const Service = require('./almacen.service');

const listAlmacenActivos = tryCatch(async (req, res) => {
    const data = await Service.listAlmacenActivos();
    res.json({ success: true, data });
});

const listAlmacen = tryCatch(async (req, res) => {
    const data = await Service.listAlmacen();
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
    res.status(201).json({ success: true, data: result });
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
    const result = await Service.updateEstadoRecetaAlmacen(req.body);
    res.json({ success: true, message: result.message });
});

module.exports = {
    listAlmacenActivos,
    listAlmacen,
    getProductosCategoria2,
    getProductosForReceta,
    getRecetas,
    createAlmacen,
    updateAlmacen,
    createReceta,
    updateReceta,
    updateProductoReceta,
    updateEstadoRecetaAlmacen
};

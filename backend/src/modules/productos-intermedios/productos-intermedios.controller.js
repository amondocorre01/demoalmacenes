const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./productos-intermedios.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const data = await Service.listAlmacenUsuario(idUsuario);
    res.json({ success: true, data });
});

const listUnidadMedida = tryCatch(async (req, res) => {
    const data = await Service.listUnidadMedida();
    res.json({ success: true, data });
});

const listarProductosIntermedios = tryCatch(async (req, res) => {
    const data = await Service.listarProductosIntermedios();
    res.json({ success: true, data });
});

const getRecetaByAlmacen = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const data = await Service.getRecetaByAlmacen(id);
    res.json({ success: true, data });
});

const getRecetas = tryCatch(async (req, res) => {
    const data = await Service.getRecetas(req.query);
    res.json({ success: true, data });
});

const getRecetaIntermedio = tryCatch(async (req, res) => {
    const data = await Service.getRecetaIntermedio(req.params.id);
    res.json({ success: true, data });
});

const crearProductoIntermedio = tryCatch(async (req, res) => {
    const result = await Service.crearProductoIntermedio(req.body);
    res.status(201).json({ success: true, ...result });
});

const editarProductoIntermedio = tryCatch(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = await Service.editarProductoIntermedio(id, req.body);
    res.json({ success: true, message: result.message });
});

const updateEstadoRecetaAlmacen = tryCatch(async (req, res) => {
    const result = await Service.updateEstadoRecetaAlmacen(req.body);
    res.json({ success: true, message: result.message });
});

module.exports = {
    listAlmacenUsuario,
    listUnidadMedida,
    listarProductosIntermedios,
    getRecetaByAlmacen,
    getRecetas,
    getRecetaIntermedio,
    crearProductoIntermedio,
    editarProductoIntermedio,
    updateEstadoRecetaAlmacen
};

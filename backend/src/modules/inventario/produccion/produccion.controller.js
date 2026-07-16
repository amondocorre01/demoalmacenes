const { tryCatch } = require('../../../helpers/asyncHandler');
const { getUserId } = require('../../../helpers/userContext');
const Service = require('./produccion.service');

const getAreasByUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.getAreasByUsuario(idUsuario);
    res.json({ success: result.status, areas: result.areas, message: result.message });
});

const listAlmacen = tryCatch(async (req, res) => {
    const result = await Service.listAlmacen();
    res.json({ success: result.status, data: result.data, message: result.message });
});

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.listAlmacenUsuario(idUsuario);
    res.json({ success: result.status, almacenes: result.almacenes, message: result.message });
});

const getRecetaByAlmacen = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const tipo = req.query.tipo !== undefined ? parseInt(req.query.tipo, 10) : null;
    const result = await Service.getRecetaByAlmacen(idAlmacen, tipo);
    res.json({ success: result.status, recetas: result.recetas, message: result.message });
});

const getProductosProducidos = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const result = await Service.getProductosProducidos(
        parseInt(id_planta_almacen, 10) || 0,
        fecha_inicio || '',
        fecha_fin || ''
    );
    res.json({ success: result.status, productos: result.productos, message: result.message });
});

const registrarProductosProducidos = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    await Service.validarDatosProduccion(req.body);
    const result = await Service.registrarProductosProducidos(req.body, idUsuario);
    res.json({ success: result.status, message: result.message });
});

module.exports = {
    getAreasByUsuario,
    listAlmacen,
    listAlmacenUsuario,
    getRecetaByAlmacen,
    getProductosProducidos,
    registrarProductosProducidos
};

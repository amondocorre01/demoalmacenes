const { tryCatch } = require('../../../helpers/asyncHandler');
const { getUserId } = require('../../../helpers/userContext');
const Service = require('./reportes.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const idAlmacen = req.query.id_planta_almacen || 0;
    const data = await Service.listAlmacenUsuario(idUsuario, idAlmacen);
    res.json({ success: true, datos: data });
});

const listInventarioAlmacen = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const tipoGroup = parseInt(req.query.tipo_group, 10) || 1;
    const data = await Service.listInventarioAlmacen(idAlmacen, tipoGroup);
    res.json({ success: true, datos: data });
});

const listarProductosAlmacen = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const data = await Service.listarProductosAlmacen(idAlmacen);
    res.json({ success: true, datos: data });
});

const listarProductosEspeciales = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const data = await Service.listarProductosEspeciales(idAlmacen);
    res.json({ success: true, datos: data });
});

const depreciarProducto = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const result = await Service.depreciarProducto(idAlmacen, req.body, idUsuario);
    res.json({ success: result.status, message: result.message });
});

const listarProductosDepreciados = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const { fecha_inicio, fecha_fin } = req.query;
    const data = await Service.listarProductosDepreciados(idAlmacen, fecha_inicio, fecha_fin);
    res.json({ success: true, datos: data });
});
const listHistorialInventarioAlmacen = tryCatch(async (req, res) => {
    const result = await Service.listHistorialInventarioAlmacen(req.query);
    if (result.status) {
        res.json({ success: true, datos: result.productos });
    } else {
        res.json({ success: false, message: result.message });
    }
});
module.exports = {
    listAlmacenUsuario,
    listInventarioAlmacen,
    listarProductosAlmacen,
    listarProductosEspeciales,
    depreciarProducto,
    listarProductosDepreciados,
    listHistorialInventarioAlmacen
};

const { tryCatch } = require('../../../helpers/asyncHandler');
const { getUserId } = require('../../../helpers/userContext');
const Service = require('./ajustes.service');

const listarProductosStockAlmacen = tryCatch(async (req, res) => {
    const { id_planta_almacen } = req.query;
    const data = await Service.listarProductosStockAlmacen(id_planta_almacen);
    res.json({ success: true, data });
});

const agregarStock = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.agregarStock(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

const descontarStock = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    await Service.validarStockDisponible(req.body.id_planta_almacen, req.body.productos);
    const result = await Service.descontarStock(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

const listarProductosAgregados = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const data = await Service.listarProductosAgregados(id_planta_almacen, fecha_inicio, fecha_fin);
    res.json({ success: true, data });
});

const listarProductosDescontados = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const data = await Service.listarProductosDescontados(id_planta_almacen, fecha_inicio, fecha_fin);
    res.json({ success: true, data });
});

module.exports = {
    listarProductosStockAlmacen,
    agregarStock,
    descontarStock,
    listarProductosAgregados,
    listarProductosDescontados
};

const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./transferencia.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const data = await Service.listAlmacenUsuario(idUsuario);
    res.json({ success: true, data });
});

const listAlmacenActivos = tryCatch(async (req, res) => {
    const data = await Service.listAlmacenActivos();
    res.json({ success: true, data });
});

const listarProductosIntermedioStock = tryCatch(async (req, res) => {
    const { id_planta_almacen } = req.query;
    const data = await Service.listarProductosIntermedioStock(id_planta_almacen);
    res.json({ success: true, data });
});

const listarProductosInsumoStock = tryCatch(async (req, res) => {
    const { id_planta_almacen } = req.query;
    const data = await Service.listarProductosInsumoStock(id_planta_almacen);
    res.json({ success: true, data });
});

const listarTransferenciasProductos = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const data = await Service.listarTransferenciasProductos(id_planta_almacen, fecha_inicio, fecha_fin);
    res.json({ success: true, data });
});

const listarTransferenciasInsumos = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const data = await Service.listarTransferenciasInsumos(id_planta_almacen, fecha_inicio, fecha_fin);
    res.json({ success: true, data });
});

const registrarTransferencia = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.registrarTransferencia(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

module.exports = {
    listAlmacenUsuario,
    listAlmacenActivos,
    listarProductosIntermedioStock,
    listarProductosInsumoStock,
    listarTransferenciasProductos,
    listarTransferenciasInsumos,
    registrarTransferencia
};

const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./pedidos.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.listAlmacenUsuario(idUsuario);
    res.json(result);
});

const getProductosPlantaAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_area, id_planta_almacen } = req.query;
    const result = await Service.getProductosPlantaAlmacen(
        idUsuario, parseInt(id_area), parseInt(id_planta_almacen)
    );
    res.json(result);
});

const getInventarioPlanta = tryCatch(async (req, res) => {
    getUserId(req);
    const { id_area, id_planta_almacen_documento } = req.query;
    const result = await Service.getInventarioPlanta(
        parseInt(id_area), parseInt(id_planta_almacen_documento)
    );
    res.json(result);
});

const enviarSolicitudAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_planta_almacen, id_area, fecha_entrega, productos } = req.body;
    const result = await Service.enviarSolicitudAlmacen(
        idUsuario, parseInt(id_planta_almacen), parseInt(id_area), fecha_entrega, productos
    );
    res.json(result);
});

const editarSolicitudAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_documento, id_area, productos } = req.body;
    const result = await Service.editarSolicitudAlmacen(
        idUsuario, parseInt(id_documento), parseInt(id_area), productos
    );
    res.json(result);
});

const listPedidosAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_planta_almacen, almacenes, fecha_inicio, fecha_fin } = req.query;
    const almacenesArray = almacenes ? almacenes.split(',').map(Number) : [];
    const result = await Service.listPedidosAlmacen(
        idUsuario, parseInt(id_planta_almacen), almacenesArray, fecha_inicio, fecha_fin
    );
    res.json(result);
});

const getPermisosReporte = tryCatch(async (req, res) => {
    getUserId(req);
    const { id_ventas_acceso, id_usuario } = req.query;
    const result = await Service.getPermisosReporte(
        parseInt(id_ventas_acceso), parseInt(id_usuario)
    );
    res.json(result);
});

module.exports = {
    listAlmacenUsuario,
    getProductosPlantaAlmacen,
    getInventarioPlanta,
    enviarSolicitudAlmacen,
    editarSolicitudAlmacen,
    listPedidosAlmacen,
    getPermisosReporte
};

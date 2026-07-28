const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./pedido-almacen.service');

const listAlmacenesSolicitantes = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.listAlmacenesSolicitantes(idUsuario);
    res.json(result);
});

const listProductos = tryCatch(async (req, res) => {
    const { id_almacen,id_almacen_solicitante, tipo ='insumo'} = req.query;
    console.log('req.query',req.query)
    const result = await Service.listProductos(parseInt(id_almacen),parseInt(id_almacen_solicitante), tipo);
    res.json(result);
});

const crearSolicitud = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_almacen_solicitante, id_almacen_destino, fecha_entrega, productos } = req.body;
    const result = await Service.crearSolicitud(
        idUsuario, parseInt(id_almacen_solicitante), parseInt(id_almacen_destino),
        fecha_entrega, productos
    );
    res.status(201).json(result);
});

const listarSolicitudes = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_almacen_solicitante, id_almacen_destino, fecha_inicio, fecha_fin } = req.query;
    const result = await Service.listarSolicitudes(
        idUsuario,
        parseInt(id_almacen_solicitante) || 0,
        parseInt(id_almacen_destino) || 0,
        fecha_inicio, fecha_fin
    );
    res.json(result);
});

const getSolicitud = tryCatch(async (req, res) => {
    getUserId(req);
    const { id } = req.params;
    const result = await Service.getSolicitud(parseInt(id));
    res.json(result);
});

const editarSolicitud = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_documento, productos } = req.body;
    const result = await Service.editarSolicitud(idUsuario, parseInt(id_documento), productos);
    res.json(result);
});

const enviarSolicitud = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_documento, detalles } = req.body;
    const result = await Service.enviarSolicitud(idUsuario, parseInt(id_documento), detalles);
    res.json(result);
});

const recibirSolicitud = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_documento, detalles } = req.body;
    const result = await Service.recibirSolicitud(idUsuario, parseInt(id_documento), detalles);
    res.json(result);
});

const cancelarSolicitud = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id } = req.params;
    const result = await Service.cancelarSolicitud(idUsuario, parseInt(id));
    res.json(result);
});

module.exports = {
    listAlmacenesSolicitantes,
    listProductos,
    crearSolicitud,
    listarSolicitudes,
    getSolicitud,
    editarSolicitud,
    enviarSolicitud,
    recibirSolicitud,
    cancelarSolicitud
};

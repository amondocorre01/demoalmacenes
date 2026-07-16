const { tryCatch } = require('../../../helpers/asyncHandler');
const { getUserId } = require('../../../helpers/userContext');
const Service = require('./reposicion-desperdicio.service');

const listarDesperdicios = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const almacenes = req.query.almacenes ? req.query.almacenes.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const data = await Service.listarDesperdicios(idUsuario, {
        almacenes,
        fecha_inicio: req.query.fecha_inicio,
        fecha_fin: req.query.fecha_fin,
        id_estado: req.query.id_estado
    });
    res.json({ success: true, data });
});

const getProductosVencidos = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const almacenes = req.query.almacenes ? req.query.almacenes.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const data = await Service.getProductosVencidos(idUsuario, {
        almacenes,
        fecha: req.query.fecha
    });
    res.json({ success: true, data });
});

const getProductosVencidosGroup = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const data = await Service.getProductosVencidosGroup(idUsuario);
    res.json({ success: true, data });
});

const getProductosAlmacenStock = tryCatch(async (req, res) => {
    const { id_almacen } = req.query;
    const data = await Service.getProductosAlmacenStock(id_almacen);
    res.json({ success: true, data });
});

const desperdiciarProductosVencidos = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.desperdiciarProductosVencidos(idUsuario, req.body);
    res.status(201).json({ success: true, message: result.message });
});

const desperdiciarProductos = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.desperdiciarProductos(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

const asignarResponsableDesperdicio = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    await Service.asignarResponsableDesperdicio(req.body, idUsuario);
    res.json({ success: true, message: 'Se guardó correctamente la información.' });
});

const registrarReposicion = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.registrarReposicion(req.body, idUsuario);
    res.status(201).json({ success: true, message: result.message });
});

const listarReposiciones = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const almacenes = req.query.almacenes ? req.query.almacenes.split(',').map(Number).filter(n => !isNaN(n)) : [];
    const data = await Service.listarReposiciones(idUsuario, {
        almacenes,
        fecha_inicio: req.query.fecha_inicio,
        fecha_fin: req.query.fecha_fin,
        id_estado: req.query.id_estado
    });
    res.json({ success: true, data });
});

const asignarResponsableReposicion = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    await Service.asignarResponsableReposicion(req.body, idUsuario);
    res.json({ success: true, message: 'Se guardó correctamente la información.' });
});

module.exports = {
    listarDesperdicios,
    getProductosVencidos,
    getProductosVencidosGroup,
    getProductosAlmacenStock,
    desperdiciarProductosVencidos,
    desperdiciarProductos,
    asignarResponsableDesperdicio,
    registrarReposicion,
    listarReposiciones,
    asignarResponsableReposicion
};

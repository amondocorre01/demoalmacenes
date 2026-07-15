const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./devolucion-producto.service');

const getAreasByUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.getAreasByUsuario(idUsuario);
    res.json(result);
});

const listAlmacenes = tryCatch(async (req, res) => {
    getUserId(req);
    const result = await Service.listAlmacenes();
    res.json(result);
});

const listAlmacenActivos = tryCatch(async (req, res) => {
    getUserId(req);
    const result = await Service.listAlmacenActivos();
    res.json(result);
});

const listarProductosStock = tryCatch(async (req, res) => {
    const { id_planta_almacen=1} = req.query;
    const result = await Service.listarProductosStock(parseInt(id_planta_almacen));
    res.json(result);
});

const registrarDevolucionProducto = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const { id_planta_almacen, id_area, productos } = req.body;
    const result = await Service.registrarDevolucionProducto(
        parseInt(id_planta_almacen), parseInt(id_area), idUsuario, productos
    );
    res.json(result);
});

const listarDevoluciones = tryCatch(async (req, res) => {
    const { id_planta_almacen, fecha_inicio, fecha_fin } = req.query;
    const result = await Service.listarDevoluciones(
        parseInt(id_planta_almacen), fecha_inicio, fecha_fin
    );
    res.json(result);
});

module.exports = {
    getAreasByUsuario,
    listAlmacenes,
    listAlmacenActivos,
    listarProductosStock,
    registrarDevolucionProducto,
    listarDevoluciones
};

const { tryCatch } = require('../../../helpers/asyncHandler');
const { getUserId } = require('../../../helpers/userContext');
const Service = require('./verif-declaracion.service');

const listAlmacenUsuario = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const idAlmacen = req.query.id_planta_almacen || 0;
    const data = await Service.listAlmacenUsuario(idUsuario, idAlmacen);
    res.json({ success: true, datos: data });
});

const obtenerDeclaracionAlmacen = tryCatch(async (req, res) => {
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const fecha = req.query.fecha || '';
    const result = await Service.obtenerDeclaracionAlmacen(idAlmacen, fecha);
    res.json({ success: true, ...result });
});

const guardarVerificacionDeclaracionAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const result = await Service.guardarVerificacionDeclaracionAlmacen(idAlmacen, req.body, idUsuario);
    res.json({ success: result.status, message: result.message });
});

const listarDeclaVerificadaAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const idAlmacen = parseInt(req.params.idAlmacen, 10);
    const data = await Service.listarDeclaVerificadaAlmacen(idUsuario, idAlmacen);
    res.json({ success: true, datos: data });
});

module.exports = {
    listAlmacenUsuario,
    obtenerDeclaracionAlmacen,
    guardarVerificacionDeclaracionAlmacen,
    listarDeclaVerificadaAlmacen
};

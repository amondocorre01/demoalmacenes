const { tryCatch } = require('../../helpers/asyncHandler');
const Service = require('./reposicion-alamcen.service');

const getCanalesVenta = tryCatch(async (req, res) => {
    const data = await Service.getCanalesVenta(req.user);
    res.json({ success: true, data });
});

const getVentas = tryCatch(async (req, res) => {
    const result = await Service.getVentas(req.query);
    res.json({ success: true, ...result });
});

const updateVentas = tryCatch(async (req, res) => {
    const idUsuario = req.user?.ID_USUARIO || req.user?.id || req.user?.id_usuario || 0;
    const result = await Service.updateVentas(req.body.ventas, idUsuario);
    res.json(result);
});

module.exports = {
    getCanalesVenta,
    getVentas,
    updateVentas
};
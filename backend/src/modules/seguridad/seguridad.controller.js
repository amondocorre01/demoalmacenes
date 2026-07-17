const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/userContext');
const Service = require('./seguridad.service');

const getAccesibilidadAlmacen = tryCatch(async (req, res) => {
    const result = await Service.getAccesibilidadAlmacen();
    res.json({ success: result.status, usuarios: result.usuarios, message: result.message });
});

const setAccesoAlmacen = tryCatch(async (req, res) => {
    const idUsuario = getUserId(req);
    const result = await Service.setAccesoAlmacen(req.body, idUsuario);
    res.json({ success: result.status, message: result.message });
});

module.exports = {
    getAccesibilidadAlmacen,
    setAccesoAlmacen
};

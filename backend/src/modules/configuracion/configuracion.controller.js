const { tryCatch } = require('../../helpers/asyncHandler');
const { getUserId } = require('../../helpers/planta.helper');
const Service = require('./configuracion.service');

const listAlmacenes = tryCatch(async (req, res) => {
    const result = await Service.listAlmacenes();
    res.json(result);
});

const listarProductosAlmacen = tryCatch(async (req, res) => {
    const { idAlmacen } = req.params;
    const result = await Service.listarProductosAlmacen(parseInt(idAlmacen));
    res.json(result);
});

const asignarProductoAlmacen = tryCatch(async (req, res) => {
    const { idAlmacen } = req.params;
    const { id_producto=0, id_producto_intermedio=0, estado } = req.body;
    const result = await Service.asignarProductoAlmacen(
        parseInt(idAlmacen), id_producto, id_producto_intermedio, estado
    );
    res.json(result);
});

const listProductosForAlmacen = tryCatch(async (req, res) => {
    const result = await Service.listProductosForAlmacen();
    res.json(result);
});

const actualizarUnidadMedidaDeclaracion = tryCatch(async (req, res) => {
    const { idProductoDetalle } = req.params;
    const { id_unidad_medida, nota } = req.body;
    const result = await Service.actualizarUnidadMedidaDeclaracion(
        parseInt(idProductoDetalle), id_unidad_medida, nota
    );
    res.json(result);
});

module.exports = {
    listAlmacenes,
    listarProductosAlmacen,
    asignarProductoAlmacen,
    listProductosForAlmacen,
    actualizarUnidadMedidaDeclaracion
};

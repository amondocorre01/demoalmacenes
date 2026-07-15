const { query } = require('../../../config/database');
const InventarioHelper = require('../../../helpers/inventario.helper');

class DeclaracionRepository {

    async obtenerDeclaracionAlmacenData(idAlmacen, idDocumento, fecha) {
        return await InventarioHelper.obtenerDeclaracionAlmacenData(idAlmacen, idDocumento, fecha);
    }

    async obtenerDeclaracionAlmacenDataById(idDocumento) {
        return await InventarioHelper.obtenerDeclaracionAlmacenDataById(idDocumento);
    }

    async existeDeclaracion(idAlmacen, fechaInicio, fechaFin) {
        return await InventarioHelper.existeDeclaracion(idAlmacen, fechaInicio, fechaFin);
    }

    async getUltimaVerifDeclaracion(idAlmacen) {
        return await InventarioHelper.getUltimaVerifDeclaracion(idAlmacen);
    }

    async existeProductoEnDecla(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio) {
        return await InventarioHelper.existeProductoEnDecla(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio);
    }

    async registrarDocInv(idUsuario, idAlmacen, fechaHora) {
        return await InventarioHelper.registrarDocInv(idUsuario, idAlmacen, fechaHora);
    }

    async actualizarDocInv(idUsuario, idDocumento, fechaHora) {
        return await InventarioHelper.actualizarDocInv(idUsuario, idDocumento, fechaHora);
    }

    async registrarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion) {
        return await InventarioHelper.registrarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion);
    }

    async actualizarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion) {
        return await InventarioHelper.actualizarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion);
    }
}

module.exports = new DeclaracionRepository();

const { query } = require('../../../config/database');
const InventarioHelper = require('../../../helpers/inventario.helper');

class VerifDeclaracionRepository {

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

    async getStockObjByAlmacen(idAlmacen) {
        return await InventarioHelper.getStockObjByAlmacen(idAlmacen);
    }

    async existeProductoEnDecla(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio) {
        return await InventarioHelper.existeProductoEnDecla(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio);
    }

    async registrarDocInvVerif(idUsuario, idAlmacen, fechaHora) {
        return await InventarioHelper.registrarDocInvVerif(idUsuario, idAlmacen, fechaHora);
    }

    async actualizarDocInvVerif(idUsuario, idDocumento, fechaHora) {
        return await InventarioHelper.actualizarDocInvVerif(idUsuario, idDocumento, fechaHora);
    }

    async registrarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion) {
        return await InventarioHelper.registrarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion);
    }

    async actualizarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion) {
        return await InventarioHelper.actualizarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion);
    }

    async getProductoDescuadre(idAlmacen, idDoc, fecha, fechaHora) {
        const result = await query(`EXEC GET_DECLARACION_INVENTARIO_DIFE_V2 @idAlmacen, @idDoc, @fecha, @fechaHora`, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idDoc', value: idDoc },
            { name: 'fecha', value: fecha },
            { name: 'fechaHora', value: fechaHora }
        ]);
        return result.recordset || [];
    }

    async getInventarioByProducto(idAlmacen, strWhere, fecha) {
        return await InventarioHelper.getInventarioByProducto(idAlmacen, strWhere, fecha);
    }

    async registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idProductoConversion) {
        return await InventarioHelper.registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idProductoConversion);
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario) {
        return await InventarioHelper.actualizarCantUtilizada(idInventario, cantidad, idUsuario);
    }

    async registrarDesperdicio(idAlmacen, idUsuario, idInv, idProdDetalle, idProducto, idProdIntermedio, cantidad, idUnidad, fechaHora, fechaVen, detalle, tipo, porcentajePrimario) {
        await query(`
            INSERT INTO PLANTA_ALMACEN_DESPEDICIO
            (ID_PLANTA_ALMACEN, ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE,
             ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD, ID_UNIDAD_MEDIDA,
             FECHA_REGISTRO, FECHA_VENCIMIENTO, DETALLE, TIPO, PORCENTAJE_PRIMARIO)
            VALUES (@idAlmacen, @idUsuario, @idInv, @idProdDetalle,
                    @idProducto, @idProdIntermedio, @cantidad, @idUnidad,
                    @fechaHora, @fechaVen, @detalle, @tipo, @porcentajePrimario)
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProdDetalle', value: idProdDetalle },
            { name: 'idProducto', value: idProducto },
            { name: 'idProdIntermedio', value: idProdIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidad', value: idUnidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle },
            { name: 'tipo', value: tipo },
            { name: 'porcentajePrimario', value: porcentajePrimario }
        ]);
    }
}

module.exports = new VerifDeclaracionRepository();

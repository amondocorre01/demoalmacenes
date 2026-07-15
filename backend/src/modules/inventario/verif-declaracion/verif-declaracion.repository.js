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

    async registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idDetalleDevol) {
        return await InventarioHelper.registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idDetalleDevol);
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario) {
        return await InventarioHelper.actualizarCantUtilizada(idInventario, cantidad, idUsuario);
    }

    async registrarDesperdicio(idAlmacen, idUsuario, idInv, idProdDetalle, idProducto, idProdIntermedio, cantidad, idUnidad, fechaHora, fechaVen, detalle, tipo, prctoPrimario, imagen, automatico) {
        const precioUnitario = await InventarioHelper.calcularPrecioDesperdicio(idProducto, idProdIntermedio, idProdDetalle, cantidad);
        const result = await query(`
            INSERT INTO PLANTA_DESPERDICIO_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
             ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO, ESTADO, PRECIO_ASUMIDO_EMPRESA,
             PRECIO_ASUMIDO_EMPLEADO, ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO,
             DETALLE, ID_ESTADO, PROD_PRIMARIO, AUTOMATICO)
            VALUES (@idUsuario, @idInv, @idProdDetalle, @idProdIntermedio,
                    @idUnidad, @cantidad, @fechaHora, 1, 0,
                    @precioEmpleado, @idAlmacen, @precioProducto, @fechaVen,
                    @detalle, @tipo, @prctoPrimario, @automatico);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProdDetalle', value: idProdDetalle },
            { name: 'idProdIntermedio', value: idProdIntermedio },
            { name: 'idUnidad', value: idUnidad },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'precioEmpleado', value: precioUnitario },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'precioProducto', value: precioUnitario },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle },
            { name: 'tipo', value: tipo },
            { name: 'prctoPrimario', value: prctoPrimario || 0 },
            { name: 'automatico', value: automatico || 0 }
        ]);
        const id = result.recordset[0]?.id || 0;
        if (imagen && id) {
            await InventarioHelper.guardarImagenDesperdicioAlmacen(id, imagen);
        }
        return id;
    }
}

module.exports = new VerifDeclaracionRepository();

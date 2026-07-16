const { query } = require('../../config/database');

class TransferenciaRepository {

    // ── Almacenes ──

    async listAlmacenUsuario(idUsuario) {
        const result = await query(`
            SELECT pa.* FROM PLANTA_PERMISO_ALMACEN ppa, PLANTA_ALMACEN pa
            WHERE ppa.ID_USUARIO = @idUsuario
            AND ppa.ESTADO = 1 AND pa.ESTADO = 1
            AND ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
            ORDER BY pa.DESCRICION
        `, [{ name: 'idUsuario', value: idUsuario }]);
        return result.recordset;
    }

    async listAlmacenActivos() {
        const result = await query(`
            SELECT * FROM PLANTA_ALMACEN
            WHERE ESTADO = 1
            ORDER BY DESCRICION ASC
        `);
        return result.recordset;
    }

    // ── Stock por producto intermedio ──

    async listarProdIntAlmacenData(idAlmacen) {
        const result = await query(`
            SELECT ppi.* FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi,
                 PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
            WHERE papi.ESTADO = 1
            AND papi.ID_PLANTA_ALMACEN = @idAlmacen
            AND ppi.ESTADO = 1
            AND papi.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
            ORDER BY NOMBRE
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset;
    }

    async getStockByProductoIntermedio(idPlantaAlmacen, idProductoIntermedio, fecha) {
        const result = await query(`
            SELECT pai.ID_PRODUCTO_INTERMEDIO,
                   SUM(CANTIDAD - CANTIDAD_UTILIZADA) as CANTIDAD,
                   ppi.CANTIDAD_ADECUACION
            FROM PLANTA_ALMACEN_INVENTARIO pai,
                 PLANTA_PRODUCTO_INTERMEDIO_V2 ppi
            WHERE pai.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
            AND pai.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            AND pai.ID_PLANTA_ALMACEN = @idPlantaAlmacen
            AND pai.ESTADO_INGRESO = 1
            AND pai.FECHA_VENCIMIENTO >= @fecha
            AND (CANTIDAD - CANTIDAD_UTILIZADA) > 0
            GROUP BY pai.ID_PRODUCTO_INTERMEDIO, ppi.CANTIDAD_ADECUACION
        `, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    // ── Stock por insumo ──

    async listarProductosInsumoStock(idAlmacen, fecha) {
        const result = await query(`
            EXEC PL_GET_PRODUCTOS_STOCK_ALMACEN @idAlmacen, @fecha
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    async getStockByProductoInsumo(idPlantaAlmacen, idProductoDetalle, fecha, cantAdecuacion) {
        const result = await query(`
            SELECT SUM((CANTIDAD - CANTIDAD_UTILIZADA) / @cantAdecuacion) as CANTIDAD
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.ID_PRODUCTO_DETALLE = @idProductoDetalle
            AND pai.ID_PLANTA_ALMACEN = @idPlantaAlmacen
            AND pai.ESTADO_INGRESO = 1
            AND pai.FECHA_VENCIMIENTO >= @fecha
            AND (CANTIDAD - CANTIDAD_UTILIZADA) > 0
        `, [
            { name: 'cantAdecuacion', value: cantAdecuacion },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset[0]?.CANTIDAD || 0;
    }

    // ── Transferencia ──

    async registraTransfDoc(idAlmacen, idAlmacenDestino, idUsuario, fechaHora, envio, idDocSal, transaction = null) {
        const result = await query(`
            INSERT INTO PLANTA_DOCUMENTO_TRANSFERENCIA
            (ID_PLANTA_ALMACEN, ID_PLANTA_ALMACEN_DESTINO, ID_USUARIO, ESTADO, ENVIO, FECHA_REGISTRO, ID_DOCUMENTO_TRANSFERENCIA_SALIDA)
            VALUES (@idAlmacen, @idAlmacenDestino, @idUsuario, 1, @envio, @fechaHora, @idDocSal);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idAlmacenDestino', value: idAlmacenDestino },
            { name: 'idUsuario', value: idUsuario },
            { name: 'envio', value: envio },
            { name: 'fechaHora', value: fechaHora },
            { name: 'idDocSal', value: idDocSal }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    async getInventarioByProducto(idAlmacen, campo, idProducto, fecha) {
        const result = await query(`
            SELECT ID_ALMACEN_INVENTARIO, ID_PLANTA_ALMACEN, ID_PRODUCTO_INTERMEDIO,
                   CANTIDAD_UTILIZADA, ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA,
                   FECHA_VENCIMIENTO,
                   CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) as CANTIDAD
            FROM PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.${campo} = @idProducto
            AND pai.ID_PLANTA_ALMACEN = @idAlmacen
            AND pai.ESTADO_INGRESO = 1
            AND pai.FECHA_VENCIMIENTO >= @fecha
            AND CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) > 0
            ORDER BY FECHA_VENCIMIENTO
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    async registrarEnInventarioAlmacen(data, transaction = null) {
        const {
            idAlmacen, idProducto, idIntermedio, cantidad, fechaHora,
            fechaVen, idUsuario, idUnidadMedida, idProducido, ingreso,
            estado, idInvA, idPD, idDetalleDevol
        } = data;
        const result = await query(`
            INSERT INTO PLANTA_ALMACEN_INVENTARIO
            (ID_PLANTA_ALMACEN, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD,
             ESTADO_INGRESO, FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO,
             USUARIO_REGISTRO, ID_UNIDAD_MEDIDA, ID_PLANTA_PRODUCTO_PRODUCIDO,
             ID_INVENTARIO_DESC, ID_PRODUCTO_DETALLE, ID_DETALLE_DEVOLUCION_ALMACEN,
             PRECIO_INGRESO_STOCK)
            VALUES (@idAlmacen, @idProducto, @idIntermedio, @cantidad,
                    @ingreso, @fechaHora, @fechaVen, @estado,
                    @idUsuario, @idUnidadMedida, @idProducido,
                    @idInvA, @idPD, @idDetalleDevol, 0);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idIntermedio', value: idIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'ingreso', value: ingreso },
            { name: 'fechaHora', value: fechaHora },
            { name: 'fechaVen', value: fechaVen },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'idProducido', value: idProducido },
            { name: 'idInvA', value: idInvA },
            { name: 'idPD', value: idPD },
            { name: 'idDetalleDevol', value: idDetalleDevol }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario, transaction = null) {
        const result = await query(`
            UPDATE PLANTA_ALMACEN_INVENTARIO
            SET CANTIDAD_UTILIZADA = @cantidad, ID_USUARIO_MODIFICA = @idUsuario
            WHERE ID_ALMACEN_INVENTARIO = @idInventario
        `, [
            { name: 'idInventario', value: idInventario },
            { name: 'cantidad', value: cantidad },
            { name: 'idUsuario', value: idUsuario }
        ], 'planta', transaction);
        return result.rowsAffected[0] > 0;
    }

    async registraTransfdetalle(idDoc, idProducto, idProductoIntermedio, idInventario, cantidad, fechaHora, transaction = null) {
        const result = await query(`
            INSERT INTO PLANTA_DETALLE_TRANSFERENCIA
            (ID_DOCUMENTO_TRANSFERENCIA, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
             ID_ALMACEN_INVENTARIO, CANTIDAD_TRANFERIDA, ESTADO, FECHA_REGISTRO)
            VALUES (@idDoc, @idProducto, @idProductoIntermedio,
                    @idInventario, @cantidad, 1, @fechaHora)
        `, [
            { name: 'idDoc', value: idDoc },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idInventario', value: idInventario },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
        return result.rowsAffected[0] > 0;
    }

    // ── Listar transferencias ──

    async listarTransferenciasProductos(idPlantaAlmacen, fechaInicio, fechaFin) {
        const result = await query(`
            EXEC GET_TRANFERENCIA_PRODUCTO @idPlantaAlmacen, @fechaInicio, @fechaFin
        `, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin }
        ]);
        return result.recordset;
    }

    async listarTransferenciasInsumos(idPlantaAlmacen, fechaInicio, fechaFin) {
        const result = await query(`
            EXEC GET_TRANFERENCIA_INSUMO @idPlantaAlmacen, @fechaInicio, @fechaFin
        `, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin }
        ]);
        return result.recordset;
    }

}

module.exports = new TransferenciaRepository();

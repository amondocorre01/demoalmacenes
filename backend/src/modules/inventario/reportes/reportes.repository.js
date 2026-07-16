const { query } = require('../../../config/database');
const InventarioHelper = require('../../../helpers/inventario.helper');

class ReportesRepository {

    async getProductosAlmacen(idAlmacen) {
        const result = await query(`EXEC GET_PRODUCTO_STOCK_ALMCEN @idAlmacen`, [
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset;
    }

    async getProductosPlanta(idAlmacen) {
        const result = await query(`
            SELECT *FROM (
                SELECT vpp.ID_PRODUCTO, 0 AS ID_PRODUCTO_INTERMEDIO, NOMBRE AS PRODUCTO,
                    COALESCE(pap.ESTADO, 0) AS ESTADO
                FROM VISTA_PLANTA_PRODUCTO vpp
                LEFT JOIN PLANTA_ALMACEN_PRODUCTO pap
                    ON pap.ID_PRODUCTO = vpp.ID_PRODUCTO AND pap.ID_PLANTA_ALMACEN = @idAlmacen
                WHERE CODIGO = '1' AND vpp.ESTADO = '1'
                UNION
                SELECT 0 AS ID_PRODUCTO, vppi.ID_PRODUCTO_INTERMEDIO, NOMBRE AS PRODUCTO,
                    COALESCE(pap.ESTADO, 0) AS ESTADO
                FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 vppi
                LEFT JOIN PLANTA_ALMACEN_PRODUCTO pap
                    ON pap.ID_PRODUCTO_INTERMEDIO = vppi.ID_PRODUCTO_INTERMEDIO AND pap.ID_PLANTA_ALMACEN = @idAlmacen
                WHERE vppi.ESTADO = '1'
            ) AS tb1 ORDER BY tb1.PRODUCTO, tb1.ESTADO
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset;
    }

    async getProductosEspeciales(idAlmacen) {
        const result = await query(`
            SELECT DISTINCT pp.ID_PRODUCTO, pp.NOMBRE,
                (SELECT TOP(1) pum.UNIDAD_MEDIDA
                 FROM PLANTA_PRODUCTO_DETALLE ppd, PLANTA_UNIDAD_MEDIDA pum
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO
                 AND pum.ID_UNIDAD_MEDIDA = ppd.ID_UNIDAD_MEDIDA_ADECUACION
                 AND ppd.ESTADO = 1
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS UNIDAD_MEDIDA,
                (SELECT TOP(1) ppd.ID_UNIDAD_MEDIDA_ADECUACION
                 FROM PLANTA_PRODUCTO_DETALLE ppd
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO AND ppd.ESTADO = 1
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS ID_UNIDAD_MEDIDA
            FROM PLANTA_PRODUCTO pp
            INNER JOIN PLANTA_ALMACEN_PRODUCTO pad
                ON pad.ID_PRODUCTO = pp.ID_PRODUCTO AND pad.ESTADO = 1
                AND pad.ID_PLANTA_ALMACEN = @idAlmacen
            WHERE pp.ESTADO = 1
            ORDER BY pp.NOMBRE ASC
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset;
    }

    async getProductoData(idProducto) {
        return await InventarioHelper.getProductoData(idProducto);
    }

    async getInventarioByProducto(idAlmacen, strWhere, fecha) {
        return await InventarioHelper.getInventarioByProducto(idAlmacen, strWhere, fecha);
    }

    async registrarProductoConversion(idAlmacen, idProductoIngreso, idProductoSalida, cantIngreso, cantSalida, idUnidadIngreso, idUnidadSalida, idUsuario, fechaHora) {
        const result = await query(`
            INSERT INTO PLANTA_PRODUCTO_CONVERCION
            (ID_PLANTA_ALMACEN, ID_PRODUCTO_INGRESO, ID_PRODUCTO_SALIDA, CANTIDAD_INGRESO, CANTIDAD_SALIDA,
             ID_UNIDAD_MEDIDA_INGRESO, ID_UNIDAD_MEDIDA_SALIDA, ID_USUARIO_REGISTRA, FECHA_REGISTRO, ESTADO)
            VALUES (@idAlmacen, @idProductoIngreso, @idProductoSalida, @cantIngreso, @cantSalida,
                    @idUnidadIngreso, @idUnidadSalida, @idUsuario, @fechaHora, 1);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProductoIngreso', value: idProductoIngreso },
            { name: 'idProductoSalida', value: idProductoSalida },
            { name: 'cantIngreso', value: cantIngreso },
            { name: 'cantSalida', value: cantSalida },
            { name: 'idUnidadIngreso', value: idUnidadIngreso },
            { name: 'idUnidadSalida', value: idUnidadSalida },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async registrarInventarioProducto(idAlmacen, idProducto, cantidad, fechaHora, duracion, fecha, idUsuario, idProductoDetalle, idUnidadMedida, idConversion) {
        const result = await query(`
            INSERT INTO PLANTA_ALMACEN_INVENTARIO
            (ID_PLANTA_ALMACEN, ID_PRODUCTO, CANTIDAD, ESTADO_INGRESO, FECHA_REGISTRO,
             FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_PRODUCTO_DETALLE,
             ID_UNIDAD_MEDIDA, ID_PRODUCTO_CONVERCION)
            VALUES (@idAlmacen, @idProducto, @cantidad, 1, @fechaHora,
                    DATEADD(DD, @duracion, @fecha), 1, @idUsuario, @idProductoDetalle,
                    @idUnidadMedida, @idConversion);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'duracion', value: duracion },
            { name: 'fecha', value: fecha },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'idConversion', value: idConversion }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async registrarDescuentoConversion(idAlmacen, idProducto, cant, fechaVenInv, idUsuario, idInvA, idPD, idUnidadInv, idConversion) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const result = await query(`
            INSERT INTO PLANTA_ALMACEN_INVENTARIO
            (ID_PLANTA_ALMACEN, ID_PRODUCTO, CANTIDAD, ESTADO_INGRESO, FECHA_REGISTRO,
             FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_INVENTARIO_DESC,
             ID_PRODUCTO_DETALLE, ID_UNIDAD_MEDIDA, ID_PRODUCTO_CONVERCION)
            VALUES (@idAlmacen, @idProducto, @cant, 0, @fechaHora,
                    @fechaVenInv, 2, @idUsuario, @idInvA,
                    @idPD, @idUnidadInv, @idConversion);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'cant', value: cant },
            { name: 'fechaHora', value: now },
            { name: 'fechaVenInv', value: fechaVenInv },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInvA', value: idInvA },
            { name: 'idPD', value: idPD },
            { name: 'idUnidadInv', value: idUnidadInv },
            { name: 'idConversion', value: idConversion }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario) {
        return await InventarioHelper.actualizarCantUtilizada(idInventario, cantidad, idUsuario);
    }

    async getInventarioAlmacen(idAlmacen, grupo, fecha) {
        const result = await query(`EXEC PL_GET_INVENTARIO_ALMACEN_V2 @fecha, @idAlmacen, @grupo`, [
            { name: 'fecha', value: fecha },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'grupo', value: grupo }
        ]);
        const rows = result.recordset || [];
        for (const row of rows) {
            if (row.DETALLE) {
                try { row.DETALLE = JSON.parse(row.DETALLE); } catch { row.DETALLE = []; }
            }
        }
        return rows;
    }

    async listarProductosDepreciados(idAlmacen, fechaInicio, fechaFin) {
        let sql = `
            SELECT ppc.*,
                (SELECT pa.DESCRICION FROM PLANTA_ALMACEN pa WHERE pa.ID_PLANTA_ALMACEN = ppc.ID_PLANTA_ALMACEN) AS ALMACEN,
                (SELECT PP.NOMBRE FROM PLANTA_PRODUCTO pp WHERE PP.ID_PRODUCTO = ppc.ID_PRODUCTO_INGRESO) AS PRODUCTO_INGRESO,
                (SELECT PP.NOMBRE FROM PLANTA_PRODUCTO pp WHERE PP.ID_PRODUCTO = ppc.ID_PRODUCTO_SALIDA) AS PRODUCTO_SALIDA,
                (SELECT pum.UNIDAD_MEDIDA FROM PLANTA_UNIDAD_MEDIDA pum WHERE pum.ID_UNIDAD_MEDIDA = ppc.ID_UNIDAD_MEDIDA_INGRESO) AS UNIDAD_MEDIDA_INGRESO,
                (SELECT pum.UNIDAD_MEDIDA FROM PLANTA_UNIDAD_MEDIDA pum WHERE pum.ID_UNIDAD_MEDIDA = ppc.ID_UNIDAD_MEDIDA_SALIDA) AS UNIDAD_MEDIDA_SALIDA
            FROM PLANTA_PRODUCTO_CONVERCION ppc
            WHERE 1 = 1
        `;
        const params = [];
        if (idAlmacen) {
            sql += ` AND ppc.ID_PLANTA_ALMACEN = @idAlmacen`;
            params.push({ name: 'idAlmacen', value: idAlmacen });
        }
        if (fechaInicio) {
            sql += ` AND ppc.FECHA_REGISTRO >= @fechaInicio`;
            params.push({ name: 'fechaInicio', value: fechaInicio + ' 00:00:00' });
        }
        if (fechaFin) {
            sql += ` AND ppc.FECHA_REGISTRO <= @fechaFin`;
            params.push({ name: 'fechaFin', value: fechaFin + ' 23:59:59' });
        }
        sql += ` ORDER BY ppc.FECHA_REGISTRO ASC`;
        const result = await query(sql, params);
        return result.recordset;
    }
    async listHistorialInventarioAlmacen(fechaInicio, fechaFin, idAlmacen, idProdDetalle, idProdIntermedio) {
        const result = await query(`
            EXEC PL_GET_HIST_INVENTARIO_ALMACEN @fechaInicio, @fechaFin, @idAlmacen, @idProdDetalle, @idProdIntermedio
        `, [
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProdDetalle', value: idProdDetalle },
            { name: 'idProdIntermedio', value: idProdIntermedio }
        ], 'planta');
        return result.recordset;
    }
}

module.exports = new ReportesRepository();

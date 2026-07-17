const { query } = require('../../config/database');

class DevolucionProductoRepository {

    // ─── getAreasByUsuario ───
    async getAreasByUsuario(idUsuario) {
        const sql = `
            SELECT pa.ID_AREA, pa.NOMBRE, pa.ESTADO,
                COALESCE(iu.ID_UBICACION, 0) AS ID_UBICACION, pa.ESTADO_SOLICITUD,
                (SELECT vccb.ID_CUENTA_BANCO, vccb.DESCRIPCION, vccb.NOMBRE_BANCO,
                    RIGHT(NUMERO_CUENTA, 4) as ULT4DIGITOS, MONEDA, TIPO,
                    CODIGO_CONTABLE, NOMBRE_CUENTA_CONTABLE
                 FROM VISTA_CONTA_CUENTA_BANCO vccb
                 INNER JOIN CONTA_AREA_CUENTA_BANCO cacb ON cacb.ID_CUENTA_BANCO = vccb.ID_CUENTA_BANCO AND cacb.ESTADO = 1
                 WHERE cacb.ID_AREA = pa.ID_AREA AND vccb.ESTADO = 1
                 FOR JSON AUTO) AS CUENTAS_BANCARIAS
            FROM PLANTA_AREA pa
            LEFT JOIN ID_UBICACION iu ON iu.ID_UBICACION = pa.ID_UBICACION AND iu.SUCURSAL = 1
            WHERE pa.ESTADO = 1 AND pa.ID_AREA IN (
                SELECT ID_AREA FROM PLANTA_PERMISOS_AREA WHERE ID_USUARIO = @idUsuario AND ESTADO = 1
            )
            ORDER BY pa.NOMBRE
        `;
        const result = await query(sql, [{ name: 'idUsuario', value: idUsuario }]);
        const rows = result.recordset || [];
        rows.forEach(row => {
            try {
                row.CUENTAS_BANCARIAS = JSON.parse(row.CUENTAS_BANCARIAS || '[]');
            } catch (e) {
                row.CUENTAS_BANCARIAS = [];
            }
        });
        return rows;
    }

    // ─── listAlmacenes ───
    async listAlmacenes() {
        const sql = `SELECT * FROM PLANTA_ALMACEN ap ORDER BY DESCRICION`;
        const result = await query(sql);
        return result.recordset || [];
    }

    // ─── listAlmacenActivos ───
    async listAlmacenActivos() {
        const sql = `SELECT * FROM PLANTA_ALMACEN ap WHERE ap.ESTADO = 1 ORDER BY DESCRICION ASC`;
        const result = await query(sql);
        return result.recordset || [];
    }

    // ─── listarProductosStock (almacen context) ───
    async listarProductosStock(idPlantaAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT ID_PRODUCTO, PRODUCTO, NOMBRE_DETALLE, UNIDAD_MEDIDA_E,
                SUM(CAST(((CANTIDAD - CANTIDAD_UTILIZADA) / CANTIDAD_ADECUACION) as decimal(10,2))) as CANTIDAD,
                CANTIDAD_ADECUACION, ID_PRODUCTO_DETALLE, PEDIDO_DECIMAL,
                (SELECT vpai2.ID_PRODUCTO,
                    SUM(CAST(((vpai2.CANTIDAD - vpai2.CANTIDAD_UTILIZADA) / vpai2.CANTIDAD_ADECUACION) as decimal(10,2))) as CANTIDAD,
                    vpai2.FECHA_VENCIMIENTO
                 FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai2
                 WHERE vpai2.FECHA_VENCIMIENTO >= @fecha
                   AND vpai2.ID_PRODUCTO <> 0
                   AND vpai2.ID_PLANTA_ALMACEN = @idPlantaAlmacen
                   AND vpai2.ID_PRODUCTO_DETALLE = vpai.ID_PRODUCTO_DETALLE
                   AND vpai2.ID_PRODUCTO = vpai.ID_PRODUCTO
                   AND vpai2.ESTADO_INGRESO = 1
                   AND ((vpai2.CANTIDAD - vpai2.CANTIDAD_UTILIZADA) / vpai2.CANTIDAD_ADECUACION) > 0
                 GROUP BY FECHA_VENCIMIENTO, ID_PRODUCTO
                 FOR JSON AUTO) as FECHAS
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai
            WHERE FECHA_VENCIMIENTO >= @fecha
              AND ID_PRODUCTO <> 0
              AND ID_PLANTA_ALMACEN = @idPlantaAlmacen
              AND ESTADO_INGRESO = 1
              AND ((CANTIDAD - CANTIDAD_UTILIZADA) / CANTIDAD_ADECUACION) > 0
            GROUP BY PRODUCTO, NOMBRE_DETALLE, ID_PRODUCTO, CANTIDAD_ADECUACION, ID_PRODUCTO_DETALLE, UNIDAD_MEDIDA_E, PEDIDO_DECIMAL
            ORDER BY PRODUCTO
        `;
        const result = await query(sql, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        const rows = result.recordset || [];
        rows.forEach(row => {
            try {
                row.FECHAS = JSON.parse(row.FECHAS || '[]');
            } catch (e) {
                row.FECHAS = [];
            }
        });
        return rows;
    }

    // ─── registrarDevolucionProducto helpers ───

    async getStockByProductoFecha(idPlantaAlmacen, idProducto, idProductoDetalle, fecha) {
        const sql = `
            SELECT pai.ID_PRODUCTO,
                SUM((CANTIDAD - CANTIDAD_UTILIZADA) / pai.CANTIDAD_ADECUACION) as CANTIDAD
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.ID_PLANTA_ALMACEN = @idPlantaAlmacen
              AND ID_PRODUCTO = @idProducto
              AND ID_PRODUCTO_DETALLE = @idProductoDetalle
              AND pai.ESTADO_INGRESO = 1
              AND pai.FECHA_VENCIMIENTO = @fecha
              AND ((CANTIDAD - CANTIDAD_UTILIZADA) / pai.CANTIDAD_ADECUACION) > 0
            GROUP BY pai.ID_PRODUCTO
        `;
        const result = await query(sql, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset?.[0]?.CANTIDAD || 0;
    }

    async registrarDevolDoc(idAlmacen, idArea, idUsuario, fechaHora, transaction = null) {
        const sql = `INSERT INTO PLANTA_DOCUMENTO_DEVOLUCION_ALMACEN (ID_PLANTA_ALMACEN, ID_AREA, ID_USUARIO, ESTADO, FECHA_REGISTRO)
                     VALUES (@idAlmacen, @idArea, @idUsuario, 1, @fechaHora);
                     SELECT SCOPE_IDENTITY() as id`;
                     
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idArea', value: idArea },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
        return result.recordset?.[0] ? result.recordset[0].id : 0;
    }

    async existeProductoEnDevol(idDoc, idProductoDetalle, idProducto, transaction = null) {
        const sql = `SELECT * FROM PLANTA_DETALLE_DEVOLUCION_ALMACEN
                     WHERE ID_PRODUCTO = @idProducto
                       AND ID_PRODUCTO_DETALLE = @idProductoDetalle
                       AND ID_DOCUMENTO_DEVOLUCION_ALMACEN = @idDoc`;
        const result = await query(sql, [
            { name: 'idDoc', value: idDoc },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProducto', value: idProducto }
        ], 'planta', transaction);
        return result.recordset[0] || null;
    }

    async registraDevolDetalle(idDoc, idProductoDetalle, idProducto, cantidad, fechaHora, transaction = null) {
        const existe = await this.existeProductoEnDevol(idDoc, idProductoDetalle, idProducto, transaction);
        if (existe) {
            const idDevDet = existe.ID_DETALLE_DEVOLUCION_ALMACEN;
            const sql = `UPDATE PLANTA_DETALLE_DEVOLUCION_ALMACEN
                         SET CANTIDAD_DEVUELTA = CANTIDAD_DEVUELTA + @cantidad
                         WHERE ID_DETALLE_DEVOLUCION_ALMACEN = @id`;
            await query(sql, [
                { name: 'cantidad', value: cantidad },
                { name: 'id', value: idDevDet }
            ], 'planta', transaction);
            return idDevDet;
        } else {
            const sql = `INSERT INTO PLANTA_DETALLE_DEVOLUCION_ALMACEN
                         (ID_DOCUMENTO_DEVOLUCION_ALMACEN, ID_PRODUCTO_DETALLE, ID_PRODUCTO, CANTIDAD_DEVUELTA, ESTADO, FECHA_REGISTRO)
                         VALUES (@idDoc, @idProductoDetalle, @idProducto, @cantidad, 1, @fechaHora);
                         SELECT SCOPE_IDENTITY() as id`;
            const result = await query(sql, [
                { name: 'idDoc', value: idDoc },
                { name: 'idProductoDetalle', value: idProductoDetalle },
                { name: 'idProducto', value: idProducto },
                { name: 'cantidad', value: cantidad },
                { name: 'fechaHora', value: fechaHora }
            ], 'planta', transaction);
            return result.recordset?.[0] ? result.recordset[0].id : 0;
        }
    }

    async getInventarioByProducto(idAlmacen, idProducto, idProductoDetalle, fecha, transaction = null) {
        const sql = `
            SELECT ID_ALMACEN_INVENTARIO, ID_PLANTA_ALMACEN, ID_PRODUCTO_INTERMEDIO,
                CANTIDAD_UTILIZADA, ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA,
                FECHA_VENCIMIENTO,
                CAST((CANTIDAD - CASE when CANTIDAD_UTILIZADA is null then 0 else CANTIDAD_UTILIZADA end) as numeric(18,2)) as CANTIDAD
            FROM PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.ID_PRODUCTO = @idProducto
              AND ID_PRODUCTO_DETALLE = @idProductoDetalle
              AND pai.ID_PLANTA_ALMACEN = @idAlmacen
              AND pai.ESTADO_INGRESO = 1
              AND pai.FECHA_VENCIMIENTO >= @fecha
              AND CAST((CANTIDAD - CASE when CANTIDAD_UTILIZADA is null then 0 else CANTIDAD_UTILIZADA end) as numeric(18,2)) > 0
            ORDER BY FECHA_VENCIMIENTO
        `;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'fecha', value: fecha }
        ], 'planta', transaction);
        return result.recordset || [];
    }

    async registrarEnInventarioAlmacen(idAlmacen, idProducto, idIntermedio, cantidad, fecha, fechaVen, idUsuario, idUnidadMedida, idProducido, ingreso, estado, idInvA, idPD, idDetalleDevol, transaction = null) {
        const precio = 0;
        const sql = `INSERT INTO PLANTA_ALMACEN_INVENTARIO
            (ID_PLANTA_ALMACEN, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD, ESTADO_INGRESO, FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_UNIDAD_MEDIDA, ID_PLANTA_PRODUCTO_PRODUCIDO, ID_INVENTARIO_DESC, ID_PRODUCTO_DETALLE, ID_DETALLE_DEVOLUCION_ALMACEN, PRECIO_INGRESO_STOCK)
            VALUES (@idAlmacen, @idProducto, @idIntermedio, @cantidad, @ingreso, @fecha, @fechaVen, @estado, @idUsuario, @idUnidadMedida, @idProducido, @idInvA, @idPD, @idDetalleDevol, @precio);
            SELECT SCOPE_IDENTITY() as id`;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idIntermedio', value: idIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'ingreso', value: ingreso },
            { name: 'fecha', value: fecha },
            { name: 'fechaVen', value: fechaVen },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'idProducido', value: idProducido },
            { name: 'idInvA', value: idInvA },
            { name: 'idPD', value: idPD },
            { name: 'idDetalleDevol', value: idDetalleDevol },
            { name: 'precio', value: precio }
        ], 'planta', transaction);
        return result.recordset?.[0] ? result.recordset[0].id : 0;
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario, transaction = null) {
        const sql = `UPDATE PLANTA_ALMACEN_INVENTARIO
                     SET CANTIDAD_UTILIZADA = @cantidad, ID_USUARIO_MODIFICA = @idUsuario
                     WHERE ID_ALMACEN_INVENTARIO = @idInventario`;
        await query(sql, [
            { name: 'cantidad', value: cantidad },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInventario', value: idInventario }
        ], 'planta', transaction);
    }

    async getDataInv(idInv, fechaVen, transaction = null) {
        const sql = `SELECT * FROM PLANTA_INVENTARIO pi3
                     WHERE ID_INVENTARIO = (
                         SELECT TOP 1 ID_INVENTARIO_DESC
                         FROM PLANTA_INVENTARIO pi2
                         WHERE pi2.ESTADO_INGRESO = 0
                           AND FECHA_VENCIMIENTO = @fechaVen
                           AND ID_PLANTA_ALMACEN_DETALLE = (
                               SELECT ID_PLANTA_ALMACEN_DETALLE
                               FROM PLANTA_ALMACEN_INVENTARIO pai
                               WHERE ID_ALMACEN_INVENTARIO = @idInv
                           )
                     )`;
        const result = await query(sql, [
            { name: 'idInv', value: idInv },
            { name: 'fechaVen', value: fechaVen }
        ], 'planta', transaction);
        return result.recordset[0] || null;
    }

    async devolProductoAPlanta(idArea, idProducto, cantidad, fecha, fechaVen, idUsuario, idUnidadMedida, idProducido, ingreso, estado, idInvA, idPD, idDetalleDevol, transaction = null) {
        const dataInv = await this.getDataInv(idInvA, fechaVen, transaction);
        const idCompDetalle = dataInv?.ID_COMPRA_DETALLE || 0;
        const idAlmDetalle = dataInv?.ID_PLANTA_ALMACEN_DETALLE || 0;
        const idSub2 = dataInv?.ID_SUB_CATEGORIA_2 || 0;
        const idPedidoDetalle = dataInv?.PLANTA_PEDIDO_DETALLE || 0;
        const idRegDetalle = dataInv?.ID_PLANTA_PEDIDO_REG_DETALLE || 0;
        const sql = `INSERT INTO PLANTA_INVENTARIO
            (ID_AREA, ID_PRODUCTO, CANTIDAD, ESTADO_INGRESO, FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_UNIDAD_MEDIDA, ID_PLANTA_PRODUCTO_PRODUCIDO, ID_INVENTARIO_DESC, ID_PRODUCTO_DETALLE,
             ID_COMPRA_DETALLE, ID_PLANTA_ALMACEN_DETALLE, ID_SUB_CATEGORIA_2, PLANTA_PEDIDO_DETALLE, ID_PLANTA_PEDIDO_REG_DETALLE, ID_DETALLE_DEVOLUCION_ALMACEN)
            VALUES (@idArea, @idProducto, @cantidad, @ingreso, @fecha, @fechaVen, @estado, @idUsuario, @idUnidadMedida, @idProducido, 0, @idPD,
                    @idCompDetalle, @idAlmDetalle, @idSub2, @idPedidoDetalle, @idRegDetalle, @idDetalleDevol);
                    SELECT SCOPE_IDENTITY() as id`;
        const result = await query(sql, [
            { name: 'idArea', value: idArea },
            { name: 'idProducto', value: idProducto },
            { name: 'cantidad', value: cantidad },
            { name: 'ingreso', value: ingreso },
            { name: 'fecha', value: fecha },
            { name: 'fechaVen', value: fechaVen },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'idProducido', value: idProducido },
            { name: 'idPD', value: idPD },
            { name: 'idCompDetalle', value: idCompDetalle },
            { name: 'idAlmDetalle', value: idAlmDetalle },
            { name: 'idSub2', value: idSub2 },
            { name: 'idPedidoDetalle', value: idPedidoDetalle },
            { name: 'idRegDetalle', value: idRegDetalle },
            { name: 'idDetalleDevol', value: idDetalleDevol }
        ], 'planta', transaction);
        return result.recordset?.[0] ? result.recordset[0].id : 0;
    }

    // ─── listarDevoluciones ───
    async listarDevoluciones(idPlantaAlmacen, fechaInicio, fechaFin) {
        const sql = `EXEC GET_DEVOLUCION_PRODUCTO_ALMACEN @idPlantaAlmacen, @fechaInicio, @fechaFin`;
        const result = await query(sql, [
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin }
        ]);
        const rows = result.recordset || [];
        rows.forEach(row => {
            try {
                row.DETALLE = JSON.parse(row.DETALLE || '[]');
            } catch (e) {
                row.DETALLE = [];
            }
        });
        return rows;
    }
}

module.exports = new DevolucionProductoRepository();

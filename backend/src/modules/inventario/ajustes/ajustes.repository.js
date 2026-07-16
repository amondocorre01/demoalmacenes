const { query, beginTransaction } = require('../../../config/database');

class AjustesRepository {

    // ── Stock ──

    async listarProductosStockAlmacen(idAlmacen) {
        const fecha = new Date().toISOString().split('T')[0];
        const result = await query(`
            EXEC GET_PRODUCTO_STOCK_ALMCEN @idAlmacen, @fecha
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    async getInventarioByProducto(idAlmacen, idProducto, idProductoDetalle, idProductoIntermedio, fecha) {
        let campo, params;
        if (idProductoIntermedio > 0) {
            campo = 'pai.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio';
            params = [
                { name: 'idProductoIntermedio', value: idProductoIntermedio }
            ];
        } else {
            campo = 'pai.ID_PRODUCTO = @idProducto AND pai.ID_PRODUCTO_DETALLE = @idProductoDetalle';
            params = [
                { name: 'idProducto', value: idProducto },
                { name: 'idProductoDetalle', value: idProductoDetalle }
            ];
        }
        const result = await query(`
            SELECT ID_ALMACEN_INVENTARIO, ID_PLANTA_ALMACEN, ID_PRODUCTO_INTERMEDIO,
                   CANTIDAD_UTILIZADA, ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA,
                   FECHA_VENCIMIENTO,
                   CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) as CANTIDAD
            FROM PLANTA_ALMACEN_INVENTARIO pai
            WHERE ${campo}
            AND pai.ID_PLANTA_ALMACEN = @idAlmacen
            AND pai.ESTADO_INGRESO = 1
            AND pai.FECHA_VENCIMIENTO >= @fecha
            AND CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) > 0
            ORDER BY FECHA_VENCIMIENTO
        `, [
            ...params,
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    // ── Precios ──

    async getPrecioProductoIntermedio(idProductoIntermedio) {
        const fecha = new Date().toISOString().split('T')[0];
        const result = await query(`
            SELECT dbo.getPrecioRecetaIntermedio(@id, @fecha) AS PRECIO
        `, [
            { name: 'id', value: idProductoIntermedio },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset[0]?.PRECIO || 0;
    }

    async getPrecioProductoDetalle2(idProductoDetalle) {
        const result = await query(`
            SELECT TOP 1 PRECIO FROM VISTA_PLANTA_COMPRA_DETALLE_PRECIO
            WHERE ID_PRODUCTO_DETALLE = @id
            ORDER BY FECHA_FACTURA DESC
        `, [{ name: 'id', value: idProductoDetalle }]);
        return result.recordset[0]?.PRECIO || 0;
    }

    async getPrecioProducto(idProducto) {
        const result = await query(`
            SELECT TOP 1 PRECIO FROM VISTA_PLANTA_COMPRA_DETALLE_PRECIO
            WHERE ID_PRODUCTO = @id
            ORDER BY FECHA_FACTURA DESC
        `, [{ name: 'id', value: idProducto }]);
        return result.recordset[0]?.PRECIO || 0;
    }

    async getProductoConversion(idProducto) {
        const fecha = new Date().toISOString().split('T')[0];
        const result = await query(`
            SELECT dbo.getProductoConversion(@id, @fecha) AS PRECIO
        `, [
            { name: 'id', value: idProducto },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset[0]?.PRECIO || 0;
    }

    async calcularPrecio(idProducto, idProductoDetalle, idProductoIntermedio) {
        if (idProducto === 0 || idProducto === '0') {
            return await this.getPrecioProductoIntermedio(idProductoIntermedio);
        }
        let precio = await this.getPrecioProductoDetalle2(idProductoDetalle);
        if (precio === 0) precio = await this.getPrecioProducto(idProducto);
        if (precio === 0) precio = await this.getProductoConversion(idProducto);
        return precio;
    }

    // ── Inventario ──

    async registrarEnInventarioAlmacen(data, transaction = null) {
        const {
            idAlmacen, idProducto, idIntermedio, cantidad, fechaHora,
            fechaVen, idUsuario, idUnidadMedida, idProducido, ingreso,
            estado, idInvA, idPD, idDetalleDevol
        } = data;

        let precio = 0;
        if ((estado === 8 || estado === 9) && ingreso === 1) {
            precio = await this.calcularPrecio(idProducto, idPD, idIntermedio);
        }
        precio = Math.round(precio * 100000000) / 100000000;

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
                    @idInvA, @idPD, @idDetalleDevol, @precio);
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
            { name: 'idDetalleDevol', value: idDetalleDevol },
            { name: 'precio', value: precio }
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

    // ── Desperdicio / Reposición ──

    async registrarDesperdicioAlmacen(data, transaction = null) {
        const {
            idAlmacen, idUsuario, idInv, idProductoDetalle, idProducto,
            idProductoIntermedio, cantidad, idUnidadMedida, fechaHora,
            fechaVen, detalle, tipo, prctoPrimario
        } = data;

        const precio = await this.calcularPrecio(idProducto, idProductoDetalle, idProductoIntermedio);
        const precioTotal = Math.round(cantidad * precio * 100) / 100;

        const result = await query(`
            INSERT INTO PLANTA_DESPERDICIO_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE,
             ID_PRODUCTO_INTERMEDIO, ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO,
             ESTADO, PRECIO_ASUMIDO_EMPRESA, PRECIO_ASUMIDO_EMPLEADO,
             ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO, DETALLE,
             ID_ESTADO, PROD_PRIMARIO, AUTOMATICO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle,
                    @idProductoIntermedio, @idUnidadMedida, @cantidad, @fechaHora,
                    1, 0, @precioTotal,
                    @idAlmacen, @precioTotal, @fechaVen, @detalle,
                    @tipo, @prctoPrimario, 0);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'precioTotal', value: precioTotal },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle },
            { name: 'tipo', value: tipo },
            { name: 'prctoPrimario', value: prctoPrimario }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    // ── Listar ajustes ──

    async listarProductosAjustes(idAlmacen, estadoIngreso, fechaInicio, fechaFin) {
        const result = await query(`
            SELECT ID_PRODUCTO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
                   SUM(CANTIDAD) as CANTIDAD,
                   COALESCE(PRODUCTO, PRODUCTO_INTERMEDIO) as PRODUCTO,
                   COALESCE(NOMBRE_DETALLE, PRODUCTO_INTERMEDIO) as PRODUCTO_DETALLE,
                   UNIDAD_MEDIDA, USUARIO_REGISTRA, FECHA_VENCIMIENTO, DETALLE
            FROM (
                SELECT *,
                    (SELECT TOP(1) DETALLE FROM PLANTA_DESPERDICIO_ALMACEN pda
                     WHERE pda.ID_ALMACEN_INVENTARIO = vpai.ID_ALMACEN_INVENTARIO) as DETALLE
                FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai
                WHERE ID_PLANTA_ALMACEN = @idAlmacen
                AND ESTADO_INGRESO = @estadoIngreso
                AND ID_ESTADO = 9
                AND FECHA_REGISTRO BETWEEN @fechaInicio AND @fechaFin
            ) tb
            GROUP BY ID_PRODUCTO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
                     PRODUCTO, PRODUCTO_INTERMEDIO, NOMBRE_DETALLE,
                     UNIDAD_MEDIDA, FECHA_VENCIMIENTO, USUARIO_REGISTRA, DETALLE
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'estadoIngreso', value: estadoIngreso },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin }
        ]);
        return result.recordset;
    }

    async getStockProductoAlmacen(idAlmacen, idProducto, idProductoDetalle, idProductoIntermedio) {
        const fecha = new Date().toISOString().split('T')[0];
        const result = await query(`
            SELECT SUM(CANTIDAD - CANTIDAD_UTILIZADA) AS CANTIDAD
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai
            WHERE FECHA_VENCIMIENTO >= @fecha
            AND vpai.ID_PRODUCTO = @idProducto
            AND ID_PRODUCTO_DETALLE = @idProductoDetalle
            AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            AND ID_PLANTA_ALMACEN = @idAlmacen
            AND ESTADO_INGRESO = 1
        `, [
            { name: 'fecha', value: fecha },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset[0]?.CANTIDAD || 0;
    }
}

module.exports = new AjustesRepository();

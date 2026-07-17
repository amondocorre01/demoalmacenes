const { query, beginTransaction } = require('../../../config/database');

class ReposicionDesperdicioRepository {

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

    // ── Desperdicios ──

    async listarDesperdicios(idsAlmacen, fechaInicio, fechaFin, idEstado) {
        const result = await query(`
            EXEC PL_GET_DESPERDICIO_ALMACEN @almacenes, @fechaInicio, @fechaFin, @idEstado
        `, [
            { name: 'almacenes', value: idsAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin },
            { name: 'idEstado', value: idEstado }
        ]);
        return result.recordset;
    }

    async existeDespAlmacen(idDesperdicio) {
        const result = await query(`
            SELECT * FROM PLANTA_DESPERDICIO_ALMACEN
            WHERE ID_PLANTA_DESPERDICIO_ALMACEN = @id
        `, [{ name: 'id', value: idDesperdicio }]);
        return result.recordset.length > 0;
    }

    async asignarResponsableDesperdicio(idUsuarioModifica, idUsuarioAsignado, idDesperdicio, transaction = null) {
        const result = await query(`
            UPDATE PLANTA_DESPERDICIO_ALMACEN
            SET ID_USUARIO_ASUMIDO = @idUsuarioAsignado,
                ID_USUARIO_MODIFICA = @idUsuarioModifica
            WHERE ID_PLANTA_DESPERDICIO_ALMACEN = @idDesperdicio
        `, [
            { name: 'idUsuarioModifica', value: idUsuarioModifica },
            { name: 'idUsuarioAsignado', value: idUsuarioAsignado },
            { name: 'idDesperdicio', value: idDesperdicio }
        ], 'planta', transaction);
        return result.rowsAffected[0] > 0;
    }

    // ── Productos vencidos ──

    async getProductosVencidos(idsAlmacen, fecha) {
        const result = await query(`
            EXEC PL_GET_PRODUCTOS_VENCIDOS_ALMACEN @almacenes, @fecha
        `, [
            { name: 'almacenes', value: idsAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset;
    }

    async getProductosVencidosGroup(idUsuario, fecha) {
        const result = await query(`
            EXEC PL_GET_PRODUCTOS_VENCIDOS_GROUP_ALMACEN @idUsuario, @fecha
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'fecha', value: fecha }
        ]);
        const data = result.recordset;
        data.forEach(r => {
            try { r.PRODUCTOS = r.PRODUCTOS ? JSON.parse(r.PRODUCTOS) : []; } catch { r.PRODUCTOS = []; }
        });
        return data;
    }

    // ── Productos con stock ──

    async getProductosAlmacenStock(idAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const result = await query(`
            SELECT tb.*,
                (SELECT tb.ID_PRODUCTO, tb.ID_PRODUCTO_DETALLE, tb.ID_PRODUCTO_INTERMEDIO,
                        tb.PRODUCTO, tb.CANTIDAD_ADECUACION, tb.PROD_PRIMARIO,
                        CAST((SUM(vpai2.CANTIDAD - vpai2.CANTIDAD_UTILIZADA) / tb.CANTIDAD_ADECUACION) as decimal(10,2)) as STOCK,
                        vpai2.FECHA_VENCIMIENTO
                 FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai2
                 WHERE vpai2.FECHA_VENCIMIENTO >= @fecha
                 AND vpai2.ID_PLANTA_ALMACEN = @idAlmacen
                 AND vpai2.ID_PRODUCTO_DETALLE = tb.ID_PRODUCTO_DETALLE
                 AND vpai2.ID_PRODUCTO = tb.ID_PRODUCTO
                 AND vpai2.ID_PRODUCTO_INTERMEDIO = tb.ID_PRODUCTO_INTERMEDIO
                 AND vpai2.ESTADO_INGRESO = 1
                 AND ((vpai2.CANTIDAD - vpai2.CANTIDAD_UTILIZADA) / vpai2.CANTIDAD_ADECUACION) > 0
                 GROUP BY FECHA_VENCIMIENTO
                 FOR JSON AUTO) as FECHAS
            FROM (
                SELECT ID_PRODUCTO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
                       COALESCE(PRODUCTO, PRODUCTO_INTERMEDIO) AS PRODUCTO,
                       COALESCE(NOMBRE_DETALLE, PRODUCTO_INTERMEDIO) AS NOMBRE_DETALLE,
                       UNIDAD_MEDIDA_E,
                       CAST((SUM(CANTIDAD - CANTIDAD_UTILIZADA) / CANTIDAD_ADECUACION) as decimal(10,2)) as CANTIDAD,
                       CANTIDAD_ADECUACION, PEDIDO_DECIMAL, PROD_PRIMARIO,
                       UNIDAD_MEDIDA AS UNIDAD_MEDIDA_A
                FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai
                WHERE FECHA_VENCIMIENTO >= @fecha
                AND ID_PLANTA_ALMACEN = @idAlmacen
                AND ESTADO_INGRESO = 1
                AND ((CANTIDAD - CANTIDAD_UTILIZADA) / CANTIDAD_ADECUACION) > 0
                GROUP BY PRODUCTO, NOMBRE_DETALLE, ID_PRODUCTO, CANTIDAD_ADECUACION,
                         ID_PRODUCTO_INTERMEDIO, ID_PRODUCTO_DETALLE, UNIDAD_MEDIDA_E,
                         PRODUCTO_INTERMEDIO, PEDIDO_DECIMAL, PROD_PRIMARIO, UNIDAD_MEDIDA
            ) tb
            ORDER BY PRODUCTO
        `, [
            { name: 'fecha', value: fecha },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        const data = result.recordset;
        data.forEach(row => {
            try { row.FECHAS = JSON.parse(row.FECHAS || '[]'); } catch { row.FECHAS = []; }
        });
        return data;
    }

    // ── Inventario ──

    async getInventarioByProducto(idAlmacen, idProducto, idProductoDetalle, idProductoIntermedio, fecha, conFechaVencimiento = false, transaction = null) {
        let campo, params;
        if (idProductoIntermedio > 0) {
            campo = 'pai.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio';
            params = [{ name: 'idProductoIntermedio', value: idProductoIntermedio }];
        } else {
            campo = 'pai.ID_PRODUCTO = @idProducto AND pai.ID_PRODUCTO_DETALLE = @idProductoDetalle';
            params = [
                { name: 'idProducto', value: idProducto },
                { name: 'idProductoDetalle', value: idProductoDetalle }
            ];
        }
        let filtroFecha = '';
        if (conFechaVencimiento) {
            filtroFecha = 'AND pai.FECHA_VENCIMIENTO <= @fechaVen';
            params.push({ name: 'fechaVen', value: fecha });
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
            ${filtroFecha}
            AND CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) > 0
            ORDER BY FECHA_VENCIMIENTO
        `, [
            ...params,
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ], 'planta', transaction);
        return result.recordset;
    }

    async getStockProductoAlmacenFecha(idAlmacen, idProducto, idProductoDetalle, idProdIn, fecha) {
        const result = await query(`
            SELECT SUM(CANTIDAD - CANTIDAD_UTILIZADA) AS CANTIDAD
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai
            WHERE FECHA_VENCIMIENTO = @fecha
            AND vpai.ID_PRODUCTO = @idProducto
            AND ID_PRODUCTO_DETALLE = @idProductoDetalle
            AND ID_PRODUCTO_INTERMEDIO = @idProdIn
            AND ID_PLANTA_ALMACEN = @idAlmacen
            AND ESTADO_INGRESO = 1
        `, [
            { name: 'fecha', value: fecha },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProdIn', value: idProdIn },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset[0]?.CANTIDAD || 0;
    }

    // ── Precios ──

    async getPrecioProductoIntermedio(idProductoIntermedio) {
        const fecha = new Date().toLocaleDateString('en-CA');
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
        const fecha = new Date().toLocaleDateString('en-CA');
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

    // ── Inventario: insertar / actualizar ──

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
            fechaVen, detalle, tipo, prctoPrimario,urlImgen=''
        } = data;

        const precio = await this.calcularPrecio(idProducto, idProductoDetalle, idProductoIntermedio);
        const precioTotal = Math.round(cantidad * precio * 100) / 100;

        const result = await query(`
            INSERT INTO PLANTA_DESPERDICIO_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE,
             ID_PRODUCTO_INTERMEDIO, ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO,
             ESTADO, PRECIO_ASUMIDO_EMPRESA, PRECIO_ASUMIDO_EMPLEADO,
             ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO, DETALLE,
             ID_ESTADO, PROD_PRIMARIO, AUTOMATICO,IMAGEN)
            VALUES (@idUsuario, @idInv, @idProductoDetalle,
                    @idProductoIntermedio, @idUnidadMedida, @cantidad, @fechaHora,
                    1, 0, @precioTotal,
                    @idAlmacen, @precioTotal, @fechaVen, @detalle,
                    @tipo, @prctoPrimario, 0,@urlImgen);
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
            { name: 'prctoPrimario', value: prctoPrimario },
            { name: 'urlImgen', value: urlImgen }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    async actualizarImagenDesperdicio(id, ruta) {
        await query(`UPDATE PLANTA_DESPERDICIO_ALMACEN SET IMAGEN = @ruta WHERE ID_PLANTA_DESPERDICIO_ALMACEN = @id`, [
            { name: 'ruta', value: ruta },
            { name: 'id', value: id }
        ]);
    }

    async registrarReposicionAlmacen(data, transaction = null) {
        const {
            idAlmacen, idUsuario, idInv, idProductoDetalle, idProducto,
            idProductoIntermedio, cantidad, idUnidadMedida, fechaHora,
            fechaVen, detalle, tipo
        } = data;

        const precio = await this.calcularPrecio(idProducto, idProductoDetalle, idProductoIntermedio);
        const precioTotal = Math.round(cantidad * precio * 100) / 100;

        const result = await query(`
            INSERT INTO PLANTA_REPOSICION_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE,
             ID_PRODUCTO_INTERMEDIO, ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO,
             ESTADO, PRECIO_ASUMIDO_EMPRESA, PRECIO_ASUMIDO_EMPLEADO,
             ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO, DETALLE,
             ID_ESTADO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle,
                    @idProductoIntermedio, @idUnidadMedida, @cantidad, @fechaHora,
                    1, 0, @precioTotal,
                    @idAlmacen, @precioTotal, @fechaVen, @detalle,
                    @tipo);
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
            { name: 'tipo', value: tipo }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    // ── Reposiciones ──

    async listarReposiciones(idsAlmacen, fechaInicio, fechaFin, idEstado) {
        const result = await query(`
            EXEC PL_GET_REPOSICION_ALMACEN @almacenes, @fechaInicio, @fechaFin, @idEstado
        `, [
            { name: 'almacenes', value: idsAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin },
            { name: 'idEstado', value: idEstado }
        ]);
        return result.recordset;
    }

    async existeReposicionAlmacen(idReposicion) {
        const result = await query(`
            SELECT * FROM PLANTA_REPOSICION_ALMACEN
            WHERE ID_PLANTA_REPOSICION_ALMACEN = @id
        `, [{ name: 'id', value: idReposicion }]);
        return result.recordset.length > 0;
    }

    async asignarResponsableReposicion(idUsuarioModifica, idUsuarioAsignado, idReposicion, transaction = null) {
        const fecha = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const result = await query(`
            UPDATE PLANTA_REPOSICION_ALMACEN
            SET ID_USUARIO_ASUMIDO = @idUsuarioAsignado,
                ID_USUARIO_MODIFICA = @idUsuarioModifica,
                FECHA_MODIFICACION = @fecha
            WHERE ID_PLANTA_REPOSICION_ALMACEN = @idReposicion
        `, [
            { name: 'idUsuarioModifica', value: idUsuarioModifica },
            { name: 'idUsuarioAsignado', value: idUsuarioAsignado },
            { name: 'fecha', value: fecha },
            { name: 'idReposicion', value: idReposicion }
        ], 'planta', transaction);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = new ReposicionDesperdicioRepository();

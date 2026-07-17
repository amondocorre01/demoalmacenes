const { query } = require('../../config/database');

class PedidosRepository {

    // ─── listAlmacenUsuario ───
    async listAlmacenUsuario(idUsuario, idAlmacen = 0) {
        let sql;
        if (idAlmacen === 0) {
            sql = `SELECT pa.* FROM PLANTA_PERMISO_ALMACEN ppa, PLANTA_ALMACEN pa
                   WHERE ppa.ID_USUARIO = @idUsuario AND ppa.ESTADO = 1 AND pa.ESTADO = 1
                     AND ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
                   ORDER BY pa.DESCRICION`;
        } else {
            sql = `SELECT DISTINCT pa.* FROM PLANTA_PERMISO_ALMACEN ppa, PLANTA_ALMACEN pa
                   WHERE ppa.ID_PLANTA_ALMACEN = @idAlmacen AND ppa.ID_USUARIO = @idUsuario
                     AND ppa.ESTADO = 1 AND pa.ESTADO = 1
                     AND ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
                   ORDER BY pa.DESCRICION`;
        }
        const result = await query(sql, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset || [];
    }

    // ─── getProductosPlantaAlmacen ───
    async getProductosPlantaAlmacen(idArea, idAlmacen) {
        const sql = `
            SELECT DISTINCT vppd.NOMBRE_DETALLE AS NOMBRE, vppd.PRODUCTO, vppd.ID_PRODUCTO_DETALLE,
                vppd.ID_PRODUCTO, vppd.UNIDAD_MEDIDA_E as UNIDAD_MEDIDA, vppd.PRESENTACION,
                vppd.CANTIDAD_ADECUACION AS CANTIDAD_MEDIDA, vppd.UNIDAD_MEDIDA_A, vppd.PEDIDO_DECIMAL
            FROM VISTA_PLANTA_PRODUCTO_DETALLE vppd, PLANTA_ALMACEN_PRODUCTO pap
            WHERE vppd.ID_PRODUCTO = pap.ID_PRODUCTO
              AND pap.ESTADO = 1
              AND (vppd.ESTADO = 1 OR vppd.ESTADO_PRODUCCION = 1)
              AND vppd.ESTADO_PRODUCTO = 1
              AND pap.ID_PLANTA_ALMACEN = @idAlmacen
            ORDER BY vppd.NOMBRE_DETALLE
        `;
        const result = await query(sql, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset || [];
    }

    // ─── getInventarioArea ───
    async getInventarioArea(idArea) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT (SUM(pi2.CANTIDAD)) as CANTIDAD, pi2.ID_PRODUCTO_DETALLE
            FROM VISTA_PLANTA_INVENTARIO pi2
            WHERE pi2.ESTADO_INGRESO = 1 AND pi2.ID_ESTADO <> 5 AND pi2.ID_AREA = @idArea
              AND pi2.FECHA_VENCIMIENTO >= @fecha
            GROUP BY pi2.ID_PRODUCTO_DETALLE
        `;
        const result = await query(sql, [
            { name: 'idArea', value: idArea },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset || [];
    }

    // ─── getInventarioPlantaData ───
    async getInventarioPlantaData(idArea, idDocumento) {
        const inventario = await this.getInventarioArea(idArea);
        const fecha = new Date().toLocaleDateString('en-CA');
        let sqlPedidos;
        if (idDocumento === 0) {
            sqlPedidos = `
                SELECT SUM(CANTIDAD_SOLICITADA) as CANTIDAD, ID_PRODUCTO_DETALLE
                FROM PLANTA_ALMACEN_DETALLE pad2, PLANTA_ALMACEN_DOCUMENTO pad3
                WHERE pad2.ID_PLANTA_ALMACEN_DOCUMENTO = pad3.ID_PLANTA_ALMACEN_DOCUMENTO
                  AND pad3.FECHA_A_ENTREGAR >= @fecha
                  AND pad3.ID_AREA = @idArea
                  AND pad3.ESTADO = 1
                GROUP BY ID_PRODUCTO_DETALLE
            `;
        } else {
            sqlPedidos = `
                SELECT SUM(CANTIDAD_SOLICITADA) as CANTIDAD, ID_PRODUCTO_DETALLE
                FROM PLANTA_ALMACEN_DETALLE pad2, PLANTA_ALMACEN_DOCUMENTO pad3
                WHERE pad2.ID_PLANTA_ALMACEN_DOCUMENTO = pad3.ID_PLANTA_ALMACEN_DOCUMENTO
                  AND pad3.FECHA_A_ENTREGAR >= @fecha
                  AND pad3.ID_PLANTA_ALMACEN_DOCUMENTO <> @idDocumento
                  AND pad3.ID_AREA = @idArea
                  AND pad3.ESTADO = 1
                GROUP BY ID_PRODUCTO_DETALLE
            `;
        }
        const resultPedidos = await query(sqlPedidos, [
            { name: 'idArea', value: idArea },
            { name: 'fecha', value: fecha },
            { name: 'idDocumento', value: idDocumento }
        ]);
        const pedidosTotal = {};
        for (const p of resultPedidos.recordset) {
            pedidosTotal[p.ID_PRODUCTO_DETALLE] = p.CANTIDAD || 0;
        }
        const inv = {};
        for (const i of inventario) {
            const idP = i.ID_PRODUCTO_DETALLE;
            const cant = pedidosTotal[idP] || 0;
            const cantidad = i.CANTIDAD || 0;
            const disponible = Math.round((cantidad - cant) * 100) / 100;
            inv[idP] = disponible > 0 ? disponible : 0;
        }
        return inv;
    }

    // ─── getPlGetProductoArea (EXEC PL_GET_PRODUCTO_AREA) ───
    async getPlGetProductoArea(idArea) {
        const sql = `EXEC PL_GET_PRODUCTO_AREA @idArea`;
        const result = await query(sql, [{ name: 'idArea', value: idArea }]);
        return result.recordset || [];
    }

    // ─── verificarStockDisponible ───
    async verificarStockDisponible(idArea, productos, idDocumento) {
        const inventario = await this.getInventarioPlantaData(idArea, idDocumento);
        const data = await this.getPlGetProductoArea(idArea);
        const products = {};
        for (const v of data) {
            products[v.ID_PRODUCTO] = v.NOMBRE;
        }
        const res = [];
        for (const key of Object.keys(productos)) {
            const producto = productos[key];
            if (producto) {
                const cantidad = producto.cantidad || 0;
                const stock = inventario[key] || 0;
                if (cantidad && cantidad > stock) {
                    res.push({
                        id_producto: parseInt(key),
                        producto: products[key] || '',
                        cantida_solitada: cantidad,
                        stock
                    });
                }
            }
        }
        return res;
    }

    // ─── guardarSolicitud ───
    async guardarSolicitud(estado, idPlantaAlmacen, idUsuario, fechaEntrega, productos, idArea, transaction = null) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const hora = new Date().toLocaleTimeString('en-CA', { hour12: false });
        const sqlDoc = `INSERT INTO PLANTA_ALMACEN_DOCUMENTO (ESTADO, FECHA_REGISTRO, HORA_REGISTRO, ID_USUARIO, ID_PLANTA_ALMACEN, FECHA_A_ENTREGAR, ID_AREA)
                        VALUES (1, @fecha, @hora, @idUsuario, @idPlantaAlmacen, @fechaEntrega, @idArea);
                        SELECT SCOPE_IDENTITY() as id;`;
        const resultDoc = await query(sqlDoc, [
            { name: 'fecha', value: fecha },
            { name: 'hora', value: hora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idPlantaAlmacen', value: idPlantaAlmacen },
            { name: 'fechaEntrega', value: fechaEntrega },
            { name: 'idArea', value: idArea }
        ], 'planta', transaction);
        const idDocumento = resultDoc.recordset?.[0] ? resultDoc.recordset[0].id : 0;
        if (!idDocumento) {
            return { status: false, message: 'Ocurrio un error al guardar la información.' };
        }
        await this.registrarPedidoReg(idUsuario, 1, idDocumento, transaction);
        for (const key of Object.keys(productos)) {
            const cantidad = productos[key]?.cantidad || 0;
            if (cantidad && cantidad > 0) {
                const sqlItem = `EXECUTE SET_ITEM_ALMACEN_PEDIDO @estado, @cantidad, @idUsuario, @key, @idProducto, @idDocumento`;
                await query(sqlItem, [
                    { name: 'estado', value: estado },
                    { name: 'cantidad', value: cantidad },
                    { name: 'idUsuario', value: idUsuario },
                    { name: 'key', value: parseInt(key) },
                    { name: 'idProducto', value: parseInt(key) },
                    { name: 'idDocumento', value: idDocumento }
                ], 'planta', transaction);
            }
        }
        return { status: true, message: 'Se ha registrado correctamente la información.' };
    }

    // ─── registrarPedidoReg ───
    async registrarPedidoReg(idUsuario, estado, idDocumento, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `INSERT INTO PLANTA_ALMACEN_REGISTRO (FECHA, ID_USUARIO, ID_ESTADO, ID_ALMACEN_PEDIDO_DOCUMENTO)
                     VALUES (@fecha, @idUsuario, 1, @idDocumento)`;
        await query(sql, [
            { name: 'fecha', value: fechaHora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idDocumento', value: idDocumento }
        ], 'planta', transaction);
    }

    // ─── editarSolicitudAlmacen ───
    async editarSolicitudAlmacen(idDocumento, idUsuario, productos, transaction = null) {
        for (const key of Object.keys(productos)) {
            const cantidad = productos[key]?.cantidad || 0;
            const sql = `UPDATE PLANTA_ALMACEN_DETALLE
                         SET CANTIDAD_SOLICITADA = @cantidad, ID_USUARIO_MODIFICA = @idUsuario
                         WHERE ID_PRODUCTO_DETALLE = @idProductoDetalle
                           AND ID_PLANTA_ALMACEN_DOCUMENTO = @idDocumento`;
            await query(sql, [
                { name: 'cantidad', value: cantidad },
                { name: 'idUsuario', value: idUsuario },
                { name: 'idProductoDetalle', value: parseInt(key) },
                { name: 'idDocumento', value: idDocumento }
            ], 'planta', transaction);
        }
        return { status: true, message: 'Se guardo correctamente el cambio solicitado.' };
    }

    // ─── listPedidosAlmacen ───
    async listPedidosAlmacen(idPlantaAlmacen, idsAlmacen, fechaInicio, fechaFin) {
        let sql;
        if (idPlantaAlmacen) {
            sql = `EXECUTE GET_ALMACEN_PEDIDOS @id, @inicio, @fin`;
        } else {
            sql = `EXECUTE GET_ALMACEN_PEDIDOS_V2 @id, @inicio, @fin`;
        }
        const result = await query(sql, [
            { name: 'id', value: idPlantaAlmacen || idsAlmacen },
            { name: 'inicio', value: fechaInicio },
            { name: 'fin', value: fechaFin }
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

    // ─── getPermisosReporte ───
    async getPermisosReporte(idVentasAcceso, idUsuario) {
        const sql = `SELECT * FROM VENTAS_USUARIOS_ACCESO va
                     WHERE va.ID_VENTAS_ACCESO = @idVentasAcceso AND va.ID_USUARIO = @idUsuario`;
        const result = await query(sql, [
            { name: 'idVentasAcceso', value: idVentasAcceso },
            { name: 'idUsuario', value: idUsuario }
        ]);
        return result.recordset || [];
    }
}

module.exports = new PedidosRepository();

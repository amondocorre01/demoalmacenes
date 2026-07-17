const { query } = require('../../config/database');

class ConfiguracionRepository {

    async listAlmacenes() {
        const sql = `
            SELECT *,
                (SELECT * from(
                    SELECT ID_PLANTA_RECETA_ALMACEN, pr.DESCRIPCION, 0 as ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT pra.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT ppr.* FROM VISTA_PLANTA_PRODUCTO_RECETA ppr WHERE PPR.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA ORDER BY PRODUCTO DESC FOR JSON AUTO) AS PRODUCTOS
                    FROM PLANTA_RECETA_ALMACEN pra, PLANTA_RECETA pr
                    WHERE pra.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA and pra.ID_PLANTA_ALMACEN = ap.ID_PLANTA_ALMACEN
                    UNION
                    SELECT 0 as ID_PLANTA_RECETA_ALMACEN, NOMBRE as DESCRIPCION, ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT papi.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT vpri.* FROM VISTA_PLANTA_RECETA_INTERMEDIO vpri WHERE vpri.ID_PLANTA_RI_PI = vppi.ID_PLANTA_RI_PI and vpri.ESTADO = 1 FOR JSON AUTO) as PRODUCTOS
                    FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 vppi, PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
                    WHERE papi.ID_PRODUCTO_INTERMEDIO = vppi.ID_PRODUCTO_INTERMEDIO AND papi.ID_PLANTA_ALMACEN = ap.ID_PLANTA_ALMACEN and vppi.ESTADO = 1
                ) as tb
                FOR JSON AUTO) as RECETAS
            FROM PLANTA_ALMACEN ap ORDER BY DESCRICION
        `;
        const result = await query(sql);
        return result.recordset || [];
    }

    async getProductosAlmacen(idAlmacen) {
        const sql = `
            SELECT *,
                (SELECT TOP(1) pum.UNIDAD_MEDIDA
                 FROM PLANTA_PRODUCTO_DETALLE ppd, PLANTA_UNIDAD_MEDIDA pum
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO
                   AND pum.ID_UNIDAD_MEDIDA = ppd.ID_UNIDAD_MEDIDA_ADECUACION
                   AND ppd.ESTADO = 1
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS UNIDAD_MEDIDA
            FROM PLANTA_PRODUCTO pp
            WHERE ID_PRODUCTO IN (
                SELECT DISTINCT(ID_PRODUCTO)
                FROM PLANTA_ALMACEN_INVENTARIO pai
                WHERE ID_PLANTA_ALMACEN = @idAlmacen
            )
            ORDER BY NOMBRE
        `;
        const result = await query(sql, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset || [];
    }

    async getStockAlmacen(idAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT SUM(INV.CANTIDAD) AS CANTIDAD, ID_PRODUCTO
            FROM (
                SELECT ID_PRODUCTO, (CANTIDAD - CANTIDAD_UTILIZADA) as CANTIDAD
                FROM PLANTA_ALMACEN_INVENTARIO pai
                WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
                  AND pai.ESTADO_INGRESO = 1
                  AND pai.FECHA_VENCIMIENTO >= @fecha
            ) INV
            GROUP BY ID_PRODUCTO
        `;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        const inventario = {};
        for (const r of result.recordset) {
            inventario[r.ID_PRODUCTO] = r.CANTIDAD;
        }
        return inventario;
    }

    async existeProductoEnAlmacen(idAlmacen, idProducto, idProductoIntermedio) {
        const sql = `SELECT * FROM PLANTA_ALMACEN_PRODUCTO
                     WHERE ID_PRODUCTO = @idProducto
                       AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
                       AND ID_PLANTA_ALMACEN = @idAlmacen`;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio }
        ]);
        return result.recordset[0] || null;
    }

    async editarEstadoProductoAlmacen(id, estado) {
        const sql = `UPDATE PLANTA_ALMACEN_PRODUCTO SET ESTADO = @estado WHERE ID_ALMACEN_PRODUCTO = @id`;
        await query(sql, [
            { name: 'id', value: id },
            { name: 'estado', value: estado }
        ]);
    }

    async registrarProductoAlmacen(idProducto, idProductoIntermedio, idAlmacen) {
        const sql = `INSERT INTO PLANTA_ALMACEN_PRODUCTO (ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, ID_PLANTA_ALMACEN, ESTADO)
                     VALUES (@idProducto, @idProductoIntermedio, @idAlmacen, 1)`;
        const result = await query(sql, [
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset?.[0] ? result.recordset[0].ID_ALMACEN_PRODUCTO : 0;
    }

    async listProductosForAlmacen() {
        const sql = `SELECT * FROM VISTA_PLANTA_PRODUCTO_DETALLE
                     WHERE ID_PRODUCTO IN (
                         SELECT DISTINCT pap.ID_PRODUCTO
                         FROM PLANTA_ALMACEN_PRODUCTO pap
                         WHERE ESTADO = 1 AND pap.ID_PRODUCTO <> 0
                     )`;
        const result = await query(sql);
        return result.recordset || [];
    }

    async existeProductoDetalleById(idProductoDetalle) {
        const sql = `SELECT ID_PRODUCTO_DETALLE FROM PLANTA_PRODUCTO_DETALLE WHERE ID_PRODUCTO_DETALLE = @id`;
        const result = await query(sql, [{ name: 'id', value: idProductoDetalle }]);
        return (result.recordset?.length || 0) > 0;
    }

    async validarUnidadMedida(idProductoDetalle, idUnidadMedida) {
        const sql = `SELECT * FROM PLANTA_PRODUCTO_DETALLE
                     WHERE ID_PRODUCTO_DETALLE = @idProductoDetalle
                       AND (ID_UNIDAD_MEDIDA_ESTANDAR = @idUnidadMedida OR ID_UNIDAD_MEDIDA_ADECUACION = @idUnidadMedida)`;
        const result = await query(sql, [
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ]);
        return result.recordset[0] || null;
    }

    async actualizarUnidadMedidaDeclaracion(idProductoDetalle, idUnidadMedida, nota) {
        let sql = `UPDATE PLANTA_PRODUCTO_DETALLE SET ID_UNIDAD_MEDIDA_DECLARACION = @idUnidadMedida`;
        const params = [
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ];
        if (nota) {
            sql += `, NOTA = @nota`;
            params.push({ name: 'nota', value: nota });
        }
        sql += ` WHERE ID_PRODUCTO_DETALLE = @idProductoDetalle`;
        const result = await query(sql, params);
        return result.rowsAffected?.[0] > 0;
    }
}

module.exports = new ConfiguracionRepository();

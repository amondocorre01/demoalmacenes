const { query, queryWithTransaction } = require('../../../config/database');

const StockService = {
    async getIdAreaPlanta(idUbicacion) {
        const result = await query(
            'SELECT * FROM PLANTA_AREA WHERE ID_UBICACION = @id',
            [{ name: 'id', value: idUbicacion }],
            'planta'
        );
        return result.recordset[0]?.ID_AREA || 0;
    },

    async getStocksPlanta() {
        const idUbicacion = 9;
        const idArea = await this.getIdAreaPlanta(idUbicacion);
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT ID_SUB_CATEGORIA_2, SUM(CANTIDAD) AS CANTIDAD FROM (
                SELECT pi2.ID_SUB_CATEGORIA_2,
                    ROUND((SUM(CAST(pi2.CANTIDAD AS FLOAT) - pi2.CANTIDAD_UTILIZADA) / COALESCE(ppd.CANTIDAD_ADECUACION, 1)), 2) AS CANTIDAD
                FROM PLANTA_INVENTARIO pi2
                INNER JOIN INVENTARIOS_SUB_CATEGORIA_2 isc ON isc.ID_SUB_CATEGORIA_2 = pi2.ID_SUB_CATEGORIA_2
                LEFT JOIN PLANTA_PRODUCTO_DETALLE ppd ON ppd.ID_PRODUCTO_DETALLE = pi2.ID_PRODUCTO_DETALLE AND isc.GRUPO <> 1
                WHERE ID_AREA = @idArea
                  AND FECHA_VENCIMIENTO >= @fecha
                  AND ESTADO_INGRESO = 1
                  AND ID_ESTADO <> 5
                  AND pi2.ID_SUB_CATEGORIA_2 IS NOT NULL
                  AND pi2.ID_SUB_CATEGORIA_2 <> 0
                  AND (pi2.CANTIDAD - pi2.CANTIDAD_UTILIZADA) > 0
                GROUP BY pi2.ID_SUB_CATEGORIA_2, ppd.CANTIDAD_ADECUACION
            ) tb GROUP BY ID_SUB_CATEGORIA_2
        `;
        const result = await query(
            sql,
            [
                { name: 'idArea', value: idArea },
                { name: 'fecha', value: fecha }
            ],
            'planta'
        );
        const stocks = {};
        for (const row of result.recordset) {
            stocks[row.ID_SUB_CATEGORIA_2] = row.CANTIDAD;
        }
        return stocks;
    },

    async getStocksPlantaBySubCat2(idSub2) {
        const idUbicacion = 9;
        const idArea = await this.getIdAreaPlanta(idUbicacion);
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT pp.ID_PRODUCTO_DETALLE, NOMBRE_DETALLE, COALESCE(subquery.CANTIDAD, 0) AS CANTIDAD
            FROM PLANTA_PRODUCTO_DETALLE pp
            LEFT JOIN (
                SELECT pi2.ID_PRODUCTO_DETALLE, pi2.ID_SUB_CATEGORIA_2,
                    ROUND((SUM(CAST(pi2.CANTIDAD AS FLOAT) - pi2.CANTIDAD_UTILIZADA) / COALESCE(ppd.CANTIDAD_ADECUACION, 1)), 2) AS CANTIDAD
                FROM PLANTA_INVENTARIO pi2
                INNER JOIN INVENTARIOS_SUB_CATEGORIA_2 isc ON isc.ID_SUB_CATEGORIA_2 = pi2.ID_SUB_CATEGORIA_2
                INNER JOIN PLANTA_PRODUCTO_DETALLE ppd ON ppd.ID_PRODUCTO_DETALLE = pi2.ID_PRODUCTO_DETALLE AND isc.GRUPO <> 1
                WHERE ID_AREA = @idArea
                  AND FECHA_VENCIMIENTO >= @fecha
                  AND ESTADO_INGRESO = 1
                  AND ID_ESTADO <> 5
                  AND pi2.ID_SUB_CATEGORIA_2 IS NOT NULL
                  AND pi2.ID_SUB_CATEGORIA_2 <> 0
                  AND (pi2.CANTIDAD - pi2.CANTIDAD_UTILIZADA) > 0
                  AND ppd.ID_SUB_CATEGORIA_2 = @idSub2
                GROUP BY pi2.ID_SUB_CATEGORIA_2, ppd.CANTIDAD_ADECUACION, pi2.ID_PRODUCTO_DETALLE
            ) AS subquery ON pp.ID_PRODUCTO_DETALLE = subquery.ID_PRODUCTO_DETALLE
            WHERE pp.ID_SUB_CATEGORIA_2 = @idSub2
        `;
        const result = await query(
            sql,
            [
                { name: 'idArea', value: idArea },
                { name: 'fecha', value: fecha },
                { name: 'idSub2', value: idSub2 }
            ],
            'planta'
        );
        return result.recordset;
    },

    async getAdecuacionPedido(idSub2, transaction) {
        const sql = `
            SELECT CASE
                WHEN GRUPO = 1 THEN CANTIDAD_ADECUACION_PEDIDOS * CANTIDAD_ESTANDARIZADA
                ELSE 1
            END AS ADECUACION
            FROM INVENTARIOS_SUB_CATEGORIA_2
            WHERE ID_SUB_CATEGORIA_2 = @idSub2
        `;
        const params = [{ name: 'idSub2', value: idSub2 }];
        let result;
        if (transaction) {
            result = await queryWithTransaction(transaction, sql, params);
        } else {
            result = await query(sql, params, 'planta');
        }
        return result.recordset[0]?.ADECUACION || 1;
    }
};

module.exports = StockService;

const { query } = require('../../../config/database');

const InventarioService = {
    async getInventariosSubcategoria2(fecha, tipoReporte) {
        let sql;
        if (tipoReporte === 'ALL') {
            sql = `SELECT (SELECT CATEGORIA FROM INVENTARIOS_CATEGORIA c WHERE c.ID_CATEGORIA = v1.ID_CATEGORIA) AS CATEGORIA, v2.*,
                (SELECT SUM(d.RECIBIDA) FROM DESPACHO d WHERE v2.ID_SUB_CATEGORIA_2 = d.ID_SUB_CATEGORIA_2 AND d.FECHA = @fecha) AS RECIBIDA,
                (SELECT it.TURNO FROM INVENTARIOS_TURNO it WHERE v2.ID_TURNO = it.ID_TURNO) AS TURNO,
                (SELECT TOP 1 d.ESTADO FROM DESPACHO d WHERE v2.ID_SUB_CATEGORIA_2 = d.ID_SUB_CATEGORIA_2 AND d.FECHA = @fecha) AS ESTADO
                FROM INVENTARIOS_SUB_CATEGORIA_2 v2, INVENTARIOS_SUB_CATEGORIA_1 v1
                WHERE v2.ESTADO_REPOSICION = 1 AND v2.ESTADO_PLANTA = 1
                  AND v2.ID_SUB_CATEGORIA_1 = v1.ID_SUB_CATEGORIA_1 AND v1.ESTADO = 1
                  AND v2.ESTADO_REPOSICION = 1 AND v1.ID_CATEGORIA IS NOT NULL
                  AND ID_SUB_CATEGORIA_2 NOT IN (SELECT ID_SUB_CATEGORIA_2 FROM PEDIDO_FESTIVO WHERE ESTADO = 1)
                ORDER BY v1.ID_SUB_CATEGORIA_1`;
        } else {
            sql = `SELECT (SELECT CATEGORIA FROM INVENTARIOS_CATEGORIA c WHERE c.ID_CATEGORIA = v1.ID_CATEGORIA) AS CATEGORIA, v2.*,
                (SELECT SUM(d.RECIBIDA) FROM DESPACHO d WHERE v2.ID_SUB_CATEGORIA_2 = d.ID_SUB_CATEGORIA_2 AND d.FECHA = @fecha) AS RECIBIDA,
                it2.TURNO,
                (SELECT TOP 1 d.ESTADO FROM DESPACHO d WHERE v2.ID_SUB_CATEGORIA_2 = d.ID_SUB_CATEGORIA_2 AND d.FECHA = @fecha) AS ESTADO
                FROM INVENTARIOS_SUB_CATEGORIA_2 v2, INVENTARIOS_SUB_CATEGORIA_1 v1, INVENTARIOS_TURNO it2
                WHERE v2.ESTADO_REPOSICION = 1 AND v2.ESTADO_PLANTA = 1
                  AND v2.ID_TURNO = it2.ID_TURNO AND it2.TURNO = @tipoReporte
                  AND v2.ID_SUB_CATEGORIA_1 = v1.ID_SUB_CATEGORIA_1 AND v1.ESTADO = 1
                  AND v2.ESTADO_REPOSICION = 1 AND v1.ID_CATEGORIA IS NOT NULL
                  AND ID_SUB_CATEGORIA_2 NOT IN (SELECT ID_SUB_CATEGORIA_2 FROM PEDIDO_FESTIVO WHERE ESTADO = 1)
                ORDER BY v1.ID_SUB_CATEGORIA_1`;
        }
        const result = await query(
            sql,
            [
                { name: 'fecha', value: fecha },
                { name: 'tipoReporte', value: tipoReporte }
            ],
            'default'
        );
        return result.recordset;
    },

    async getSubcategoria2AFechar(tipoReporte) {
        let sql;
        if (tipoReporte === 'ALL') {
            sql = `SELECT ID_SUB_CATEGORIA_2, DURACION, SUB_CATEGORIA_2, it.TURNO
                FROM INVENTARIOS_SUB_CATEGORIA_2 i2, INVENTARIOS_TURNO it
                WHERE i2.ID_TURNO = it.ID_TURNO
                  AND i2.ESTADO_REPOSICION = 1 AND i2.ESTADO_PLANTA = 1 AND i2.PARA_FECHAR = 1`;
        } else {
            sql = `SELECT ID_SUB_CATEGORIA_2, DURACION, SUB_CATEGORIA_2, it.TURNO
                FROM INVENTARIOS_SUB_CATEGORIA_2 i2, INVENTARIOS_TURNO it
                WHERE i2.ID_TURNO = it.ID_TURNO
                  AND it.TURNO = @tipoReporte
                  AND i2.ESTADO_REPOSICION = 1 AND i2.ESTADO_PLANTA = 1 AND i2.PARA_FECHAR = 1`;
        }
        const result = await query(
            sql,
            [{ name: 'tipoReporte', value: tipoReporte }],
            'default'
        );
        return result.recordset;
    },

    async getPedidoSucursal(dbName, sufijo, fecha, tipoReporte) {
        const cabSql = `SELECT ID_CABECERA, ESTADO, FECHA, PERFIL, BLOQUEADO_GENERAL, BLOQUEO, PLANTA
            FROM CABECERA_PEDIDO${sufijo}
            WHERE PLANTA = 1 AND FECHA_A_ENTREGAR = @fecha`;
        const cabResult = await query(cabSql, [{ name: 'fecha', value: fecha }], dbName);
        const idCabecera = cabResult.recordset[0]?.ID_CABECERA || 0;

        let detSql;
        if (tipoReporte === 'ALL') {
            detSql = `SELECT * FROM INVENTARIOS_DECLARACION${sufijo} WHERE ID_CABECERA = @idCabecera`;
        } else {
            detSql = `SELECT * FROM INVENTARIOS_DECLARACION${sufijo} WHERE ID_CABECERA = @idCabecera AND TURNO = @tipoReporte`;
        }
        const detResult = await query(
            detSql,
            [
                { name: 'idCabecera', value: idCabecera },
                { name: 'tipoReporte', value: tipoReporte }
            ],
            dbName
        );
        const res = {};
        for (const row of detResult.recordset) {
            res[row.ID_SUBCATEGORIA_2] = {
                cantidad_enviada: row.CANTIDAD_ENVIADA,
                cantidad_solicitada: row.CANTIDAD_SOLICITADA,
                estado: row.ESTADO_CONTEO
            };
        }
        return res;
    },

    async getPedidoSucursalTurno(dbName, sufijo, fecha, tipoReporte) {
        const cabSql = `SELECT ID_CABECERA, ESTADO FROM CABECERA_PEDIDO${sufijo} WHERE PLANTA = 1 AND FECHA_A_ENTREGAR = @fecha`;
        const cabResult = await query(cabSql, [{ name: 'fecha', value: fecha }], dbName);
        const idCabecera = cabResult.recordset[0]?.ID_CABECERA || 0;
        const estadoCabecera = cabResult.recordset[0]?.ESTADO || 9;

        const turnoFilter = tipoReporte === 'ALL' ? '' : `AND id.TURNO = @tipoReporte`;
        const epaFilter = tipoReporte === 'ALL' ? '' : `AND epa.TURNO = @tipoReporte`;

        const sql = `
            SELECT id.ID_SUBCATEGORIA_2, id.ESTADO_CONTEO, id.CANTIDAD_SOLICITADA, id.CANTIDAD_ENVIADA,
                id.ID_PRODUCTO_DETALLE, id.TURNO, id.TURNO AS TURNO_SOL, 1 AS PEDIDO_PRINCIPAL
            FROM INVENTARIOS_DECLARACION${sufijo} id
            WHERE ID_CABECERA = @idCabecera ${turnoFilter}
            UNION ALL
            SELECT id.ID_SUBCATEGORIA_2, epa.ESTADO_CONTEO, id.CANTIDAD_SOLICITADA, epa.CANTIDAD_ENVIADA,
                epa.ID_PRODUCTO_DETALLE, epa.TURNO, id.TURNO AS TURNO_SOL, 0 AS PEDIDO_PRINCIPAL
            FROM INVENTARIOS_DECLARACION${sufijo} id
            INNER JOIN ENVIO_PEDIDO_AUX${sufijo} epa ON epa.ID_INVENTARIOS_DECLARACION = id.ID_INVENTARIOS_DECLARACION
                AND epa.ESTADO = 1 ${epaFilter}
            WHERE ID_CABECERA = @idCabecera
        `;
        const result = await query(
            sql,
            [
                { name: 'idCabecera', value: idCabecera },
                { name: 'tipoReporte', value: tipoReporte }
            ],
            dbName
        );
        const res = {};
        for (const row of result.recordset) {
            const turno = row.TURNO;
            if (!res[row.ID_SUBCATEGORIA_2]) res[row.ID_SUBCATEGORIA_2] = {};
            res[row.ID_SUBCATEGORIA_2][turno] = {
                cantidad_enviada: row.CANTIDAD_ENVIADA,
                cantidad_solicitada: row.CANTIDAD_SOLICITADA,
                estado: row.ESTADO_CONTEO,
                pedido_principal: row.PEDIDO_PRINCIPAL,
                turnoSol: row.TURNO_SOL,
                estado_cabecera: estadoCabecera,
                id_producto_detalle: row.ID_PRODUCTO_DETALLE || 0
            };
        }
        return { pedidos: res, estado_cabecera: estadoCabecera };
    },

    async getEstadoSolicitudSucursal(dbName, sufijo, sucursal, idSucBi) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const dias = { 'Friday': 'VIERNES', 'Saturday': 'SABADO', 'Sunday': 'DOMINGO',
            'Monday': 'LUNES', 'Tuesday': 'MARTES', 'Wednesday': 'MIERCOLES', 'Thursday': 'JUEVES' };
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        const dia = dias[dayName] || 'LUNES';

        const sqlPr = `SELECT * FROM VENTA_CALENDARIO_SUCURSAL vcs
            WHERE vcs.ID_UBICACION = @sucursal
              AND vcs.ID_TABLA_CALENDARIO = (SELECT ID_TABLA_CALENDARIO FROM TABLA_CALENDARIO WHERE [DATE] = @fecha)`;
        const resPr = await query(sqlPr, [
            { name: 'sucursal', value: sucursal },
            { name: 'fecha', value: fecha }
        ], 'default');

        if (resPr.recordset[0]?.ENVIO == 1 && resPr.recordset[0]?.FERIADO == 0) {
            const sql = `SELECT @sucursal AS ID_SUCURSAL, @idSucBi AS SUCURSAL, ID_CABECERA, ESTADO
                FROM CABECERA_PEDIDO${sufijo} cpa
                WHERE ID_CABECERA = (SELECT MAX(ID_CABECERA) FROM CABECERA_PEDIDO${sufijo} cpa2 WHERE PLANTA = 1 AND FECHA <> @fecha)`;
            const result = await query(sql, [
                { name: 'sucursal', value: sucursal },
                { name: 'idSucBi', value: idSucBi },
                { name: 'fecha', value: fecha }
            ], dbName);
            return result.recordset[0] || null;
        }
        return null;
    },

    async getCabeceraPedido(dbName, sufijo, fechaEntrega, campos) {
        const sql = `SELECT ${campos} FROM CABECERA_PEDIDO${sufijo} WHERE FECHA_A_ENTREGAR = @fecha AND PLANTA = 1`;
        const result = await query(sql, [{ name: 'fecha', value: fechaEntrega }], dbName);
        return result.recordset;
    }
};

module.exports = InventarioService;

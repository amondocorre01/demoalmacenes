const { query, getPool, queryWithTransaction } = require('../../config/database');

const execQuery = async (sqlQuery, params, transaction, dbName) => {
    if (transaction) {
        return await queryWithTransaction(transaction, sqlQuery, params);
    }
    return await query(sqlQuery, params, dbName);
};

const ConsolidadosRepository = {
    async beginTransaction(dbName) {
        const pool = await getPool(dbName);
        const transaction = pool.transaction();
        await transaction.begin();
        return transaction;
    },

    async getCabeceraPedidoByFechaEntrega(dbName, sufijo, fecha, campos = '*') {
        const sqlQuery = `
            SELECT ${campos} FROM CABECERA_PEDIDO${sufijo}
            WHERE PLANTA = 1 AND FECHA_A_ENTREGAR = @fecha
        `;
        const result = await query(sqlQuery, [{ name: 'fecha', value: fecha }], dbName);
        return result.recordset[0] || null;
    },

    async editarCantEnviadaDecl(dbName, sufijo, cantidad, idCabecera, turno, idSub2, obs, idProductoDetalle, idUsuario, transaction) {
        const declResult = await execQuery(`
            SELECT TOP 1 ID_INVENTARIOS_DECLARACION, TURNO, CANTIDAD_ENVIADA
            FROM INVENTARIOS_DECLARACION${sufijo}
            WHERE ID_SUBCATEGORIA_2 = @idSub2 AND ID_CABECERA = @idCabecera
        `, [
            { name: 'idSub2', value: idSub2 },
            { name: 'idCabecera', value: idCabecera }
        ], transaction, dbName);

        const decl = declResult.recordset[0] || {};
        const idDcl = decl.ID_INVENTARIOS_DECLARACION || 0;

        let sqlQuery = `
            UPDATE INVENTARIOS_DECLARACION${sufijo}
            SET CANTIDAD_ENVIADA = @cantidad, ESTADO_CONTEO = 11
        `;
        if (obs) {
            sqlQuery += `, OBSERVACION = @obs`;
        }
        if (idProductoDetalle) {
            sqlQuery += `, ID_PRODUCTO_DETALLE = @idProductoDetalle`;
        }
        sqlQuery += `
            WHERE TURNO = @turno AND ID_SUBCATEGORIA_2 = @idSub2
                AND ID_CABECERA = @idCabecera AND ESTADO_CONTEO <= 11
        `;
        const params = [
            { name: 'cantidad', value: cantidad },
            { name: 'turno', value: turno },
            { name: 'idSub2', value: idSub2 },
            { name: 'idCabecera', value: idCabecera }
        ];
        if (obs) params.push({ name: 'obs', value: obs });
        if (idProductoDetalle) params.push({ name: 'idProductoDetalle', value: idProductoDetalle });

        const result = await execQuery(sqlQuery, params, transaction, dbName);
        await this.registrarLogPedido(dbName, sufijo, idDcl, cantidad, idCabecera, turno, idSub2, idUsuario, obs, idProductoDetalle, transaction);
        return result.rowsAffected[0] || 0;
    },

    async editarCantidadEnviada(dbName, sufijo, cantidad, turno, idSub2, idCabecera, obs, idProductoDetalle, idUsuario, transaction) {
        const declResult = await execQuery(`
            SELECT TOP 1 ID_INVENTARIOS_DECLARACION, TURNO, CANTIDAD_ENVIADA
            FROM INVENTARIOS_DECLARACION${sufijo}
            WHERE ID_SUBCATEGORIA_2 = @idSub2 AND ID_CABECERA = @idCabecera
        `, [
            { name: 'idSub2', value: idSub2 },
            { name: 'idCabecera', value: idCabecera }
        ], transaction, dbName);

        const decl = declResult.recordset[0] || {};
        const idDcl = decl.ID_INVENTARIOS_DECLARACION || 0;

        let sqlQuery = `
            UPDATE ENVIO_PEDIDO_AUX${sufijo}
            SET CANTIDAD_ENVIADA = @cantidad
        `;
        if (obs) {
            sqlQuery += `, OBSERVACION = @obs`;
        }
        if (idProductoDetalle) {
            sqlQuery += `, ID_PRODUCTO_DETALLE = @idProductoDetalle`;
        }
        sqlQuery += `
            WHERE TURNO = @turno AND ESTADO_CONTEO <= 11
                AND ID_INVENTARIOS_DECLARACION IN (
                    SELECT ID_INVENTARIOS_DECLARACION FROM INVENTARIOS_DECLARACION${sufijo}
                    WHERE ID_SUBCATEGORIA_2 = @idSub2 AND ID_CABECERA = @idCabecera
                )
        `;
        const params = [
            { name: 'cantidad', value: cantidad },
            { name: 'turno', value: turno },
            { name: 'idSub2', value: idSub2 },
            { name: 'idCabecera', value: idCabecera }
        ];
        if (obs) params.push({ name: 'obs', value: obs });
        if (idProductoDetalle) params.push({ name: 'idProductoDetalle', value: idProductoDetalle });

        const result = await execQuery(sqlQuery, params, transaction, dbName);
        await this.registrarLogPedido(dbName, sufijo, idDcl, cantidad, idCabecera, turno, idSub2, idUsuario, obs, idProductoDetalle, transaction);
        return result.rowsAffected[0] || 0;
    },

    async insertNewEnvio(dbName, sufijo, cantidad, idCabecera, turno, idSub2, idUsuario, obs, idProductoDetalle, transaction) {
        const declResult = await execQuery(`
            SELECT TOP 1 ID_INVENTARIOS_DECLARACION, TURNO, CANTIDAD_ENVIADA
            FROM INVENTARIOS_DECLARACION${sufijo}
            WHERE ID_SUBCATEGORIA_2 = @idSub2 AND ID_CABECERA = @idCabecera
        `, [
            { name: 'idSub2', value: idSub2 },
            { name: 'idCabecera', value: idCabecera }
        ], transaction, dbName);

        const decl = declResult.recordset[0] || {};
        const idDcl = decl.ID_INVENTARIOS_DECLARACION || 0;
        if (!idDcl) return 0;

        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');

        const data = {
            TURNO: turno,
            ID_INVENTARIOS_DECLARACION: idDcl,
            ESTADO_CONTEO: 11,
            CANTIDAD_ENVIADA: cantidad,
            ESTADO: 1,
            ID_USUARIO_REGISTRA: idUsuario || 0,
            FECHA_REGISTRO: fechaHora
        };
        if (obs) data.OBSERVACION = obs;
        if (idProductoDetalle) data.ID_PRODUCTO_DETALLE = idProductoDetalle;

        const columns = Object.keys(data).join(', ');
        const values = Object.keys(data).map(k => `@${k}`).join(', ');
        const params = Object.entries(data).map(([k, v]) => ({ name: k, value: v }));

        const result = await execQuery(
            `INSERT INTO ENVIO_PEDIDO_AUX${sufijo} (${columns}) VALUES (${values})`,
            params, transaction, dbName
        );
        return result.rowsAffected[0] || 0;
    },

    async registrarLogPedido(dbName, sufijo, idDcl, cantidad, idCabecera, turno, idSub2, idUsuario, obs, idProductoDetalle, transaction) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');

        const data = {
            TURNO: turno,
            ID_INVENTARIOS_DECLARACION: idDcl,
            ESTADO_CONTEO: 11,
            CANTIDAD_ENVIADA: cantidad,
            ESTADO: 1,
            ID_USUARIO_REGISTRA: idUsuario || 0,
            FECHA_REGISTRO: fechaHora
        };
        if (obs) data.OBSERVACION = obs;
        if (idProductoDetalle) data.ID_PRODUCTO_DETALLE = idProductoDetalle;

        const columns = Object.keys(data).join(', ');
        const values = Object.keys(data).map(k => `@${k}`).join(', ');
        const params = Object.entries(data).map(([k, v]) => ({ name: k, value: v }));

        const result = await execQuery(
            `INSERT INTO ENVIO_PEDIDO_LOG${sufijo} (${columns}) VALUES (${values})`,
            params, transaction, dbName
        );
        return result.rowsAffected[0] || 0;
    },

    async verificarProductosBloqueados(dbName, sufijo, idCabecera, productos, transaction) {
        if (!productos || productos.length === 0) return [];

        const conditions = productos.map((_, i) =>
            `(id.ID_SUBCATEGORIA_2 = @idSub2_${i} AND id.TURNO = @turno_${i})`
        ).join(' OR ');

        const sqlQuery = `
            SELECT DISTINCT id.ID_SUBCATEGORIA_2,NOMBRE_PRODUCTO, id.TURNO, id.ESTADO_CONTEO
            FROM INVENTARIOS_DECLARACION${sufijo} id
            WHERE id.ID_CABECERA = @idCabecera
              AND id.ESTADO_CONTEO > 11
              AND (${conditions})
        `;
        const params = [
            { name: 'idCabecera', value: idCabecera }
        ];
        productos.forEach((p, i) => {
            params.push({ name: `idSub2_${i}`, value: p.idSub2 });
            params.push({ name: `turno_${i}`, value: p.turno });
        });

        const result = await execQuery(sqlQuery, params, transaction, dbName);
        return result.recordset;
    },

    async verifPedidoPrincipal(dbName, sufijo, idCabecera, idSub2, turno, transaction) {
        const sqlQuery = `
            select (case when epaa.ID_ENVIO_PEDIDO_AUX is null and ida.TURNO=@turno then 1 else 0 end) as pedido_principal
            from INVENTARIOS_DECLARACION${sufijo} ida
            left join ENVIO_PEDIDO_AUX${sufijo} epaa on epaa.ID_INVENTARIOS_DECLARACION = ida.ID_INVENTARIOS_DECLARACION and epaa.TURNO=@turno
            where ida.ID_CABECERA =@idCabecera and ida.ID_SUBCATEGORIA_2 =@idSub2
        `;
        const result = await execQuery(sqlQuery, [
            { name: 'idCabecera', value: idCabecera },
            { name: 'idSub2', value: idSub2 },
            { name: 'turno', value: turno }
        ], transaction, dbName);
        return result.recordset[0] || null;
    },
};

module.exports = ConsolidadosRepository;

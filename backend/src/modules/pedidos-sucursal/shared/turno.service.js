const { query } = require('../../../config/database');

const TurnoService = {
    async getTurnosAll() {
        const result = await query('SELECT * FROM INVENTARIOS_TURNO', [], 'default');
        return result.recordset;
    },
    async getTurnosDespacho(fecha) {
        const fechaHoy = new Date().toLocaleDateString('en-CA');
        const result = await query(`SELECT iu.CODIGO as SUCURSAL, it.TURNO,
                IIF(ic.ID_CRONOGRAMA_ESTADO>1,'despachado','noDespachado') as ESTADO
          FROM INVENTARIO_CRONOGRAMA ic
          INNER JOIN ID_UBICACION iu ON iu.ID_UBICACION = ic.ID_UBICACION
          INNER JOIN INVENTARIOS_TURNO it ON it.ID_TURNO = ic.ID_TURNO
          WHERE ic.FECHA= @fecha`, [{ name: 'fecha', value: fecha || fechaHoy }], 'default');
        return result.recordset;
    },

    async getTurnos2(dbName, sufijo, idCabecera) {
        const solicitadas = await this._getTurnosPedidos2(dbName, sufijo, idCabecera, 'CANTIDAD_ENVIADA', 11);
        const aceptadas = await this._getTurnosPedidos2(dbName, sufijo, idCabecera, 'CANTIDAD_ENVIADA', 12);

        const result = await query(
            'SELECT ID_TURNO, TURNO FROM INVENTARIOS_TURNO',
            [],
            dbName
        );
        const turnos = result.recordset;
        for (const turno of turnos) {
            turno.SOLICITADA = solicitadas.some(s => s.TURNO === turno.TURNO);
            turno.ENVIADA = aceptadas.some(a => a.TURNO === turno.TURNO);
        }
        return turnos;
    },

    async _getTurnosPedidos2(dbName, sufijo, idCabecera, tipoPedido, estadoConteo) {
        const sql = `
            SELECT TURNO FROM INVENTARIOS_DECLARACION${sufijo}
            WHERE ${tipoPedido} > 0 AND ESTADO_CONTEO >= ${estadoConteo}
            AND ID_CABECERA = @idCabecera
            GROUP BY TURNO
        `;
        const result = await query(
            sql,
            [{ name: 'idCabecera', value: idCabecera }],
            dbName
        );
        return result.recordset;
    },

    async getIdTurno(turno) {
        const result = await query(
            'SELECT ID_TURNO FROM INVENTARIOS_TURNO WHERE TURNO = @turno',
            [{ name: 'turno', value: turno }],
            'default'
        );
        return result.recordset[0]?.ID_TURNO || 0;
    },

    async getTurnos(dbName, sufijo, idCabecera) {
        const sql = `
            SELECT it.ID_TURNO, it.TURNO FROM INVENTARIOS_TURNO it
            WHERE TURNO IN (
                SELECT TURNO FROM INVENTARIOS_DECLARACION${sufijo} ida
                WHERE CANTIDAD_SOLICITADA > 0 AND ID_CABECERA = @idCabecera
                GROUP BY TURNO
            )
        `;
        const result = await query(
            sql,
            [{ name: 'idCabecera', value: idCabecera }],
            dbName
        );
        return result.recordset;
    }
};

module.exports = TurnoService;

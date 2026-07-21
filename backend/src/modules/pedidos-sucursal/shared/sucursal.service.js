const { query, getPool } = require('../../../config/database');

const SucursalService = {
    async getSucursales() {
        const result = await query(
            'SELECT * FROM ID_UBICACION WHERE ESTADO = 1 AND SUCURSAL = 1 ORDER BY DESCRIPCION ASC',
            [],
            'default'
        );
        return result.recordset;
    },

    async getSucursalId(idUbicacion) {
        const result = await query(
            `SELECT * FROM ID_UBICACION WHERE ID_UBICACION = @id`,
            [{ name: 'id', value: idUbicacion }],
            'default'
        );
        return result.recordset[0] || null;
    },

    async getDataSucursal(idSucursal) {
        const result = await query(
            `SELECT * FROM ID_UBICACION WHERE ID_UBICACION = @id`,
            [{ name: 'id', value: idSucursal }],
            'default'
        );
        return result.recordset;
    },

    async getSucursalesByDb(dbName) {
        const result = await query(
            'SELECT * FROM ID_UBICACION WHERE ESTADO = 1 AND SUCURSAL = 1 ORDER BY DESCRIPCION ASC',
            [],
            dbName || 'default'
        );
        return result.recordset;
    }
};

module.exports = SucursalService;

const { query } = require('../../config/database');

class SeguridadRepository {

    async getAccesibilidadAlmacen() {
        const result = await query(`
            SELECT vvu.ID_USUARIO, vvu.NOMBRE_COMPLETO,
                (SELECT pa.* FROM PLANTA_PERMISO_ALMACEN ppa2
                 INNER JOIN PLANTA_ALMACEN pa ON ppa2.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
                 WHERE ppa2.ESTADO = 1 AND ppa2.ID_USUARIO = vvu.ID_USUARIO
                 ORDER BY pa.DESCRICION ASC FOR JSON AUTO) as ALMACENES
            FROM VISTA_VENTAS_USUARIOS vvu
            WHERE vvu.ELIMINADO = 0 AND vvu.ID_STATUS = 1
            ORDER BY NOMBRE_COMPLETO
        `);
        const data = result.recordset;
        data.forEach(u => {
            try { u.ALMACENES = u.ALMACENES ? JSON.parse(u.ALMACENES) : []; } catch { u.ALMACENES = []; }
        });
        return data;
    }

    async existePermisoAlmacen(idUsuario, idAlmacen) {
        const result = await query(`
            SELECT * FROM PLANTA_PERMISO_ALMACEN
            WHERE ID_USUARIO = @idUsuario AND ID_PLANTA_ALMACEN = @idAlmacen
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idAlmacen', value: idAlmacen }
        ], 'planta');
        return result.recordset.length > 0;
    }

    async actualizarPermisoAlmacen(idUsuario, idAlmacen, estado, idUsuarioModifica) {
        await query(`
            UPDATE PLANTA_PERMISO_ALMACEN
            SET ESTADO = @estado, ID_USUARIO_MODIFICA = @idUsuarioModifica
            WHERE ID_USUARIO = @idUsuario AND ID_PLANTA_ALMACEN = @idAlmacen
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'estado', value: estado },
            { name: 'idUsuarioModifica', value: idUsuarioModifica }
        ], 'planta');
        return true;
    }

    async insertarPermisoAlmacen(idUsuario, idAlmacen, estado, idUsuarioModifica) {
        await query(`
            INSERT INTO PLANTA_PERMISO_ALMACEN (ESTADO, ID_USUARIO, ID_PLANTA_ALMACEN, ID_USUARIO_MODIFICA)
            VALUES (@estado, @idUsuario, @idAlmacen, @idUsuarioModifica)
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'estado', value: estado },
            { name: 'idUsuarioModifica', value: idUsuarioModifica }
        ], 'planta');
        return true;
    }

}

module.exports = new SeguridadRepository();

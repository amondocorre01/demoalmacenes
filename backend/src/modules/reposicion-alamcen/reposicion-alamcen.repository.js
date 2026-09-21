const { query } = require('../../config/database');

const DB = 'default';

class ReposicionAlmacenRepository {

    async getPerfilUsuario(idUsuario) {
        const result = await query(`
            SELECT vp.PERFIL
            FROM VENTAS_USUARIOS vu
            INNER JOIN VENTAS_PERFIL vp ON vp.ID_VENTAS_PERFIL = vu.ID_VENTAS_PERFIL
            WHERE vu.ID_USUARIO = @idUsuario AND vu.ELIMINADO = 0
        `, [{ name: 'idUsuario', value: idUsuario }], DB);
        return result.recordset[0]?.PERFIL ?? '';
    }

    async getCanalesVentaReposicion(q) {
        const result = await query(`
            SELECT * FROM VENTAS_NOMBRE_LISTA_PRECIOS vnlp
            WHERE NOMBRE_LISTA_PRECIOS LIKE '%REPOSICIONES%'
            AND NOMBRE_LISTA_PRECIOS LIKE '%' + @q + '%'
        `, [{ name: 'q', value: q }], DB);
        return result.recordset || [];
    }

    async getVentasReposicion(fechaInicio, fechaFin, idCanalVenta) {
        const result = await query(`
            EXEC GET_VENTAS_REPOSICIONES_SUCURSAL @fecha_inicio, @fecha_fin, @id_nombre_lista_precio
        `, [
            { name: 'fecha_inicio', value: fechaInicio },
            { name: 'fecha_fin', value: fechaFin },
            { name: 'id_nombre_lista_precio', value: idCanalVenta }
        ], DB);
        return result.recordset || [];
    }

    async getEmpleados(idCanalVenta) {
        const result = await query(`
            SELECT ID_EMPLEADO, NOMBRE_COMPLETO, CI
            FROM SIREPE_EMPLEADO se
            INNER JOIN VENTAS_REPOSICION_CARGO vrl
                ON vrl.ID_CARGO = se.ID_CARGO
                AND vrl.ID_NOMBRE_LISTA_PRECIOS = @idCanalVenta
                AND vrl.ESTADO = 1
            WHERE (se.GLOBAL IS NULL OR se.GLOBAL <> 1) AND se.ID_STATUS = 1
            ORDER BY se.NOMBRE ASC
        `, [{ name: 'idCanalVenta', value: idCanalVenta }], DB);
        return result.recordset || [];
    }

    async existeEmpleado(idEmpleado) {
        const result = await query(`
            SELECT * FROM SIREPE_EMPLEADO WHERE ID_EMPLEADO = @idEmpleado
        `, [{ name: 'idEmpleado', value: idEmpleado }], DB);
        return result.recordset[0] || null;
    }

    async updateVentaReposicion(idVentaReposicion, idEmpleado) {
        const result = await query(`
            UPDATE VENTAS_REPOSICION_SUCURSAL
            SET ID_EMPLEADO_ASUMIDO = @idEmpleado
            WHERE ID_VENTAS_REPOSICION_SUCURSAL = @idVentaReposicion
            AND (ID_EMPLEADO_ASUMIDO <> @idEmpleado OR ID_EMPLEADO_ASUMIDO IS NULL)
        `, [
            { name: 'idVentaReposicion', value: idVentaReposicion },
            { name: 'idEmpleado', value: idEmpleado }
        ], DB);
        return result.rowsAffected[0] || 0;
    }

    async registerVentasReposicionLog(idVentaReposicion, idUsuario, idEmpleado, fecha) {
        const result = await query(`
            INSERT INTO VENTAS_REPOSICION_SUCURSAL_LOG
            (ID_VENTAS_REPOSICION_SUCURSAL, ID_EMPLEADO_ASUMIDO, ID_USUARIO, FECHA)
            VALUES (@idVentaReposicion, @idEmpleado, @idUsuario, @fecha);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idVentaReposicion', value: idVentaReposicion },
            { name: 'idEmpleado', value: idEmpleado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fecha', value: fecha }
        ], DB);
        return result.recordset[0]?.id || 0;
    }
}

module.exports = new ReposicionAlmacenRepository();
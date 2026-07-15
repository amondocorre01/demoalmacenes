const { query } = require('../../config/database');

class ProductosIntermediosRepository {

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

    async listUnidadMedida() {
        const result = await query(`
            SELECT * FROM PLANTA_UNIDAD_MEDIDA WHERE ESTADO = 1
        `);
        return result.recordset;
    }

    async listarProductosIntermedios() {
        const result = await query(`
            SELECT *,
                (SELECT papi.*, (SELECT pa.DESCRICION) AS ALMACEN
                 FROM PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi, PLANTA_ALMACEN pa
                 WHERE papi.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
                 AND papi.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
                 FOR JSON AUTO) as ALMACENES,
                (SELECT * FROM VISTA_PLANTA_RI_PI prp
                 WHERE prp.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
                 FOR JSON AUTO) as RECETAS
            FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi
            ORDER BY NOMBRE
        `);
        return result.recordset;
    }

    async existeProductoIntermedio(nombre, idProductoIntermedio = 0) {
        const result = await query(`
            SELECT * FROM PLANTA_PRODUCTO_INTERMEDIO
            WHERE LTRIM(LOWER(NOMBRE)) = LTRIM(LOWER(@nombre))
            AND ID_PRODUCTO_INTERMEDIO <> @idProductoIntermedio
        `, [
            { name: 'nombre', value: nombre },
            { name: 'idProductoIntermedio', value: idProductoIntermedio }
        ]);
        return result.recordset.length > 0;
    }

    async crearProductoIntermedio({ nombre, duracion, porcentaje_desperdicio = 0, producto_primario = 0, nota = '', estado_produccion = 0 }) {
        const result = await query(`
            INSERT INTO PLANTA_PRODUCTO_INTERMEDIO
            (NOMBRE, ESTADO, DURACION, PORCENTAJE_DESPERDICIO, PROD_PRIMARIO, NOTA, ESTADO_PRODUCCION)
            VALUES (@nombre, 1, @duracion, @porcentajeDesperdicio, @productoPrimario, @nota, @estadoProduccion);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'nombre', value: nombre.toUpperCase() },
            { name: 'duracion', value: duracion },
            { name: 'porcentajeDesperdicio', value: porcentaje_desperdicio },
            { name: 'productoPrimario', value: producto_primario },
            { name: 'nota', value: nota },
            { name: 'estadoProduccion', value: estado_produccion }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async editarProductoIntermedio(idProductoIntermedio, { nombre, estado = 0, duracion, porcentaje_desperdicio = 0, producto_primario = 0, nota = '', estado_produccion = 0 }) {
        const result = await query(`
            UPDATE PLANTA_PRODUCTO_INTERMEDIO
            SET NOMBRE = @nombre, ESTADO = @estado, DURACION = @duracion,
                PORCENTAJE_DESPERDICIO = @porcentajeDesperdicio, PROD_PRIMARIO = @productoPrimario,
                NOTA = @nota, ESTADO_PRODUCCION = @estadoProduccion
            WHERE ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'nombre', value: nombre.toUpperCase() },
            { name: 'estado', value: estado },
            { name: 'duracion', value: duracion },
            { name: 'porcentajeDesperdicio', value: porcentaje_desperdicio },
            { name: 'productoPrimario', value: producto_primario },
            { name: 'nota', value: nota },
            { name: 'estadoProduccion', value: estado_produccion }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async addProductoIntAlmacen(idAlmacen, idProductoIntermedio, estado) {
        const existe = await query(`
            SELECT * FROM PLANTA_ALMACEN_PRODUCTO_INTERMEDIO
            WHERE ID_PLANTA_ALMACEN = @idAlmacen AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProductoIntermedio', value: idProductoIntermedio }
        ]);

        if (existe.recordset.length > 0) {
            await query(`
                UPDATE PLANTA_ALMACEN_PRODUCTO_INTERMEDIO SET ESTADO = @estado
                WHERE ID_PLANTA_ALMACEN = @idAlmacen AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            `, [
                { name: 'idAlmacen', value: idAlmacen },
                { name: 'idProductoIntermedio', value: idProductoIntermedio },
                { name: 'estado', value: estado }
            ]);
        } else {
            await query(`
                INSERT INTO PLANTA_ALMACEN_PRODUCTO_INTERMEDIO (ESTADO, ID_PLANTA_ALMACEN, ID_PRODUCTO_INTERMEDIO)
                VALUES (@estado, @idAlmacen, @idProductoIntermedio)
            `, [
                { name: 'idAlmacen', value: idAlmacen },
                { name: 'idProductoIntermedio', value: idProductoIntermedio },
                { name: 'estado', value: estado }
            ]);
        }
        return true;
    }

    async getRecetaByAlmacen(idPlantaAlmacen) {
        const result = await query(`
            SELECT pr.* FROM PLANTA_RECETA_ALMACEN pra, PLANTA_RECETA pr
            WHERE pra.ESTADO = 1 AND pr.ESTADO = 1
            AND pra.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA
            AND pra.ID_PLANTA_ALMACEN = @idPlantaAlmacen
            ORDER BY pr.DESCRIPCION DESC
        `, [{ name: 'idPlantaAlmacen', value: idPlantaAlmacen }]);
        return result.recordset;
    }

    async getRecetas(idSub2) {
        const result = await query(`
            SELECT ppr.*, CONCAT(PRODUCTO, PRODUCTO_INTERMEDIO) as PP
            FROM PLANTA_RECETA pr, VISTA_PLANTA_PRODUCTO_RECETA ppr
            WHERE ppr.ESTADO = 1 AND pr.ID_PLANTA_RECETA = ppr.ID_PLANTA_RECETA
            AND pr.ID_SUB_CATEGORIA_2 = @idSub2
            ORDER BY PP DESC
        `, [{ name: 'idSub2', value: idSub2 }]);
        return result.recordset;
    }

    async getRecetaIntermedio(idProductoIntermedio) {
        const result = await query(`
            EXEC GET_RECTAS_INTERMEDIAS @idProductoIntermedio
        `, [{ name: 'idProductoIntermedio', value: idProductoIntermedio }]);
        return result.recordset;
    }

    async actualizarEstadoRecetaAlmacen(idRecetaAlmacen, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA_ALMACEN SET ESTADO = @estado
            WHERE ID_PLANTA_RECETA_ALMACEN = @idRecetaAlmacen
        `, [
            { name: 'idRecetaAlmacen', value: idRecetaAlmacen },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async actualizarEstadoProductoIntermedioAlmacen(idAlmacenPM, estado) {
        const result = await query(`
            UPDATE PLANTA_ALMACEN_PRODUCTO_INTERMEDIO SET ESTADO = @estado
            WHERE ID_ALMACEN_PRODUCTO_INTERMEDIO = @idAlmacenPM
        `, [
            { name: 'idAlmacenPM', value: idAlmacenPM },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = new ProductosIntermediosRepository();

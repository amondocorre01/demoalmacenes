const { query } = require('../../config/database');

class AlmacenRecetaRepository {

    async listAlmacenActivos() {
        const result = await query(`
            SELECT * FROM PLANTA_ALMACEN 
            WHERE ESTADO = 1 
            ORDER BY DESCRICION ASC
        `);
        return result.recordset;
    }

    async listAlmacen() {
        const result = await query(`
            SELECT *,
                (SELECT * FROM (
                    SELECT ID_PLANTA_RECETA_ALMACEN, pr.DESCRIPCION, 0 as ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT pra.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT ppr.* FROM VISTA_PLANTA_PRODUCTO_RECETA ppr 
                         WHERE PPR.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA 
                         ORDER BY PRODUCTO DESC FOR JSON AUTO) AS PRODUCTOS
                    FROM PLANTA_RECETA_ALMACEN pra, PLANTA_RECETA pr
                    WHERE pra.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA AND pra.ID_PLANTA_ALMACEN = ap.ID_PLANTA_ALMACEN
                    UNION
                    SELECT 0 as ID_PLANTA_RECETA_ALMACEN, NOMBRE as DESCRIPCION, ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT papi.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT vpri.* FROM VISTA_PLANTA_RECETA_INTERMEDIO vpri 
                         WHERE vpri.ID_PLANTA_RI_PI = vppi.ID_PLANTA_RI_PI AND vpri.ESTADO = 1 FOR JSON AUTO) as PRODUCTOS
                    FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 vppi, PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
                    WHERE papi.ID_PRODUCTO_INTERMEDIO = vppi.ID_PRODUCTO_INTERMEDIO 
                    AND papi.ID_PLANTA_ALMACEN = ap.ID_PLANTA_ALMACEN AND vppi.ESTADO = 1
                ) as tb FOR JSON AUTO) as RECETAS
            FROM PLANTA_ALMACEN ap ORDER BY DESCRICION
        `);
        return result.recordset;
    }

    async existeAlmacenByNombre(nombre, idAlmacen = 0) {
        const result = await query(`
            SELECT * FROM PLANTA_ALMACEN 
            WHERE LTRIM(LOWER(DESCRICION)) = LTRIM(LOWER(@nombre))
            AND ID_PLANTA_ALMACEN <> @idAlmacen
        `, [
            { name: 'nombre', value: nombre },
            { name: 'idAlmacen', value: idAlmacen }
        ]);
        return result.recordset.length > 0;
    }

    async existeAlmacenById(idAlmacen) {
        const result = await query(`
            SELECT * FROM PLANTA_ALMACEN WHERE ID_PLANTA_ALMACEN = @idAlmacen
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset.length > 0;
    }

    async crearAlmacen(nombre, estadoProduccion = 0) {
        const result = await query(`
            INSERT INTO PLANTA_ALMACEN (DESCRICION, ESTADO, ESTADO_PRODUCCION)
            VALUES (@nombre, 1, @estadoProduccion);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'nombre', value: nombre },
            { name: 'estadoProduccion', value: estadoProduccion }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async editarAlmacen(idAlmacen, nombre, estado, estadoProduccion) {
        const result = await query(`
            UPDATE PLANTA_ALMACEN 
            SET DESCRICION = @nombre, ESTADO = @estado, ESTADO_PRODUCCION = @estadoProduccion
            WHERE ID_PLANTA_ALMACEN = @idAlmacen
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'nombre', value: nombre },
            { name: 'estado', value: estado },
            { name: 'estadoProduccion', value: estadoProduccion }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async getProductosCategoria2() {
        const result = await query(`
            SELECT isc.ID_SUB_CATEGORIA_2, isc.SUB_CATEGORIA_2 as PRODUCTO
            FROM INVENTARIOS_SUB_CATEGORIA_2 isc
            WHERE PRODUCTO_RECETA = 1 AND isc.ESTADO_REPOSICION = 1
            ORDER BY PRODUCTO DESC
        `);
        return result.recordset;
    }

    async getProductosForReceta(codigoTipo) {
        const result = await query(`
            SELECT pp.ID_PRODUCTO, pp.NOMBRE,
                (SELECT TOP(1) pum.UNIDAD_MEDIDA 
                 FROM PLANTA_PRODUCTO_DETALLE ppd, PLANTA_UNIDAD_MEDIDA pum 
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO 
                 AND pum.ID_UNIDAD_MEDIDA = ppd.ID_UNIDAD_MEDIDA_ADECUACION 
                 AND ppd.ESTADO = 1 
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS UNIDAD_MEDIDA,
                (SELECT TOP(1) ppd.ID_UNIDAD_MEDIDA_ADECUACION 
                 FROM PLANTA_PRODUCTO_DETALLE ppd 
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO AND ppd.ESTADO = 1 
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS ID_UNIDAD_MEDIDA
            FROM VISTA_PLANTA_PRODUCTO pp
            WHERE pp.CODIGO = @codigo AND pp.ESTADO = 1
            ORDER BY pp.NOMBRE ASC
        `, [{ name: 'codigo', value: codigoTipo }]);
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

    async existeReceta(idSubCategoria2) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA WHERE ID_SUB_CATEGORIA_2 = @idSubCategoria2
        `, [{ name: 'idSubCategoria2', value: idSubCategoria2 }]);
        return result.recordset[0]?.ID_PLANTA_RECETA || 0;
    }

    async existeRecetaById(idReceta) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA WHERE ID_PLANTA_RECETA = @idReceta
        `, [{ name: 'idReceta', value: idReceta }]);
        return result.recordset.length > 0;
    }

    async crearReceta(nombre, idSubCategoria2, estado = 1) {
        const result = await query(`
            INSERT INTO PLANTA_RECETA (DESCRIPCION, ID_SUB_CATEGORIA_2, ESTADO)
            VALUES (@nombre, @idSubCategoria2, @estado);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'nombre', value: nombre },
            { name: 'idSubCategoria2', value: idSubCategoria2 },
            { name: 'estado', value: estado }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async editarReceta(idReceta, nombre, idSubCategoria2, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA 
            SET DESCRIPCION = @nombre, ID_SUB_CATEGORIA_2 = @idSubCategoria2, ESTADO = @estado
            WHERE ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idReceta', value: idReceta },
            { name: 'nombre', value: nombre },
            { name: 'idSubCategoria2', value: idSubCategoria2 },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async tieneProductoRecta(idReceta, idProducto, idProductoIntermedio) {
        const result = await query(`
            SELECT * FROM PLANTA_PRODUCTO_RECETA 
            WHERE ID_PLANTA_RECETA = @idReceta
            AND ID_PRODUCTO = @idProducto
            AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [
            { name: 'idReceta', value: idReceta },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio }
        ]);
        return result.recordset[0]?.ID_PLANTA_PRODUCTO_RECETA || 0;
    }

    async crearProductoRecta(idReceta, idProducto, idProductoIntermedio, estado, cantidad, idUnidadMedida) {
        const result = await query(`
            INSERT INTO PLANTA_PRODUCTO_RECETA 
            (ID_PLANTA_RECETA, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, ESTADO, CANTIDAD, ID_UNIDAD_MEDIDA)
            VALUES (@idReceta, @idProducto, @idProductoIntermedio, @estado, @cantidad, @idUnidadMedida);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idReceta', value: idReceta },
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'estado', value: estado },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async editarProductoRecta(idProductoReceta, estado, cantidad, idUnidadMedida) {
        const result = await query(`
            UPDATE PLANTA_PRODUCTO_RECETA 
            SET ESTADO = @estado, CANTIDAD = @cantidad, ID_UNIDAD_MEDIDA = @idUnidadMedida
            WHERE ID_PLANTA_PRODUCTO_RECETA = @idProductoReceta
        `, [
            { name: 'idProductoReceta', value: idProductoReceta },
            { name: 'estado', value: estado },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async actualizarEstadoProductoReceta(idProducto, idProductoIntermedio, idReceta, estado) {
        const result = await query(`
            UPDATE PLANTA_PRODUCTO_RECETA SET ESTADO = @estado
            WHERE ID_PRODUCTO = @idProducto 
            AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            AND ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idProducto', value: idProducto },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idReceta', value: idReceta },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async actualizarProductoReceta(idPlantaProductoReceta, estado, cantidad, idUnidadMedida) {
        const result = await query(`
            UPDATE PLANTA_PRODUCTO_RECETA 
            SET ESTADO = @estado, CANTIDAD = @cantidad, ID_UNIDAD_MEDIDA = @idUnidadMedida
            WHERE ID_PLANTA_PRODUCTO_RECETA = @idPlantaProductoReceta
        `, [
            { name: 'idPlantaProductoReceta', value: idPlantaProductoReceta },
            { name: 'estado', value: estado },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async tieneRectaAlamcen(idAlmacen, idReceta) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA_ALMACEN 
            WHERE ID_PLANTA_ALMACEN = @idAlmacen AND ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta }
        ]);
        return result.recordset.length > 0;
    }

    async crearRecetaPlanta(idAlmacen, idReceta) {
        const result = await query(`
            INSERT INTO PLANTA_RECETA_ALMACEN (ID_PLANTA_ALMACEN, ID_PLANTA_RECETA, ESTADO)
            VALUES (@idAlmacen, @idReceta, 1);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async editarRecetaPlanta(idAlmacen, idReceta, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA_ALMACEN SET ESTADO = @estado
            WHERE ID_PLANTA_ALMACEN = @idAlmacen AND ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
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

    async getProductosIntermediosActivos() {
        const result = await query(`
            SELECT * FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi
            WHERE ESTADO = 1
            ORDER BY NOMBRE
        `);
        return result.recordset;
    }

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

module.exports = new AlmacenRecetaRepository();

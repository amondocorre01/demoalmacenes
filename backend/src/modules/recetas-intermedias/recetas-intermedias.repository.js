const { query, beginTransaction } = require('../../config/database');

class RecetasIntermediasRepository {

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
                 WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO
                 AND ppd.ESTADO = 1
                 ORDER BY ppd.ID_PRODUCTO_DETALLE) AS ID_UNIDAD_MEDIDA
            FROM VISTA_PLANTA_PRODUCTO pp
            WHERE pp.CODIGO = @codigoTipo AND pp.ESTADO = 1
            ORDER BY pp.NOMBRE ASC
        `, [{ name: 'codigoTipo', value: codigoTipo }]);
        return result.recordset;
    }

    async listarProductosIntermediosActivos() {
        const result = await query(`
            SELECT * FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi
            WHERE ESTADO = 1
            ORDER BY NOMBRE
        `);
        return result.recordset;
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

    async listarProductosIntermediosByAlmacen(idAlmacen) {
        const result = await query(`
            SELECT ppi.*
            FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi,
                 PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
            WHERE papi.ESTADO = 1
            AND papi.ID_PLANTA_ALMACEN = @idAlmacen
            AND ppi.ESTADO = 1
            AND papi.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
            ORDER BY NOMBRE
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset;
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

    async getRecetaByAlmacen(idPlantaAlmacen) {
        const result = await query(`
            SELECT ppi.*,
                (SELECT * FROM VISTA_PLANTA_RECETA_INTERMEDIO pri
                 WHERE pri.ID_PLANTA_RI_PI = ppi.ID_PLANTA_RI_PI
                 AND pri.NUM_RECETA = ppi.NUM_RECETA
                 ORDER BY PRODUCTO, PRODUCTO_INTERMEDIO_ANTECESOR
                 FOR JSON AUTO) as PRODUCTOS_RECETA
            FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi,
                 PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
            WHERE papi.ESTADO = 1
            AND papi.ID_PLANTA_ALMACEN = @idPlantaAlmacen
            AND ppi.ESTADO = 1
            AND papi.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
            ORDER BY NOMBRE
        `, [{ name: 'idPlantaAlmacen', value: idPlantaAlmacen }]);
        return result.recordset;
    }

    async getRecetaIntermedio(idProductoIntermedio) {
        const result = await query(`
            EXEC GET_RECTAS_INTERMEDIAS @idProductoIntermedio
        `, [{ name: 'idProductoIntermedio', value: idProductoIntermedio }]);
        return result.recordset;
    }

    async existeProductoIntermedioByID(idProductoIntermedio) {
        const result = await query(`
            SELECT * FROM PLANTA_PRODUCTO_INTERMEDIO
            WHERE ID_PRODUCTO_INTERMEDIO = @id
        `, [{ name: 'id', value: idProductoIntermedio }]);
        return result.recordset.length > 0;
    }

    async existeRecetaByID(idProductoIntermedio, idPlantaRiPi) {
        const result = await query(`
            SELECT * FROM PLANTA_RI_PI
            WHERE ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            AND ID_PLANTA_RI_PI = @idPlantaRiPi
        `, [
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idPlantaRiPi', value: idPlantaRiPi }
        ]);
        return result.recordset.length > 0;
    }

    async getMaxNumReceta(idProductoIntermedio, transaction = null) {
        const result = await query(`
            SELECT ISNULL(MAX(NUM_RECETA), 0) + 1 as NEXT_NUM
            FROM PLANTA_RI_PI
            WHERE ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [{ name: 'idProductoIntermedio', value: idProductoIntermedio }], 'planta', transaction);
        return result.recordset[0]?.NEXT_NUM || 1;
    }

    async desactivarRecetasAnteriores(idProductoIntermedio, transaction = null) {
        const result = await query(`
            UPDATE PLANTA_RI_PI SET ESTADO = 0
            WHERE ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [{ name: 'idProductoIntermedio', value: idProductoIntermedio }], 'planta', transaction);
        return result.rowsAffected[0];
    }

    async crearRecetaIntermedio(data, transaction = null) {
        const result = await query(`
            INSERT INTO PLANTA_RI_PI
            (ESTADO, NUM_RECETA, CANTIDAD_ESTANDAR, ID_PRODUCTO_INTERMEDIO,
             ID_UNIDAD_MEDIDA_ESTANDAR, CANTIDAD_ADECUACION, ID_UNIDAD_MEDIDA_ADECUACION)
            VALUES (@estado, @numReceta, @cantidadEstandar, @idProductoIntermedio,
                    @idUnidadMedidaEstandar, @cantidadAdecuacion, @idUnidadMedidaAdecuacion);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'estado', value: 1 },
            { name: 'numReceta', value: data.num_receta },
            { name: 'cantidadEstandar', value: data.cantidad_e },
            { name: 'idProductoIntermedio', value: data.id_producto_intermedio },
            { name: 'idUnidadMedidaEstandar', value: data.id_unidad_medida_e },
            { name: 'cantidadAdecuacion', value: data.cantidad_a },
            { name: 'idUnidadMedidaAdecuacion', value: data.id_unidad_medida_a }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }
 async getRecetaIntermedioById(idPlantaRiPi, transaction = null) {
        const result = await query(`
            select * from PLANTA_RI_PI where ID_PLANTA_RI_PI = @idPlantaRiPi;
        `, [
            { name: 'idPlantaRiPi', value: idPlantaRiPi }
        ], 'planta', transaction);
        return result.recordset[0] || {};
    }
    async registrarLogRI(idPlantaRiPi, cantidadE, idUnidadMedidaE, cantidadA, idUnidadMedidaA, estado, idUsuario, fecha, accion, transaction = null) {
        const result = await query(`
            INSERT INTO PLANTA_RI_PI_LOG
            (ID_PLANTA_RI_PI, CANTIDAD_ESTANDAR, ID_UNIDAD_MEDIDA_ESTANDAR,
             CANTIDAD_ADECUACION, ID_UNIDAD_MEDIDA_ADECUACION, ESTADO,
             ID_USUARIO, FECHA, ACCION)
            VALUES (@idPlantaRiPi, @cantidadE, @idUnidadMedidaE,
                    @cantidadA, @idUnidadMedidaA, @estado,
                    @idUsuario, @fecha, @accion)
        `, [
            { name: 'idPlantaRiPi', value: idPlantaRiPi },
            { name: 'cantidadE', value: cantidadE },
            { name: 'idUnidadMedidaE', value: idUnidadMedidaE },
            { name: 'cantidadA', value: cantidadA },
            { name: 'idUnidadMedidaA', value: idUnidadMedidaA },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fecha', value: fecha },
            { name: 'accion', value: accion }
        ], 'planta', transaction);
        return result.rowsAffected[0] > 0;
    }

    async editarRecetaIntermedio(idPlantaRiPi, data) {
        const result = await query(`
            UPDATE PLANTA_RI_PI
            SET CANTIDAD_ESTANDAR = @cantidadEstandar,
                ID_UNIDAD_MEDIDA_ESTANDAR = @idUnidadMedidaEstandar,
                CANTIDAD_ADECUACION = @cantidadAdecuacion,
                ID_UNIDAD_MEDIDA_ADECUACION = @idUnidadMedidaAdecuacion
            WHERE ID_PLANTA_RI_PI = @idPlantaRiPi
        `, [
            { name: 'idPlantaRiPi', value: idPlantaRiPi },
            { name: 'cantidadEstandar', value: data.cantidad_e },
            { name: 'idUnidadMedidaEstandar', value: data.id_unidad_medida_e },
            { name: 'cantidadAdecuacion', value: data.cantidad_a },
            { name: 'idUnidadMedidaAdecuacion', value: data.id_unidad_medida_a }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async existeRecetaIntermedio(idPlantaRiPi, numReceta, idProducto, idProductoIntermedioAntecesor) {
        let sql = `SELECT * FROM PLANTA_RECETA_INTERMEDIO WHERE NUM_RECETA = @numReceta AND ID_PLANTA_RI_PI = @idPlantaRiPi`;
        const params = [
            { name: 'numReceta', value: numReceta },
            { name: 'idPlantaRiPi', value: idPlantaRiPi }
        ];

        if (idProducto) {
            sql += ` AND ID_PRODUCTO = @idProducto`;
            params.push({ name: 'idProducto', value: idProducto });
        } else {
            sql += ` AND ID_PRODUCTO_INTERMEDIO_ANTECESOR = @idProductoIntermedioAntecesor`;
            params.push({ name: 'idProductoIntermedioAntecesor', value: idProductoIntermedioAntecesor });
        }

        const result = await query(sql, params);
        return result.recordset.length > 0 ? result.recordset[0] : null;
    }

    async actualizarProductoRI(idRecetaIntermedio, cantidad, idUnidadMedida, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA_INTERMEDIO
            SET ESTADO = @estado, CANTIDAD = @cantidad, ID_UNIDAD_MEDIDA = @idUnidadMedida
            WHERE ID_RECETA_INTERMEDIO = @idRecetaIntermedio
        `, [
            { name: 'idRecetaIntermedio', value: idRecetaIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    }

    async agregarProductoRI(idPlantaRiPi, idProductoIntermedioAntecesor, idProducto, cantidad, idUnidadMedida, numReceta) {
        const result = await query(`
            INSERT INTO PLANTA_RECETA_INTERMEDIO
            (ID_PLANTA_RI_PI, ID_PRODUCTO_INTERMEDIO_ANTECESOR, ID_PRODUCTO, CANTIDAD, ID_UNIDAD_MEDIDA, NUM_RECETA, ESTADO)
            VALUES (@idPlantaRiPi, @idProductoIntermedioAntecesor, @idProducto, @cantidad, @idUnidadMedida, @numReceta, 1);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idPlantaRiPi', value: idPlantaRiPi },
            { name: 'idProductoIntermedioAntecesor', value: idProductoIntermedioAntecesor || 0 },
            { name: 'idProducto', value: idProducto || 0 },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'numReceta', value: numReceta }
        ]);
        return result.recordset[0]?.id || 0;
    }

    async registrarLogProductosRI(idRecetaIntermedio, cantidad, idUnidadMedida, estado, idUsuario, fecha, accion) {
        const result = await query(`
            INSERT INTO PLANTA_RECETA_INTERMEDIO_LOG
            (ID_RECETA_INTERMEDIO, CANTIDAD, ID_UNIDAD_MEDIDA, ESTADO,
             ID_USUARIO, FECHA, ACCION)
            VALUES (@idRecetaIntermedio, @cantidad, @idUnidadMedida, @estado,
                    @idUsuario, @fecha, @accion)
        `, [
            { name: 'idRecetaIntermedio', value: idRecetaIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fecha', value: fecha },
            { name: 'accion', value: accion }
        ]);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = new RecetasIntermediasRepository();

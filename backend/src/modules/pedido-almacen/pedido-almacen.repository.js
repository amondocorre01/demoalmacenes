const { query } = require('../../config/database');

class PedidoAlmacenRepository {

    async listAlmacenesSolicitantes(idUsuario) {
        const sql = `
        SELECT pa.DESCRICION,pa.ID_PLANTA_ALMACEN,
            (SELECT pa2.DESCRICION,pa2.ID_PLANTA_ALMACEN  
                  FROM PLANTA_ALMACEN pa2
                        inner join PLANTA_PEDIDOS_ALMACEN_CONFIG ppac2 on ppac2.ID_ALMACEN_DESTINO  = pa2.ID_PLANTA_ALMACEN and ppac2.ESTADO =1
                        WHERE ppac2.ID_ALMACEN_SOLICITANTE = ppa.ID_PLANTA_ALMACEN AND pa.ESTADO = 1
                        ORDER BY pa.DESCRICION FOR JSON PATH) as DESTINOS
                  FROM PLANTA_PERMISO_ALMACEN ppa
                        INNER JOIN PLANTA_ALMACEN pa ON ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
                        inner join PLANTA_PEDIDOS_ALMACEN_CONFIG ppac on ppac.ID_ALMACEN_SOLICITANTE = ppa.ID_PLANTA_ALMACEN and ppac.ESTADO =1
                        WHERE ppa.ID_USUARIO = @idUsuario AND ppa.ESTADO = 1 AND pa.ESTADO = 1
                        ORDER BY pa.DESCRICION
        `;
        const result = await query(sql, [{ name: 'idUsuario', value: idUsuario }]);
        const rows = result.recordset || []
        rows.forEach(row => {
            try {
                row.DESTINOS = JSON.parse(row.DESTINOS || '[]');
            } catch (e) {
                row.DESTINOS = [];
            }
        });
        return rows;
    }

    async listAlmacenActivos() {
        const sql = `SELECT * FROM PLANTA_ALMACEN WHERE ESTADO = 1 ORDER BY DESCRICION`;
        const result = await query(sql);
        return result.recordset || [];
    }

    async listProductosAndPIStock(idAlmacen,idAlmacenSolicitante,tipo='all') {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            select *,
              ISNULL((
                  SELECT CAST(SUM(CAST((pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) as decimal(10,2)))/tb.CANTIDAD_ADECUACION as decimal(10,2))
                  FROM PLANTA_ALMACEN_INVENTARIO pai
                  WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
                  AND pai.ID_PRODUCTO_DETALLE = tb.ID_PRODUCTO_DETALLE and  pai.ID_PRODUCTO_INTERMEDIO = tb.ID_PRODUCTO_INTERMEDIO
                  AND pai.ESTADO_INGRESO = 1
                  AND pai.FECHA_VENCIMIENTO >= @fecha
                  AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
              ), 0) AS STOCK
              from (
              SELECT pap.ID_PLANTA_ALMACEN,
                  pap.ID_PRODUCTO_INTERMEDIO,
                  pap.ID_PRODUCTO,
                  coalesce(vppd.ID_PRODUCTO_DETALLE ,0) as ID_PRODUCTO_DETALLE,
                  coalesce(vppd.PRODUCTO, ppiv.NOMBRE) as GRUPO,
                  coalesce(vppd.NOMBRE_DETALLE, ppiv.NOMBRE) as PRODUCTO,
                  coalesce(vppd.CANTIDAD_ESTANDAR, ppiv.CANTIDAD_ESTANDAR) as CANTIDAD_ESTANDAR,
                  coalesce(vppd.CANTIDAD_ADECUACION, ppiv.CANTIDAD_ADECUACION) as CANTIDAD_ADECUACION,
                  coalesce(vppd.UNIDAD_MEDIDA_E, ppiv.UNIDAD_MEDIDA_E) as UNIDAD_MEDIDA_E,
                  coalesce(vppd.UNIDAD_MEDIDA_A, ppiv.UNIDAD_MEDIDA_A) as UNIDAD_MEDIDA_A,
                  vppd.PRESENTACION
              FROM PLANTA_ALMACEN_PRODUCTO pap
              LEFT JOIN VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppiv ON ppiv.ID_PRODUCTO_INTERMEDIO = pap.ID_PRODUCTO_INTERMEDIO 
              LEFT JOIN VISTA_PLANTA_PRODUCTO_DETALLE vppd ON vppd.ID_PRODUCTO = pap.ID_PRODUCTO 
              INNER JOIN PLANTA_ALMACEN_PRODUCTO pap2 
                  ON ( pap2.ID_PRODUCTO_INTERMEDIO = pap.ID_PRODUCTO_INTERMEDIO and pap.ID_PRODUCTO_INTERMEDIO>0 OR pap2.ID_PRODUCTO = pap.ID_PRODUCTO and pap.ID_PRODUCTO>0)
                  AND pap2.ESTADO = 1 AND pap2.ID_PLANTA_ALMACEN = @idAlmacenSolicitante
              WHERE pap.ESTADO = 1  AND pap.ID_PLANTA_ALMACEN = @idAlmacen
              ) as tb where @tipo = 'all' or (tb.ID_PRODUCTO_INTERMEDIO >0 and @tipo='intermedio') or (tb.ID_PRODUCTO >0 and @tipo='insumo')
               order by GRUPO
        `;
        const result = await query(sql, [
            { name: 'tipo', value: tipo },
            { name: 'idAlmacenSolicitante', value: idAlmacenSolicitante },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset || [];
    }

    async listProductosIntermedioStock(idAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT ppi.ID_PRODUCTO_INTERMEDIO, ppi.NOMBRE AS PRODUCTO,
                ppi.UNIDAD_MEDIDA, ISNULL((
                    SELECT SUM(CAST((pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) as decimal(10,2)))
                    FROM PLANTA_ALMACEN_INVENTARIO pai
                    WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
                    AND pai.ID_PRODUCTO_INTERMEDIO = ppi.ID_PRODUCTO_INTERMEDIO
                    AND pai.ESTADO_INGRESO = 1
                    AND pai.FECHA_VENCIMIENTO >= @fecha
                    AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
                ), 0) AS STOCK
            FROM PLANTA_PRODUCTO_INTERMEDIO ppi
            WHERE ppi.ESTADO = 1
            ORDER BY ppi.NOMBRE
        `;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset || [];
    }

    async registrarDocumento(idAlmacenSolicitante, idAlmacenDestino, idUsuario, fechaEntrega, transaction = null) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const hora = new Date().toLocaleTimeString('en-CA', { hour12: false });
        const sql = `
            INSERT INTO PLANTA_ALMACEN_SOLICITUD_DOCUMENTO
            (ID_ALMACEN_SOLICITANTE, ID_ALMACEN_DESTINO, FECHA_REGISTRO, HORA_REGISTRO, ID_USUARIO, ESTADO, FECHA_A_ENTREGAR)
            VALUES (@idAlmacenSolicitante, @idAlmacenDestino, @fecha, @hora, @idUsuario, 1, @fechaEntrega);
            SELECT SCOPE_IDENTITY() as id;
        `;
        const result = await query(sql, [
            { name: 'idAlmacenSolicitante', value: idAlmacenSolicitante },
            { name: 'idAlmacenDestino', value: idAlmacenDestino },
            { name: 'fecha', value: fecha },
            { name: 'hora', value: hora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaEntrega', value: fechaEntrega }
        ], 'planta', transaction);
        return result.recordset?.[0] ? result.recordset[0].id : 0;
    }

    async registrarDetalle(idDocumento, idProductoDetalle, idProductoIntermedio, cantidadSolicitada, idUnidad, idUsuario, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `
            INSERT INTO PLANTA_ALMACEN_SOLICITUD_DETALLE
            (ID_ALMACEN_SOLICITUD_DOCUMENTO, ESTADO_SOLICITUD, ID_PRODUCTO_INTERMEDIO, ID_PRODUCTO_DETALLE,
             CANTIDAD_SOLICITADA, ID_UNIDAD, ID_USUARIO_REGISTRA, FECHA_REGISTRO)
            VALUES (@idDocumento, 1, @idProductoIntermedio, @idProductoDetalle,
                    @cantidadSolicitada, @idUnidad, @idUsuario, @fechaHora);
            SELECT SCOPE_IDENTITY() as id;
        `;
        const result = await query(sql, [
            { name: 'idDocumento', value: idDocumento },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'cantidadSolicitada', value: cantidadSolicitada },
            { name: 'idUnidad', value: idUnidad },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
        return result.recordset?.[0] ? result.recordset[0].id : 0;
    }

    async registrarRegistro(idUsuario, idEstado, idDocumento, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `
            INSERT INTO PLANTA_ALMACEN_SOLICITUD_REGISTRO (FECHA, ID_USUARIO, ID_ESTADO, ID_ALMACEN_SOLICITUD_DOCUMENTO)
            VALUES (@fechaHora, @idUsuario, @idEstado, @idDocumento)
        `;
        await query(sql, [
            { name: 'fechaHora', value: fechaHora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idEstado', value: idEstado },
            { name: 'idDocumento', value: idDocumento }
        ], 'planta', transaction);
    }

    async listarDocumentos(idAlmacenSolicitante, idAlmacenDestino, fechaInicio, fechaFin) {
        const params = [];
        const where = [];

        if (idAlmacenSolicitante) {
            where.push('d.ID_ALMACEN_SOLICITANTE = @idAlmacenSolicitante');
            params.push({ name: 'idAlmacenSolicitante', value: idAlmacenSolicitante });
        }
        if (idAlmacenDestino) {
            where.push('d.ID_ALMACEN_DESTINO = @idAlmacenDestino');
            params.push({ name: 'idAlmacenDestino', value: idAlmacenDestino });
        }
        if (fechaInicio) {
            where.push('d.FECHA_REGISTRO >= @fechaInicio');
            params.push({ name: 'fechaInicio', value: fechaInicio });
        }
        if (fechaFin) {
            where.push('d.FECHA_REGISTRO <= @fechaFin');
            params.push({ name: 'fechaFin', value: fechaFin });
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const sql = `
            SELECT d.*,
                aSol.DESCRICION AS ALMACEN_SOLICITANTE,
                aDes.DESCRICION AS ALMACEN_DESTINO,
                (SELECT dt.ID_ALMACEN_SOLICITUD_DETALLE, dt.CANTIDAD_SOLICITADA, dt.CANTIDAD_ENVIADA,
                        dt.CANTIDAD_ACEPTADA, dt.ID_PRODUCTO_DETALLE, dt.ID_PRODUCTO_INTERMEDIO,
                        dt.ID_UNIDAD, dt.ESTADO_SOLICITUD,
                        COALESCE(vppd.PRODUCTO, ppi.NOMBRE) AS GRUPO,
                        COALESCE(vppd.NOMBRE_DETALLE, ppi.NOMBRE) AS PRODUCTO,
                        coalesce(vppd.CANTIDAD_ESTANDAR, ppi.CANTIDAD_ESTANDAR) as CANTIDAD_ESTANDAR,
                        coalesce(vppd.CANTIDAD_ADECUACION, ppi.CANTIDAD_ADECUACION) as CANTIDAD_ADECUACION,
                        coalesce(vppd.UNIDAD_MEDIDA_E, ppi.UNIDAD_MEDIDA_E) as UNIDAD_MEDIDA_E,
                        coalesce(vppd.UNIDAD_MEDIDA_A, ppi.UNIDAD_MEDIDA_A) as UNIDAD_MEDIDA_A
                 FROM PLANTA_ALMACEN_SOLICITUD_DETALLE dt
                 LEFT JOIN VISTA_PLANTA_PRODUCTO_DETALLE vppd ON vppd.ID_PRODUCTO_DETALLE = dt.ID_PRODUCTO_DETALLE
                 LEFT JOIN VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi ON ppi.ID_PRODUCTO_INTERMEDIO = dt.ID_PRODUCTO_INTERMEDIO
                 WHERE dt.ID_ALMACEN_SOLICITUD_DOCUMENTO = d.ID_ALMACEN_SOLICITUD_DOCUMENTO
                 FOR JSON AUTO) AS DETALLE
            FROM PLANTA_ALMACEN_SOLICITUD_DOCUMENTO d
            LEFT JOIN PLANTA_ALMACEN aSol ON aSol.ID_PLANTA_ALMACEN = d.ID_ALMACEN_SOLICITANTE
            LEFT JOIN PLANTA_ALMACEN aDes ON aDes.ID_PLANTA_ALMACEN = d.ID_ALMACEN_DESTINO
            ${whereClause}
            ORDER BY d.FECHA_REGISTRO DESC, d.HORA_REGISTRO DESC
        `;
        const result = await query(sql, params);
        const rows = result.recordset || [];
        rows.forEach(row => {
            try {
                row.DETALLE = JSON.parse(row.DETALLE || '[]');
            } catch (e) {
                row.DETALLE = [];
            }
        });
        return rows;
    }

    async getDocumentoById(idDocumento) {
        const sql = `
            SELECT d.*,
                aSol.DESCRICION AS ALMACEN_SOLICITANTE,
                aDes.DESCRICION AS ALMACEN_DESTINO,
                (SELECT dt.ID_ALMACEN_SOLICITUD_DETALLE, dt.CANTIDAD_SOLICITADA, dt.CANTIDAD_ENVIADA,
                        dt.CANTIDAD_ACEPTADA, dt.ID_PRODUCTO_DETALLE, dt.ID_PRODUCTO_INTERMEDIO,
                        dt.ID_UNIDAD, dt.ESTADO_SOLICITUD,
                        COALESCE(vppd.PRODUCTO, ppi.NOMBRE) AS GRUPO,
                        COALESCE(vppd.NOMBRE_DETALLE, ppi.NOMBRE) AS PRODUCTO,
                        coalesce(vppd.CANTIDAD_ESTANDAR, ppi.CANTIDAD_ESTANDAR) as CANTIDAD_ESTANDAR,
                        coalesce(vppd.CANTIDAD_ADECUACION, ppi.CANTIDAD_ADECUACION) as CANTIDAD_ADECUACION,
                        coalesce(vppd.UNIDAD_MEDIDA_E, ppi.UNIDAD_MEDIDA_E) as UNIDAD_MEDIDA_E,
                        coalesce(vppd.UNIDAD_MEDIDA_A, ppi.UNIDAD_MEDIDA_A) as UNIDAD_MEDIDA_A
                 FROM PLANTA_ALMACEN_SOLICITUD_DETALLE dt
                 LEFT JOIN VISTA_PLANTA_PRODUCTO_DETALLE vppd ON vppd.ID_PRODUCTO_DETALLE = dt.ID_PRODUCTO_DETALLE
                 LEFT JOIN VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi ON ppi.ID_PRODUCTO_INTERMEDIO = dt.ID_PRODUCTO_INTERMEDIO
                 WHERE dt.ID_ALMACEN_SOLICITUD_DOCUMENTO = d.ID_ALMACEN_SOLICITUD_DOCUMENTO
                 FOR JSON PATH) AS DETALLE,
                (SELECT r.FECHA, r.ID_USUARIO, r.ID_ESTADO,vvu.NOMBRE_COMPLETO
                 FROM PLANTA_ALMACEN_SOLICITUD_REGISTRO r
                 inner join VISTA_VENTAS_USUARIOS vvu on vvu.ID_USUARIO = r.ID_USUARIO 
                 WHERE r.ID_ALMACEN_SOLICITUD_DOCUMENTO = d.ID_ALMACEN_SOLICITUD_DOCUMENTO
                 ORDER BY r.FECHA
                 FOR JSON PATH) AS REGISTROS
            FROM PLANTA_ALMACEN_SOLICITUD_DOCUMENTO d
            LEFT JOIN PLANTA_ALMACEN aSol ON aSol.ID_PLANTA_ALMACEN = d.ID_ALMACEN_SOLICITANTE
            LEFT JOIN PLANTA_ALMACEN aDes ON aDes.ID_PLANTA_ALMACEN = d.ID_ALMACEN_DESTINO
            WHERE d.ID_ALMACEN_SOLICITUD_DOCUMENTO = @idDocumento
        `;
        const result = await query(sql, [{ name: 'idDocumento', value: idDocumento }]);
        if (!result.recordset || result.recordset.length === 0) return null;
        const row = result.recordset[0];
        try {
            row.DETALLE = JSON.parse(row.DETALLE || '[]');
        } catch (e) {
            row.DETALLE = [];
        }
        try {
            row.REGISTROS = JSON.parse(row.REGISTROS || '[]');
        } catch (e) {
            row.REGISTROS = [];
        }
        return row;
    }

    async updateDetalleEnviado(idDetalle, cantidadEnviada, idUsuario, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `
            UPDATE PLANTA_ALMACEN_SOLICITUD_DETALLE
            SET CANTIDAD_ENVIADA = @cantidadEnviada,
                ID_USUARIO_MODIFICA = @idUsuario,
                FECHA_MODIFICACION = @fechaHora
            WHERE ID_ALMACEN_SOLICITUD_DETALLE = @idDetalle
        `;
        await query(sql, [
            { name: 'idDetalle', value: idDetalle },
            { name: 'cantidadEnviada', value: cantidadEnviada },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
    }

    async updateDetalleAceptado(idDetalle, cantidadAceptada, idUsuario, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `
            UPDATE PLANTA_ALMACEN_SOLICITUD_DETALLE
            SET CANTIDAD_ACEPTADA = @cantidadAceptada,
                ID_USUARIO_MODIFICA = @idUsuario,
                FECHA_MODIFICACION = @fechaHora
            WHERE ID_ALMACEN_SOLICITUD_DETALLE = @idDetalle
        `;
        await query(sql, [
            { name: 'idDetalle', value: idDetalle },
            { name: 'cantidadAceptada', value: cantidadAceptada },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
    }

    async updateDocumentoEstado(idDocumento, estado, transaction = null) {
        const sql = `UPDATE PLANTA_ALMACEN_SOLICITUD_DOCUMENTO SET ESTADO = @estado WHERE ID_ALMACEN_SOLICITUD_DOCUMENTO = @idDocumento`;
        await query(sql, [
            { name: 'idDocumento', value: idDocumento },
            { name: 'estado', value: estado }
        ], 'planta', transaction);
    }

    async editarDetalleSolicitado(idDetalle, cantidad, idUsuario, transaction = null) {
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const sql = `
            UPDATE PLANTA_ALMACEN_SOLICITUD_DETALLE
            SET CANTIDAD_SOLICITADA = @cantidad,
                ID_USUARIO_MODIFICA = @idUsuario,
                FECHA_MODIFICACION = @fechaHora
            WHERE ID_ALMACEN_SOLICITUD_DETALLE = @idDetalle
        `;
        await query(sql, [
            { name: 'idDetalle', value: idDetalle },
            { name: 'cantidad', value: cantidad },
            { name: 'idUsuario', value: idUsuario },
            { name: 'fechaHora', value: fechaHora }
        ], 'planta', transaction);
    }

    async getDetallesByDocumento(idDocumento) {
        const sql = `
            SELECT dt.*,
                COALESCE(vppd.PRODUCTO, ppi.NOMBRE) AS GRUPO,
                COALESCE(vppd.NOMBRE_DETALLE, ppi.NOMBRE) AS PRODUCTO,
                coalesce(vppd.CANTIDAD_ESTANDAR, ppi.CANTIDAD_ESTANDAR) as CANTIDAD_ESTANDAR,
                coalesce(vppd.CANTIDAD_ADECUACION, ppi.CANTIDAD_ADECUACION) as CANTIDAD_ADECUACION,
                coalesce(vppd.UNIDAD_MEDIDA_E, ppi.UNIDAD_MEDIDA_E) as UNIDAD_MEDIDA_E,
                coalesce(vppd.UNIDAD_MEDIDA_A, ppi.UNIDAD_MEDIDA_A) as UNIDAD_MEDIDA_A
            FROM PLANTA_ALMACEN_SOLICITUD_DETALLE dt
            LEFT JOIN VISTA_PLANTA_PRODUCTO_DETALLE vppd ON vppd.ID_PRODUCTO_DETALLE = dt.ID_PRODUCTO_DETALLE
            LEFT JOIN VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 ppi ON ppi.ID_PRODUCTO_INTERMEDIO = dt.ID_PRODUCTO_INTERMEDIO
            WHERE dt.ID_ALMACEN_SOLICITUD_DOCUMENTO = @idDocumento
        `;
        const result = await query(sql, [{ name: 'idDocumento', value: idDocumento }]);
        return result.recordset || [];
    }

    async getStockByProducto(idAlmacen, idProductoDetalle, idProductoIntermedio) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const sql = `
            SELECT COALESCE(vpp.CANTIDAD_ADECUACION, ppiv.CANTIDAD_ADECUACION) as cantidad_adecuacion ,
                ISNULL(
                    CAST(
                        SUM(pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) 
                        / COALESCE(vpp.CANTIDAD_ADECUACION, ppiv.CANTIDAD_ADECUACION)
                    AS decimal(10,2)), 
                0
                ) AS stock
            FROM PLANTA_ALMACEN_INVENTARIO pai
            LEFT JOIN PLANTA_PRODUCTO_INTERMEDIO_V2 ppiv 
                ON ppiv.ID_PRODUCTO_INTERMEDIO = pai.ID_PRODUCTO_INTERMEDIO 
            LEFT JOIN PLANTA_PRODUCTO_DETALLE vpp 
                ON vpp.ID_PRODUCTO_DETALLE = pai.ID_PRODUCTO_DETALLE 
            WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
              AND pai.ID_PRODUCTO_DETALLE = @idProductoDetalle
              AND pai.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
              AND pai.ESTADO_INGRESO = 1
              AND pai.FECHA_VENCIMIENTO >= @fecha
              AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
            GROUP by vpp.CANTIDAD_ADECUACION, ppiv.CANTIDAD_ADECUACION ;
        `;
        const result = await query(sql, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'fecha', value: fecha }
        ]);
        return result.recordset[0] || {};
    }

    async getInventarioByProducto(idAlmacen, campo, idProducto, transaction = null) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const result = await query(`
            SELECT ID_ALMACEN_INVENTARIO, ID_PLANTA_ALMACEN, ID_PRODUCTO_INTERMEDIO,
                   CANTIDAD_UTILIZADA, ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA,
                   FECHA_VENCIMIENTO, LOTE,
                   CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) as CANTIDAD
            FROM PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.${campo} = @idProducto
              AND pai.ID_PLANTA_ALMACEN = @idAlmacen
              AND pai.ESTADO_INGRESO = 1
              AND pai.FECHA_VENCIMIENTO >= @fecha
              AND CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) > 0
            ORDER BY FECHA_VENCIMIENTO
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'fecha', value: fecha }
        ], 'planta', transaction);
        return result.recordset || [];
    }

    async registrarEnInventarioAlmacen(data, transaction = null) {
        const {
            idAlmacen, idProducto, idIntermedio, cantidad, fechaHora,
            fechaVen, idUsuario, idUnidadMedida, idProducido, ingreso,
            estado, idInvA, idPD, idDetalleDevol, lote = null
        } = data;
        const result = await query(`
            INSERT INTO PLANTA_ALMACEN_INVENTARIO
            (ID_PLANTA_ALMACEN, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD,
             ESTADO_INGRESO, FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO,
             USUARIO_REGISTRO, ID_UNIDAD_MEDIDA, ID_PLANTA_PRODUCTO_PRODUCIDO,
             ID_INVENTARIO_DESC, ID_PRODUCTO_DETALLE, ID_DETALLE_DEVOLUCION_ALMACEN,
             PRECIO_INGRESO_STOCK, LOTE)
            VALUES (@idAlmacen, @idProducto, @idIntermedio, @cantidad,
                    @ingreso, @fechaHora, @fechaVen, @estado,
                    @idUsuario, @idUnidadMedida, @idProducido,
                    @idInvA, @idPD, @idDetalleDevol, 0, @lote);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProducto', value: idProducto },
            { name: 'idIntermedio', value: idIntermedio },
            { name: 'cantidad', value: cantidad },
            { name: 'ingreso', value: ingreso },
            { name: 'fechaHora', value: fechaHora },
            { name: 'fechaVen', value: fechaVen },
            { name: 'estado', value: estado },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'idProducido', value: idProducido },
            { name: 'idInvA', value: idInvA },
            { name: 'idPD', value: idPD },
            { name: 'idDetalleDevol', value: idDetalleDevol },
            { name: 'lote', value: lote }
        ], 'planta', transaction);
        return result.recordset[0]?.id || 0;
    }

    async actualizarCantUtilizada(idInventario, cantidad, idUsuario, transaction = null) {
        await query(`
            UPDATE PLANTA_ALMACEN_INVENTARIO
            SET CANTIDAD_UTILIZADA = @cantidad, ID_USUARIO_MODIFICA = @idUsuario
            WHERE ID_ALMACEN_INVENTARIO = @idInventario
        `, [
            { name: 'idInventario', value: idInventario },
            { name: 'cantidad', value: cantidad },
            { name: 'idUsuario', value: idUsuario }
        ], 'planta', transaction);
    }
}

module.exports = new PedidoAlmacenRepository();

const { query } = require('../config/database');

async function listAlmacenUsuario(idUsuario, idAlmacen = 0) {
    let sql;
    const params = [{ name: 'idUsuario', value: idUsuario }];
    if (idAlmacen > 0) {
        sql = `SELECT DISTINCT pa.* FROM PLANTA_PERMISO_ALMACEN ppa
               INNER JOIN PLANTA_ALMACEN pa ON ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
               WHERE ppa.ID_PLANTA_ALMACEN = @idAlmacen AND ppa.ID_USUARIO = @idUsuario
               AND ppa.ESTADO = 1 AND pa.ESTADO = 1
               ORDER BY pa.DESCRICION DESC`;
        params.push({ name: 'idAlmacen', value: idAlmacen });
    } else {
        sql = `SELECT pa.* FROM PLANTA_PERMISO_ALMACEN ppa
               INNER JOIN PLANTA_ALMACEN pa ON ppa.ID_PLANTA_ALMACEN = pa.ID_PLANTA_ALMACEN
               WHERE ppa.ID_USUARIO = @idUsuario AND ppa.ESTADO = 1 AND pa.ESTADO = 1
               ORDER BY pa.DESCRICION DESC`;
    }
    const result = await query(sql, params);
    return result.recordset;
}

async function getStockObjByAlmacen(idAlmacen) {
    const result = await query(`
        SELECT pai.ID_PRODUCTO_DETALLE AS KEY_PD, pai.ID_PRODUCTO_INTERMEDIO AS KEY_PI,
               SUM(pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) AS CANTIDAD
        FROM PLANTA_ALMACEN_INVENTARIO pai
        WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen AND pai.ESTADO_INGRESO = 1
        AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
        GROUP BY pai.ID_PRODUCTO_DETALLE, pai.ID_PRODUCTO_INTERMEDIO
    `, [{ name: 'idAlmacen', value: idAlmacen }]);
    const stocks = {};
    for (const row of result.recordset) {
        const keyPd = `${row.KEY_PD}-PD`;
        const keyPi = `${row.KEY_PI}-PI`;
        if (!stocks[keyPd]) stocks[keyPd] = {};
        stocks[keyPd][keyPi] = parseFloat(row.CANTIDAD) || 0;
    }
    return stocks;
}

async function existeDeclaracion(idAlmacen, fechaInicio, fechaFin) {
    const result = await query(`
        SELECT TOP 1 pad.* FROM PLANTA_ALMACEN_DOCUMENTO_INVENTARIO pad
        WHERE pad.ID_PLANTA_ALMACEN = @idAlmacen
        AND pad.FECHA_REGISTRO BETWEEN @fechaInicio AND @fechaFin
        ORDER BY pad.ID_ALMACEN_DOCUMENTO_INVENTARIO DESC
    `, [
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'fechaInicio', value: fechaInicio },
        { name: 'fechaFin', value: fechaFin }
    ]);
    return result.recordset[0] || null;
}

async function getUltimaVerifDeclaracion(idAlmacen) {
    const result = await query(`
        SELECT TOP 1 * FROM PLANTA_ALMACEN_DOCUMENTO_INVENTARIO
        WHERE ID_PLANTA_ALMACEN = @idAlmacen AND ESTADO_VERIFICACION IN (0, 1)
        ORDER BY ID_ALMACEN_DOCUMENTO_INVENTARIO DESC
    `, [{ name: 'idAlmacen', value: idAlmacen }]);
    return result.recordset[0] || null;
}

async function obtenerDeclaracionAlmacenData(idAlmacen, idDocumento, fecha) {
    const result = await query(`EXEC GET_DECLARACION_INVENTARIO_V2 @idAlmacen, @idDocumento, @fecha`, [
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'idDocumento', value: idDocumento },
        { name: 'fecha', value: fecha }
    ]);
    return result.recordset;
}

async function obtenerDeclaracionAlmacenDataById(idDocumento) {
    const result = await query(`EXEC GET_DECLARACION_INVENTARIO_V2 @idAlmacen, @idDocumento, @fecha`, [
        { name: 'idAlmacen', value: 0 },
        { name: 'idDocumento', value: idDocumento },
        { name: 'fecha', value: '' }
    ]);
    return result.recordset;
}

async function existeProductoEnDecla(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio) {
    const result = await query(`
        SELECT * FROM PLANTA_ALMACEN_DECLARACION_INVENTARIO
        WHERE ID_ALMACEN_DOCUMENTO_INVENTARIO = @idDocumento
        AND ID_PRODUCTO = @idProducto AND ID_PRODUCTO_DETALLE = @idProductoDetalle
        AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
    `, [
        { name: 'idDocumento', value: idDocumento },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoDetalle', value: idProductoDetalle },
        { name: 'idProductoIntermedio', value: idProductoIntermedio }
    ]);
    return result.recordset.length > 0;
}

async function registrarDocInv(idUsuario, idAlmacen, fechaHora) {
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_DOCUMENTO_INVENTARIO
        (ID_USUARIO_REGISTRA, ID_PLANTA_ALMACEN, FECHA_REGISTRO, ESTADO)
        VALUES (@idUsuario, @idAlmacen, @fechaHora, 1);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idUsuario', value: idUsuario },
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'fechaHora', value: fechaHora }
    ]);
    return result.recordset[0]?.id || 0;
}

async function actualizarDocInv(idUsuario, idDocumento, fechaHora) {
    await query(`
        UPDATE PLANTA_ALMACEN_DOCUMENTO_INVENTARIO
        SET ID_USUARIO_MODIFICA = @idUsuario, FECHA_MODIFICACION = @fechaHora
        WHERE ID_ALMACEN_DOCUMENTO_INVENTARIO = @idDocumento
    `, [
        { name: 'idUsuario', value: idUsuario },
        { name: 'idDocumento', value: idDocumento },
        { name: 'fechaHora', value: fechaHora }
    ]);
}

async function registrarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion) {
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_DECLARACION_INVENTARIO
        (ID_ALMACEN_DOCUMENTO_INVENTARIO, ID_PRODUCTO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
         CANTIDAD, FECHA_REGISTRO, OBSERVACION)
        VALUES (@idDocumento, @idProducto, @idProductoDetalle, @idProductoIntermedio,
                @cantidad, @fechaHora, @observacion);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idDocumento', value: idDocumento },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoDetalle', value: idProductoDetalle },
        { name: 'idProductoIntermedio', value: idProductoIntermedio },
        { name: 'cantidad', value: cantidad },
        { name: 'fechaHora', value: fechaHora },
        { name: 'observacion', value: observacion || '' }
    ]);
    return result.recordset[0]?.id || 0;
}

async function actualizarDeclaInv(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, observacion) {
    await query(`
        UPDATE PLANTA_ALMACEN_DECLARACION_INVENTARIO
        SET CANTIDAD = @cantidad, FECHA_MODIFICACION = @fechaHora, OBSERVACION = @observacion
        WHERE ID_ALMACEN_DOCUMENTO_INVENTARIO = @idDocumento
        AND ID_PRODUCTO = @idProducto AND ID_PRODUCTO_DETALLE = @idProductoDetalle
        AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
    `, [
        { name: 'idDocumento', value: idDocumento },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoDetalle', value: idProductoDetalle },
        { name: 'idProductoIntermedio', value: idProductoIntermedio },
        { name: 'cantidad', value: cantidad },
        { name: 'fechaHora', value: fechaHora },
        { name: 'observacion', value: observacion || '' }
    ]);
}

async function registrarDocInvVerif(idUsuario, idAlmacen, fechaHora) {
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_DOCUMENTO_INVENTARIO
        (ID_USUARIO_REGISTRA, ID_PLANTA_ALMACEN, FECHA_REGISTRO, ESTADO, ESTADO_VERIFICACION, FECHA_VERIFICACION)
        VALUES (@idUsuario, @idAlmacen, @fechaHora, 1, 1, @fechaHora);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idUsuario', value: idUsuario },
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'fechaHora', value: fechaHora }
    ]);
    return result.recordset[0]?.id || 0;
}

async function actualizarDocInvVerif(idUsuario, idDocumento, fechaHora) {
    await query(`
        UPDATE PLANTA_ALMACEN_DOCUMENTO_INVENTARIO
        SET ID_USUARIO_MODIFICA = @idUsuario, FECHA_MODIFICACION = @fechaHora,
            ESTADO_VERIFICACION = 1, FECHA_VERIFICACION = @fechaHora
        WHERE ID_ALMACEN_DOCUMENTO_INVENTARIO = @idDocumento
    `, [
        { name: 'idUsuario', value: idUsuario },
        { name: 'idDocumento', value: idDocumento },
        { name: 'fechaHora', value: fechaHora }
    ]);
}

async function registrarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion) {
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_DECLARACION_INVENTARIO
        (ID_ALMACEN_DOCUMENTO_INVENTARIO, ID_PRODUCTO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
         CANTIDAD, FECHA_REGISTRO, CANTIDAD_SISTEMA, OBSERVACION)
        VALUES (@idDocumento, @idProducto, @idProductoDetalle, @idProductoIntermedio,
                @cantidad, @fechaHora, @stockSistema, @observacion);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idDocumento', value: idDocumento },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoDetalle', value: idProductoDetalle },
        { name: 'idProductoIntermedio', value: idProductoIntermedio },
        { name: 'cantidad', value: cantidad },
        { name: 'fechaHora', value: fechaHora },
        { name: 'stockSistema', value: stockSistema },
        { name: 'observacion', value: observacion || '' }
    ]);
    return result.recordset[0]?.id || 0;
}

async function actualizarDeclaInvVerif(idDocumento, idProducto, idProductoDetalle, idProductoIntermedio, cantidad, fechaHora, stockSistema, observacion) {
    await query(`
        UPDATE PLANTA_ALMACEN_DECLARACION_INVENTARIO
        SET CANTIDAD = @cantidad, FECHA_MODIFICACION = @fechaHora,
            CANTIDAD_SISTEMA = @stockSistema, OBSERVACION = @observacion
        WHERE ID_ALMACEN_DOCUMENTO_INVENTARIO = @idDocumento
        AND ID_PRODUCTO = @idProducto AND ID_PRODUCTO_DETALLE = @idProductoDetalle
        AND ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
    `, [
        { name: 'idDocumento', value: idDocumento },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoDetalle', value: idProductoDetalle },
        { name: 'idProductoIntermedio', value: idProductoIntermedio },
        { name: 'cantidad', value: cantidad },
        { name: 'fechaHora', value: fechaHora },
        { name: 'stockSistema', value: stockSistema },
        { name: 'observacion', value: observacion || '' }
    ]);
}

async function registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idProductoConversion) {
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_INVENTARIO
        (ID_PLANTA_ALMACEN, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD, ESTADO_INGRESO,
         FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_UNIDAD_MEDIDA,
         ID_PRODUCTO_PROducido, ID_ALMACEN_INVENTARIO_DESC, ID_PRODUCTO_DETALLE, ID_PRODUCTO_CONVERCION, TIPO)
        VALUES (@idAlmacen, @idProducto, @idProductoIntermedio, @cantidad, @estadoIngreso,
                @fechaHora, @fechaVen, 1, @idUsuario, @idUnidadInv,
                @idProducido, @idInvDesc, @idProductoDetalle, @idProductoConversion, @tipo);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'idProducto', value: idProducto },
        { name: 'idProductoIntermedio', value: idProductoIntermedio || 0 },
        { name: 'cantidad', value: cantidad },
        { name: 'estadoIngreso', value: estadoIngreso },
        { name: 'fechaHora', value: fechaHora },
        { name: 'fechaVen', value: fechaVen },
        { name: 'idUsuario', value: idUsuario },
        { name: 'idUnidadInv', value: idUnidadInv || 0 },
        { name: 'idProducido', value: idProducido || 0 },
        { name: 'idInvDesc', value: idInvDesc || 0 },
        { name: 'idProductoDetalle', value: idProductoDetalle || 0 },
        { name: 'idProductoConversion', value: idProductoConversion || 0 },
        { name: 'tipo', value: tipo || 0 }
    ]);
    return result.recordset[0]?.id || 0;
}

async function actualizarCantUtilizada(idInventario, cantidad, idUsuario) {
    await query(`
        UPDATE PLANTA_ALMACEN_INVENTARIO
        SET CANTIDAD_UTILIZADA = @cantidad, ID_USUARIO_MODIFICA = @idUsuario
        WHERE ID_ALMACEN_INVENTARIO = @idInventario
    `, [
        { name: 'idInventario', value: idInventario },
        { name: 'cantidad', value: cantidad },
        { name: 'idUsuario', value: idUsuario }
    ]);
}

async function getInventarioByProducto(idAlmacen, strWhere, fecha) {
    const result = await query(`
        SELECT pai.* FROM PLANTA_ALMACEN_INVENTARIO pai
        WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
        AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
        AND pai.FECHA_VENCIMIENTO >= @fecha
        AND ${strWhere}
        ORDER BY pai.FECHA_VENCIMIENTO ASC
    `, [
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'fecha', value: fecha }
    ]);
    return result.recordset;
}

async function getProductoData(idProducto) {
    const result = await query(`
        SELECT pp.ID_PRODUCTO, pp.NOMBRE,
            (SELECT TOP(1) ppd.* FROM PLANTA_PRODUCTO_DETALLE ppd
             WHERE ppd.ID_PRODUCTO = pp.ID_PRODUCTO AND ppd.ESTADO = 1
             ORDER BY ppd.ID_PRODUCTO_DETALLE FOR JSON AUTO) AS DETALLE
        FROM PLANTA_PRODUCTO pp
        WHERE pp.ESTADO = 1 AND pp.ID_PRODUCTO = @idProducto
        ORDER BY pp.NOMBRE ASC
    `, [{ name: 'idProducto', value: idProducto }]);
    const row = result.recordset[0];
    if (row && row.DETALLE) {
        try { row.DETALLE = JSON.parse(row.DETALLE); } catch { row.DETALLE = []; }
    }
    return row || null;
}

module.exports = {
    listAlmacenUsuario,
    getStockObjByAlmacen,
    existeDeclaracion,
    getUltimaVerifDeclaracion,
    obtenerDeclaracionAlmacenData,
    obtenerDeclaracionAlmacenDataById,
    existeProductoEnDecla,
    registrarDocInv,
    actualizarDocInv,
    registrarDeclaInv,
    actualizarDeclaInv,
    registrarDocInvVerif,
    actualizarDocInvVerif,
    registrarDeclaInvVerif,
    actualizarDeclaInvVerif,
    registrarEnInventarioAlmacen,
    actualizarCantUtilizada,
    getInventarioByProducto,
    getProductoData
};

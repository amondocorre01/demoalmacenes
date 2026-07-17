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
    const fechaAct = new Date().toLocaleDateString('en-CA');
    const result = await query(`
        SELECT  ID_PRODUCTO_DETALLE,ID_PRODUCTO_INTERMEDIO,ROUND(SUM((CAST((vpai.CANTIDAD-vpai.CANTIDAD_UTILIZADA) as numeric(18,2))/IIF (vpai.UNIDAD_MEDIDA_E=vpai.UNIDAD_MEDIDA_D,vpai.CANTIDAD_ADECUACION,1))),2)as STOCK 
          FROM VISTA_PLANTA_ALMACEN_INVENTARIO vpai WHERE vpai.ESTADO_INGRESO='1' and vpai.ID_PLANTA_ALMACEN =@idAlmacen and vpai.FECHA_VENCIMIENTO>=@fecha
          group by ID_PRODUCTO_DETALLE,ID_PRODUCTO_INTERMEDIO;
    `, [{ name: 'idAlmacen', value: idAlmacen },{ name: 'fecha', value: fechaAct }]);
    const stocks = {};
    for (const row of result.recordset) {
        const keyPd = `${row.ID_PRODUCTO_DETALLE}-PD`;
        const keyPi = `${row.ID_PRODUCTO_INTERMEDIO}-PI`;
        if (!stocks[keyPd]) stocks[keyPd] = {};
        stocks[keyPd][keyPi] = parseFloat(row.STOCK) || 0;
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
    const result = await query(`EXEC GET_DECLARACION_INVENTARIO_ID_V2  @idDocumento`, [
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
        (ID_USUARIO, ID_PLANTA_ALMACEN, FECHA_REGISTRO, ESTADO)
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
        (ID_USUARIO,ID_USUARIO_VERIFICA, ID_PLANTA_ALMACEN, FECHA_REGISTRO, ESTADO, ESTADO_VERIFICACION, FECHA_VERIFICACION)
        VALUES (@idUsuario,@idUsuario, @idAlmacen, @fechaHora, 1, 1, @fechaHora);
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
        SET ID_USUARIO_VERIFICA = @idUsuario, ID_USUARIO_MODIFICA = @idUsuario, FECHA_MODIFICACION = @fechaHora,
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
         CANTIDAD,CANTIDAD_VERIFICADA, FECHA_REGISTRO, STOCK_SISTEMA, OBSERVACION)
        VALUES (@idDocumento, @idProducto, @idProductoDetalle, @idProductoIntermedio,
                @cantidad, @cantidad, @fechaHora, @stockSistema, @observacion);
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
        SET CANTIDAD_VERIFICADA = @cantidad, FECHA_MODIFICACION = @fechaHora,
            STOCK_SISTEMA = @stockSistema, OBSERVACION = @observacion
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

async function calcularPrecioInventario(tipo, ingreso, idProducto, idProductoIntermedio, idProductoDetalle) {
    let precio = 0;
    if ((tipo === 8 || tipo === 9) && ingreso === 1) {
        if (idProducto === 0) {
            precio = await getPrecioProductoIntermedio(idProductoIntermedio);
        } else {
            precio = await getPrecioProductoDetalle2(idProductoDetalle);
            if (precio === 0) precio = await getPrecioProducto(idProducto);
            if (precio === 0) precio = await getProductoConversion(idProducto);
        }
    }
    return Math.round(precio * 100000000) / 100000000;
}

async function getPrecioProductoDetalle2(idProductoDetalle) {
    const result = await query(`SELECT TOP 1 PRECIO FROM VISTA_PLANTA_COMPRA_DETALLE_PRECIO WHERE ID_PRODUCTO_DETALLE = @id ORDER BY FECHA_FACTURA DESC`, [
        { name: 'id', value: idProductoDetalle }
    ]);
    return result.recordset[0]?.PRECIO || 0;
}

async function getPrecioProducto(idProducto) {
    const result = await query(`SELECT TOP 1 PRECIO FROM VISTA_PLANTA_COMPRA_DETALLE_PRECIO WHERE ID_PRODUCTO = @id ORDER BY FECHA_FACTURA DESC`, [
        { name: 'id', value: idProducto }
    ]);
    return result.recordset[0]?.PRECIO || 0;
}

async function getPrecioProductoIntermedio(idProductoIntermedio) {
    const fecha = new Date().toLocaleDateString('en-CA');
    const result = await query(`SELECT dbo.getPrecioRecetaIntermedio(@id, @fecha) AS PRECIO`, [
        { name: 'id', value: idProductoIntermedio },
        { name: 'fecha', value: fecha }
    ]);
    return result.recordset[0]?.PRECIO || 0;
}

async function getProductoConversion(idProducto) {
    const fecha = new Date().toLocaleDateString('en-CA');
    const result = await query(`SELECT dbo.getProductoConversion(@id, @fecha) AS PRECIO`, [
        { name: 'id', value: idProducto },
        { name: 'fecha', value: fecha }
    ]);
    return result.recordset[0]?.PRECIO || 0;
}

async function calcularPrecioDesperdicio(idProducto, idProductoIntermedio, idProductoDetalle, cantidad) {
    let precio = 0;
    if (idProducto === 0) {
        precio = await getPrecioProductoIntermedio(idProductoIntermedio);
    } else {
        precio = await getPrecioProductoDetalle2(idProductoDetalle);
        if (precio === 0) precio = await getPrecioProducto(idProducto);
        if (precio === 0) precio = await getProductoConversion(idProducto);
    }
    return Math.round(cantidad * precio * 100) / 100;
}

async function registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cantidad, fechaHora, fechaVen, idUsuario, idUnidadInv, idProducido, estadoIngreso, tipo, idInvDesc, idProductoDetalle, idDetalleDevol) {
    const precio = await calcularPrecioInventario(tipo, estadoIngreso, idProducto, idProductoIntermedio, idProductoDetalle);
    const result = await query(`
        INSERT INTO PLANTA_ALMACEN_INVENTARIO
        (ID_PLANTA_ALMACEN, ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD, ESTADO_INGRESO,
         FECHA_REGISTRO, FECHA_VENCIMIENTO, ID_ESTADO, USUARIO_REGISTRO, ID_UNIDAD_MEDIDA,
         ID_PLANTA_PRODUCTO_PRODUCIDO, ID_INVENTARIO_DESC, ID_PRODUCTO_DETALLE, ID_DETALLE_DEVOLUCION_ALMACEN, PRECIO_INGRESO_STOCK)
        VALUES (@idAlmacen, @idProducto, @idProductoIntermedio, @cantidad, @estadoIngreso,
                @fechaHora, @fechaVen, @tipo, @idUsuario, @idUnidadInv,
                @idProducido, @idInvDesc, @idProductoDetalle, @idDetalleDevol, @precio);
        SELECT SCOPE_IDENTITY() as id;
    `, [
        { name: 'idAlmacen', value: idAlmacen },
        { name: 'idProducto', value: idProducto || 0 },
        { name: 'idProductoIntermedio', value: idProductoIntermedio || 0 },
        { name: 'cantidad', value: cantidad },
        { name: 'estadoIngreso', value: estadoIngreso },
        { name: 'fechaHora', value: fechaHora },
        { name: 'fechaVen', value: fechaVen },
        { name: 'tipo', value: tipo },
        { name: 'idUsuario', value: idUsuario },
        { name: 'idUnidadInv', value: idUnidadInv || 0 },
        { name: 'idProducido', value: idProducido || 0 },
        { name: 'idInvDesc', value: idInvDesc || 0 },
        { name: 'idProductoDetalle', value: idProductoDetalle || 0 },
        { name: 'idDetalleDevol', value: idDetalleDevol || 0 },
        { name: 'precio', value: precio }
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

async function guardarImagenDesperdicioAlmacen(idDesperdicio, imagen) {
    const ruta = `/uploads/documentacion/desperdicio/almacen/${idDesperdicio}.png`;
    await query(`UPDATE PLANTA_DESPERDICIO_ALMACEN SET IMAGEN = @ruta WHERE ID_PLANTA_DESPERDICIO_ALMACEN = @id`, [
        { name: 'ruta', value: ruta },
        { name: 'id', value: idDesperdicio }
    ]);
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
    calcularPrecioInventario,
    calcularPrecioDesperdicio,
    actualizarCantUtilizada,
    getInventarioByProducto,
    getProductoData,
    guardarImagenDesperdicioAlmacen
};

const { query, rawQuery } = require('../config/database');

const PlantaHelpers = {
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
    },

    async existeAlmacenById(idAlmacen) {
        const result = await query(`
            SELECT * FROM PLANTA_ALMACEN WHERE ID_PLANTA_ALMACEN = @idAlmacen
        `, [{ name: 'idAlmacen', value: idAlmacen }]);
        return result.recordset.length > 0;
    },

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
    },

    async editarAlmacen(idAlmacen, nombre, estado, estadoProduccion) {
        const result = await query(`
            UPDATE PLANTA_ALMACEN 
            SET DESCRICION = @nombre,
                ESTADO = @estado,
                ESTADO_PRODUCCION = @estadoProduccion
            WHERE ID_PLANTA_ALMACEN = @idAlmacen
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'nombre', value: nombre },
            { name: 'estado', value: estado },
            { name: 'estadoProduccion', value: estadoProduccion }
        ]);
        return result.rowsAffected[0] > 0;
    },

    async existeReceta(idSubCategoria2) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA WHERE ID_SUB_CATEGORIA_2 = @idSubCategoria2
        `, [{ name: 'idSubCategoria2', value: idSubCategoria2 }]);
        return result.recordset[0]?.ID_PLANTA_RECETA || 0;
    },

    async existeRecetaById(idReceta) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA WHERE ID_PLANTA_RECETA = @idReceta
        `, [{ name: 'idReceta', value: idReceta }]);
        return result.recordset.length > 0;
    },

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
    },

    async editarReceta(idReceta, nombre, idSubCategoria2, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA 
            SET DESCRIPCION = @nombre,
                ID_SUB_CATEGORIA_2 = @idSubCategoria2,
                ESTADO = @estado
            WHERE ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idReceta', value: idReceta },
            { name: 'nombre', value: nombre },
            { name: 'idSubCategoria2', value: idSubCategoria2 },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    },

    async editarEstadoReceta(idReceta, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA SET ESTADO = @estado WHERE ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idReceta', value: idReceta },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    },

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
    },

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
    },

    async editarProductoRecta(idProductoReceta, estado, cantidad, idUnidadMedida) {
        const result = await query(`
            UPDATE PLANTA_PRODUCTO_RECETA 
            SET ESTADO = @estado,
                CANTIDAD = @cantidad,
                ID_UNIDAD_MEDIDA = @idUnidadMedida
            WHERE ID_PLANTA_PRODUCTO_RECETA = @idProductoReceta
        `, [
            { name: 'idProductoReceta', value: idProductoReceta },
            { name: 'estado', value: estado },
            { name: 'cantidad', value: cantidad },
            { name: 'idUnidadMedida', value: idUnidadMedida }
        ]);
        return result.rowsAffected[0] > 0;
    },

    async tieneRectaAlamcen(idAlmacen, idReceta) {
        const result = await query(`
            SELECT * FROM PLANTA_RECETA_ALMACEN 
            WHERE ID_PLANTA_ALMACEN = @idAlmacen
            AND ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta }
        ]);
        return result.recordset.length > 0;
    },

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
    },

    async editarRecetaPlanta(idAlmacen, idReceta, estado) {
        const result = await query(`
            UPDATE PLANTA_RECETA_ALMACEN 
            SET ESTADO = @estado
            WHERE ID_PLANTA_ALMACEN = @idAlmacen
            AND ID_PLANTA_RECETA = @idReceta
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta },
            { name: 'estado', value: estado }
        ]);
        return result.rowsAffected[0] > 0;
    },

    async getAreaById(idArea) {
        const result = await query(`
            SELECT * FROM PLANTA_AREA WHERE ID_AREA = @idArea
        `, [{ name: 'idArea', value: idArea }]);
        return result.recordset[0] || null;
    },

    async getAreasByUsuario(idUsuario) {
        const result = await query(`
            SELECT pa.ID_AREA, pa.NOMBRE, pa.ESTADO, 
                   COALESCE(iu.ID_UBICACION, 0) AS ID_UBICACION,
                   pa.ESTADO_SOLICITUD
            FROM PLANTA_AREA pa 
            LEFT JOIN ID_UBICACION iu ON iu.ID_UBICACION = pa.ID_UBICACION AND iu.SUCURSAL = 1
            WHERE pa.ESTADO = 1 
            AND pa.ID_AREA IN (
                SELECT ID_AREA FROM PLANTA_PERMISOS_AREA 
                WHERE ID_USUARIO = @idUsuario AND ESTADO = 1
            )
            ORDER BY pa.NOMBRE
        `, [{ name: 'idUsuario', value: idUsuario }]);
        return result.recordset;
    },

    async getProveedorById(idProveedor) {
        const result = await query(`
            SELECT pp.*, pef.CODIGO as CODIGO_ESTADO_FACTURADO 
            FROM PLANTA_PROVEEDOR pp
            LEFT JOIN PLANTA_ESTADO_FACTURADO pef ON pef.ID_ESTADO_FACTURADO = pp.ID_ESTADO_FACTURADO 
            WHERE ID_PROVEEDOR = @idProveedor
        `, [{ name: 'idProveedor', value: idProveedor }]);
        return result.recordset[0] || null;
    },

    async existeProveedorById(idProveedor) {
        const result = await query(`
            SELECT * FROM PLANTA_PROVEEDOR WHERE ID_PROVEEDOR = @idProveedor
        `, [{ name: 'idProveedor', value: idProveedor }]);
        return result.recordset.length > 0;
    },

    async existeProductById(idProducto) {
        const result = await query(`
            SELECT * FROM PLANTA_PRODUCTO WHERE ID_PRODUCTO = @idProducto
        `, [{ name: 'idProducto', value: idProducto }]);
        return result.recordset.length > 0;
    },

    async getProductoDetalleById(idProductoDetalle) {
        const result = await query(`
            SELECT * FROM VISTA_PLANTA_PRODUCTO_DETALLE 
            WHERE ID_PRODUCTO_DETALLE = @idProductoDetalle
        `, [{ name: 'idProductoDetalle', value: idProductoDetalle }]);
        return result.recordset[0] || null;
    },

    // ==================== COMPRAS HELPERS ====================

    async getProductosData(idProveedor) {
        const result = await query(`
            SELECT ppd.*, vpp.ESTADO_CONTEO, vpp.CODIGO,
                DATEADD(YEAR, (SELECT VIDA_UTIL FROM PLANTA_DEPRECIACION pd WHERE pd.ID_DEPRECIACION = ppd.ID_DEPRECIACION), CONVERT(date, GETDATE())) as FECHA_VENCIMIENTO
            FROM PLANTA_PROVEEDOR_PRODUCTO ppp
            INNER JOIN PLANTA_PRODUCTO_DETALLE ppd ON ppp.ID_PRODUCTO_DETALLE = ppd.ID_PRODUCTO_DETALLE
            INNER JOIN VISTA_PLANTA_PRODUCTO vpp ON vpp.ID_PRODUCTO = ppd.ID_PRODUCTO
            WHERE ppp.ID_PROVEEDOR = @idProveedor
        `, [{ name: 'idProveedor', value: idProveedor }]);
        const productos = {};
        result.recordset.forEach(r => {
            productos[r.ID_PRODUCTO_DETALLE] = r;
        });
        return productos;
    },

    async getContactoProveedor(idProveedor) {
        const result = await query(`
            SELECT TOP 1 * FROM PLANTA_PROVEEDOR_CONTACTO 
            WHERE ID_PROVEEDOR = @idProveedor AND ESTADO = 1
        `, [{ name: 'idProveedor', value: idProveedor }]);
        return result.recordset[0] || { ID_PROVEEDOR_CONTACTO: 0 };
    },

    async getProductosPedido(idDocumento) {
        const result = await query(`
            SELECT ppd.ID_PRODUCTO_DETALLE, ppd.CANTIDAD, ppd.CANTIDAD_RECIBIDA,
                   ppd2.CANTIDAD_ESTANDAR, ppd2.ID_PRODUCTO, ppd2.CANTIDAD_ADECUACION,
                   ppd2.ID_UNIDAD_MEDIDA_ADECUACION, ID_SUB_CATEGORIA_2, ppd2.CODIGO,
                   ppd2.FECHA_VENCIMIENTO, ppd2.ESTADO_CONTEO
            FROM PLANTA_PEDIDO_DETALLE ppd
            INNER JOIN VISTA_PLANTA_PRODUCTO_DETALLE ppd2 ON ppd.ID_PRODUCTO_DETALLE = ppd2.ID_PRODUCTO_DETALLE
            WHERE ppd.ID_PLANTA_PEDIDO_DOCUMENTO = @idDocumento
        `, [{ name: 'idDocumento', value: idDocumento }]);
        const registros = {};
        result.recordset.forEach(r => {
            registros[r.ID_PRODUCTO_DETALLE] = r;
        });
        return registros;
    },

    async tieneProdCompraDetalle(idCompraDocumento, idProductoDetalle) {
        const result = await query(`
            SELECT * FROM PLANTA_COMPRA_DETALLE 
            WHERE ID_COMPRA_DOCUMENTO = @idCompraDocumento 
            AND ID_PRODUCTO_DETALLE = @idProductoDetalle AND ESTADO = 1
        `, [
            { name: 'idCompraDocumento', value: idCompraDocumento },
            { name: 'idProductoDetalle', value: idProductoDetalle }
        ]);
        return result.recordset[0] || null;
    },

    async getDeudas(idArea, idProveedor) {
        const result = await query(`
            SELECT pcd.ID_COMPRA_DOCUMENTO, pcd.IMPORTE_TOTAL, pcd.DESCUENTO, pcd.IMPORTE_GIFT_CARD,
                (pcd.IMPORTE_TOTAL - ISNULL(pcd.DESCUENTO, 0) - ISNULL(pcd.IMPORTE_GIFT_CARD, 0)) -
                ISNULL((SELECT SUM(MONTO_PAGADO) FROM PLANTA_PAGO_DETALLE ppd 
                        WHERE ppd.ID_COMPRA_DOCUMENTO = pcd.ID_COMPRA_DOCUMENTO AND ppd.ESTADO = 1), 0) as DEUDA
            FROM PLANTA_COMPRA_DOCUMENTO pcd
            WHERE pcd.ID_AREA = @idArea AND pcd.ID_PROVEEDOR = @idProveedor AND pcd.ID_COMPRA_ESTADO = 1
            HAVING (pcd.IMPORTE_TOTAL - ISNULL(pcd.DESCUENTO, 0) - ISNULL(pcd.IMPORTE_GIFT_CARD, 0)) -
                ISNULL((SELECT SUM(MONTO_PAGADO) FROM PLANTA_PAGO_DETALLE ppd 
                        WHERE ppd.ID_COMPRA_DOCUMENTO = pcd.ID_COMPRA_DOCUMENTO AND ppd.ESTADO = 1), 0) > 0
        `, [
            { name: 'idArea', value: idArea },
            { name: 'idProveedor', value: idProveedor }
        ]);
        return result.recordset;
    },

    async getSaldoProveedor(idArea, idProveedor) {
        const result = await query(`
            SELECT ID_PAGO_DOCUMENTO,SALDO FROM  PLANTA_PAGO_DOCUMENTO 
            WHERE ID_AREA= @idArea AND ID_PROVEEDOR=@idProveedor AND  SALDO >0 AND ESTADO=1
        `, [
            { name: 'idArea', value: idArea },
            { name: 'idProveedor', value: idProveedor }
        ]);
        return result.recordset;
    },

    async getDeudaCompra(idCompraDocumento) {
        const result = await query(`
            SELECT ISNULL(SUM(MONTO_PAGADO), 0) AS MONTO_PAGADO 
            FROM PLANTA_PAGO_DETALLE 
            WHERE ESTADO = 1 AND ID_COMPRA_DOCUMENTO = @idCompraDocumento
        `, [{ name: 'idCompraDocumento', value: idCompraDocumento }]);
        return result.recordset[0]?.MONTO_PAGADO || 0;
    },

    async getSaldoByProveedor(idProveedor, idArea) {
        const saldoResult = await query(`
            SELECT ISNULL(SUM(SALDO), 0) AS SALDO 
            FROM PLANTA_PAGO_DOCUMENTO 
            WHERE ID_AREA = @idArea AND ID_PROVEEDOR = @idProveedor AND ESTADO = 1
        `, [
            { name: 'idProveedor', value: idProveedor },
            { name: 'idArea', value: idArea }
        ]);
        const deudaResult = await query(`
            SELECT ISNULL(SUM(tb.IMPORTE_TOTAL - ISNULL(tb.MONTO_PAGADO, 0)), 0) AS DEUDA 
            FROM (
                SELECT DISTINCT pcd.ID_COMPRA_DOCUMENTO,
                    (pcd.IMPORTE_TOTAL - ISNULL(pcd.DESCUENTO, 0) - ISNULL(pcd.IMPORTE_GIFT_CARD, 0)) AS IMPORTE_TOTAL,
                    (SELECT ISNULL(SUM(MONTO_PAGADO), 0) FROM PLANTA_PAGO_DETALLE ppd 
                     WHERE ppd.ID_COMPRA_DOCUMENTO = pcd.ID_COMPRA_DOCUMENTO AND ppd.ESTADO = 1) AS MONTO_PAGADO
                FROM PLANTA_COMPRA_DOCUMENTO pcd
                WHERE pcd.ID_AREA = @idArea AND pcd.ID_PROVEEDOR = @idProveedor
            ) tb
            WHERE (tb.IMPORTE_TOTAL - ISNULL(tb.MONTO_PAGADO, 0)) > 0
        `, [
            { name: 'idProveedor', value: idProveedor },
            { name: 'idArea', value: idArea }
        ]);
        return {
            saldo: saldoResult.recordset[0]?.SALDO || 0,
            deuda: deudaResult.recordset[0]?.DEUDA || 0
        };
    },
    async guardarArchivo(id, archivoBase64, carpeta) {
        if (!archivoBase64) return null;

        const path = require('path');
        const fs = require('fs').promises;

        const buffer = Buffer.from(archivoBase64, 'base64');
        const ext = this._detectExtension(buffer);
        const nombre = `${id}.${ext}`;
        const dir = path.join(__dirname, '../../uploads/documentacion', carpeta);
        const rutaArchivo = path.join(dir, nombre);

        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(rutaArchivo, buffer);

        return {
            ruta: `/uploads/documentacion/${carpeta}/`,
            nombre
        };
    },

    _detectExtension(buffer) {
        const hex = buffer.toString('hex', 0, Math.min(buffer.length, 8)).toUpperCase();
        const sigs = {
            '89504E47': 'png',
            'FFD8FF': 'jpg',
            '47494638': 'gif',
            '25504446': 'pdf',
            '504B0304': 'zip',
            '424D': 'bmp',
            '49494433': 'mp3',
        };
        for (const [sig, ext] of Object.entries(sigs)) {
            if (hex.startsWith(sig)) return ext;
        }
        const firstBytes = buffer.toString('utf8', 0, Math.min(buffer.length, 200));
        if (firstBytes.includes('<?xml') || /<Factura|<factura|<facturaElectronica/i.test(firstBytes)) return 'xml';
        if (firstBytes.includes('<html') || firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<!doctype')) return 'html';
        if (hex.startsWith('7B5C7274')) return 'rtf';
        if (hex.startsWith('FFFB') || hex.startsWith('FFF3') || hex.startsWith('4D3468')) return 'mp3';
        if (hex.startsWith('52494646')) return 'wav';
        return 'bin';
    },
};

module.exports = PlantaHelpers;

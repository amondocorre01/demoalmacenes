const { query, getPool } = require('../../../config/database');
const InventarioHelper = require('../../../helpers/inventario.helper');
const PlantaHelpers = require('../../../helpers/planta.helper');

class ProduccionRepository {

    async generarLote(transaction = null) {
        const anio = new Date().getFullYear();
        const pool = await getPool();
        const request = pool.request();
        if (transaction) request.transaction = transaction;

        request.input('anio', anio);
        const result = await request.query(`
            MERGE PLANTA_LOTE_CONTADOR AS target
            USING (SELECT @anio AS ANIO) AS source
            ON target.ANIO = source.ANIO
            WHEN MATCHED THEN
                UPDATE SET ULTIMO_NUMERO = target.ULTIMO_NUMERO + 1
            WHEN NOT MATCHED THEN
                INSERT (ANIO, ULTIMO_NUMERO) VALUES (source.ANIO, 1);
        `);

        const request2 = pool.request();
        if (transaction) request2.transaction = transaction;
        request2.input('anio', anio);
        const numResult = await request2.query(`
            SELECT ULTIMO_NUMERO FROM PLANTA_LOTE_CONTADOR WHERE ANIO = @anio
        `);
        const numero = numResult.recordset[0]?.ULTIMO_NUMERO || 1;
        //return `LT-${anio}-${String(numero).padStart(4, '0')}`;
        return `LT-${String(numero).padStart(4, '0')}`;
    }

    async getLotesDisponibles(idAlmacen, idProductoIntermedio) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const result = await query(`
            SELECT --pai.ID_ALMACEN_INVENTARIO, 
                pai.ID_PRODUCTO_DETALLE, pai.ID_UNIDAD_MEDIDA,
                pai.FECHA_VENCIMIENTO, pai.LOTE,
                CAST(SUM(pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) as numeric(18,2)) as CANTIDAD_DISPONIBLE
            FROM PLANTA_ALMACEN_INVENTARIO pai
            WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen
            AND pai.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
            AND pai.ESTADO_INGRESO = 1
            AND pai.FECHA_VENCIMIENTO >= @fecha
            AND (pai.CANTIDAD - ISNULL(pai.CANTIDAD_UTILIZADA, 0)) > 0
            --AND pai.LOTE IS NOT NULL AND pai.LOTE <> ''
            GROUP BY pai.ID_PRODUCTO_DETALLE, pai.ID_UNIDAD_MEDIDA,pai.FECHA_VENCIMIENTO, pai.LOTE
            ORDER BY pai.FECHA_VENCIMIENTO ASC
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'fecha', value: fecha }
        ], 'planta');
        return result.recordset;
    }

    async getPrimerIntermedioConLoteo(productos) {
        const ids = productos
            .map(p => p.ID_PRODUCTO_INTERMEDIO || p.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0)
            .filter(id => id > 0);
        if (ids.length === 0) return null;
        const placeholders = ids.map((_, i) => `@id${i}`).join(',');
        const params = ids.map((id, i) => ({ name: `id${i}`, value: id }));
        const result = await query(`
            SELECT TOP 1 ID_PRODUCTO_INTERMEDIO, REQUIERE_LOTEO
            FROM PLANTA_PRODUCTO_INTERMEDIO
            WHERE ID_PRODUCTO_INTERMEDIO IN (${placeholders})
            AND REQUIERE_LOTEO = 1
        `, params, 'planta');
        return result.recordset[0] || null;
    }

    async getAreasByUsuario(idUsuario) {
        const str = '';/* `(SELECT vccb.ID_CUENTA_BANCO,vccb.DESCRIPCION,vccb.NOMBRE_BANCO,RIGHT(NUMERO_CUENTA, 4) as ULT4DIGITOS,MONEDA,TIPO,CODIGO_CONTABLE,NOMBRE_CUENTA_CONTABLE
            FROM VISTA_CONTA_CUENTA_BANCO vccb
            INNER JOIN CONTA_AREA_CUENTA_BANCO cacb ON cacb.ID_CUENTA_BANCO=vccb.ID_CUENTA_BANCO AND cacb.ESTADO=1
            WHERE cacb.ID_AREA = pa.ID_AREA AND vccb.ESTADO=1 FOR JSON AUTO) AS CUENTAS_BANCARIAS`;*/
        const result = await query(`
            SELECT pa.ID_AREA, pa.NOMBRE, pa.ESTADO, COALESCE(iu.ID_UBICACION,0) AS ID_UBICACION, pa.ESTADO_SOLICITUD ${str}
            FROM PLANTA_AREA pa
            LEFT JOIN ID_UBICACION iu ON iu.ID_UBICACION=pa.ID_UBICACION AND iu.SUCURSAL=1
            WHERE pa.ESTADO = 1 AND pa.ID_AREA IN (SELECT ID_AREA FROM PLANTA_PERMISOS_AREA WHERE ID_USUARIO=@idUsuario AND ESTADO=1)
            ORDER BY pa.NOMBRE
        `, [{ name: 'idUsuario', value: idUsuario }], 'planta');
        const data = result.recordset;
        /*data.forEach(row => {
            try { row.CUENTAS_BANCARIAS = row.CUENTAS_BANCARIAS ? JSON.parse(row.CUENTAS_BANCARIAS) : []; } catch { row.CUENTAS_BANCARIAS = []; }
        });*/
        return data;
    }

    async listAlmacen() {
        const result = await query(`
            SELECT *,
                (SELECT * FROM (
                    SELECT ID_PLANTA_RECETA_ALMACEN, pr.DESCRIPCION, 0 as ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT pra.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT ppr.* FROM VISTA_PLANTA_PRODUCTO_RECETA ppr WHERE ppr.ID_PLANTA_RECETA=pr.ID_PLANTA_RECETA ORDER BY PRODUCTO DESC FOR JSON AUTO) AS PRODUCTOS
                    FROM PLANTA_RECETA_ALMACEN pra, PLANTA_RECETA pr
                    WHERE pra.ID_PLANTA_RECETA = pr.ID_PLANTA_RECETA AND pra.ID_PLANTA_ALMACEN=ap.ID_PLANTA_ALMACEN
                    UNION
                    SELECT 0 as ID_PLANTA_RECETA_ALMACEN, NOMBRE as DESCRIPCION, ID_ALMACEN_PRODUCTO_INTERMEDIO,
                        (SELECT papi.ESTADO) as ESTADO_RECETA_ALMACEN,
                        (SELECT vpri.* FROM VISTA_PLANTA_RECETA_INTERMEDIO vpri WHERE vpri.ID_PLANTA_RI_PI=vppi.ID_PLANTA_RI_PI AND vpri.ESTADO=1 FOR JSON AUTO) as PRODUCTOS
                    FROM VISTA_PLANTA_PRODUCTO_INTERMEDIO_V2 vppi, PLANTA_ALMACEN_PRODUCTO_INTERMEDIO papi
                    WHERE papi.ID_PRODUCTO_INTERMEDIO=vppi.ID_PRODUCTO_INTERMEDIO AND papi.ID_PLANTA_ALMACEN=ap.ID_PLANTA_ALMACEN AND vppi.ESTADO=1
                ) as tb FOR JSON AUTO) as RECETAS
            FROM PLANTA_ALMACEN ap ORDER BY DESCRICION
        `, [], 'planta');
        const data = result.recordset;
        if (data) {
            data.forEach(res => {
                try { res.RECETAS = res.RECETAS ? JSON.parse(res.RECETAS) : []; } catch { res.RECETAS = []; }
                res.RECETAS.forEach(receta => {
                    try { receta.PRODUCTOS = receta.PRODUCTOS ? JSON.parse(receta.PRODUCTOS) : []; } catch { receta.PRODUCTOS = []; }
                });
            });
        }
        return data;
    }

    async getRecetaByAlmacen(idAlmacen) {
        const result = await query(`EXEC PL_GET_RECETAS_ALMACEN @idAlmacen`, [
            { name: 'idAlmacen', value: idAlmacen }
        ], 'planta');
        return result.recordset;
    }

    async getInventarioAlmacen(idAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const result = await query(`
            SELECT SUM(INV.CANTIDAD) AS CANTIDAD, ID_PRODUCTO, ID_UNIDAD_MEDIDA, ID_PRODUCTO_INTERMEDIO FROM (
                SELECT ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA, ID_PRODUCTO_INTERMEDIO,
                    CAST((CANTIDAD - CASE WHEN CANTIDAD_UTILIZADA IS NULL THEN 0 ELSE CANTIDAD_UTILIZADA END) as numeric(18,2)) as CANTIDAD
                FROM PLANTA_ALMACEN_INVENTARIO pai
                WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen AND pai.ESTADO_INGRESO = 1 AND pai.FECHA_VENCIMIENTO >= @fecha
            ) INV GROUP BY ID_PRODUCTO, ID_UNIDAD_MEDIDA, ID_PRODUCTO_INTERMEDIO
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ], 'planta');
        const inventario = {};
        result.recordset.forEach(p => {
            const idProducto = p.ID_PRODUCTO || 0;
            const idPi = p.ID_PRODUCTO_INTERMEDIO || 0;
            if (!inventario[idProducto]) inventario[idProducto] = {};
            inventario[idProducto][idPi] = p;
        });
        return inventario;
    }

    async getInventarioPFAlmacen(idAlmacen) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const result = await query(`
            SELECT ppd.ID_SUB_CATEGORIA_2, pai.ID_PRODUCTO,
                CAST(SUM(CANTIDAD - CANTIDAD_UTILIZADA) as numeric(18,2)) as CANTIDAD
            FROM VISTA_PLANTA_ALMACEN_INVENTARIO pai
            INNER JOIN PLANTA_PRODUCTO_DETALLE ppd ON ppd.ID_PRODUCTO_DETALLE = pai.ID_PRODUCTO_DETALLE AND ppd.ESTADO_PRODUCCION = 1
            WHERE pai.ID_PLANTA_ALMACEN = @idAlmacen AND pai.ESTADO_INGRESO = 1 AND pai.FECHA_VENCIMIENTO >= @fecha
            GROUP BY pai.ID_PRODUCTO, ID_SUB_CATEGORIA_2
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fecha', value: fecha }
        ], 'planta');
        const inventario = {};
        result.recordset.forEach(p => {
            const idSub2 = p.ID_SUB_CATEGORIA_2 || 0;
            const idProducto = p.ID_PRODUCTO || 0;
            if (!inventario[idSub2]) inventario[idSub2] = {};
            inventario[idSub2][idProducto] = p.CANTIDAD || 0;
        });
        return inventario;
    }

    async getProductosReceta(idReceta) {
        const result = await query(`
            SELECT pr.*, ppd.ID_PRODUCTO_DETALLE, ppd.ID_PRODUCTO, ID_UNIDAD_MEDIDA_ADECUACION as ID_UNIDAD_MEDIDA, CANTIDAD_ADECUACION,
                (SELECT * FROM PLANTA_PRODUCTO_RECETA ppr WHERE pr.ID_PLANTA_RECETA = ppr.ID_PLANTA_RECETA AND ppr.ESTADO = 1 FOR JSON AUTO) AS PRODUCTOS
            FROM PLANTA_RECETA pr
            LEFT JOIN PLANTA_PRODUCTO_DETALLE ppd ON ppd.ID_SUB_CATEGORIA_2 = pr.ID_SUB_CATEGORIA_2 AND ppd.ESTADO_PRODUCCION=1
            WHERE pr.ID_PLANTA_RECETA = @idReceta
        `, [{ name: 'idReceta', value: idReceta }], 'planta');
        const row = result.recordset[0] || null;
        if (row) {
            try { row.PRODUCTOS = row.PRODUCTOS ? JSON.parse(row.PRODUCTOS) : []; } catch { row.PRODUCTOS = []; }
        }
        return row;
    }

    async getProductosRecestaIntermedio(idAlmacen, idProductoIntermedio) {
        const result = await query(`
            SELECT ppi.*,
                (SELECT pri.ID_PRODUCTO, CANTIDAD, pri.ID_PRODUCTO_INTERMEDIO_ANTECESOR, ID_UNIDAD_MEDIDA
                 FROM PLANTA_RECETA_INTERMEDIO pri
                 WHERE pri.ID_PLANTA_RI_PI=ppi.ID_PLANTA_RI_PI AND pri.ESTADO=1 AND pri.NUM_RECETA=ppi.NUM_RECETA FOR JSON AUTO) AS PRODUCTOS
            FROM PLANTA_PRODUCTO_INTERMEDIO_V2 ppi
            WHERE ppi.ID_PRODUCTO_INTERMEDIO = @idProductoIntermedio
        `, [{ name: 'idProductoIntermedio', value: idProductoIntermedio }], 'planta');
        const row = result.recordset[0] || null;
        if (row) {
            try { row.PRODUCTOS = row.PRODUCTOS ? JSON.parse(row.PRODUCTOS) : []; } catch { row.PRODUCTOS = []; }
        }
        return row;
    }

    async getFechaVencimiento(idSub2, fecha) {
        const result = await query(`
            SELECT CONVERT(date, DATEADD(DAY, DURACION, @fecha)) as FECHA_VENCIMIENTO
            FROM INVENTARIOS_SUB_CATEGORIA_2
            WHERE ID_SUB_CATEGORIA_2 = @idSub2
        `, [
            { name: 'idSub2', value: idSub2 },
            { name: 'fecha', value: fecha }
        ], 'planta');
        return result.recordset[0]?.FECHA_VENCIMIENTO || fecha;
    }

    async getProductosProducidos(idAlmacen, fechaInicio, fechaFin) {
        const result = await query(`EXEC GET_PRODUCTOS_PRODUCIDOS @idAlmacen, @fechaInicio, @fechaFin`, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fechaInicio', value: fechaInicio },
            { name: 'fechaFin', value: fechaFin }
        ], 'planta');
        const data = result.recordset;
        data.forEach(re => {
            try { re.DETALLE = re.DETALLE ? JSON.parse(re.DETALLE) : []; } catch { re.DETALLE = []; }
        });
        return data;
    }

    async registrarEnProductoProduc(idAlmacen, idReceta, idProductoIntermedio, idSub2, cantidadP, cantidadU, cantDesperdicio, fechaHora, idUsuario, detalle, idRiPr, lote = null) {
        const result = await query(`
            INSERT INTO PLANTA_PRODUCTO_PRODUCIDO
            (ID_PLANTA_ALMACEN, ID_PLANTA_RECETA, ID_PRODUCTO_INTERMEDIO, ID_SUBCATEGORIA_2,
             CANTIDAD_PRODUCIDA, CANTIDAD_UTILIZABLE, CANTIDAD_DESPERDICIO, ESTADO,
             FECHA_REGISTRO, ID_USUARIO_REGISTRA, DETALLE, ID_PLANTA_RI_PI, LOTE)
            VALUES (@idAlmacen, @idReceta, @idProductoIntermedio, @idSub2,
                    @cantidadP, @cantidadU, @cantDesperdicio, 1,
                    @fechaHora, @idUsuario, @detalle, @idRiPr, @lote);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'idReceta', value: idReceta },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idSub2', value: idSub2 },
            { name: 'cantidadP', value: cantidadP },
            { name: 'cantidadU', value: cantidadU },
            { name: 'cantDesperdicio', value: cantDesperdicio },
            { name: 'fechaHora', value: fechaHora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'detalle', value: detalle },
            { name: 'idRiPr', value: idRiPr },
            { name: 'lote', value: lote }
        ], 'planta');
        return result.recordset[0]?.id || 0;
    }

    async registrarEnInventarioPlanta(idArea, idProductoP, idSub2, cantidad, fechaHora, fechaVen, idUsuario, idProductoDetalle, idProducto, idUnidad, estadoIngreso, idEstado, idInv, lote = null) {
        const result = await query(`
            INSERT INTO PLANTA_INVENTARIO
            (FECHA_VENCIMIENTO, CANTIDAD, ID_PRODUCTO_DETALLE, ID_PRODUCTO, ID_UNIDAD_MEDIDA,
             ID_SUB_CATEGORIA_2, ESTADO_INGRESO, FECHA_REGISTRO, USUARIO_REGISTRO,
             ID_ESTADO, ID_AREA, ID_INVENTARIO_DESC, ID_PLANTA_PRODUCTO_PRODUCIDO, LOTE)
            VALUES (@fechaVen, @cantidad, @idProductoDetalle, @idProducto, @idUnidad,
                    @idSub2, @estadoIngreso, @fechaHora, @idUsuario,
                    @idEstado, @idArea, @idInv, @idProductoP, @lote);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'fechaVen', value: fechaVen },
            { name: 'cantidad', value: cantidad },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProducto', value: idProducto },
            { name: 'idUnidad', value: idUnidad },
            { name: 'idSub2', value: idSub2 },
            { name: 'estadoIngreso', value: estadoIngreso },
            { name: 'fechaHora', value: fechaHora },
            { name: 'idUsuario', value: idUsuario },
            { name: 'idEstado', value: idEstado },
            { name: 'idArea', value: idArea },
            { name: 'idInv', value: idInv },
            { name: 'idProductoP', value: idProductoP },
            { name: 'lote', value: lote }
        ], 'planta');
        return result.recordset[0]?.id || 0;
    }

    async actualizarCantUtzPlanta(cantidad, idInv) {
        await query(`
            UPDATE PLANTA_INVENTARIO SET CANTIDAD_UTILIZADA = CANTIDAD_UTILIZADA + @cantidad WHERE ID_INVENTARIO = @idInv
        `, [
            { name: 'cantidad', value: cantidad },
            { name: 'idInv', value: idInv }
        ], 'planta');
    }

    async registrarDescuentoInvAlmacen(idAlmacen, idProducto, idProductoIntermedio, idProducido, cantidad, idUsuario, fecha, fechaHora, tipo, detalle, idProductoDetalle, imagen, prctoPrimario, lote = null) {
        if (cantidad <= 0) return;
        let str;
        if (idProductoIntermedio > 0) {
            str = `pai.ID_PRODUCTO_INTERMEDIO='${idProductoIntermedio}'`;
        } else {
            str = `pai.ID_PRODUCTO='${idProducto}'`;
            if (idProductoDetalle > 0) {
                str += ` AND pai.ID_PRODUCTO_DETALLE<>'${idProductoDetalle}'`;
            }
        }
        if (tipo === 4) {
            str += ` AND pai.ID_PLANTA_PRODUCTO_PRODUCIDO='${idProducido}'`;
        }
        if (lote) {
            str += ` AND pai.LOTE='${lote}'`;
        }
        const productoInv = await InventarioHelper.getInventarioByProducto(idAlmacen, str, fecha);
        let cantRestante = cantidad;

        for (let i = 0; i < productoInv.length && cantRestante > 0; i++) {
            const inv = productoInv[i];
            const idInvA = inv.ID_ALMACEN_INVENTARIO;
            const cantUtz = inv.CANTIDAD_UTILIZADA || 0;
            const cantInv = inv.CANTIDAD;
            const idPD = inv.ID_PRODUCTO_DETALLE;
            const idUnidadInv = inv.ID_UNIDAD_MEDIDA;
            const fechaVenInv = inv.FECHA_VENCIMIENTO;

            if (cantRestante > 0) {
                const cant = Math.min(cantInv, cantRestante);
                const nuevaCantUtz = cantUtz + cant;
                cantRestante -= cant;

                const idInvReg = await InventarioHelper.registrarEnInventarioAlmacen(
                    idAlmacen, idProducto, idProductoIntermedio, cant,
                    fechaHora, fechaVenInv, idUsuario, idUnidadInv, idProducido,
                    0, tipo, idInvA, idPD, 0
                );
                await InventarioHelper.actualizarCantUtilizada(idInvA, nuevaCantUtz, idUsuario);

                if (tipo === 4) {
                    await this.registrarDesperdicioAlmacen(idAlmacen, idUsuario, idInvReg, idPD, idProducto, idProductoIntermedio, cant, idUnidadInv, fechaHora, fechaVenInv, detalle, tipo, prctoPrimario, imagen, 0);
                }
                if (tipo === 15) {
                    await this.registrarReposicionAlmacen(idAlmacen, idUsuario, idInvReg, idPD, idProducto, idProductoIntermedio, cant, idUnidadInv, fechaHora, fechaVenInv, detalle, tipo);
                }
            }
        }

        if (cantRestante > 0 && tipo === 3) {
            await query(`
                INSERT INTO PLANTA_RECETA_PF (ID_PRODUCTO, ID_PRODUCTO_INTERMEDIO, CANTIDAD, FECHA, ID_PLANTA_ALMACEN, ID_PLANTA_PRODUCTO_PRODUCIDO, ID_UNIDAD_MEDIDA)
                VALUES (@idProducto, @idProductoIntermedio, @cantRestante, @fechaHora, @idAlmacen, @idProducido, @idUnidadMedida)
            `, [
                { name: 'idProducto', value: idProducto },
                { name: 'idProductoIntermedio', value: idProductoIntermedio || 0 },
                { name: 'cantRestante', value: cantRestante },
                { name: 'fechaHora', value: fechaHora },
                { name: 'idAlmacen', value: idAlmacen },
                { name: 'idProducido', value: idProducido },
                { name: 'idUnidadMedida', value: 0 }
            ], 'planta');
        }
    }

    async registrarDesperdicioAlmacen(idAlmacen, idUsuario, idInv, idProductoDetalle, idProducto, idProductoIntermedio, cantidad, idUnidadMedida, fechaHora, fechaVen, detalle, tipo, prctoPrimario, imagen, automatico) {

        const precioTotal = await InventarioHelper.calcularPrecioDesperdicio(idProducto, idProductoIntermedio, idProductoDetalle, cantidad) || 0;
        const result = await query(`
            INSERT INTO PLANTA_DESPERDICIO_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
             ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO, ESTADO, PRECIO_ASUMIDO_EMPRESA,
             PRECIO_ASUMIDO_EMPLEADO, ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO,
             DETALLE, ID_ESTADO, PROD_PRIMARIO, AUTOMATICO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle, @idProductoIntermedio,
                    @idUnidadMedida, @cantidad, @fechaHora, 1, 0,
                    @precioTotal, @idAlmacen, @precioTotal, @fechaVen,
                    @detalle, @tipo, @prctoPrimario, @automatico);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'precioTotal', value: precioTotal },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle || 'Ninguna' },
            { name: 'tipo', value: tipo },
            { name: 'prctoPrimario', value: prctoPrimario || 0 },
            { name: 'automatico', value: automatico || 0 }
        ], 'planta');
        const id = result.recordset[0]?.id || 0;
        if (imagen && id) {
            const uuid = require('crypto').randomUUID();
            const resp = await PlantaHelpers.guardarArchivo(uuid, imagen, 'desperdicio/almacen');
            if (resp) {
                await query(`UPDATE PLANTA_DESPERDICIO_ALMACEN SET IMAGEN = @ruta WHERE ID_PLANTA_DESPERDICIO_ALMACEN = @id`, [
                    { name: 'ruta', value: resp.ruta + resp.nombre },
                    { name: 'id', value: id }
                ], 'planta');
            }
        }
        return id;
    }

    async registrarReposicionAlmacen(idAlmacen, idUsuario, idInv, idProductoDetalle, idProducto, idProductoIntermedio, cantidad, idUnidadMedida, fechaHora, fechaVen, detalle, tipo) {
        let precio = 0;
        if (idProducto === 0) {
            precio = await InventarioHelper.getPrecioProductoIntermedio(idProductoIntermedio);
        } else {
            precio = await InventarioHelper.getPrecioProductoDetalle2(idProductoDetalle);
            if (precio === 0) precio = await InventarioHelper.getPrecioProducto(idProducto);
            if (precio === 0) precio = await InventarioHelper.getProductoConversion(idProducto);
        }
        const precioTotal = Math.round(cantidad * precio * 2) / 2;
        const result = await query(`
            INSERT INTO PLANTA_REPOSICION_ALMACEN
            (ID_USUARIO_REGISTRA, ID_ALMACEN_INVENTARIO, ID_PRODUCTO_DETALLE, ID_PRODUCTO_INTERMEDIO,
             ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO, ESTADO, PRECIO_ASUMIDO_EMPRESA,
             PRECIO_ASUMIDO_EMPLEADO, ID_PLANTA_ALMACEN, PRECIO_PRODUCTO, FECHA_VENCIMIENTO,
             DETALLE, ID_ESTADO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle, @idProductoIntermedio,
                    @idUnidadMedida, @cantidad, @fechaHora, 1, 0,
                    @precioTotal, @idAlmacen, @precioTotal, @fechaVen,
                    @detalle, @tipo);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idProductoIntermedio', value: idProductoIntermedio },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'precioTotal', value: precioTotal },
            { name: 'idAlmacen', value: idAlmacen },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle || 'Ninguna' },
            { name: 'tipo', value: tipo }
        ], 'planta');
        return result.recordset[0]?.id || 0;
    }

    async registrarDesperdicioArea(idArea, idUsuario, idInv, idProductoDetalle, idSub2, cantidad, idUnidadMedida, fechaHora, fechaVen, detalle, tipo, automatico, imagen, prctoPrimario) {
        let precio = 0;
        if (idProductoDetalle === 0) {
            precio = await this.getPrecioSubCategoria2(idSub2);
        } else {
            precio = await InventarioHelper.getPrecioProductoDetalle(idInv);
            if (precio === 0) precio = await InventarioHelper.getPrecioProductoDetalle2(idProductoDetalle);
        }
        const precioTotal = Math.round(precio * cantidad * 2) / 2;
        const result = await query(`
            INSERT INTO PLANTA_DESPERDICIO_AREA
            (ID_USUARIO_REGISTRA, ID_INVENTARIO, ID_PRODUCTO_DETALLE, ID_SUB_CATEGORIA_2,
             ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO, ESTADO, PRECIO_ASUMIDO_EMPRESA,
             PRECIO_ASUMIDO_EMPLEADO, ID_AREA, PRECIO_PRODUCTO, FECHA_VENCIMIENTO,
             DETALLE, ID_ESTADO, AUTOMATICO, PROD_PRIMARIO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle, @idSub2,
                    @idUnidadMedida, @cantidad, @fechaHora, 1, 0,
                    @precioTotal, @idArea, @precioTotal, @fechaVen,
                    @detalle, @tipo, @automatico, @prctoPrimario);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idSub2', value: idSub2 },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'precioTotal', value: precioTotal },
            { name: 'idArea', value: idArea },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle || 'Ninguna' },
            { name: 'tipo', value: tipo },
            { name: 'automatico', value: automatico || 0 },
            { name: 'prctoPrimario', value: prctoPrimario || 0 }
        ], 'planta');
        const id = result.recordset[0]?.id || 0;
        if (imagen && id) {
            const uuid = require('crypto').randomUUID();
            const resp = await PlantaHelpers.guardarArchivo(uuid, imagen, 'desperdicio/area');
            if (resp) {
                await query(`UPDATE PLANTA_DESPERDICIO_AREA SET IMAGEN = @ruta WHERE ID_PLANTA_DESPERDICIO_AREA = @id`, [
                    { name: 'ruta', value: resp.ruta + resp.nombre },
                    { name: 'id', value: id }
                ], 'planta');
            }
        }
        return id;
    }

    async registrarReposicionArea(idArea, idUsuario, idInv, idProductoDetalle, idSub2, cantidad, idUnidadMedida, fechaHora, fechaVen, detalle, tipo, precioA, usuarioAsume) {
        let precio = 0;
        if (idProductoDetalle === 0) {
            precio = await this.getPrecioSubCategoria2(idSub2);
        } else {
            precio = await InventarioHelper.getPrecioProductoDetalle(idInv);
            if (precio === 0) precio = await InventarioHelper.getPrecioProductoDetalle2(idProductoDetalle);
        }
        const precioEmpresa = precio > 0 ? Math.round((precio * cantidad - precioA) * 2) / 2 : 0;
        const precioEmpleado = Math.round(precioA * 2) / 2;
        const precioTotal = Math.round(precio * cantidad * 2) / 2;
        const result = await query(`
            INSERT INTO PLANTA_REPOSICION_AREA
            (ID_USUARIO_REGISTRA, ID_INVENTARIO, ID_PRODUCTO_DETALLE, ID_SUB_CATEGORIA_2,
             ID_UNIDAD_MEDIDA, CANTIDAD, FECHA_REGISTRO, ID_USUARIO_ASUMIDO, ESTADO,
             PRECIO_ASUMIDO_EMPRESA, PRECIO_ASUMIDO_EMPLEADO, ID_AREA, PRECIO_PRODUCTO,
             FECHA_VENCIMIENTO, DETALLE, ID_ESTADO)
            VALUES (@idUsuario, @idInv, @idProductoDetalle, @idSub2,
                    @idUnidadMedida, @cantidad, @fechaHora, @usuarioAsume, 1,
                    @precioEmpresa, @precioEmpleado, @idArea, @precioTotal,
                    @fechaVen, @detalle, @tipo);
            SELECT SCOPE_IDENTITY() as id;
        `, [
            { name: 'idUsuario', value: idUsuario },
            { name: 'idInv', value: idInv },
            { name: 'idProductoDetalle', value: idProductoDetalle },
            { name: 'idSub2', value: idSub2 },
            { name: 'idUnidadMedida', value: idUnidadMedida },
            { name: 'cantidad', value: cantidad },
            { name: 'fechaHora', value: fechaHora },
            { name: 'usuarioAsume', value: usuarioAsume },
            { name: 'precioEmpresa', value: precioEmpresa },
            { name: 'precioEmpleado', value: precioEmpleado },
            { name: 'idArea', value: idArea },
            { name: 'precioTotal', value: precioTotal },
            { name: 'fechaVen', value: fechaVen },
            { name: 'detalle', value: detalle || 'Ninguna' },
            { name: 'tipo', value: tipo }
        ], 'planta');
        return result.recordset[0]?.id || 0;
    }

    async getPrecioSubCategoria2(idSub2) {
        const result = await query(`
            SELECT TOP 1 PRECIO FROM PLANTA_PRECIO_SUB_CATEGORIA_2 WHERE ID_SUB_CATEGORIA_2 = @idSub2 AND ESTADO = 1 ORDER BY FECHA_REGISTRO DESC
        `, [{ name: 'idSub2', value: idSub2 }], 'planta');
        return result.recordset[0]?.PRECIO || 0;
    }

    async getPrecioProductoDetalle(idInv) {
        const result = await query(`
            SELECT TOP 1 PRECIO FROM PLANTA_ALMACEN_INVENTARIO WHERE ID_ALMACEN_INVENTARIO = @idInv
        `, [{ name: 'idInv', value: idInv }], 'planta');
        return result.recordset[0]?.PRECIO || 0;
    }
}

module.exports = new ProduccionRepository();

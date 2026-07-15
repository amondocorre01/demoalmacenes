const Repo = require('./verif-declaracion.repository');
const InventarioHelper = require('../../../helpers/inventario.helper');
const { AppError } = require('../../../middleware/errorHandler');
const { beginTransaction } = require('../../../config/database');

class VerifDeclaracionService {

    async listAlmacenUsuario(idUsuario, idAlmacen = 0) {
        return await InventarioHelper.listAlmacenUsuario(idUsuario, idAlmacen);
    }

    async obtenerDeclaracionAlmacen(idAlmacen, fecha) {
        const fechaAct = new Date().toISOString().slice(0, 10);
        const fechaSel = fecha || fechaAct;
        const fechaInicio = fechaSel + ' 00:00:00';
        const fechaFin = fechaSel + ' 23:59:59';

        const verif = await Repo.getUltimaVerifDeclaracion(idAlmacen);
        const estadoVerif = verif?.ESTADO_VERIFICACION || false;
        const documento = await Repo.existeDeclaracion(idAlmacen, fechaInicio, fechaFin);
        const idDocumento = documento?.ID_ALMACEN_DOCUMENTO_INVENTARIO || 0;

        let response;
        if (fechaSel < fechaAct) {
            response = await Repo.obtenerDeclaracionAlmacenDataById(idDocumento);
        } else {
            response = await Repo.obtenerDeclaracionAlmacenData(idAlmacen, idDocumento, fechaAct);
        }

        let fechaV = new Date(fechaAct);
        if (estadoVerif && verif) {
            fechaV = new Date(estadoVerif ? verif.FECHA_VERIFICACION : verif.FECHA_REGISTRO);
        }
        const fechaActual = new Date(fechaAct + ' 23:59:59');
        const diffTime = Math.abs(fechaActual - fechaV);
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (response && response.length > 0) {
            return {
                id_documento: idDocumento,
                documento,
                ulitimo_verificacion: verif,
                dias,
                productos: response
            };
        }
        return {
            id_documento: idDocumento,
            documento,
            ulitimo_verificacion: verif,
            dias,
            productos: [],
            message: 'No existen datos.'
        };
    }

    async guardarVerificacionDeclaracionAlmacen(idAlmacen, { fecha, productos }, idUsuario) {
        const fechaAct = new Date().toISOString().slice(0, 10);
        const fechaSel = fecha || fechaAct;

        this._validarDatosDeclaracion(idAlmacen, fechaSel, fechaAct, productos);

        const fechaInicio = fechaSel + ' 00:00:00';
        const fechaFin = fechaSel + ' 23:59:59';

        const verif = await Repo.getUltimaVerifDeclaracion(idAlmacen);
        const estadoVerif = verif?.ESTADO_VERIFICACION || false;

        let fechaHoraUlt = fechaAct;
        if (verif) {
            fechaHoraUlt = estadoVerif ? verif.FECHA_VERIFICACION : verif.FECHA_REGISTRO;
        }

        const documento = await Repo.existeDeclaracion(idAlmacen, fechaInicio, fechaFin);
        const idDocumento = documento?.ID_ALMACEN_DOCUMENTO_INVENTARIO || 0;
        const estadoVerifAct = documento?.ESTADO_VERIFICACION || false;

        if (estadoVerifAct) {
            throw new AppError('La declaración ya fue verificada, por lo tanto, no se pueden realizar más cambios.', 400);
        }

        const transaction = await beginTransaction();
        try {
            const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
            let idDoc = 0;

            if (idDocumento > 0) {
                await Repo.actualizarDocInvVerif(idUsuario, idDocumento, fechaHora);
            } else {
                idDoc = await Repo.registrarDocInvVerif(idUsuario, idAlmacen, fechaHora);
            }

            if (idDoc === 0 && idDocumento === 0) {
                await transaction.rollback();
                throw new AppError('Ocurrio un error al registrar el documento.', 500);
            }
            const docId = idDocumento || idDoc;
            const stocks = await Repo.getStockObjByAlmacen(idAlmacen);
            for (const producto of productos) {
                const idProducto = producto.id_producto;
                const idProductoDetalle = producto.id_producto_detalle;
                const idProductoIntermedio = producto.id_producto_intermedio;
                const cantidad = producto.cantidad;
                const cantidadAdecuacion = producto.cantidad_adecuacion;
                const observacion = producto.observacion || '';
                const stock = stocks[`${idProductoDetalle}-PD`]?.[`${idProductoIntermedio}-PI`] || 0;

                const existe = await Repo.existeProductoEnDecla(docId, idProducto, idProductoDetalle, idProductoIntermedio);
                if (existe) {
                    await Repo.actualizarDeclaInvVerif(docId, idProducto, idProductoDetalle, idProductoIntermedio, cantidad * cantidadAdecuacion, fechaHora, stock * cantidadAdecuacion, observacion);
                } else {
                    await Repo.registrarDeclaInvVerif(docId, idProducto, idProductoDetalle, idProductoIntermedio, cantidad * cantidadAdecuacion, fechaHora, stock * cantidadAdecuacion, observacion);
                }
            }

            await this._verificarDescuadreInventario(idAlmacen, docId, idUsuario, fechaAct, fechaHoraUlt);

            await transaction.commit();
            return { status: true, message: 'Se guardo correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async listarDeclaVerificadaAlmacen(idUsuario, idAlmacen) {
        const almacenes = await InventarioHelper.listAlmacenUsuario(idUsuario, idAlmacen);
        const fechaAct = new Date().toISOString().slice(0, 10);

        for (const almacen of almacenes) {
            const id = almacen.ID_PLANTA_ALMACEN;
            const verif = await Repo.getUltimaVerifDeclaracion(id);
            const estadoVerif = verif?.ESTADO_VERIFICACION || 0;
            const fechaRegistro = verif ? verif.FECHA_REGISTRO : fechaAct;
            const fechaBase = estadoVerif ? verif.FECHA_VERIFICACION : fechaRegistro;
            const fechaV = new Date(fechaBase);
            const fechaActual = new Date(fechaAct + ' 23:59:59');
            const diffTime = Math.abs(fechaActual - fechaV);
            const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            almacen.ULTIMA_VERIFICACION = verif;
            almacen.DIAS = dias;
        }

        return almacenes;
    }

    async _verificarDescuadreInventario(idAlmacen, idDoc, idUsuario, fecha, fechaHoraUlt) {
        const productos = await Repo.getProductoDescuadre(idAlmacen, idDoc, fecha, fechaHoraUlt);
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const tipo = 8;
        for (const producto of productos) {
            const idProductoIntermedio = producto.ID_PRODUCTO_INTERMEDIO;
            const idProductoDetalle = producto.ID_PRODUCTO_DETALLE;
            const idProducto = producto.ID_PRODUCTO;
            const diferencia = Math.round(producto.DIFERENCIA * 100) / 100;
            const cantUtilizada = producto.CANTIDAD_UTILIZADA;
            const prctoPrimario = producto.PROD_PRIMARIO;
            const porcentaje = producto.PORCENTAJE_DESPERDICIO;
            const duracion = producto.DURACION || 1;
            const idUnidadInv = producto.ID_UNIDAD_MEDIDA_ADECUACION || 0;
            const duracionVal = duracion || 1;
            const idProducido = 0;

            if (diferencia < 0) {
                const cant = Math.round(Math.abs(diferencia) * 100) / 100;
                const fechaVen = new Date(fecha);
                fechaVen.setDate(fechaVen.getDate() + duracionVal);
                const fechaVenStr = fechaVen.toISOString().slice(0, 10);
                await Repo.registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cant, fechaHora, fechaVenStr, idUsuario, idUnidadInv, idProducido, 1, tipo, 0, idProductoDetalle, 0);
            } else {
                const varianza = Math.round((porcentaje / 100) * cantUtilizada);
                let cantidad = diferencia;
                let cantDesperdicio = cantidad > varianza ? cantidad - varianza : 0;

                const str = idProductoIntermedio > 0
                    ? `pai.ID_PRODUCTO_INTERMEDIO='${idProductoIntermedio}'`
                    : `pai.ID_PRODUCTO='${idProducto}' AND pai.ID_PRODUCTO_DETALLE='${idProductoDetalle}'`;

                const productoInv = await Repo.getInventarioByProducto(idAlmacen, str, fecha);

                for (const inv of productoInv) {
                    if (cantidad <= 0) break;

                    const idInvA = inv.ID_ALMACEN_INVENTARIO;
                    const cantUtz = inv.CANTIDAD_UTILIZADA || 0;
                    const cantInv = inv.CANTIDAD;
                    const idPD = inv.ID_PRODUCTO_DETALLE;
                    const idUnidad = inv.ID_UNIDAD_MEDIDA;
                    const fechaVenInv = inv.FECHA_VENCIMIENTO;

                    const cant = Math.round((cantInv <= cantidad ? cantInv : cantidad) * 100) / 100;
                    const nuevaCantUtz = Math.round((cantUtz + cant) * 100) / 100;
                    cantidad = Math.round((cantidad - cant) * 100) / 100;
                    const cantDesp = Math.round((cantDesperdicio > cant ? cant : cantDesperdicio) * 100) / 100;
                    cantDesperdicio = cantDesperdicio > 0 ? Math.round((cantDesperdicio - cantDesp) * 100) / 100 : 0;

                    const idInvRg = await Repo.registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cant, fechaHora, fechaVenInv, idUsuario, idUnidadInv, idProducido, 0, tipo, idInvA, idPD, 0);
                    await Repo.actualizarCantUtilizada(idInvA, nuevaCantUtz, idUsuario);

                    if (cantDesp > 0) {
                        await Repo.registrarDesperdicio(idAlmacen, idUsuario, idInvRg, idPD, idProducto, idProductoIntermedio, cantDesp, idUnidad, fechaHora, fechaVenInv, 'descuadre de inventario.', tipo, prctoPrimario, '', 0);
                    }
                }
            }
        }
    }

    _validarDatosDeclaracion(idAlmacen, fechaSel, fechaAct, productos) {
        if (!idAlmacen || idAlmacen <= 0) {
            throw new AppError("Campo 'id_planta_almacen' no valido.", 400);
        }
        if (fechaSel !== fechaAct) {
            throw new AppError('No puedes realizar la verificación de la declaración de inventario en una fecha que no sea la actual.', 400);
        }
        if (!productos || productos.length === 0) {
            throw new AppError('Se requiere productos.', 400);
        }
        for (const producto of productos) {
            const nombrePr = producto.producto || '';
            const idProducto = producto.id_producto;
            if (idProducto === undefined || idProducto === null || isNaN(idProducto)) {
                throw new AppError(`Campo id_producto requerido en el producto: '${nombrePr}'.`, 400);
            }
            const idProductoDetalle = producto.id_producto_detalle;
            if (idProductoDetalle === undefined || idProductoDetalle === null || isNaN(idProductoDetalle)) {
                throw new AppError(`Campo id_producto_detalle requerido en el producto: '${nombrePr}'.`, 400);
            }
            const idProductoIntermedio = producto.id_producto_intermedio;
            if (idProductoIntermedio === undefined || idProductoIntermedio === null || isNaN(idProductoIntermedio)) {
                throw new AppError(`Campo id_producto_intermedio requerido en el producto: '${nombrePr}'.`, 400);
            }
            const cantidad = producto.cantidad;
            if (cantidad === undefined || cantidad === null || isNaN(cantidad)) {
                throw new AppError(`Campo cantidad no valida en el producto: '${nombrePr}'.`, 400);
            }
            const cantidadAdecuacion = producto.cantidad_adecuacion;
            if (cantidadAdecuacion === undefined || cantidadAdecuacion === null || isNaN(cantidadAdecuacion) || cantidadAdecuacion === 0) {
                throw new AppError(`Campo cantidad_adecuacion no valida en el producto: '${nombrePr}'.`, 400);
            }
        }
    }
}

module.exports = new VerifDeclaracionService();

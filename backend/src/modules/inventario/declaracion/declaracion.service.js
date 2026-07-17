const Repo = require('./declaracion.repository');
const InventarioHelper = require('../../../helpers/inventario.helper');
const { AppError } = require('../../../middleware/errorHandler');
const { beginTransaction } = require('../../../config/database');

class DeclaracionService {

    async listAlmacenUsuario(idUsuario, idAlmacen = 0) {
        return await InventarioHelper.listAlmacenUsuario(idUsuario, idAlmacen);
    }

    async obtenerDeclaracionAlmacen(idAlmacen, fecha) {
        const fechaAct = new Date().toLocaleDateString('en-CA');
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

    async guardarDeclaracionAlmacen(idAlmacen, { fecha, productos }, idUsuario) {
        const fechaAct = new Date().toLocaleDateString('en-CA');
        const fechaSel = fecha || fechaAct;

        this._validarDatosDeclaracion(idAlmacen, fechaSel, fechaAct, productos);

        const fechaInicio = fechaSel + ' 00:00:00';
        const fechaFin = fechaSel + ' 23:59:59';

        const documento = await Repo.existeDeclaracion(idAlmacen, fechaInicio, fechaFin);
        const idDocumento = documento?.ID_ALMACEN_DOCUMENTO_INVENTARIO || 0;
        const estadoVerifAct = documento?.ESTADO_VERIFICACION || false;

        if (estadoVerifAct) {
            throw new AppError('La declaración ya fue verificada, por lo tanto, no se pueden realizar más cambios.', 400);
        }

        const transaction = await beginTransaction();
        try {
            const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
            let idDoc = 0;

            if (idDocumento > 0) {
                await Repo.actualizarDocInv(idUsuario, idDocumento, fechaHora);
            } else {
                idDoc = await Repo.registrarDocInv(idUsuario, idAlmacen, fechaHora);
            }

            if (idDoc === 0 && idDocumento === 0) {
                await transaction.rollback();
                throw new AppError('Ocurrio un error al registrar el documento.', 500);
            }

            const docId = idDocumento || idDoc;

            for (const producto of productos) {
                const idProducto = producto.id_producto || 0;
                const idProductoDetalle = producto.id_producto_detalle || 0;
                const idProductoIntermedio = producto.id_producto_intermedio || 0;
                const cantidad = producto.cantidad || 0;
                const cantidadAdecuacion = producto.cantidad_adecuacion || 1;
                const observacion = producto.observacion || '';

                const existe = await Repo.existeProductoEnDecla(docId, idProducto, idProductoDetalle, idProductoIntermedio);
                if (existe) {
                    await Repo.actualizarDeclaInv(docId, idProducto, idProductoDetalle, idProductoIntermedio, cantidad * cantidadAdecuacion, fechaHora, observacion);
                } else {
                    await Repo.registrarDeclaInv(docId, idProducto, idProductoDetalle, idProductoIntermedio, cantidad * cantidadAdecuacion, fechaHora, observacion);
                }
            }

            await transaction.commit();
            return { status: true, message: 'Se guardo correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    _validarDatosDeclaracion(idAlmacen, fechaSel, fechaAct, productos) {
        if (!idAlmacen || idAlmacen <= 0) {
            throw new AppError("Campo 'id_planta_almacen' no valido.", 400);
        }
        if (fechaSel !== fechaAct) {
            throw new AppError('No puedes realizar la declaración de inventario en una fecha que no sea la actual.', 400);
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

module.exports = new DeclaracionService();

const Repo = require('./declaracion.repository');
const InventarioHelper = require('../../../helpers/inventario.helper');
const { AppError } = require('../../../middleware/errorHandler');

class DeclaracionService {

    async listAlmacenUsuario(idUsuario, idAlmacen = 0) {
        return await InventarioHelper.listAlmacenUsuario(idUsuario, idAlmacen);
    }

    async obtenerDeclaracionAlmacen(idAlmacen, fecha) {
        const fechaAct = new Date().toISOString().slice(0, 10);
        const fechaSel = fecha || fechaAct;
        const fechaInicio = fechaSel + ' 00:00:00';
        const fechaFin = fechaSel + ' 23:59:59';

        const verif = await Repo.getUltimaVerifDeclaracion(idAlmacen);
        const estadoVerif = verif?.ESTADO_VERIFICACION || 0;
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
        const fechaAct = new Date().toISOString().slice(0, 10);
        const fechaSel = fecha || fechaAct;
        const fechaInicio = fechaSel + ' 00:00:00';
        const fechaFin = fechaSel + ' 23:59:59';

        const documento = await Repo.existeDeclaracion(idAlmacen, fechaInicio, fechaFin);
        const idDocumento = documento?.ID_ALMACEN_DOCUMENTO_INVENTARIO || 0;
        const estadoVerifAct = documento?.ESTADO_VERIFICACION || 0;

        if (estadoVerifAct === 1) {
            throw new AppError('La declaración ya fue verificada, por lo tanto, no se pueden realizar más cambios.', 400);
        }

        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let idDoc = 0;

        if (idDocumento > 0) {
            await Repo.actualizarDocInv(idUsuario, idDocumento, fechaHora);
        } else {
            idDoc = await Repo.registrarDocInv(idUsuario, idAlmacen, fechaHora);
        }

        if (idDoc === 0 && idDocumento === 0) {
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

        return { status: true, message: 'Se guardo correctamente la información.' };
    }
}

module.exports = new DeclaracionService();

const Repo = require('./reportes.repository');
const InventarioHelper = require('../../../helpers/inventario.helper');
const { AppError } = require('../../../middleware/errorHandler');

class ReportesService {

    async listAlmacenUsuario(idUsuario, idAlmacen = 0) {
        return await InventarioHelper.listAlmacenUsuario(idUsuario, idAlmacen);
    }

    async listInventarioAlmacen(idAlmacen, tipoGroup = 1) {
        const fecha = new Date().toISOString().slice(0, 10);
        const productos = await Repo.getInventarioAlmacen(idAlmacen, tipoGroup, fecha);
        if (!productos || productos.length === 0) {
            throw new AppError('No existen productos en inventario.', 404);
        }
        return productos;
    }

    async listarProductosAlmacen(idAlmacen) {
        const productos = await Repo.getProductosPlanta(idAlmacen);
        if (!productos || productos.length === 0) {
            throw new AppError('No existen productos.', 404);
        }
        return productos;
    }

    async listarProductosEspeciales(idAlmacen) {
        const productos = await Repo.getProductosEspeciales(idAlmacen);
        if (!productos || productos.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        return productos;
    }

    async depreciarProducto(idAlmacen, { id_producto_salida, id_producto_ingreso, cantidad_salida, cantidad_ingreso }, idUsuario) {
        const fecha = new Date().toISOString().slice(0, 10);
        const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const productoSalida = await Repo.getProductoData(id_producto_salida);
        const productoIngreso = await Repo.getProductoData(id_producto_ingreso);

        if (!productoSalida || !productoIngreso) {
            throw new AppError('Producto no encontrado.', 404);
        }

        const detalleSalida = productoSalida.DETALLE || [];
        const detalleIngreso = productoIngreso.DETALLE || [];

        const idUnidadMedidaSalida = detalleSalida[0]?.ID_UNIDAD_MEDIDA_ADECUACION || 0;
        const idUnidadMedidaIngreso = detalleIngreso[0]?.ID_UNIDAD_MEDIDA_ADECUACION || 0;
        const idProductoDetalleI = detalleIngreso[0]?.ID_PRODUCTO_DETALLE || 0;
        const duracion = detalleIngreso[0]?.DURACION || 0;

        const transaction = await require('../../../config/database').beginTransaction();
        try {
            const str = `pai.ID_PRODUCTO = ${id_producto_salida}`;
            const productoInv = await Repo.getInventarioByProducto(idAlmacen, str, fecha);

            const idConversion = await Repo.registrarProductoConversion(
                idAlmacen, id_producto_ingreso, id_producto_salida,
                cantidad_ingreso, cantidad_salida, idUnidadMedidaIngreso, idUnidadMedidaSalida,
                idUsuario, fechaHora
            );

            await Repo.registrarInventarioProducto(
                idAlmacen, id_producto_ingreso, cantidad_ingreso, fechaHora,
                duracion, fecha, idUsuario, idProductoDetalleI, idUnidadMedidaIngreso, idConversion
            );

            let cantRestante = cantidad_salida;
            for (const inv of productoInv) {
                if (cantRestante <= 0) break;

                const idInvA = inv.ID_ALMACEN_INVENTARIO;
                const cantUtz = inv.CANTIDAD_UTILIZADA || 0;
                const cantInv = inv.CANTIDAD;
                const idPD = inv.ID_PRODUCTO_DETALLE;
                const idUnidadInv = inv.ID_UNIDAD_MEDIDA;
                const fechaVenInv = inv.FECHA_VENCIMIENTO;

                const cant = cantInv <= cantRestante ? cantInv : cantRestante;
                const nuevaCantUtz = cantUtz + cant;
                cantRestante = parseInt(cantRestante) - cant;

                await Repo.registrarDescuentoConversion(
                    idAlmacen, id_producto_salida, cant, fechaVenInv,
                    idUsuario, idInvA, idPD, idUnidadInv, idConversion
                );
                await Repo.actualizarCantUtilizada(idInvA, nuevaCantUtz, idUsuario);
            }

            await transaction.commit();
            return { status: true, message: 'Se registro correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async listarProductosDepreciados(idAlmacen, fechaInicio, fechaFin) {
        const productos = await Repo.listarProductosDepreciados(idAlmacen, fechaInicio, fechaFin);
        if (!productos || productos.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        return productos;
    }
}

module.exports = new ReportesService();

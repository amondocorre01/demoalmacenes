const { beginTransaction } = require('../../config/database');
const Repo = require('./pedidos.repository');

class PedidosService {

    async listAlmacenUsuario(idUsuario) {
        const almacenes = await Repo.listAlmacenUsuario(idUsuario, 0);
        if (!almacenes || almacenes.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, almacenes };
    }

    async getProductosPlantaAlmacen(idUsuario, idArea, idPlantaAlmacen) {
        const productos = await Repo.getProductosPlantaAlmacen(idArea, idPlantaAlmacen);
        const inventario = await Repo.getInventarioPlantaData(idArea, 0);
        for (const producto of productos) {
            const idProducto = producto.ID_PRODUCTO_DETALLE || 0;
            producto.STOCK = inventario[idProducto] || 0;
        }
        if (!productos || productos.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, productos };
    }

    async getInventarioPlanta(idArea, idDocumento) {
        const inv = await Repo.getInventarioPlantaData(idArea, idDocumento);
        if (!inv || Object.keys(inv).length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, inventario: inv };
    }

    async enviarSolicitudAlmacen(idUsuario, idPlantaAlmacen, idArea, fechaEntrega, productos) {
        const stockCheck = await Repo.verificarStockDisponible(idArea, productos, 0);
        if (stockCheck.length > 0) {
            return {
                status: false,
                message: 'La cantidad de pedido de los siguientes productos supera el STOCK de inventario.',
                data: stockCheck
            };
        }
        const transaction = await beginTransaction();
        try {
            const result = await Repo.guardarSolicitud(1, idPlantaAlmacen, idUsuario, fechaEntrega, productos, idArea, transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrio un error.' };
        }
    }

    async editarSolicitudAlmacen(idUsuario, idDocumento, idArea, productos) {
        const stockCheck = await Repo.verificarStockDisponible(idArea, productos, idDocumento);
        if (stockCheck.length > 0) {
            return {
                status: false,
                message: 'La cantidad de pedido de los siguientes productos supera el STOCK de inventario.',
                data: stockCheck
            };
        }
        const transaction = await beginTransaction();
        try {
            const result = await Repo.editarSolicitudAlmacen(idDocumento, idUsuario, productos, transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrio un error.' };
        }
    }

    async listPedidosAlmacen(idUsuario, idPlantaAlmacen, almacenes, fechaInicio, fechaFin) {
        let almacenesArray = almacenes;
        if (!almacenesArray || almacenesArray.length === 0) {
            const res = await Repo.listAlmacenUsuario(idUsuario, 0);
            almacenesArray = res.map(a => a.ID_PLANTA_ALMACEN);
        }
        const idsAlmacen = almacenesArray.join(',');
        const pedidos = await Repo.listPedidosAlmacen(idPlantaAlmacen, idsAlmacen, fechaInicio, fechaFin);
        if (!pedidos || pedidos.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, pedidos };
    }

    async getPermisosReporte(idVentasAcceso, idUsuario) {
        const permisos = await Repo.getPermisosReporte(idVentasAcceso, idUsuario);
        if (!permisos || permisos.length === 0) {
            return { status: false };
        }
        return { status: true, permisos };
    }
}

module.exports = new PedidosService();

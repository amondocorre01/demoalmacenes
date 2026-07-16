const { beginTransaction } = require('../../../config/database');
const Repo = require('./ajustes.repository');

class AjustesService {

    async listarProductosStockAlmacen(idPlantaAlmacen) {
        return await Repo.listarProductosStockAlmacen(idPlantaAlmacen);
    }

    async agregarStock(data, idUsuario) {
        const { id_planta_almacen, productos } = data;
        const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const transaction = await beginTransaction();
        try {
            for (const producto of productos) {
                await Repo.registrarEnInventarioAlmacen({
                    idAlmacen: id_planta_almacen,
                    idProducto: producto.id_producto || 0,
                    idIntermedio: producto.id_producto_intermedio || 0,
                    cantidad: producto.cantidad,
                    fechaHora,
                    fechaVen: producto.fecha_vencimiento,
                    idUsuario,
                    idUnidadMedida: producto.id_unidad_medida,
                    idProducido: 0,
                    ingreso: 1,
                    estado: 9,
                    idInvA: 0,
                    idPD: producto.id_producto_detalle || 0,
                    idDetalleDevol: 0
                }, transaction);
            }
            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async descontarStock(data, idUsuario) {
        const { id_planta_almacen, productos } = data;
        const fecha = new Date().toISOString().split('T')[0];
        const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const transaction = await beginTransaction();
        try {
            for (const producto of productos) {
                const { cantidad, id_producto, id_producto_detalle, id_producto_intermedio } = producto;
                const detalle = producto.detalle || 'descuento manual.';
                const tipo = 9;

                const inventario = await Repo.getInventarioByProducto(
                    id_planta_almacen, id_producto, id_producto_detalle, id_producto_intermedio, fecha
                );
                let cantidadRestante = cantidad;

                for (let i = 0; i < inventario.length && cantidadRestante > 0; i++) {
                    const inv = inventario[i];
                    const cantInv = inv.CANTIDAD;
                    const cantUtz = (inv.CANTIDAD_UTILIZADA || 0);
                    const cant = Math.min(cantInv, cantidadRestante);
                    const nuevaCantUtz = cantUtz + cant;
                    cantidadRestante -= cant;

                    const idInvReg = await Repo.registrarEnInventarioAlmacen({
                        idAlmacen: id_planta_almacen,
                        idProducto: id_producto,
                        idIntermedio: id_producto_intermedio,
                        cantidad: cant,
                        fechaHora,
                        fechaVen: inv.FECHA_VENCIMIENTO,
                        idUsuario,
                        idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                        idProducido: 0,
                        ingreso: 0,
                        estado: tipo,
                        idInvA: inv.ID_ALMACEN_INVENTARIO,
                        idPD: inv.ID_PRODUCTO_DETALLE,
                        idDetalleDevol: 0
                    }, transaction);

                    await Repo.actualizarCantUtilizada(inv.ID_ALMACEN_INVENTARIO, nuevaCantUtz, idUsuario, transaction);

                    await Repo.registrarDesperdicioAlmacen({
                        idAlmacen: id_planta_almacen,
                        idUsuario,
                        idInv: idInvReg,
                        idProductoDetalle: inv.ID_PRODUCTO_DETALLE,
                        idProducto: id_producto,
                        idProductoIntermedio: id_producto_intermedio,
                        cantidad: cant,
                        idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                        fechaHora,
                        fechaVen: inv.FECHA_VENCIMIENTO,
                        detalle,
                        tipo,
                        prctoPrimario: 0
                    }, transaction);
                }
            }
            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async listarProductosAgregados(idPlantaAlmacen, fechaInicio, fechaFin) {
        const fi = `${fechaInicio} 00:00:00`;
        const ff = fechaFin ? `${fechaFin} 23:59:59` : `${fechaInicio} 23:59:59`;
        return await Repo.listarProductosAjustes(idPlantaAlmacen, 1, fi, ff);
    }

    async listarProductosDescontados(idPlantaAlmacen, fechaInicio, fechaFin) {
        const fi = `${fechaInicio} 00:00:00`;
        const ff = fechaFin ? `${fechaFin} 23:59:59` : `${fechaInicio} 23:59:59`;
        return await Repo.listarProductosAjustes(idPlantaAlmacen, 0, fi, ff);
    }

    async validarStockDisponible(idPlantaAlmacen, productos) {
        const insuficientes = [];
        for (const producto of productos) {
            const stock = await Repo.getStockProductoAlmacen(
                idPlantaAlmacen,
                producto.id_producto || 0,
                producto.id_producto_detalle || 0,
                producto.id_producto_intermedio || 0
            );
            if (stock < producto.cantidad) {
                insuficientes.push({
                    id_producto: producto.id_producto || 0,
                    id_producto_detalle: producto.id_producto_detalle || 0,
                    id_producto_intermedio: producto.id_producto_intermedio || 0,
                    cantidad: producto.cantidad,
                    stock,
                    producto: producto.producto || ''
                });
            }
        }
        if (insuficientes.length > 0) {
            const err = new Error('No cuenta con suficiente stock en los siguientes productos.');
            err.status = 400;
            err.productos = insuficientes;
            throw err;
        }
    }
}

module.exports = new AjustesService();

const { beginTransaction } = require('../../config/database');
const Repo = require('./transferencia.repository');

class TransferenciaService {

    async listAlmacenUsuario(idUsuario) {
        return await Repo.listAlmacenUsuario(idUsuario);
    }

    async listAlmacenActivos() {
        return await Repo.listAlmacenActivos();
    }

    async listarProductosIntermedioStock(idPlantaAlmacen) {
        const fecha = new Date().toISOString().split('T')[0];
        const productos = await Repo.listarProdIntAlmacenData(idPlantaAlmacen);
        for (const producto of productos) {
            const res = await Repo.getStockByProductoIntermedio(
                idPlantaAlmacen, producto.ID_PRODUCTO_INTERMEDIO, fecha
            );
            const stock = res[0] || { CANTIDAD: 0, CANTIDAD_ADECUACION: 1 };
            producto.STOCK = stock.CANTIDAD / stock.CANTIDAD_ADECUACION;
        }
        return productos;
    }

    async listarProductosInsumoStock(idPlantaAlmacen) {
        const fecha = new Date().toISOString().split('T')[0];
        return await Repo.listarProductosInsumoStock(idPlantaAlmacen, fecha);
    }

    async listarTransferenciasProductos(idPlantaAlmacen, fechaInicio, fechaFin) {
        const fi = `${fechaInicio} 00:00:00`;
        const ff = `${fechaFin} 23:59:59`;
        const results = await Repo.listarTransferenciasProductos(idPlantaAlmacen, fi, ff);
        results.forEach(r => {
            try { r.DETALLE = r.DETALLE ? JSON.parse(r.DETALLE) : []; } catch { r.DETALLE = []; }
        });
        return results;
    }

    async listarTransferenciasInsumos(idPlantaAlmacen, fechaInicio, fechaFin) {
        const fi = `${fechaInicio} 00:00:00`;
        const ff = `${fechaFin} 23:59:59`;
        const results = await Repo.listarTransferenciasInsumos(idPlantaAlmacen, fi, ff);
        results.forEach(r => {
            try { r.DETALLE = r.DETALLE ? JSON.parse(r.DETALLE) : []; } catch { r.DETALLE = []; }
        });
        return results;
    }

    async registrarTransferencia(data, idUsuario) {
        const {
            id_planta_almacen,
            id_planta_almacen_destino,
            productos
        } = data;

        if (id_planta_almacen === id_planta_almacen_destino) {
            throw Object.assign(new Error('El almacén origen y destino es el mismo.'), { status: 400 });
        }

        const fecha = new Date().toISOString().split('T')[0];
        const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Validar stock
        await this._validarStockTransferencia(id_planta_almacen, productos, fecha);

        const transaction = await beginTransaction();
        try {
            // Documento salida (ENVIO=1)
            const idDocSal = await Repo.registraTransfDoc(
                id_planta_almacen, id_planta_almacen_destino, idUsuario, fechaHora, 1, 0, transaction
            );
            if (!idDocSal) throw new Error('Error al registrar documento de salida');

            // Documento entrada (ENVIO=0, vinculado a salida)
            const idDocIn = await Repo.registraTransfDoc(
                id_planta_almacen_destino, id_planta_almacen, idUsuario, fechaHora, 0, idDocSal, transaction
            );
            if (!idDocIn) throw new Error('Error al registrar documento de entrada');

            for (const producto of productos) {
                const idProductoDetalle = producto.id_producto_detalle || 0;
                const idProductoIntermedio = producto.id_producto_intermedio || 0;
                const cantAdecuacion = parseInt(producto.cantidad_adecuacion) || 1;
                const cantidadSolicitada = Math.floor(parseFloat(producto.cantidad) * cantAdecuacion);
                const campo = idProductoIntermedio > 0 ? 'ID_PRODUCTO_INTERMEDIO' : 'ID_PRODUCTO_DETALLE';
                const idProd = idProductoIntermedio > 0 ? idProductoIntermedio : idProductoDetalle;

                const inventario = await Repo.getInventarioByProducto(id_planta_almacen, campo, idProd, fecha);
                let cantidad = cantidadSolicitada;

                for (let i = 0; i < inventario.length && cantidad > 0; i++) {
                    const inv = inventario[i];
                    const cantInv = inv.CANTIDAD;
                    const cantUtz = (inv.CANTIDAD_UTILIZADA || 0) + Math.min(cantInv, cantidad);
                    const cant = Math.min(cantInv, cantidad);
                    cantidad -= cant;

                    // Salida de inventario origen
                    const idInvSal = await Repo.registrarEnInventarioAlmacen({
                        idAlmacen: id_planta_almacen,
                        idProducto: inv.ID_PRODUCTO,
                        idIntermedio: idProductoIntermedio,
                        cantidad: cant,
                        fechaHora,
                        fechaVen: inv.FECHA_VENCIMIENTO,
                        idUsuario,
                        idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                        idProducido: 0,
                        ingreso: 0,
                        estado: 4,
                        idInvA: inv.ID_ALMACEN_INVENTARIO,
                        idPD: idProductoDetalle,
                        idDetalleDevol: 0
                    }, transaction);

                    await Repo.actualizarCantUtilizada(inv.ID_ALMACEN_INVENTARIO, cantUtz, idUsuario, transaction);
                    await Repo.registraTransfdetalle(idDocSal, idProductoDetalle, idProductoIntermedio, idInvSal, cant, fechaHora, transaction);

                    // Entrada de inventario destino
                    const idInvReg = await Repo.registrarEnInventarioAlmacen({
                        idAlmacen: id_planta_almacen_destino,
                        idProducto: inv.ID_PRODUCTO,
                        idIntermedio: idProductoIntermedio,
                        cantidad: cant,
                        fechaHora,
                        fechaVen: inv.FECHA_VENCIMIENTO,
                        idUsuario,
                        idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                        idProducido: 0,
                        ingreso: 1,
                        estado: 1,
                        idInvA: 0,
                        idPD: idProductoDetalle,
                        idDetalleDevol: 0
                    }, transaction);

                    await Repo.registraTransfdetalle(idDocIn, idProductoDetalle, idProductoIntermedio, idInvReg, cant, fechaHora, transaction);
                }
            }

            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _validarStockTransferencia(idPlantaAlmacen, productos, fecha) {
        const insuficientes = [];
        for (const producto of productos) {
            const idProductoIntermedio = producto.id_producto_intermedio || 0;
            const idProductoDetalle = producto.id_producto_detalle || 0;
            const cantAdecuacion = parseInt(producto.cantidad_adecuacion) || 1;
            const cantidadSolicitada = parseFloat(producto.cantidad) || 0;
            let stock = 0;

            if (idProductoIntermedio) {
                const res = await Repo.getStockByProductoIntermedio(idPlantaAlmacen, idProductoIntermedio, fecha);
                stock = res[0]?.CANTIDAD / res[0]?.CANTIDAD_ADECUACION || 0;
            } else if (idProductoDetalle) {
                stock = await Repo.getStockByProductoInsumo(idPlantaAlmacen, idProductoDetalle, fecha, cantAdecuacion);
            }

            if (stock < cantidadSolicitada) {
                insuficientes.push({
                    id_producto_intermedio: idProductoIntermedio,
                    id_producto_detalle: idProductoDetalle,
                    cantidad: cantidadSolicitada,
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

module.exports = new TransferenciaService();

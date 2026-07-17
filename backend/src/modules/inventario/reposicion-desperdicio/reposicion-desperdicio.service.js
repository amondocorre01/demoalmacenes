const { beginTransaction } = require('../../../config/database');
const Repo = require('./reposicion-desperdicio.repository');
const PlantaHelpers = require('../../../helpers/planta.helper');

class ReposicionDesperdicioService {

    _getFechaHora() {
        return new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
    }

    _getFecha() {
        return new Date().toLocaleDateString('en-CA');
    }

    async _getIdsAlmacen(idUsuario, almacenes) {
        if (almacenes && almacenes.length > 0) return almacenes;
        const res = await Repo.listAlmacenUsuario(idUsuario);
        return res.map(a => a.ID_PLANTA_ALMACEN);
    }

    // ── Desperdicios ──

    async listarDesperdicios(idUsuario, data) {
        const { almacenes = [], fecha_inicio, fecha_fin, id_estado = 0 } = data;
        const ids = await this._getIdsAlmacen(idUsuario, almacenes);
        const idsStr = ids.join(',');
        const fi = fecha_inicio ? `${fecha_inicio} 00:00:00` : `${this._getFecha()} 00:00:00`;
        const ff = fecha_fin ? `${fecha_fin} 23:59:59` : (fecha_inicio ? `${fecha_inicio} 23:59:59` : `${this._getFecha()} 23:59:59`);
        const result = await Repo.listarDesperdicios(idsStr, fi, ff, id_estado);
        result.forEach(r => {
            try { r.USUARIOS = r.USUARIOS ? JSON.parse(r.USUARIOS) : []; } catch { r.USUARIOS = []; }
        });
        return result;
    }

    async asignarResponsableDesperdicio(data, idUsuario) {
        const { id_desperdicio_alamcen, id_usuario } = data;
        if (!id_desperdicio_alamcen || !(await Repo.existeDespAlmacen(id_desperdicio_alamcen))) {
            throw Object.assign(new Error('No se encontró el desperdicio.'), { status: 400 });
        }
        return await Repo.asignarResponsableDesperdicio(idUsuario, id_usuario, id_desperdicio_alamcen);
    }

    // ── Productos vencidos ──

    async getProductosVencidos(idUsuario, data) {
        const { almacenes = [], fecha } = data;
        const ids = await this._getIdsAlmacen(idUsuario, almacenes);
        const idsStr = ids.join(',');
        const f = fecha || this._getFecha();
        return await Repo.getProductosVencidos(idsStr, f);
    }

    async getProductosVencidosGroup(idUsuario) {
        const fecha = this._getFecha();
        return await Repo.getProductosVencidosGroup(idUsuario, fecha);
    }

    // ── Productos con stock ──

    async getProductosAlmacenStock(idAlmacen) {
        return await Repo.getProductosAlmacenStock(idAlmacen);
    }

    // ── Desperdiciar productos vencidos ──

    async desperdiciarProductosVencidos(idUsuario, data) {
        const { almacenes = [], fecha } = data;
        const fechaActual = this._getFecha();
        const hora = new Date().toTimeString().substring(0, 8);

        if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw Object.assign(new Error('Fecha no válida.'), { status: 400 });
        }
        if (fecha === fechaActual && hora <= '15:00:00') {
            throw Object.assign(new Error(`No se puede hacer aún el desperdicio de la fecha: ${fecha}.`), { status: 400 });
        }

        const ids = await this._getIdsAlmacen(idUsuario, almacenes);
        const idsStr = ids.join(',');
        const productos = await Repo.getProductosVencidos(idsStr, fecha);
        const fechaHora = this._getFechaHora();

        const transaction = await beginTransaction();
        try {
            for (const producto of productos) {
                const cantidad = (producto.CANTIDAD || 0) * (producto.CANTIDAD_ADECUACION || 1);
                await this._descuentoInvAlmacen({
                    idAlmacen: producto.ID_PLANTA_ALMACEN,
                    idProducto: producto.ID_PRODUCTO,
                    idProductoDetalle: producto.ID_PRODUCTO_DETALLE,
                    idProductoIntermedio: producto.ID_PRODUCTO_INTERMEDIO,
                    cantidad,
                    idUsuario,
                    fecha: producto.FECHA_VENCIMIENTO,
                    fechaHora,
                    tipo: 12,
                    prctoPrimario: producto.PROD_PRIMARIO || 0,
                    detalle: 'Desperdicio por vencimiento.',
                    imagen: '',
                    conFechaVencimiento: true,
                    transaction
                });
            }
            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // ── Desperdiciar productos ──

    async desperdiciarProductos(data, idUsuario) {
        const { id_almacen, productos } = data;
        const productosF = [];
        const fecha = this._getFecha();

        for (const producto of productos) {
            const stock = await Repo.getStockProductoAlmacenFecha(
                id_almacen, producto.ID_PRODUCTO, producto.ID_PRODUCTO_DETALLE,
                producto.ID_PRODUCTO_INTERMEDIO, producto.FECHA_VENCIMIENTO
            );
            const cantidad = producto.CANTIDAD || 0;
            const adec = producto.CANTIDAD_ADECUACION || 0;
            if ((cantidad * adec) > stock) {
                productosF.push({
                    ID_PRODUCTO_DETALLE: producto.ID_PRODUCTO_DETALLE,
                    ID_PRODUCTO: producto.ID_PRODUCTO,
                    ID_PRODUCTO_INTERMEDIO: producto.ID_PRODUCTO_INTERMEDIO,
                    PRODUCTO: producto.PRODUCTO,
                    FECHA_VENCIMIENTO: producto.FECHA_VENCIMIENTO,
                    CANTIDAD: producto.CANTIDAD,
                    STOCK: Math.round(stock / adec * 100) / 100
                });
            }
        }
        if (productosF.length > 0) {
            const err = new Error('No cuenta con suficiente stock en los siguientes productos.');
            err.status = 400;
            err.productos = productosF;
            throw err;
        }

        const fechaHora = this._getFechaHora();
        const transaction = await beginTransaction();
        try {
            for (const producto of productos) {
                const cantidad = (producto.CANTIDAD || 0) * (producto.CANTIDAD_ADECUACION || 1);
                await this._descuentoInvAlmacen({
                    idAlmacen: id_almacen,
                    idProducto: producto.ID_PRODUCTO,
                    idProductoDetalle: producto.ID_PRODUCTO_DETALLE,
                    idProductoIntermedio: producto.ID_PRODUCTO_INTERMEDIO,
                    cantidad,
                    idUsuario,
                    fecha: producto.FECHA_VENCIMIENTO,
                    fechaHora,
                    tipo: 14,
                    prctoPrimario: producto.PROD_PRIMARIO || 0,
                    detalle: producto.DETALLE || '',
                    imagen: producto.IMAGEN || '',
                    conFechaVencimiento: true,
                    transaction
                });
            }
            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // ── Registrar reposición ──

    async registrarReposicion(data, idUsuario) {
        const { id_almacen, productos } = data;
        const productosF = [];

        for (const producto of productos) {
            const stock = await Repo.getStockProductoAlmacenFecha(
                id_almacen, producto.ID_PRODUCTO, producto.ID_PRODUCTO_DETALLE,
                producto.ID_PRODUCTO_INTERMEDIO, producto.FECHA_VENCIMIENTO
            );
            const cantidad = producto.CANTIDAD || 0;
            const adec = producto.CANTIDAD_ADECUACION || 0;
            if ((cantidad * adec) > stock) {
                productosF.push({
                    ID_PRODUCTO_DETALLE: producto.ID_PRODUCTO_DETALLE,
                    ID_PRODUCTO: producto.ID_PRODUCTO,
                    ID_PRODUCTO_INTERMEDIO: producto.ID_PRODUCTO_INTERMEDIO,
                    PRODUCTO: producto.PRODUCTO,
                    FECHA_VENCIMIENTO: producto.FECHA_VENCIMIENTO,
                    CANTIDAD: producto.CANTIDAD,
                    STOCK: Math.round(stock / adec * 100) / 100
                });
            }
        }
        if (productosF.length > 0) {
            const err = new Error('No cuenta con suficiente stock en los siguientes productos.');
            err.status = 400;
            err.productos = productosF;
            throw err;
        }

        const fechaHora = this._getFechaHora();
        const transaction = await beginTransaction();
        try {
            for (const producto of productos) {
                const cantidad = (producto.CANTIDAD || 0) * (producto.CANTIDAD_ADECUACION || 1);
                await this._descuentoInvAlmacen({
                    idAlmacen: id_almacen,
                    idProducto: producto.ID_PRODUCTO,
                    idProductoDetalle: producto.ID_PRODUCTO_DETALLE,
                    idProductoIntermedio: producto.ID_PRODUCTO_INTERMEDIO,
                    cantidad,
                    idUsuario,
                    fecha: producto.FECHA_VENCIMIENTO,
                    fechaHora,
                    tipo: 15,
                    prctoPrimario: producto.PROD_PRIMARIO || 0,
                    detalle: producto.DETALLE || '',
                    imagen: '',
                    conFechaVencimiento: true,
                    transaction
                });
            }
            await transaction.commit();
            return { message: 'Se guardó correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // ── Reposiciones ──

    async listarReposiciones(idUsuario, data) {
        const { almacenes = [], fecha_inicio, fecha_fin, id_estado = '' } = data;
        const ids = await this._getIdsAlmacen(idUsuario, almacenes);
        const idsStr = ids.join(',');
        const fi = fecha_inicio ? `${fecha_inicio} 00:00:00` : `${this._getFecha()} 00:00:00`;
        const ff = fecha_fin ? `${fecha_fin} 23:59:59` : (fecha_inicio ? `${fecha_inicio} 23:59:59` : `${this._getFecha()} 23:59:59`);
        const result = await Repo.listarReposiciones(idsStr, fi, ff, id_estado);
        result.forEach(r => {
            try { r.USUARIOS = r.USUARIOS ? JSON.parse(r.USUARIOS) : []; } catch { r.USUARIOS = []; }
        });
        return result;
    }

    async asignarResponsableReposicion(data, idUsuario) {
        const { id_reposicion_almacen, id_usuario } = data;
        if (!id_reposicion_almacen || !(await Repo.existeReposicionAlmacen(id_reposicion_almacen))) {
            throw Object.assign(new Error('No se encontró la reposición.'), { status: 400 });
        }
        return await Repo.asignarResponsableReposicion(idUsuario, id_usuario, id_reposicion_almacen);
    }

    // ── Lógica compartida: descuentoInvAlmacen ──

    async _descuentoInvAlmacen(data) {
        const {
            idAlmacen, idProducto, idProductoDetalle, idProductoIntermedio,
            cantidad, idUsuario, fecha, fechaHora, tipo, prctoPrimario,
            detalle, imagen, conFechaVencimiento, transaction
        } = data;

        if (cantidad <= 0) return;

        const inventario = await Repo.getInventarioByProducto(
            idAlmacen, idProducto, idProductoDetalle, idProductoIntermedio,
            fecha, conFechaVencimiento, transaction
        );

        let cantidadRestante = cantidad;
        for (let i = 0; i < inventario.length && cantidadRestante > 0; i++) {
            const inv = inventario[i];
            const cantUtz = inv.CANTIDAD_UTILIZADA || 0;
            const cantInv = inv.CANTIDAD;
            const cant = Math.min(cantInv, cantidadRestante);
            const nuevaCantUtz = cantUtz + cant;
            cantidadRestante -= cant;

            const idInvReg = await Repo.registrarEnInventarioAlmacen({
                idAlmacen,
                idProducto,
                idIntermedio: idProductoIntermedio,
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

            if (tipo === 15) {
                await Repo.registrarReposicionAlmacen({
                    idAlmacen, idUsuario, idInv: idInvReg,
                    idProductoDetalle: inv.ID_PRODUCTO_DETALLE,
                    idProducto, idProductoIntermedio,
                    cantidad: cant, idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                    fechaHora, fechaVen: inv.FECHA_VENCIMIENTO,
                    detalle, tipo
                }, transaction);
            } else {
                let urlImgen = ''
                if (imagen) {
                  const uuid = require('crypto').randomUUID();
                    const resp = await PlantaHelpers.guardarArchivo(uuid, imagen, 'desperdicio/almacen');
                    if (resp) {
                      urlImgen =  resp.ruta + resp.nombre
                    }
                }
                const idDesperdicio = await Repo.registrarDesperdicioAlmacen({
                    idAlmacen, idUsuario, idInv: idInvReg,
                    idProductoDetalle: inv.ID_PRODUCTO_DETALLE,
                    idProducto, idProductoIntermedio,
                    cantidad: cant, idUnidadMedida: inv.ID_UNIDAD_MEDIDA,
                    fechaHora, fechaVen: inv.FECHA_VENCIMIENTO,
                    detalle, tipo, prctoPrimario,urlImgen
                }, transaction);
                
            }
        }
    }
}

module.exports = new ReposicionDesperdicioService();

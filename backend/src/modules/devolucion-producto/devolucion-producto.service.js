const { beginTransaction } = require('../../config/database');
const Repo = require('./devolucion-producto.repository');

class DevolucionProductoService {

    async getAreasByUsuario(idUsuario) {
        const areas = await Repo.getAreasByUsuario(idUsuario);
        if (!areas || areas.length === 0) {
            return { status: false, message: 'No existen áreas.' };
        }
        return { status: true, areas };
    }

    async listAlmacenes() {
        const data = await Repo.listAlmacenes();
        if (!data || data.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, data };
    }

    async listAlmacenActivos() {
        const data = await Repo.listAlmacenActivos();
        if (!data || data.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, data };
    }

    async listarProductosStock(idPlantaAlmacen) {
        const productos = await Repo.listarProductosStock(idPlantaAlmacen);
        if (!productos || productos.length === 0) {
            return { status: false, message: 'No existen productos registrados.' };
        }
        return { status: true, productos };
    }

    // ─── validarDatosDevolucion (PHP lines 2275-2327) ───
    async _validarDatosDevolucion(idPlantaAlmacen, idArea, productos) {
        if (!idPlantaAlmacen || !Number.isFinite(idPlantaAlmacen)) {
            return { status: false, message: "Campo 'id_planta_almacen' no valido." };
        }
        if (!idArea || !Number.isFinite(idArea)) {
            return { status: false, message: "Campo 'id_area' no valido." };
        }
        if (!productos || productos.length === 0) {
            return { status: false, message: 'Se requiere productos.' };
        }
        const stockErrors = [];
        for (const producto of productos) {
            const idProducto = producto.id_producto || 0;
            const idProductoDetalle = producto.id_producto_detalle || 0;
            const nombreProd = producto.producto || '';
            const cantidad = parseFloat(producto.cantidad || 0);
            const fecha = producto.fecha;
            if (!fecha) {
                return { status: false, message: `Se requiere fecha en el siguiente producto: ${nombreProd}.` };
            }
            let stock = 0;
            if (idProducto) {
                stock = await Repo.getStockByProductoFecha(idPlantaAlmacen, idProducto, idProductoDetalle, fecha);
            }
            if (stock < cantidad) {
                stockErrors.push({ id_producto: idProducto, id_producto_detalle: idProductoDetalle, cantidad, stock, fecha, producto: nombreProd });
            }
        }
        if (stockErrors.length > 0) {
            return { status: false, message: 'No cuenta con suficiente stock en los siguientes productos.', productos: stockErrors };
        }
        return { status: true };
    }

    // ─── registarDevolProductosData (PHP lines 2092-2137) ───
    async _registarDevolProductosData(idAlmacen, idArea, idUsuario, fechaHora, fecha, productos, transaction) {
        const idDoc = await Repo.registrarDevolDoc(idAlmacen, idArea, idUsuario, fechaHora, transaction);
        if (!idDoc) {
            throw new Error('Error al registrar en documento.');
        }
        for (const producto of productos) {
            const idProducto = producto.id_producto || 0;
            const idProductoDetalle = producto.id_producto_detalle || 0;
            const cantidadAdecuacion = parseInt(producto.cantidad_adecuacion || 1);
            const cantidad = parseFloat(producto.cantidad || 0);
            const cantDevoluta = cantidad;
            const cantidadTotal = parseInt(cantDevoluta * cantidadAdecuacion);
            const fechaVen = producto.fecha || '';
            const idProductoIntermedio = 0;
            const inventarios = await Repo.getInventarioByProducto(idAlmacen, idProducto, idProductoDetalle, fechaVen, transaction);
            const idDetalleDevol = await Repo.registraDevolDetalle(idDoc, idProductoDetalle, idProducto, cantidadTotal, fechaHora, transaction);
            let cantRestante = cantidadTotal;
            for (let i = 0; i < inventarios.length; i++) {
                const inv = inventarios[i];
                if (cantRestante <= 0) break;
                const idInvA = inv.ID_ALMACEN_INVENTARIO;
                const cantUtz = inv.CANTIDAD_UTILIZADA || 0;
                const cantInv = inv.CANTIDAD;
                const idPD = inv.ID_PRODUCTO_DETALLE;
                const idUnidadInv = inv.ID_UNIDAD_MEDIDA;
                const fechaVenInv = inv.FECHA_VENCIMIENTO;
                if (cantRestante > 0) {
                    const cant = cantInv <= cantRestante ? cantInv : cantRestante;
                    const newCantUtz = cantUtz + cant;
                    cantRestante = parseInt(cantRestante - cant);
                    await Repo.registrarEnInventarioAlmacen(idAlmacen, idProducto, idProductoIntermedio, cant, fechaHora, fechaVenInv, idUsuario, idUnidadInv, 0, 0, 5, idInvA, idPD, idDetalleDevol, transaction);
                    await Repo.actualizarCantUtilizada(idInvA, newCantUtz, idUsuario, transaction);
                    await Repo.devolProductoAPlanta(idArea, idProducto, cant, fechaHora, fechaVenInv, idUsuario, idUnidadInv, 0, 1, 5, idInvA, idPD, idDetalleDevol, transaction);
                }
            }
        }
        return true;
    }

    async registrarDevolucionProducto(idPlantaAlmacen, idArea, idUsuario, productos) {
        const fecha = new Date().toLocaleDateString('en-CA');
        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        const validacion = await this._validarDatosDevolucion(idPlantaAlmacen, idArea, productos);
        if (!validacion.status) {
            return validacion;
        }
        const transaction = await beginTransaction();
        try {
            await this._registarDevolProductosData(idPlantaAlmacen, idArea, idUsuario, fechaHora, fecha, productos, transaction);
            await transaction.commit();
            return { status: true, message: 'Se guardo correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurio un error.' };
        }
    }

    async listarDevoluciones(idPlantaAlmacen, fechaInicio, fechaFin) {
        const inicio = fechaInicio + ' 00:00:00';
        const fin = fechaFin + ' 23:59:59';
        const productos = await Repo.listarDevoluciones(idPlantaAlmacen, inicio, fin);
        if (!productos || productos.length === 0) {
            return { status: false, message: 'No existen productos registrados.' };
        }
        return { status: true, productos };
    }
}

module.exports = new DevolucionProductoService();

const Repo = require('./configuracion.repository');

class ConfiguracionService {

    async listAlmacenes() {
        const rows = await Repo.listAlmacenes();
        if (!rows || rows.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        const data = rows.map(res => {
            let recetas = [];
            try {
                recetas = JSON.parse(res.RECETAS || '[]');
            } catch (e) {
                recetas = [];
            }
            recetas.forEach(receta => {
                try {
                    receta.PRODUCTOS = JSON.parse(receta.PRODUCTOS || '[]');
                } catch (e) {
                    receta.PRODUCTOS = [];
                }
            });
            return { ...res, RECETAS: recetas };
        });
        return { status: true, data };
    }

    async listarProductosAlmacen(idAlmacen) {
        const productos = await Repo.getProductosAlmacen(idAlmacen);
        const inventario = await Repo.getStockAlmacen(idAlmacen);
        if (!productos || productos.length === 0 || !idAlmacen) {
            return { status: false, message: 'No existen productos en almacen.' };
        }
        productos.forEach(producto => {
            const idProducto = producto.ID_PRODUCTO || 0;
            producto.STOCK = inventario[idProducto] || 0;
        });
        return { status: true, productos };
    }

    async asignarProductoAlmacen(idAlmacen, idProducto, idProductoIntermedio, estado = 0) {
        const idProd = idProducto || 0;
        const idProdInt = idProductoIntermedio || 0;
        if (!idProd && !idProdInt) {
            return { status: false, message: 'se requiere id_producto y id_producto_intermedio.' };
        }
        const existe = await Repo.existeProductoEnAlmacen(idAlmacen, idProd, idProdInt);
        if (existe) {
            await Repo.editarEstadoProductoAlmacen(existe.ID_ALMACEN_PRODUCTO, estado);
        } else if(estado==1) {
            await Repo.registrarProductoAlmacen(idProd, idProdInt, idAlmacen);
        }
        return { status: true, message: 'Se guardo corectamente la información.' };
    }

    async listProductosForAlmacen() {
        const productos = await Repo.listProductosForAlmacen();
        return { status: true, productos };
    }

    async actualizarUnidadMedidaDeclaracion(idProductoDetalle, idUnidadMedida, nota) {
        const existe = await Repo.existeProductoDetalleById(idProductoDetalle);
        if (!existe) {
            return { status: false, message: 'No se encontro el producto.' };
        }
        const valid = await Repo.validarUnidadMedida(idProductoDetalle, idUnidadMedida);
        if (!valid) {
            return { status: false, message: 'id_unidad_medida no valido' };
        }
        const ok = await Repo.actualizarUnidadMedidaDeclaracion(idProductoDetalle, idUnidadMedida, nota);
        if (ok) {
            return { status: true, message: 'se guardo correctamente la información.' };
        }
        return { status: false, message: 'Ocurrio un error inesperado.' };
    }
}

module.exports = new ConfiguracionService();

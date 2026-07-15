const Repo = require('./productos-intermedios.repository');
const { AppError } = require('../../middleware/errorHandler');

class ProductosIntermediosService {

    async listAlmacenUsuario(idUsuario) {
        if (!idUsuario) {
            throw new AppError('El id del usuario es requerido.', 400);
        }

        const result = await Repo.listAlmacenUsuario(idUsuario);
        if (!result || result.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        return result;
    }

    async listUnidadMedida() {
        const result = await Repo.listUnidadMedida();
        if (!result || result.length === 0) {
            throw new AppError('No se encontro datos.', 404);
        }
        return result;
    }

    async listarProductosIntermedios() {
        const result = await Repo.listarProductosIntermedios();
        if (!result || result.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        const data = result.map(row => {
            let almacenes = [];
            let recetas = [];
            if (row.ALMACENES) {
                try {
                    almacenes = typeof row.ALMACENES === 'string' ? JSON.parse(row.ALMACENES) : row.ALMACENES;
                } catch (e) {
                    almacenes = [];
                }
            }
            if (row.RECETAS) {
                try {
                    recetas = typeof row.RECETAS === 'string' ? JSON.parse(row.RECETAS) : row.RECETAS;
                } catch (e) {
                    recetas = [];
                }
            }
            return { ...row, ALMACENES: almacenes, RECETAS: recetas };
        });
        return data;
    }

    async crearProductoIntermedio(data) {
        const { nombre, duracion, id_planta_almacen = 0 } = data;

        if (!nombre) {
            throw new AppError('Nombre requerido.', 400);
        }

        if (!duracion || !Number(duracion) || Number(duracion) === 0) {
            throw new AppError('Campo duracion no valida.', 400);
        }

        const existe = await Repo.existeProductoIntermedio(nombre, 0);
        if (existe) {
            throw new AppError('Ya existe un producto.', 409);
        }

        const id = await Repo.crearProductoIntermedio(data);
        if (!id) {
            throw new AppError('Ocurrio un error.', 500);
        }

        if (id_planta_almacen) {
            await Repo.addProductoIntAlmacen(id_planta_almacen, id, 1);
        }

        return { id };
    }

    async editarProductoIntermedio(id, data) {
        if (!id) {
            throw new AppError('El id del producto intermedio es requerido.', 400);
        }

        const { nombre, duracion } = data;

        if (!nombre) {
            throw new AppError('Nombre requerido.', 400);
        }

        if (!duracion || !Number(duracion) || Number(duracion) === 0) {
            throw new AppError('Campo duracion no valida.', 400);
        }

        const existe = await Repo.existeProductoIntermedio(nombre, id);
        if (existe) {
            throw new AppError('Ya existe un producto.', 409);
        }

        const result = await Repo.editarProductoIntermedio(id, data);
        if (!result) {
            throw new AppError('Ocurrio un error.', 500);
        }

        return { message: 'Se guardo correctamente la informacion.' };
    }

    async getRecetaByAlmacen(id) {
        if (!id) {
            throw new AppError('El id del almacen es requerido.', 400);
        }

        const result = await Repo.getRecetaByAlmacen(id);
        if (!result || result.length === 0) {
            throw new AppError('No existen productos.', 404);
        }
        return result;
    }

    async getRecetas({ id_sub_2 = 0 } = {}) {
        const result = await Repo.getRecetas(id_sub_2);
        if (!result || result.length === 0) {
            throw new AppError('No existen productos.', 404);
        }
        return result;
    }

    async getRecetaIntermedio(id_producto_intermedio = 0 ) {
        if (!id_producto_intermedio) {
            throw new AppError('El id del producto intermedio es requerido.', 400);
        }

        const result = await Repo.getRecetaIntermedio(id_producto_intermedio);
        if (!result || result.length === 0) {
            throw new AppError('No existe la receta seleccionada.', 404);
        }

        const data = result.map(row => {
            let productos = [];
            if (row.PRODUCTOS) {
                try {
                    productos = typeof row.PRODUCTOS === 'string' ? JSON.parse(row.PRODUCTOS) : row.PRODUCTOS;
                } catch (e) {
                    productos = [];
                }
            }
            return { ...row, PRODUCTOS: productos };
        });
        return data;
    }

    async updateEstadoRecetaAlmacen({ id_planta_receta_almacen = 0, id_almacen_producto_intermedio = 0, estado = 0 } = {}) {
        let result = false;

        if (id_planta_receta_almacen) {
            result = await Repo.actualizarEstadoRecetaAlmacen(id_planta_receta_almacen, estado);
        }

        if (id_almacen_producto_intermedio) {
            result = await Repo.actualizarEstadoProductoIntermedioAlmacen(id_almacen_producto_intermedio, estado);
        }

        if (!result) {
            throw new AppError('Ocurrio un error al actualizar el estado.', 500);
        }

        return { message: 'Se guardo correctamente la informacion.' };
    }
}

module.exports = new ProductosIntermediosService();

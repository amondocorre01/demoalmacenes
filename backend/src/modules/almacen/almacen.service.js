const Repo = require('./almacen.repository');
const { beginTransaction } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

class AlmacenService {

    async listAlmacenActivos() {
        return await Repo.listAlmacenActivos();
    }

    async listAlmacen() {
        const result = await Repo.listAlmacen();
        const data = result.map(row => {
            let recetas = [];
            if (row.RECETAS) {
                try {
                    recetas = JSON.parse(row.RECETAS);
                    recetas = recetas.map(r => ({
                        ...r,
                        PRODUCTOS: r.PRODUCTOS ? (typeof r.PRODUCTOS === 'string' ? JSON.parse(r.PRODUCTOS) : r.PRODUCTOS) : []
                    }));
                } catch (e) {
                    recetas = [];
                }
            }
            return { ...row, RECETAS: recetas };
        });
        return data;
    }

    async getProductosCategoria2() {
        const result = await Repo.getProductosCategoria2();
        if (!result || result.length === 0) {
            throw new AppError('No se encontro datos.', 404);
        }
        return result;
    }

    async getProductosForReceta({ codigo_tipo = 0 } = {}) {
        const result = await Repo.getProductosForReceta(codigo_tipo);
        if (!result || result.length === 0) {
            throw new AppError('No existen productos.', 404);
        }
        return result;
    }

    async getRecetas({ id_sub_2 = 0 } = {}) {
        const result = await Repo.getRecetas(id_sub_2);
        if (!result || result.length === 0) {
            throw new AppError('No existen recetas.', 404);
        }
        return result;
    }

    async createAlmacen({ almacen, estado_produccion = 0 } = {}) {
        if (!almacen) {
            throw new AppError('El nombre del almacen es requerido.', 400);
        }

        const existe = await Repo.existeAlmacenByNombre(almacen, 0);
        if (existe) {
            throw new AppError('Ya existe un almacen con el mismo nombre.', 409);
        }

        const id = await Repo.crearAlmacen(almacen, estado_produccion);
        if (!id) {
            throw new AppError('Ocurrio un error al crear el almacen.', 500);
        }

        return { id };
    }

    async updateAlmacen(id, { almacen = '', estado = 0, estado_produccion = 0 } = {}) {
        if (!id) {
            throw new AppError('El id del almacen es requerido.', 400);
        }

        const existe = await Repo.existeAlmacenById(id);
        if (!existe) {
            throw new AppError('No se encontro el almacen.', 404);
        }

        const existeNombre = await Repo.existeAlmacenByNombre(almacen, id);
        if (existeNombre) {
            throw new AppError('Ya existe un almacen con el mismo nombre.', 409);
        }

        const result = await Repo.editarAlmacen(id, almacen, estado, estado_produccion);
        if (!result) {
            throw new AppError('Ocurrio un error al actualizar el almacen.', 500);
        }

        return { message: 'Se ha registrado la informacion correctamente.' };
    }

    async createReceta({ nombre = '', id_sub_categoria_2 = 0, id_planta_almacen = 0, productos = [] } = {}) {
        if (!id_sub_categoria_2) {
            throw new AppError('El campo ID_SUB_CATEGORIA_2 es obligatorio.', 400);
        }

        const transaction = await beginTransaction();
        try {
            let idReceta = await Repo.existeReceta(id_sub_categoria_2);
            if (!idReceta) {
                idReceta = await Repo.crearReceta(nombre, id_sub_categoria_2, 1);
            } else {
                await Repo.editarReceta(idReceta, nombre, id_sub_categoria_2, 1);
            }

            if (!idReceta) {
                await transaction.rollback();
                throw new AppError('Ocurrio un error al crear la receta.', 500);
            }

            if (id_planta_almacen) {
                await this._saveRecetaAlmacenData(id_planta_almacen, idReceta, transaction);
            }

            for (const producto of productos) {
                const idProducto = producto.id_producto || 0;
                const idProductoIntermedio = producto.id_producto_intermedio || 0;
                const cantidad = producto.cantidad || 0;
                const idUnidadMedida = producto.id_unidad_medida || 1;
                const estado = producto.estado || 0;

                const idProductoReceta = await Repo.tieneProductoRecta(idReceta, idProducto, idProductoIntermedio);
                if (idProductoReceta) {
                    await Repo.editarProductoRecta(idProductoReceta, estado, cantidad, idUnidadMedida);
                } else {
                    await Repo.crearProductoRecta(idReceta, idProducto, idProductoIntermedio, estado, cantidad, idUnidadMedida);
                }
            }

            await transaction.commit();
            return { message: 'Se guardo correctamente la informacion.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateReceta(id, { id_sub_categoria_2 = 0, nombre = '', estado = 0, productos = [], id_planta_almacen = 0 } = {}) {
        if (!id) {
            throw new AppError('El id de la receta es requerido.', 400);
        }

        if (!id_sub_categoria_2) {
            throw new AppError('El campo ID_SUB_CATEGORIA_2 es requerido.', 400);
        }

        const existe = await Repo.existeRecetaById(id);
        if (!existe) {
            throw new AppError('No existe la receta.', 404);
        }

        const transaction = await beginTransaction();
        try {
            await Repo.editarReceta(id, nombre, id_sub_categoria_2, estado);

            if (id_planta_almacen) {
                await this._saveRecetaAlmacenData(id_planta_almacen, id, transaction);
            }

            for (const producto of productos) {
                const idPlantaProductoReceta = producto.id_planta_producto_receta || 0;
                const cantidad = producto.cantidad || 0;
                const idUnidadMedida = producto.id_unidad_medid || 0;
                await Repo.actualizarProductoReceta(idPlantaProductoReceta, estado, cantidad, idUnidadMedida);
            }

            await transaction.commit();
            return { message: 'Se guardo correctamente la informacion.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateProductoReceta(id, { id_producto = 0, id_producto_intermedio = 0, estado = 0 } = {}) {
        if (!id) {
            throw new AppError('El id de la receta es requerido.', 400);
        }

        const idProd = id_producto || 0;
        const idProdInt = id_producto_intermedio || 0;

        const result = await Repo.actualizarEstadoProductoReceta(idProd, idProdInt, id, estado);
        if (!result) {
            throw new AppError('Ocurrio un error al actualizar el producto.', 500);
        }

        return { message: 'Se guardo correctamente la informacion.' };
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

    async _saveRecetaAlmacenData(idAlmacen, idReceta, transaction = null) {
        const existe = await Repo.tieneRectaAlamcen(idAlmacen, idReceta);
        if (existe) {
            await Repo.editarRecetaPlanta(idAlmacen, idReceta, 1);
        } else {
            const id = await Repo.crearRecetaPlanta(idAlmacen, idReceta);
            if (!id) throw new AppError('Error al guardar receta-almacen.', 500);
        }
    }
}

module.exports = new AlmacenService();

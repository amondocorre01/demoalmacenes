const Repo = require('./recetas-intermedias.repository');
const { AppError } = require('../../middleware/errorHandler');
const { beginTransaction } = require('../../config/database');

class RecetasIntermediasService {

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

    async getProductosForReceta(codigo_tipo = 0) {
        if (!codigo_tipo) {
            throw new AppError('El campo codigo_tipo es requerido.', 400);
        }
        const result = await Repo.getProductosForReceta(codigo_tipo);
        if (!result || result.length === 0) {
            throw new AppError('No existen productos.', 404);
        }
        return result;
    }

    async listarProductosIntermediosActivos() {
        const result = await Repo.listarProductosIntermediosActivos();
        if (!result || result.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        return result;
    }

    async getProductosCategoria2() {
        const result = await Repo.getProductosCategoria2();
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

    async asignarProductoIntAlmacen({ id_planta_almacen = 0, id_producto_intermedio = 0, estado = 1 } = {}) {
        if (!id_planta_almacen) {
            throw new AppError('El id_planta_almacen es requerido.', 400);
        }
        if (!id_producto_intermedio) {
            throw new AppError('El id_producto_intermedio es requerido.', 400);
        }
        await Repo.addProductoIntAlmacen(id_planta_almacen, id_producto_intermedio, estado);
        return { message: 'Se guardo correctamente la informacion.' };
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

    async listarProductosIntermediosByAlmacen( id_planta_almacen = 0 ) {
        if (!id_planta_almacen) {
            throw new AppError('El id_planta_almacen es requerido.', 400);
        }
        const result = await Repo.listarProductosIntermediosByAlmacen(id_planta_almacen);
        if (!result || result.length === 0) {
            throw new AppError('No existen datos.', 404);
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

    async getRecetaByAlmacen(id) {
        if (!id) {
            throw new AppError('El id del almacen es requerido.', 400);
        }
        const result = await Repo.getRecetaByAlmacen(id);
        if (!result || result.length === 0) {
            throw new AppError('No existen datos.', 404);
        }
        const data = result.map(row => {
            let productosReceta = [];
            if (row.PRODUCTOS_RECETA) {
                try {
                    productosReceta = typeof row.PRODUCTOS_RECETA === 'string'
                        ? JSON.parse(row.PRODUCTOS_RECETA)
                        : row.PRODUCTOS_RECETA;
                } catch (e) {
                    productosReceta = [];
                }
            }
            return { ...row, PRODUCTOS_RECETA: productosReceta };
        });
        return data;
    }

    async getRecetaIntermedio(id_producto_intermedio = 0) {
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

    async crearRecetaIntermedio(data, idUsuario) {
        const { id_producto_intermedio, cantidad_e, id_unidad_medida_e, cantidad_a, id_unidad_medida_a } = data;

        if (!id_producto_intermedio || !Number(id_producto_intermedio)) {
            throw new AppError('Campo id_producto_intermedio no valido.', 400);
        }
        if (!cantidad_e || !Number(cantidad_e)) {
            throw new AppError('Campo cantidad_e no valido.', 400);
        }
        if (!id_unidad_medida_e || !Number(id_unidad_medida_e)) {
            throw new AppError('Campo id_unidad_medida_e no valido.', 400);
        }
        if (!cantidad_a || !Number(cantidad_a)) {
            throw new AppError('Campo cantidad_a no valido.', 400);
        }
        if (!id_unidad_medida_a || !Number(id_unidad_medida_a)) {
            throw new AppError('Campo id_unidad_medida_a no valido.', 400);
        }

        const transaction = await beginTransaction();
        try {
            const fecha = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');

            await Repo.desactivarRecetasAnteriores(id_producto_intermedio, transaction);

            const numReceta = await Repo.getMaxNumReceta(id_producto_intermedio, transaction);

            const idRiPi = await Repo.crearRecetaIntermedio({
                num_receta: numReceta,
                cantidad_e,
                id_producto_intermedio,
                id_unidad_medida_e,
                cantidad_a,
                id_unidad_medida_a
            }, transaction);

            await Repo.registrarLogRI(idRiPi, cantidad_e, id_unidad_medida_e, cantidad_a, id_unidad_medida_a, 1, idUsuario, fecha, 'INSERT', transaction);

            await transaction.commit();
            return { id: idRiPi, message: 'Se guardo correctamente la informacion.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async editarRecetaIntermedio(idPlantaRiPi, data, idUsuario) {
        const { cantidad_e, id_unidad_medida_e, cantidad_a, id_unidad_medida_a } = data;

        if (!idPlantaRiPi) {
            throw new AppError('El id_planta_ri_pi es requerido.', 400);
        }
        if (!cantidad_e || !Number(cantidad_e)) {
            throw new AppError('Campo cantidad_e no valido.', 400);
        }
        if (!id_unidad_medida_e || !Number(id_unidad_medida_e)) {
            throw new AppError('Campo id_unidad_medida_e no valido.', 400);
        }
        if (!cantidad_a || !Number(cantidad_a)) {
            throw new AppError('Campo cantidad_a no valido.', 400);
        }
        if (!id_unidad_medida_a || !Number(id_unidad_medida_a)) {
            throw new AppError('Campo id_unidad_medida_a no valido.', 400);
        }

        const result = await Repo.editarRecetaIntermedio(idPlantaRiPi, data);
        if (!result) {
            throw new AppError('Ocurrio un error.', 500);
        }

        const fecha = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        await Repo.registrarLogRI(idPlantaRiPi, cantidad_e, id_unidad_medida_e, cantidad_a, id_unidad_medida_a, 1, idUsuario, fecha, 'UPDATE');

        return { message: 'Se guardo correctamente la informacion.' };
    }

    async agregarProductosRI({ id_planta_ri_pi = 0, productos = [] } = {}, idUsuario) {
        if (!id_planta_ri_pi) {
            throw new AppError('El id_planta_ri_pi es requerido.', 400);
        }
        if (!productos || productos.length === 0) {
            throw new AppError('El campo productos es requerido.', 400);
        }

        const fecha = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        let lastResult = false;

        for (const producto of productos) {
            const {
                id_producto = 0,
                id_producto_intermedio = 0,
                id_unidad_medida = 0,
                cantidad = 0,
                num_receta = 0,
                estado = 0
            } = producto;
            const receta = await Repo.getRecetaIntermedioById(id_planta_ri_pi);
            const num_receta_aux = receta.NUM_RECETA || num_receta;
            const existe = await Repo.existeRecetaIntermedio(id_planta_ri_pi, num_receta_aux, id_producto, id_producto_intermedio);

            if (existe) {
                lastResult = await Repo.actualizarProductoRI(existe.ID_RECETA_INTERMEDIO, cantidad, id_unidad_medida, estado);
                if (estado !== existe.ESTADO || cantidad !== existe.CANTIDAD || id_unidad_medida !== existe.ID_UNIDAD_MEDIDA) {
                    await Repo.registrarLogProductosRI(existe.ID_RECETA_INTERMEDIO, cantidad, id_unidad_medida, estado, idUsuario, fecha, 'UPDATE');
                }
            } else if (estado) {
                const newId = await Repo.agregarProductoRI(id_planta_ri_pi, id_producto_intermedio, id_producto, cantidad, id_unidad_medida, num_receta_aux);
                lastResult = newId > 0;
                if (lastResult) {
                    await Repo.registrarLogProductosRI(newId, cantidad, id_unidad_medida, 1, idUsuario, fecha, 'INSERT');
                }
            }
        }

        if (!lastResult) {
            throw new AppError('Ocurrio un error.', 500);
        }

        return { message: 'Se registro correctamente la informacion.' };
    }
}

module.exports = new RecetasIntermediasService();

const { beginTransaction } = require('../../../config/database');
const InventarioHelper = require('../../../helpers/inventario.helper');
const Repo = require('./produccion.repository');

class ProduccionService {

    _getFechaHora() {
        return new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
    }

    _getFecha() {
        return new Date().toLocaleDateString('en-CA');
    }

    async getAreasByUsuario(idUsuario) {
        const areas = await Repo.getAreasByUsuario(idUsuario);
        if (!areas || areas.length === 0) {
            return { status: false, message: 'No existen áreas.' };
        }
        return { status: true, areas };
    }

    async listAlmacen() {
        const almacenes = await Repo.listAlmacen();
        if (!almacenes || almacenes.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, data: almacenes };
    }

    async listAlmacenUsuario(idUsuario) {
        const almacenes = await InventarioHelper.listAlmacenUsuario(idUsuario, 0);
        if (!almacenes || almacenes.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, almacenes };
    }

    async getRecetaByAlmacen(idAlmacen, tipo) {
        const result = await Repo.getRecetaByAlmacen(idAlmacen);
        const stocks = await Repo.getInventarioAlmacen(idAlmacen);
        const invSub2 = await Repo.getInventarioPFAlmacen(idAlmacen);

        const recetas = [];
        for (const r of result) {
            let productos = [];
            try { productos = r.PRODUCTOS ? JSON.parse(r.PRODUCTOS) : []; } catch { productos = []; }

            const idPrIn = r.ID_PRODUCTO_INTERMEDIO || 0;
            const idRta = r.ID_PLANTA_RECETA || 0;
            const idSub2 = r.ID_SUB_CATEGORIA_2 || 0;

            const stockPrIn = idPrIn && stocks[0] && stocks[0][idPrIn] ? stocks[0][idPrIn].CANTIDAD || 0 : 0;
            let stock = stockPrIn > 0 ? Math.round((stockPrIn) / r.CANTIDAD_ADECUACION / r.CANTIDAD_ESTANDAR) : 0;

            let cant = -1;
            for (const producto of productos) {
                const idProducto = producto.ID_PRODUCTO || 0;
                const idProductoAntecesor = producto.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0;
                const prodStock = stocks[idProducto] && stocks[idProducto][idProductoAntecesor] ? stocks[idProducto][idProductoAntecesor] : null;
                const stockProd = prodStock ? prodStock.CANTIDAD || 0 : 0;
                const cantReceta = producto.CANTIDAD || 0;
                const cantP = cantReceta === 0 ? 0 : (stockProd > 0 ? Math.floor(stockProd / cantReceta) : 0);
                cant = (cant < cantP && cant >= 0) ? cant : cantP;
                producto.stock = stockProd;
                producto.CANT_REC = 0;
            }

            r.stock = stock;
            r.CANT_PEDIDO = 0;
            r.ID_UNICO = `${idRta}-${idPrIn}`;
            r.PRODUCTOS = productos;
            r.CANTIDAD = Math.round(cant * 100) / 100;

            if (tipo === null) {
                recetas.push(r);
            } else if (tipo === 0) {
                if (idRta === 0) {
                    r.desperdicio = 0;
                    r.produccion = 0;
                    recetas.push(r);
                }
            } else {
                if (idRta > 0) {
                    r.CANT_PEDIDO = 0;
                    recetas.push(r);
                }
            }
        }

        if (recetas.length === 0) {
            return { status: false, message: 'No existen productos.' };
        }
        return { status: true, recetas };
    }

    async getProductosProducidos(idAlmacen, fechaInicio, fechaFin) {
        const fecha = this._getFecha();
        const fi = fechaInicio ? `${fechaInicio} 00:00:00` : `${fecha} 00:00:00`;
        const ff = fechaFin ? `${fechaFin} 23:59:59` : `${fechaInicio || fecha} 23:59:59`;

        const productos = await Repo.getProductosProducidos(idAlmacen, fi, ff);
        if (!productos || productos.length === 0) {
            return { status: false, message: 'No existen productos registrados.' };
        }
        return { status: true, productos };
    }

    async validarDatosProduccion(data) {
        const { productos } = data;
        if (!productos || productos.length === 0) {
            throw Object.assign(new Error('Ingrese por lo menos un producto a producir.'), { status: 400 });
        }
        for (const p of productos) {
            const cantidadP = p.cantidad_producida || 0;
            const cantidadD = p.cantidad_desperdicio || 0;
            const cantAE = p.cant_AE || 1;

            if (!cantidadP || cantidadP <= 0) {
                throw Object.assign(new Error(`La cantidad_producida de ${p.producto || ''} debe ser mayor a cero.`), { status: 400 });
            }
            if (cantidadD > 0 && cantidadD > cantidadP * cantAE) {
                throw Object.assign(new Error(`La cantidad_desperdicio es mayor a la cantidad producida en el producto: ${p.producto || ''}`), { status: 400 });
            }
            if (cantidadD > 0) {
                const idEstado = p.idEstado || 4;
                const imagen = p.imagen || '';
                if (idEstado === 4 && !imagen) {
                    throw Object.assign(new Error(`Se requiere una imagen en el producto: ${p.producto || ''}`), { status: 400 });
                }
            }
        }
    }

    async registrarProductosProducidos(data, idUsuario) {
        const { productos } = data;
        const transaction = await beginTransaction();
        try {
            for (const p of productos) {
                const idPlantaReceta = p.id_planta_receta || 0;
                const idPlantaAlmacen = p.id_planta_almacen || 0;
                const idProductoIntermedio = p.id_producto_intermedio || 0;
                const idSub2 = p.id_sub_categoria_2 || 0;
                const cantidadP = p.cantidad_producida || 0;
                const cantidadDesperdicio = p.cantidad_desperdicio || 0;
                const detalle = p.detalle || 'Ninguna';
                const idEstado = p.idEstado || 4;
                const imagen = p.imagen || '';

                if (idPlantaReceta > 0) {
                    await this._registrarProductoProducido(
                        idPlantaAlmacen, idPlantaReceta, idSub2, data.id_area,
                        cantidadP, cantidadDesperdicio, idUsuario, detalle, idEstado, imagen, transaction
                    );
                } else if (idProductoIntermedio > 0) {
                    await this._registrarProductoIntermedioProducido(
                        idPlantaAlmacen, idProductoIntermedio, data.id_area,
                        cantidadP, cantidadDesperdicio, idUsuario, detalle, idEstado, imagen, transaction
                    );
                }
            }
            await transaction.commit();
            return { status: true, message: 'Se guardo correctamente la información.' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _registrarProductoProducido(idAlmacen, idReceta, idSub2, idArea, cantidadP, cantDesperdicio, idUsuario, detalle, idEstado, imagen, transaction) {
        const fecha = this._getFecha();
        const fechaHora = this._getFechaHora();

        const receta = await Repo.getProductosReceta(idReceta);
        if (!receta) {
            throw Object.assign(new Error('La receta no tiene productos.'), { status: 400 });
        }
        const productos = receta.PRODUCTOS || [];
        const idProductoDetalle = receta.ID_PRODUCTO_DETALLE || 0;
        const idProducto = receta.ID_PRODUCTO || 0;
        const idUnidad = receta.ID_UNIDAD_MEDIDA || null;
        const cantAdecuacion = receta.CANTIDAD_ADECUACION || 1;

        if (!productos || productos.length === 0) {
            throw Object.assign(new Error('La receta no tiene productos.'), { status: 400 });
        }

        const fechaVen = await Repo.getFechaVencimiento(idSub2, fecha);
        const idProductoP = await Repo.registrarEnProductoProduc(
            idAlmacen, idReceta, 0, idSub2, cantidadP, cantidadP, cantDesperdicio,
            fechaHora, idUsuario, detalle, 0
        );
        if (!idProductoP) {
            throw Object.assign(new Error('Ocurrio un error al guardar la información.'), { status: 500 });
        }

        await Repo.registrarEnInventarioPlanta(
            idArea, idProductoP, idSub2, cantidadP * cantAdecuacion,
            fechaHora, fechaVen, idUsuario, idProductoDetalle, idProducto, idUnidad, 1, 1, 0
        );

        for (const producto of productos) {
            const idProd = producto.ID_PRODUCTO || 0;
            const idProdAntecesor = producto.ID_PRODUCTO_INTERMEDIO || 0;
            const cantidadD = Math.round(producto.CANTIDAD * cantidadP * 100) / 100;
            await Repo.registrarDescuentoInvAlmacen(
                idAlmacen, idProd, idProdAntecesor, idProductoP, cantidadD,
                idUsuario, fecha, fechaHora, 3, '', idProductoDetalle, '', 0
            );
        }

        if (cantDesperdicio > 0) {
            const cantDespAdec = cantDesperdicio * cantAdecuacion;
            const idInvDes = await Repo.registrarEnInventarioPlanta(
                idArea, 0, idSub2, cantDespAdec,
                fechaHora, fechaVen, idUsuario, idProductoDetalle, idProducto, idUnidad, 0, 4, 0
            );
            await Repo.actualizarCantUtzPlanta(cantDespAdec, idInvDes);
            if (idEstado === 15) {
                await Repo.registrarReposicionArea(idArea, idUsuario, idInvDes, idProductoDetalle, idSub2, cantDespAdec, idUnidad, fechaHora, fechaVen, detalle, idEstado, 0, 0);
            } else {
                await Repo.registrarDesperdicioArea(idArea, idUsuario, idInvDes, idProductoDetalle, idSub2, cantDespAdec, idUnidad, fechaHora, fechaVen, detalle, 14, 0, imagen, 0);
            }
        }
    }

    async _registrarProductoIntermedioProducido(idAlmacen, idProductoIntermedio, idArea, cantidadP, cantDesperdicio, idUsuario, detalle, idEstado, imagen, transaction) {
        const receta = await Repo.getProductosRecestaIntermedio(idAlmacen, idProductoIntermedio);
        if (!receta) {
            throw Object.assign(new Error('La receta no existe.'), { status: 400 });
        }
        const productos = receta.PRODUCTOS || [];
        const idRiPr = receta.ID_PLANTA_RI_PI || 0;
        const prctoPrimario = receta.PROD_PRIMARIO || 0;

        if (!productos || productos.length === 0) {
            throw Object.assign(new Error('La receta no tiene productos.'), { status: 400 });
        }

        if (cantidadP <= 0) {
            throw Object.assign(new Error('La cantidad debe ser mayor a 0.'), { status: 400 });
        }

        const duracion = receta.DURACION || 1;
        const fecha = this._getFecha();
        const fechaHora = this._getFechaHora();
        const fechaVen = new Date(new Date().getTime() + duracion * 86400000).toISOString().split('T')[0];

        const idProducido = await Repo.registrarEnProductoProduc(
            idAlmacen, 0, idProductoIntermedio, 0,
            cantidadP, cantidadP, cantDesperdicio,
            fechaHora, idUsuario, detalle, idRiPr
        );

        if (!idProducido) {
            throw Object.assign(new Error('Ocurrio un error al guardar la información.'), { status: 500 });
        }

        const cantAdecuacion = receta.CANTIDAD_ADECUACION || 1;
        const cantEstandar = receta.CANTIDAD_ESTANDAR || 1;
        const idUnidadMedidaR = receta.ID_UNIDAD_MEDIDA_ADECUACION || 1;
        const cantP = cantidadP * cantEstandar * cantAdecuacion;

        await InventarioHelper.registrarEnInventarioAlmacen(
            idAlmacen, 0, idProductoIntermedio, cantP,
            fechaHora, fechaVen, idUsuario, idUnidadMedidaR, idProducido, 1, 1, 0, 0, 0
        );

        for (const key in productos) {
            const producto = productos[key];
            const idProd = producto.ID_PRODUCTO || 0;
            const idProdAntecesor = producto.ID_PRODUCTO_INTERMEDIO_ANTECESOR || 0;
            const cantD = Math.round((producto.CANTIDAD || 0) * cantidadP * 100) / 100;
            const idUnidadMedida = producto.ID_UNIDAD_MEDIDA || 0;
            await Repo.registrarDescuentoInvAlmacen(
                idAlmacen, idProd, idProdAntecesor, idProducido, cantD,
                idUsuario, fecha, fechaHora, 3, '', 0, imagen, 0
            );
        }

        if (cantDesperdicio > 0) {
            await Repo.registrarDescuentoInvAlmacen(
                idAlmacen, 0, idProductoIntermedio, idProducido, cantDesperdicio,
                idUsuario, fecha, fechaHora, idEstado, detalle, 0, imagen, prctoPrimario
            );
        }
    }
}

module.exports = new ProduccionService();

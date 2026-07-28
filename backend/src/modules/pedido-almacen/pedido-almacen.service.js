const { beginTransaction } = require('../../config/database');
const { notificarAUsuarios } = require('../../helpers/notification.helper');
const { getUsuariosByPerfilAndAlmacen } = require('../../helpers/usuario.helper');
const Repo = require('./pedido-almacen.repository');
require('dotenv').config();

class PedidoAlmacenService {

    async listAlmacenesSolicitantes(idUsuario) {
        const almacenes = await Repo.listAlmacenesSolicitantes(idUsuario);
      
        return { status: true, almacenes };
    }

    async listProductos(idAlmacen,idAlmacenSolicitante, tipo) {
        const productos = await Repo.listProductosAndPIStock(idAlmacen,idAlmacenSolicitante,tipo);
        const agrupados = {};
        const resultado = [];
        for (const p of productos) {
            const id = p.ID_PRODUCTO;
            if (id > 0) {
                if (!agrupados[id]) agrupados[id] = [];
                agrupados[id].push(p);
            } else {
                resultado.push(p);
            }
        }
        for (const id in agrupados) {
            const grupo = agrupados[id];
            const todosSinStock = grupo.every(p => p.STOCK === 0);
            if (todosSinStock) {
                resultado.push(grupo[0]);
            } else {
                resultado.push(...grupo.filter(p => p.STOCK > 0));
            }
        }
        return { status: true, productos: resultado };
    }

    async crearSolicitud(idUsuario, idAlmacenSolicitante, idAlmacenDestino, fechaEntrega, productos) {
        if (idAlmacenSolicitante === idAlmacenDestino) {
            return { status: false, message: 'El almacén solicitante y destino no pueden ser el mismo.' };
        }

        if (!productos || productos.length === 0) {
            return { status: false, message: 'Debe agregar al menos un producto.' };
        }

        const insuficientes = [];
        for (const producto of productos) {
            const idProductoDetalle = producto.id_producto_detalle || 0;
            const idProductoIntermedio = producto.id_producto_intermedio || 0;
            const cantidad = parseFloat(producto.cantidad) || 0;
            if (cantidad <= 0) continue;
            const {stock = 0,cantidad_adecuacion=1} = await Repo.getStockByProducto(idAlmacenDestino, idProductoDetalle, idProductoIntermedio);
            
            producto.cantidad_adecuacion = cantidad_adecuacion;
            if (stock < cantidad) {
                insuficientes.push({
                    id_producto_detalle: idProductoDetalle,
                    id_producto_intermedio: idProductoIntermedio,
                    solicitado: cantidad,
                    stock,
                    producto: producto.producto || ''
                });
            }
        }
        if (insuficientes.length > 0) {
            return {
                status: false,
                message: 'Stock insuficiente en el almacén destino para los siguientes productos.',
                productos: insuficientes
            };
        }

        const transaction = await beginTransaction();
        try {
            const idDocumento = await Repo.registrarDocumento(
                idAlmacenSolicitante, idAlmacenDestino, idUsuario, fechaEntrega, transaction
            );

            if (!idDocumento) {
                await transaction.rollback();
                return { status: false, message: 'Error al registrar la solicitud.' };
            }

            await Repo.registrarRegistro(idUsuario, 1, idDocumento, transaction);

            for (const producto of productos) {
                const cantidad = parseFloat(producto.cantidad) || 0;
                if (cantidad <= 0) continue;

                const idProductoDetalle = producto.id_producto_detalle || 0;
                const idProductoIntermedio = producto.id_producto_intermedio || 0;
                const idUnidad = producto.id_unidad || 0;

                await Repo.registrarDetalle(
                    idDocumento, idProductoDetalle, idProductoIntermedio,
                    cantidad, idUnidad, idUsuario, transaction
                );
            }

            await transaction.commit();
            const perfil = process.env.PERFIL_ENCARGADO_ALMACEN || 'Global'
            const userIds = await getUsuariosByPerfilAndAlmacen(perfil,idAlmacenDestino);
            await notificarAUsuarios(userIds, {
                tipo: 'solicitud',
                titulo: 'Solicitud de Productos',
                mensaje: 'Tienes solicitud de productos',
                referenciaModulo: 'pedidos-almacen',
                usuarioOrigen: idUsuario
            });
            return { status: true, message: 'Solicitud registrada correctamente.', id_documento: idDocumento };
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrió un error al registrar la solicitud.' };
        }
    }

    async listarSolicitudes(idUsuario, idAlmacenSolicitante, idAlmacenDestino, fechaInicio, fechaFin) {
        const fi = fechaInicio ? `${fechaInicio} 00:00:00` : '';
        const ff = fechaFin ? `${fechaFin} 23:59:59` : '';

        const documentos = await Repo.listarDocumentos(
            idAlmacenSolicitante, idAlmacenDestino, fi, ff
        );

        if (!documentos || documentos.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, solicitudes: documentos };
    }

    async getSolicitud(idDocumento) {
        const documento = await Repo.getDocumentoById(idDocumento);
        if (!documento) {
            return { status: false, message: 'No se encontró la solicitud.' };
        }
        const idAlmacenDestino = documento.ID_ALMACEN_DESTINO || 0;
        if (documento.ESTADO === 1) {
          for (const d of documento.DETALLE ?? []) {
            const { stock = 0, cantidad_adecuacion = 1 } = 
              await Repo.getStockByProducto(
                idAlmacenDestino, 
                d.ID_PRODUCTO_DETALLE || 0, 
                d.ID_PRODUCTO_INTERMEDIO || 0
              );
            
            d.STOCK = stock;
          }
        }
        return { status: true, solicitud: documento };
    }

    async editarSolicitud(idUsuario, idDocumento, productos) {
        const documento = await Repo.getDocumentoById(idDocumento);
        if (!documento) {
            return { status: false, message: 'No se encontró la solicitud.' };
        }
        if (documento.ESTADO !== 1) {
            return { status: false, message: 'Solo se pueden editar solicitudes pendientes.' };
        }
        const idAlmacenDestino = documento.ID_ALMACEN_DESTINO || 0;
        const insuficientes = [];
        for (const producto of productos) {
            const idProductoDetalle = producto.id_producto_detalle || 0;
            const idProductoIntermedio = producto.id_producto_intermedio || 0;
            const cantidad = parseFloat(producto.cantidad) || 0;
            if (cantidad <= 0) continue;
            const {stock = 0,cantidad_adecuacion=1} = await Repo.getStockByProducto(idAlmacenDestino, idProductoDetalle, idProductoIntermedio);
            
            producto.cantidad_adecuacion = cantidad_adecuacion;
            if (stock < cantidad) {
                insuficientes.push({
                    id_producto_detalle: idProductoDetalle,
                    id_producto_intermedio: idProductoIntermedio,
                    solicitado: cantidad,
                    stock,
                    producto: producto.producto || ''
                });
            }
        }
        if (insuficientes.length > 0) {
            return {
                status: false,
                message: 'Stock insuficiente en el almacén destino para los siguientes productos.',
                productos: insuficientes
            };
        }
        const transaction = await beginTransaction();
        try {
            const detalles = await Repo.getDetallesByDocumento(idDocumento);
            const detalleMap = {};
            for (const d of detalles) {
                const key = d.ID_PRODUCTO_DETALLE || d.ID_PRODUCTO_INTERMEDIO || 0;
                detalleMap[key] = d;
            }

            for (const producto of productos) {
                const cantidad = parseFloat(producto.cantidad) || 0;
                if (cantidad <= 0) continue;

                const idProductoDetalle = producto.id_producto_detalle || 0;
                const detalleExistente = detalleMap[idProductoDetalle];

                if (detalleExistente) {
                    await Repo.editarDetalleSolicitado(
                        detalleExistente.ID_ALMACEN_SOLICITUD_DETALLE, cantidad, idUsuario, transaction
                    );
                }
            }

            await transaction.commit();
            const perfil = process.env.PERFIL_ENCARGADO_ALMACEN || 'Global'
            const userIds = await getUsuariosByPerfilAndAlmacen(perfil,idAlmacenDestino);
            await notificarAUsuarios(userIds, {
                tipo: 'solicitud',
                titulo: 'Solicitud de Productos',
                mensaje: `El solicitante realizo modificaciones en el pedido ID: ${idDocumento}.`,
                referenciaModulo: 'pedidos-almacen',
                usuarioOrigen: idUsuario
            });
            return { status: true, message: 'Solicitud actualizada correctamente.' };
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrió un error al editar la solicitud.' };
        }
    }

    async enviarSolicitud(idUsuario, idDocumento, detalles) {
        const documento = await Repo.getDocumentoById(idDocumento);
        if (!documento) {
            return { status: false, message: 'No se encontró la solicitud.' };
        }
        if (documento.ESTADO !== 1) {
            return { status: false, message: 'Solo se pueden enviar solicitudes pendientes.' };
        }

        const idAlmacenDestino = documento.ID_ALMACEN_DESTINO;
        const idAlmacenSolicitante = documento.ID_ALMACEN_SOLICITANTE;

        const insuficientes = [];
        const detallesDb = await Repo.getDetallesByDocumento(idDocumento);
        for (const detalle of detalles) {
            const idDetalle = detalle.id_detalle || 0;
            const cantidadEnviada = parseFloat(detalle.cantidad_enviada) || 0;
            if (!idDetalle || cantidadEnviada <= 0) continue;

            const detDb = detallesDb.find(d => d.ID_ALMACEN_SOLICITUD_DETALLE === idDetalle);
            if (!detDb) continue;

            const idProductoDetalle = detDb.ID_PRODUCTO_DETALLE || 0;
            const idProductoIntermedio = detDb.ID_PRODUCTO_INTERMEDIO || 0;
            const { stock = 0 } = await Repo.getStockByProducto(idAlmacenDestino, idProductoDetalle, idProductoIntermedio);

            if (stock < cantidadEnviada) {
                insuficientes.push({
                    id_detalle: idDetalle,
                    producto: detDb.PRODUCTO || detDb.PRODUCTO_DETALLE || '',
                    solicitado: cantidadEnviada,
                    stock
                });
            }
        }
        if (insuficientes.length > 0) {
            return {
                status: false,
                message: 'Stock insuficiente en el almacén destino para completar el envío.',
                productos: insuficientes
            };
        }

        const fechaHora = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');

        const transaction = await beginTransaction();
        try {
            for (const detalle of detalles) {
                const idDetalle = detalle.id_detalle || 0;
                const cantidadEnviada = parseFloat(detalle.cantidad_enviada) || 0;
                if (!idDetalle || cantidadEnviada <= 0) continue;

                const detDb = detallesDb.find(d => d.ID_ALMACEN_SOLICITUD_DETALLE === idDetalle);
                if (!detDb) continue;

                const idProductoDetalle = detDb.ID_PRODUCTO_DETALLE || 0;
                const idProductoIntermedio = detDb.ID_PRODUCTO_INTERMEDIO || 0;
                const campo = idProductoIntermedio > 0 ? 'ID_PRODUCTO_INTERMEDIO' : 'ID_PRODUCTO_DETALLE';
                const idProd = idProductoIntermedio > 0 ? idProductoIntermedio : idProductoDetalle;

                const inventario = await Repo.getInventarioByProducto(idAlmacenDestino, campo, idProd, transaction);
                let cantidad = cantidadEnviada;

                for (const inv of inventario) {
                    if (cantidad <= 0) break;
                    const cantInv = inv.CANTIDAD;
                    const cantUtz = (inv.CANTIDAD_UTILIZADA || 0) + Math.min(cantInv, cantidad);
                    const cant = Math.min(cantInv, cantidad);
                    cantidad -= cant;

                    await Repo.registrarEnInventarioAlmacen({
                        idAlmacen: idAlmacenDestino,
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
                        idDetalleDevol: 0,
                        lote: inv.LOTE || null
                    }, transaction);

                    await Repo.actualizarCantUtilizada(inv.ID_ALMACEN_INVENTARIO, cantUtz, idUsuario, transaction);

                    await Repo.registrarEnInventarioAlmacen({
                        idAlmacen: idAlmacenSolicitante,
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
                        idDetalleDevol: 0,
                        lote: inv.LOTE || null
                    }, transaction);

                    await Repo.updateDetalleEnviado(idDetalle, cantidadEnviada, idUsuario, transaction);
                }
            }

            await Repo.updateDocumentoEstado(idDocumento, 2, transaction);
            await Repo.registrarRegistro(idUsuario, 2, idDocumento, transaction);

            await transaction.commit();
            const perfil = process.env.PERFIL_ENCARGADO_ALMACEN || 'Global'
            const userIds = await getUsuariosByPerfilAndAlmacen(perfil,idAlmacenSolicitante);
            await notificarAUsuarios(userIds, {
                tipo: 'solicitud',
                titulo: 'Solicitud de Productos',
                mensaje: `La solicitud ID: ${idDocumento} que realizaste ya fue enviada.`,
                referenciaModulo: 'pedidos-almacen',
                usuarioOrigen: idUsuario
            });
            return { status: true, message: 'Solicitud enviada correctamente. El inventario fue transferido.' };
        } catch (error) {
            console.log(error)
            await transaction.rollback();
            return { status: false, message: 'Ocurrió un error al enviar la solicitud.' };
        }
    }

    async recibirSolicitud(idUsuario, idDocumento, detalles) {
        const documento = await Repo.getDocumentoById(idDocumento);
        if (!documento) {
            return { status: false, message: 'No se encontró la solicitud.' };
        }
        if (documento.ESTADO !== 2) {
            return { status: false, message: 'Solo se pueden recibir solicitudes en estado enviado.' };
        }

        const transaction = await beginTransaction();
        try {
            for (const detalle of detalles) {
                const idDetalle = detalle.id_detalle || 0;
                const cantidadAceptada = parseFloat(detalle.cantidad_aceptada) || 0;
                if (idDetalle && cantidadAceptada >= 0) {
                    await Repo.updateDetalleAceptado(idDetalle, cantidadAceptada, idUsuario, transaction);
                }
            }

            await Repo.updateDocumentoEstado(idDocumento, 3, transaction);
            await Repo.registrarRegistro(idUsuario, 3, idDocumento, transaction);

            await transaction.commit();
            return { status: true, message: 'Solicitud recibida correctamente.' };
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrió un error al recibir la solicitud.' };
        }
    }

    async cancelarSolicitud(idUsuario, idDocumento) {
        const documento = await Repo.getDocumentoById(idDocumento);
        if (!documento) {
            return { status: false, message: 'No se encontró la solicitud.' };
        }
        if (documento.ESTADO === 2 || documento.ESTADO === 4) {
            return { status: false, message: 'No se puede cancelar una solicitud ya entregada o cancelada.' };
        }

        const transaction = await beginTransaction();
        try {
            await Repo.updateDocumentoEstado(idDocumento, 4, transaction);
            await Repo.registrarRegistro(idUsuario, 4, idDocumento, transaction);
            await transaction.commit();
            return { status: true, message: 'Solicitud cancelada correctamente.' };
        } catch (error) {
            await transaction.rollback();
            return { status: false, message: 'Ocurrió un error al cancelar la solicitud.' };
        }
    }
}

module.exports = new PedidoAlmacenService();

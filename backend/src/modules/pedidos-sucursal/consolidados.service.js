const ConsolidadosRepository = require('./consolidados.repository');
const { SucursalService, TurnoService, StockService, InventarioService } = require('./shared');
const { notificarAUsuarios } = require('../../helpers/notification.helper');
const { getUsuariosByPerfil } = require('../../helpers/usuario.helper');
require('dotenv').config();

const ESTADO_PLANTA = true;

function getDbName(codigo) {
    return codigo.toLowerCase();
}

const ConsolidadosService = {
    async listarPedidosConsolidados({ fecha_reporte, tipo_reporte, sucursal: id_sucursal, tipo }) {
        const sucursales = await SucursalService.getSucursales();
        const inventarios = await InventarioService.getInventariosSubcategoria2(fecha_reporte, 'ALL');
        const stocks = await StockService.getStocksPlanta();
        const turnosAll = await TurnoService.getTurnosAll();

        const listasPedidos = {};
        const estadosCab = {};
        const sucs = {};
        const sucs2 = {};
        const cabecera2 = [];
        let codigoSucursal = '';

        for (const suc of sucursales) {
            const codigo = suc.CODIGO;
            const idSuc = suc.ID_UBICACION;
            const dbName = getDbName(codigo);
            const sufijo = suc.SUFIJO || '';
            try {
                const pedidoData = await InventarioService.getPedidoSucursalTurno(dbName, sufijo, fecha_reporte, tipo_reporte);
                
                if ((pedidoData.pedidos && Object.keys(pedidoData.pedidos).length > 0 && codigo !== 'feria') ||
                    (pedidoData.pedidos && Object.keys(pedidoData.pedidos).length > 0 && id_sucursal > 0)) {
                    listasPedidos[codigo] = pedidoData.pedidos;
                    estadosCab[codigo] = pedidoData.estado_cabecera || 0;
                    if (idSuc == id_sucursal || id_sucursal == 0) {
                        cabecera2.push(codigo);
                    }
                    codigoSucursal = idSuc == id_sucursal ? codigo : codigoSucursal;
                    sucs2[codigo] = idSuc;
                    sucs[idSuc] = codigo;
                }
            } catch (e) {
                console.warn(`[Consolidados] Error al obtener pedidos de sucursal ${codigo}: ${e.message}`);
            }
        }
        
        const arrayResponse = [];
        const turnosPedido = {};
        const cabecera = ['Categoria', 'SubCategoria', 'Producto', 'Turno'];

        for (const inv of inventarios) {
            for (const turno of turnosAll) {
                const nomTurno = turno.TURNO || '';
                const idTurno = turno.ID_TURNO || 0;
                const idSubcategoria2 = inv.ID_SUB_CATEGORIA_2;
                let sum = 0;
                let sum2 = 0;
                let existe = false;
                let pedidoPrincipal = 0;
                let turnoSol = null;

                const item = {
                    id_sub_categoria_2: idSubcategoria2,
                    Categoria: inv.CATEGORIA,
                    SubCategoria: inv.SUB_CATEGORIA_1,
                    Producto: inv.SUB_CATEGORIA_2,
                    Turno: nomTurno,
                    idTurno: idTurno,
                    btnProducto: inv.ESTADO_ADECUACION || 0
                };

                for (const suc of sucursales) {
                    const codigo = suc.CODIGO;
                    const idSuc2 = suc.ID_UBICACION;
                    const lista = listasPedidos[codigo] || {};
                    const pedido = (lista[idSubcategoria2] || {})[nomTurno] || null;

                    const totalSuc = pedido ? (pedido.cantidad_solicitada || 0) : 0;
                    const totalEnv = pedido ? (pedido.cantidad_enviada || 0) : 0;
                    const estadoP = pedido ? (pedido.estado || 0) : 0;
                    const estadoCabecera = estadosCab[codigo] || 0;

                    if (pedido) {
                        turnoSol = turnoSol || pedido.turnoSol || '';
                        const pp = pedido.pedido_principal || 0;
                        pedidoPrincipal = pedidoPrincipal == 1 ? pedidoPrincipal : pp;
                        existe = existe || (estadoP >= 9);
                    }

                    const obj = {
                        id_producto_detalle: pedido ? (pedido.id_producto_detalle || 0) : 0,
                        cantidad_solicitada: totalSuc,
                        cantidad_enviada: totalEnv,
                        estado: estadoCabecera >= 12 ? estadoCabecera : estadoP
                    };

                    if (id_sucursal == 0 || id_sucursal == idSuc2) {
                        item[codigo] = obj;
                    }

                    if (estadoP == 11) sum += totalEnv;
                    if (estadoP > 11) sum2 += totalEnv;
                }

                const grupo = inv.GRUPO;
                const adecuacionVal = inv.CANTIDAD_ADECUACION_PEDIDOS || 1;
                const estandar = inv.CANTIDAD_ESTANDARIZADA || 1;
                const adecuacion = grupo == 1 ? adecuacionVal * estandar : 1;
                const cantStock = stocks[idSubcategoria2] || 0;
                item.Stock = Math.round((cantStock > 0 ? (cantStock / adecuacion) : 0) );

                const duracion = parseInt(inv.DURACION) || 0;
                const fechaVenc = new Date();
                fechaVenc.setDate(fechaVenc.getDate() + duracion);
                const dd = String(fechaVenc.getDate()).padStart(2, '0');
                const mm = String(fechaVenc.getMonth() + 1).padStart(2, '0');
                const yyyy = fechaVenc.getFullYear();
                item.Vencimiento = `${dd}/${mm}/${yyyy}`;
                if (inv.AREA_PRODUCCION != 2 && existe &&
                    (tipo == 0 || (tipo == 1 && item.Stock < sum) || (tipo == 2 && item.Stock >= sum))) {
                    if (!turnosPedido[idSubcategoria2]) {
                        turnosPedido[idSubcategoria2] = [];
                    }
                    if (pedidoPrincipal == 0) {
                        turnosPedido[idSubcategoria2].push(nomTurno);
                    }

                    item.Total = sum;
                    item.estadoStock = item.Stock >= sum;
                    item.Total_enviado = sum2;
                    item.pedido_principal = pedidoPrincipal;
                    item.turnoSol = turnoSol;
                    arrayResponse.push(item);
                }
            }
        }

        cabecera.push('Total');
        cabecera.push('Vencimiento');

        const respuesta = {
            success: true,
            cabecera2: cabecera,
            estado_planta: ESTADO_PLANTA,
            cabecera: cabecera2,
            sucursal: codigoSucursal,
            sucursales: sucs,
            sucursales2: sucs2,
            consolidados: arrayResponse,
            turnosPedido
        };
        return respuesta;
    },

    async guardarPedidosConsolidados({ fecha, sucursales, idUsuario }) {
        const sucursals = await SucursalService.getSucursales();
        const sucSuf = {};
        for (const suc of sucursals) {
            sucSuf[suc.CODIGO] = suc.SUFIJO || '';
        }

        const bloqueados = [];

        for (const [codigo, productos] of Object.entries(sucursales)) {
            const sufijo = sucSuf[codigo] || '';
            if (!sufijo) continue;
            const dbName = getDbName(codigo);

            const resCabecera = await ConsolidadosRepository.getCabeceraPedidoByFechaEntrega(dbName, sufijo, fecha);
            if (!resCabecera) continue;

            const items = productos.map(p => ({
                idSub2: p.idSub2 || 0,
                turno: p.turno || ''
            }));

            const locks = await ConsolidadosRepository.verificarProductosBloqueados(
                dbName, sufijo, resCabecera.ID_CABECERA, items
            );

            for (const lock of locks) {
                bloqueados.push({
                    sucursal: codigo,
                    idSub2: lock.ID_SUBCATEGORIA_2,
                    turno: lock.TURNO,
                    estado: lock.ESTADO_CONTEO,
                    sub2: lock.NOMBRE_PRODUCTO
                });
            }
        }

        if (bloqueados.length > 0) {
            return {
                success: false,
                message: 'No se pueden guardar los cambios, existen productos ya procesados.',
                bloqueados
            };
        }

        let resUpdate = false;
        for (const [codigo, productos] of Object.entries(sucursales)) {
            const sufijo = sucSuf[codigo] || '';
            if (!sufijo) continue;
            const dbName = getDbName(codigo);

            try {
                const resCabecera = await ConsolidadosRepository.getCabeceraPedidoByFechaEntrega(dbName, sufijo, fecha);
                if (resCabecera) {
                    const idCabecera = resCabecera.ID_CABECERA;
                    const trxSuc = await ConsolidadosRepository.beginTransaction(dbName);

                    try {
                        for (const prod of productos) {
                            const cantidad = prod.cantidad || 0;
                            const obs = prod.observacion || '';
                            const turno = prod.turno || '';
                            const idSub2 = prod.idSub2 || 0;
                            const pedido = await ConsolidadosRepository.verifPedidoPrincipal(dbName, sufijo, resCabecera.ID_CABECERA, idSub2, turno, trxSuc);
                            const editar = pedido ? 1 : 0;
                            const idProductoDetalle = prod.id_protucto_detalle || 0;
                            const pedidoPrincipal = pedido ? (pedido.pedido_principal || 0) : 0;

                            if (editar) {
                                if (pedidoPrincipal == 1) {
                                    resUpdate = await ConsolidadosRepository.editarCantEnviadaDecl(
                                        dbName, sufijo, cantidad, idCabecera, turno, idSub2, obs, idProductoDetalle, idUsuario, trxSuc
                                    );
                                } else {
                                    resUpdate = await ConsolidadosRepository.editarCantidadEnviada(
                                        dbName, sufijo, cantidad, turno, idSub2, idCabecera, obs, idProductoDetalle, idUsuario, trxSuc
                                    );
                                }
                            } else {
                                resUpdate = await ConsolidadosRepository.insertNewEnvio(
                                    dbName, sufijo, cantidad, idCabecera, turno, idSub2, idUsuario, obs, idProductoDetalle, trxSuc
                                );
                            }
                        }

                        await trxSuc.commit();
                    } catch (error) {
                        await trxSuc.rollback();
                        console.warn(`[Consolidados] Error al guardar cambios en sucursal ${codigo}: ${error.message}`);
                        throw error;
                    }
                }
            } catch (e) {
                console.warn(`[Consolidados] Error en sucursal ${codigo}: ${e.message}`);
            }
        }

        if (resUpdate) {
            const perfil = process.env.PERFIL_JEJA_ALMACEN || 'Global'
            const userIds = await getUsuariosByPerfil(perfil);
            const mensaje = `Se realizaron cambios en los pedidos de las sucursales, revise el módulo de pedidos.`;
            await notificarAUsuarios(userIds, {
                tipo: 'pedido',
                titulo: 'Pedidos de sucursales actualizados',
                mensaje,
                referenciaModulo: 'pedido',
                usuarioOrigen: idUsuario
            });
            return { success: true, message: 'Se guardo correctamente los cambios solicitados.' };
        }
        return { success: false, message: 'Ocurrio un error al guardar los cambios.' };
    }
};

module.exports = ConsolidadosService;

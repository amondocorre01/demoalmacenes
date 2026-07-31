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
    async listarPedidosConsolidados({ fecha_reporte, tipo_reporte, sucursal: id_sucursal, tipo, producible, filtrar_total, filtrar_restante }) {
        const [sucursales, inventarios, stocks, turnosAll] = await Promise.all([
            SucursalService.getSucursales(),
            InventarioService.getInventariosSubcategoria2(fecha_reporte, 'ALL'),
            StockService.getStocksPlanta(),
            TurnoService.getTurnosAll()
        ]);

        const pedidosResults = await Promise.all(sucursales.map(suc =>
            InventarioService.getPedidoSucursalTurno(
                getDbName(suc.CODIGO), suc.SUFIJO || '', fecha_reporte, tipo_reporte
            ).catch(e => {
                console.warn(`[Consolidados] Error al obtener pedidos de sucursal ${suc.CODIGO}: ${e.message}`);
                return { pedidos: {}, estado_cabecera: 0 };
            })
        ));

        const listasPedidos = {};
        const estadosCab = {};
        const sucs = {};
        const sucs2 = {};
        const cabecera2 = [];
        let codigoSucursal = '';

        for (let i = 0; i < sucursales.length; i++) {
            const { CODIGO: codigo, ID_UBICACION: idSuc } = sucursales[i];
            const pedidoData = pedidosResults[i];

            if (pedidoData.pedidos && Object.keys(pedidoData.pedidos).length > 0 &&
                (codigo !== 'feria' || id_sucursal > 0)) {
                listasPedidos[codigo] = pedidoData.pedidos;
                estadosCab[codigo] = pedidoData.estado_cabecera || 0;
                if (idSuc == id_sucursal || id_sucursal == 0) cabecera2.push(codigo);
                codigoSucursal = idSuc == id_sucursal ? codigo : codigoSucursal;
                sucs2[codigo] = idSuc;
                sucs[idSuc] = codigo;
            }
        }

        let arrayResponse = [];
        const turnosPedido = {};
        const cabecera = ['Categoria', 'SubCategoria', 'Producto', 'Turno'];
        const sinFiltroSuc = id_sucursal == 0;
        const lenSuc = sucursales.length;

        for (const inv of inventarios) {
            if (inv.AREA_PRODUCCION == 2) continue;

            const idSub = inv.ID_SUB_CATEGORIA_2;
            const grupo = inv.GRUPO;
            const adec = inv.CANTIDAD_ADECUACION_PEDIDOS || 1;
            const est = inv.CANTIDAD_ESTANDARIZADA || 1;
            const adecuacion = grupo == 1 ? adec * est : 1;
            const stock = Math.round((stocks[idSub] || 0) / adecuacion);

            const fechaVenc = new Date();
            fechaVenc.setDate(fechaVenc.getDate() + (parseInt(inv.DURACION) || 0));
            const venc = `${String(fechaVenc.getDate()).padStart(2, '0')}/${String(fechaVenc.getMonth() + 1).padStart(2, '0')}/${fechaVenc.getFullYear()}`;

            const btnProducto = inv.ESTADO_ADECUACION || 0;
            const cat = inv.CATEGORIA;
            const sub1 = inv.SUB_CATEGORIA_1;
            const sub2 = inv.SUB_CATEGORIA_2;

            for (const turno of turnosAll) {
                const nomTurno = turno.TURNO || '';
                let sum = 0, sum2 = 0, existe = false, pedidoPrincipal = 0, turnoSol = null;

                const item = {
                    id_sub_categoria_2: idSub,
                    Categoria: cat, SubCategoria: sub1, Producto: sub2,
                    Turno: nomTurno, idTurno: turno.ID_TURNO || 0,
                    btnProducto, Stock: stock, Vencimiento: venc
                };

                for (let j = 0; j < lenSuc; j++) {
                    const suc = sucursales[j];
                    const codigo = suc.CODIGO;
                    const pedido = listasPedidos[codigo]?.[idSub]?.[nomTurno];

                    const totalEnv = pedido?.cantidad_enviada || 0;
                    const estadoP = pedido?.estado || 0;

                    if (pedido) {
                        turnoSol = turnoSol || pedido.turnoSol || '';
                        if (pedidoPrincipal == 0) pedidoPrincipal = pedido.pedido_principal || 0;
                        existe = existe || (estadoP >= 9);
                        if (estadoP == 11) { sum += totalEnv; }
                        else if (estadoP > 11) { sum2 += totalEnv; }
                    }

                    if (sinFiltroSuc || id_sucursal == suc.ID_UBICACION) {
                        const ec = estadosCab[codigo] || 0;
                        item[codigo] = {
                            id_producto_detalle: pedido?.id_producto_detalle || 0,
                            cantidad_solicitada: pedido?.cantidad_solicitada || 0,
                            cantidad_enviada: totalEnv,
                            estado: ec >= 12 ? ec : estadoP
                        };
                    }
                }

                const pasaTipo = tipo == 0 || (tipo == 1 && stock < sum) || (tipo == 2 && stock >= sum);
                if (!existe || !pasaTipo) continue;

                if (!turnosPedido[idSub]) turnosPedido[idSub] = [];
                if (pedidoPrincipal == 0) turnosPedido[idSub].push(nomTurno);

                item.Total = sum;
                item.estadoStock = stock >= sum;
                item.Total_enviado = sum2;
                item.pedido_principal = pedidoPrincipal;
                item.turnoSol = turnoSol;
                arrayResponse.push(item);
            }
        }

        if (producible) {
            const itemsConTotal = arrayResponse.filter(i => (i.Total-i.Total_enviado) > 0);
            if (itemsConTotal.length > 0) {
                const idsSub = [...new Set(itemsConTotal.map(i => i.id_sub_categoria_2))];

                const [ingredientes, almacenes] = await Promise.all([
                    ConsolidadosRepository.getRecetaIngredientes(idsSub),
                    ConsolidadosRepository.getAlmacenesBySubcategorias(idsSub)
                ]);

                const ingBySub = {};
                for (const ing of ingredientes) {
                    (ingBySub[ing.ID_SUB_CATEGORIA_2] = ingBySub[ing.ID_SUB_CATEGORIA_2] || []).push(ing);
                }
                const almBySub = {};
                for (const alm of almacenes) {
                    (almBySub[alm.ID_SUB_CATEGORIA_2] = almBySub[alm.ID_SUB_CATEGORIA_2] || []).push(alm);
                }

                const allAlmIds = [...new Set(almacenes.map(a => a.ID_PLANTA_ALMACEN))];
                const stockRows = await ConsolidadosRepository.getStockIngredientes(allAlmIds, fecha_reporte);

                const stockMap = {};
                for (const row of stockRows) {
                    stockMap[`${row.ID_PLANTA_ALMACEN}_${row.ID_PRODUCTO}_${row.ID_PRODUCTO_INTERMEDIO}`] = row.CANTIDAD;
                }

                for (const item of itemsConTotal) {
                    const ings = ingBySub[item.id_sub_categoria_2] || [];
                    const alms = almBySub[item.id_sub_categoria_2] || [];

                    if (ings.length === 0 || alms.length === 0) {
                        item.producible = 0;
                        continue;
                    }

                    let minProducible = Infinity;
                    for (const ing of ings) {
                        let stockTotal = 0;
                        for (const alm of alms) {
                            stockTotal += stockMap[`${alm.ID_PLANTA_ALMACEN}_${ing.ID_PRODUCTO}_${ing.ID_PRODUCTO_INTERMEDIO}`] || 0;
                        }
                        const cant = ing.CANTIDAD > 0 ? Math.floor(stockTotal / ing.CANTIDAD) : 0;
                        if (cant < minProducible) minProducible = cant;
                    }
                    item.producible = minProducible === Infinity ? 0 : minProducible;
                }
            }
        }
        for (const item of arrayResponse) {
            if (item.producible === undefined) item.producible = 0;
        }

        arrayResponse = arrayResponse.filter(i =>
            (!filtrar_total || i.Total > 0) &&
            (!filtrar_restante || (i.Total - i.Total_enviado - i.producible - i.Stock) > 0)
        );

        cabecera.push('Total', 'Vencimiento');

        return {
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

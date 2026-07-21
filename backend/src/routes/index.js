const express = require('express');
const router = express.Router();

const modules = [
    { path: '/almacen', routes: require('../modules/almacen/almacen.routes') },
    { path: '/almacen-receta', routes: require('../modules/almacen-receta/almacen-receta.routes') },
    { path: '/productos-intermedios', routes: require('../modules/productos-intermedios/productos-intermedios.routes') },
    { path: '/inventario', routes: require('../modules/inventario/inventario.routes') },
    { path: '/configuracion', routes: require('../modules/configuracion/configuracion.routes') },
    { path: '/devolucion-producto', routes: require('../modules/devolucion-producto/devolucion-producto.routes') },
    { path: '/pedidos', routes: require('../modules/pedidos/pedidos.routes') },
    { path: '/recetas-intermedias', routes: require('../modules/recetas-intermedias/recetas-intermedias.routes') },
    { path: '/transferencia', routes: require('../modules/transferencia/transferencia.routes') },
    { path: '/seguridad', routes: require('../modules/seguridad/seguridad.routes') },
    { path: '/notificaciones', routes: require('../modules/notificacion/notificacion.routes') },
    { path: '/notificaciones/admin', routes: require('../modules/notificacion/notificacion.admin.routes') },
    { path: '/notify', routes: require('../modules/notificacion/notificacion.cross-system.routes') },
    { path: '/pedidos-sucursal', routes: require('../modules/pedidos-sucursal/consolidados.routes') },
];

router.get('/', (req, res) => {
    res.json({
        success: true,
        mensaje: 'API v1 de Planta',
        version: '1.0.0',
        endpoints: {}
    });
});

modules.forEach(({ path, routes }) => router.use(path, routes));

module.exports = router;

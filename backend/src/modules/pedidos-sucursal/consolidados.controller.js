const ConsolidadosService = require('./consolidados.service');

const ConsolidadosController = {
    async listarPedidos(req, res, next) {
        try {
            const { fecha_reporte, tipo_reporte, sucursal, tipo } = req.query;
            if (!fecha_reporte || !tipo_reporte) {
                return res.status(400).json({ success: false, message: 'fecha_reporte y tipo_reporte son requeridos' });
            }
            const result = await ConsolidadosService.listarPedidosConsolidados({
                fecha_reporte, tipo_reporte,
                sucursal: sucursal ? parseInt(sucursal) : 0,
                tipo: tipo ? parseInt(tipo) : 0
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    async guardarCambios(req, res, next) {
        try {
            const { fecha, sucursales } = req.body;
            const idUsuario = req.user?.id || 0;
            if (!fecha || !sucursales) { 
                return res.status(400).json({ success: false, message: 'fecha y sucursales son requeridos' });
            }
            const result = await ConsolidadosService.guardarPedidosConsolidados({ fecha, sucursales, idUsuario });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ConsolidadosController;

const Repo = require('./reposicion-alamcen.repository');
const { AppError } = require('../../middleware/errorHandler');

const FECHA_RE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DIAS_EDITABLES = 2;

function validarFecha(fecha) {
    if (typeof fecha !== 'string' || !FECHA_RE_ISO.test(fecha)) return false;
    const date = new Date(`${fecha}T00:00:00`);
    return !isNaN(date.getTime());
}

function calcularDiasEdicion(fechaFin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(`${fechaFin}T00:00:00`);

    const diffMs = Math.abs(endDate.getTime() - today.getTime());
    const diffDays = Math.round(diffMs / 86400000);

    let dias;
    if (endDate >= today) {
        dias = -diffDays;
    } else {
        dias = diffDays;
    }

    return dias;
}

function parseProductos(productos) {
    if (productos == null) return [];
    if (typeof productos === 'string') {
        try {
            return JSON.parse(productos);
        } catch (e) {
            return [];
        }
    }
    return productos;
}

class ReposicionAlmacenService {

    async getCanalesVenta(user) {
        const idUsuario = user?.ID_USUARIO || user?.id || user?.id_usuario || 0;

        let perfil = user?.PERFIL || user?.perfil || '';
        if (!perfil && idUsuario) {
            perfil = await Repo.getPerfilUsuario(idUsuario);
        }

        const perfilUpper = String(perfil || '').toUpperCase();
        const q = (perfilUpper.includes('PRODUCCION') || perfilUpper.includes('PLANTA')) ? 'PLANTA' : '';

        return await Repo.getCanalesVentaReposicion(q);
    }

    async getVentas({ id_nombre_lista_precio = 0, fecha_inicio = '', fecha_fin = '' } = {}) {
        if (!validarFecha(fecha_inicio) || !validarFecha(fecha_fin)) {
            throw new AppError('Fechas inválidas', 400);
        }

        const idCanalVenta = id_nombre_lista_precio || 0;
        const fechaFin = `${fecha_fin} 23:59:59`;
        const dias = calcularDiasEdicion(fecha_fin);
        const editar = dias <= DIAS_EDITABLES;

        const ventas = await Repo.getVentasReposicion(fecha_inicio, fechaFin, idCanalVenta);
        const data = ventas.map(venta => ({
            ...venta,
            PRODUCTOS: parseProductos(venta.PRODUCTOS)
        }));

        const empleados = await Repo.getEmpleados(idCanalVenta);

        return { data, empleados, editar };
    }

    async updateVentas(ventas = [], idUsuario = 0) {
        const fecha = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
        let count = 0;

        for (const venta of ventas) {
            const idVentaReposicion = venta.id_venta_reposicion ?? '';
            const idEmpleado = venta.id_empleado ?? 0;

            if (!idVentaReposicion || !idEmpleado) continue;
            if (!(await Repo.existeEmpleado(idEmpleado))) continue;

            const updated = await Repo.updateVentaReposicion(idVentaReposicion, idEmpleado);
            if (updated > 0) {
                count++;
                await Repo.registerVentasReposicionLog(idVentaReposicion, idUsuario, idEmpleado, fecha);
            }
        }

        if (count > 0) {
            return { success: true, message: 'Se guardo correctamente la información.' };
        }

        return { success: false, message: 'No se guardo nada.' };
    }
}

module.exports = new ReposicionAlmacenService();
const Repo = require('./seguridad.repository');

class SeguridadService {

    async getAccesibilidadAlmacen() {
        const usuarios = await Repo.getAccesibilidadAlmacen();
        if (!usuarios || usuarios.length === 0) {
            return { status: false, message: 'No existen datos.' };
        }
        return { status: true, usuarios };
    }

    async setAccesoAlmacen(data, idUsuarioSession) {
        const { id_almacen = 0, id_usuario = 0, estado = 0 } = data;
        if (!id_usuario || !id_almacen) {
            throw Object.assign(new Error('id_almacen y id_usuario requerido.'), { status: 400 });
        }

        const existe = await Repo.existePermisoAlmacen(id_usuario, id_almacen);
        if (existe) {
            await Repo.actualizarPermisoAlmacen(id_usuario, id_almacen, estado, idUsuarioSession);
        } else {
            await Repo.insertarPermisoAlmacen(id_usuario, id_almacen, estado, idUsuarioSession);
        }

        const mensaje = estado === 0
            ? 'El acceso se ha quitado correctamente.'
            : 'El acceso se ha asignado correctamente.';

        return { status: true, message: mensaje };
    }

}

module.exports = new SeguridadService();

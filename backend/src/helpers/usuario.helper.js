const { query } = require('../config/database');

async function getUsuariosByPerfil(perfil = 'Global') {
    const perfiles = Array.isArray(perfil) ? perfil : [perfil];
    const conditions = perfiles.map((_, i) => `TRIM(UPPER(vp.PERFIL)) = TRIM(UPPER(@perfil_${i}))`);
    const params = perfiles.map((p, i) => ({ name: `perfil_${i}`, value: p }));

    const sqlQuery = `
        SELECT ID_USUARIO FROM VENTAS_USUARIOS vu
        INNER JOIN VENTAS_PERFIL vp ON vp.ID_VENTAS_PERFIL = vu.ID_VENTAS_PERFIL
        WHERE vu.ELIMINADO = 0 AND (${conditions.join(' OR ')})
    `;
    const result = await query(sqlQuery, params, 'default');
    return result.recordset.map(u => u.ID_USUARIO);
}
async function getUsuariosByPerfilAndAlmacen(perfil = 'Global',idAlmacen=0) {
   const usuariosPerfil = await getUsuariosByPerfil(perfil);
    const sqlQuery = `
        SELECT ID_USUARIO 
        FROM PLANTA_PERMISO_ALMACEN ppa
        WHERE ppa.ID_PLANTA_ALMACEN = @idAlmacen 
          AND ppa.ESTADO = 1
    `;
    const result = await query(sqlQuery, [{ name: 'idAlmacen', value: idAlmacen }], 'planta');

    const usuariosAlmacen = result.recordset.map(u => u.ID_USUARIO);
    const comunes = usuariosPerfil.filter(id => usuariosAlmacen.includes(id));
    return comunes || [];
}

module.exports = { getUsuariosByPerfil,getUsuariosByPerfilAndAlmacen };

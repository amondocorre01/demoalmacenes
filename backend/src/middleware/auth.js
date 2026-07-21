require('dotenv').config();
const logger = require('../helpers/logger');

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies?.gp_auth;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                mensaje: 'No se proporcionó token de autenticación'
            });
        }

        const authSystemUrl = process.env.AUTH_SYSTEM_URL || 'http://localhost:3001';
        const verifyEndpoint = process.env.AUTH_VERIFY_ENDPOINT || '/api/auth/verify';

        const response = await fetch(`${authSystemUrl}${verifyEndpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(401).json({
                success: false,
                mensaje: 'Token inválido o expirado'
            });
        }

        const userData = await response.json();

        req.user = userData.user;
        logger.info(`[AuthMiddleware] User: ${req.user?.email || 'unknown'}, ID: ${req.user?.id || 'NONE'}`);

        try {
            const { query } = require('../config/database');
            const userId = req.user.id || req.user.id_usuario || req.user.ID_USUARIO;

            const rolesResult = await query(`
                    SELECT r.CODIGO_ROL 
                    FROM ROLES r
                    JOIN USUARIOS_ROLES ur ON r.ID_ROL = ur.ID_ROL
                    WHERE ur.ID_USUARIO = @idUsuario
                `,[{ name: 'idUsuario', value: userId }],'permisos');

            const roles = rolesResult.recordset.map(r => r.CODIGO_ROL.trim());
            req.user.roles = roles;
            req.user.isGlobalAdmin = roles.includes('ADMIN_PLANTA');
            const appCode = process.env.APP_CODE || 'GESTION_PLANTA';
            const permsResult = await query(`
                    SELECT DISTINCT f.CODIGO_FUNCIONALIDAD
                    FROM dbo.vw_MenuUsuario v
                    JOIN FUNCIONALIDADES f ON f.ID_FUNCIONALIDAD = v.ID_FUNCIONALIDAD
                    JOIN MODULOS m ON m.ID_MODULO = v.ID_MODULO
                    WHERE v.ID_USUARIO = @idUsuario AND v.CODIGO_APP = @appCode
                `,[
                  { name: 'idUsuario', value: userId },
                  { name: 'appCode', value: appCode }
                ],'permisos');
            req.user.permisos = permsResult.recordset.map(p => p.CODIGO_FUNCIONALIDAD.trim());
        } catch (dbErr) {
            logger.error('Error al cargar permisos adicionales:', { error: dbErr.message });
            req.user.roles = req.user.roles || [];
            req.user.permisos = req.user.permisos || [];
        }

        next();
    } catch (err) {
        logger.error('Error en middleware de autenticación:', { error: err.message });
        return res.status(500).json({
            success: false,
            mensaje: 'Error al validar autenticación'
        });
    }
};

module.exports = authMiddleware;

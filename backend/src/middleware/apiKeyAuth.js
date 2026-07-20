require('dotenv').config();
const { query } = require('../config/database');

const API_KEY_HEADER = 'x-api-key';

const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.headers[API_KEY_HEADER];

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API Key requerida en header x-api-key'
        });
    }

    try {
        const result = await query(`
            SELECT ID_API_KEY, NOMBRE_SISTEMA, PERMISOS, ACTIVO
            FROM NOTIFICACION_API_KEY
            WHERE API_KEY = @apiKey AND ACTIVO = 1
        `, [{ name: 'apiKey', value: apiKey }], 'planta');

        const keyRecord = result.recordset[0];

        if (!keyRecord) {
            return res.status(401).json({
                success: false,
                message: 'API Key inválida o inactiva'
            });
        }

        req.apiKey = {
            id: keyRecord.ID_API_KEY,
            sistema: keyRecord.NOMBRE_SISTEMA,
            permisos: keyRecord.PERMISOS ? JSON.parse(keyRecord.PERMISOS) : []
        };

        console.log(`[ApiKeyAuth] Sistema autorizado: ${keyRecord.NOMBRE_SISTEMA}`);
        next();
    } catch (err) {
        console.error('[ApiKeyAuth] Error validando API key:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al validar API Key'
        });
    }
};

const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.apiKey) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado con API Key'
            });
        }

        if (!req.apiKey.permisos.includes(permission) && !req.apiKey.permisos.includes('*')) {
            return res.status(403).json({
                success: false,
                message: `Permiso requerido: ${permission}`
            });
        }

        next();
    };
};

module.exports = { apiKeyAuth, requirePermission };

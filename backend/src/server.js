process.env.TZ = 'America/La_Paz';

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const { getPool, testConnection } = require('./config/database');
const { initSocketIO, configurarVapid } = require('./helpers/notification.helper');

const authMiddleware = require('./middleware/auth');
const ErrorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3081;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3080';
const CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'planta-backend';
const CALLBACK_URL = process.env.OAUTH_CALLBACK_URL || 'http://localhost:3081/api/auth/callback';
const AUTH_SYSTEM_URL = process.env.AUTH_SYSTEM_URL || 'http://localhost:3001';
const TOKEN_URL = process.env.OAUTH_TOKEN_URL || `${AUTH_SYSTEM_URL}/api/auth/token`;
const USERINFO_URL = process.env.OAUTH_USERINFO_URL || `${AUTH_SYSTEM_URL}/api/auth/userinfo`;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || 'lax';

const redirectToFrontend = (res, params = {}, baseUrl = null) => {
    const base = baseUrl || FRONTEND_URL;
    const redirectUrl = new URL(`${base.replace(/\/$/, '')}/auth/callback`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            redirectUrl.searchParams.set(key, value);
        }
    });
    return res.redirect(redirectUrl.toString());
};

app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({
    name: 'planta.sid',
    secret: process.env.SESSION_SECRET || 'planta_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: COOKIE_SAMESITE,
        secure: COOKIE_SECURE,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3070,http://localhost:3060,http://localhost:3050')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn('Bloqueado por CORS:', origin);
            callback(new Error('CORS no permitido'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.get('/api/health', async (req, res) => {
    const healthData = {
        status: 'OK',
        service: 'planta-backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: {}
    };

    try {
        const plantaOk = await testConnection('planta');
        healthData.database.planta = plantaOk ? 'connected' : 'error';
        res.status(200).json(healthData);
    } catch (error) {
        healthData.status = 'ERROR';
        healthData.error = error.message;
        res.status(503).json(healthData);
    }
});

app.post('/api/auth/oauth-state', (req, res) => {
    console.log('[API] Hit /api/auth/oauth-state', req.body);
    const { state, nonce, frontend_url } = req.body || {};

    if (!state) {
        return res.status(400).json({ error: 'El parámetro "state" es obligatorio' });
    }

    req.session.oauthState = state;
    req.session.oauthNonce = nonce;
    if (req.body.client_id) {
        req.session.oauthClientId = req.body.client_id;
    }

    if (frontend_url) {
        req.session.oauthRedirectBase = frontend_url;
    }

    req.session.save((err) => {
        if (err) {
            console.error('Error guardando sesión:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
        return res.json({ success: true });
    });
});

app.get('/api/auth/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return redirectToFrontend(res, { error });
    }

    if (!code) {
        return redirectToFrontend(res, { error: 'missing_code' });
    }

    const storedState = req.session.oauthState;
    const redirectBase = req.session.oauthRedirectBase;
    const storedClientId = req.session.oauthClientId;

    console.log('[Auth Callback] Session Data:', {
        storedState,
        redirectBase,
        storedClientId,
        sessionID: req.sessionID
    });

    if (!storedState) {
        return redirectToFrontend(res, { error: 'state_not_initialized' }, redirectBase);
    }

    if (!state || state !== storedState) {
        return redirectToFrontend(res, { error: 'invalid_state' }, redirectBase);
    }

    const storedNonce = req.session.oauthNonce;

    let stateMeta = {};
    try {
        const decoded = Buffer.from(state, 'base64').toString('ascii');
        if (decoded.startsWith('{')) {
            stateMeta = JSON.parse(decoded);
        }
    } catch (e) {
        console.log('[Auth Callback] State is generic string');
    }

    const clientIdToUse = stateMeta.cid || req.session.oauthClientId || CLIENT_ID;
    const effectiveRedirect = stateMeta.ret || req.session.oauthRedirectBase || FRONTEND_URL;

    console.log('[Auth Callback] Resolved Context:', {
        clientIdToUse,
        effectiveRedirect,
        fromState: !!stateMeta.cid
    });

    delete req.session.oauthState;
    delete req.session.oauthNonce;
    delete req.session.oauthRedirectBase;
    delete req.session.oauthClientId;

    req.session.save();

    try {
        let clientSecret = process.env.OAUTH_CLIENT_SECRET || '';
        
        if (clientIdToUse === 'gestion-planta-almacen') {
            clientSecret = 'planta_secret_2026';
        }

        const basicAuth = Buffer
            .from(`${clientIdToUse}:${clientSecret}`)
            .toString('base64');

        const tokenPayload = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: CALLBACK_URL,
            client_id: clientIdToUse,
            client_secret: clientSecret
        });

        const tokenResponse = await axios.post(
            TOKEN_URL,
            tokenPayload.toString(),
            {
                headers: {
                    Authorization: `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;

        let userInfo = null;
        try {
            const userResponse = await axios.get(USERINFO_URL, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'X-Client-Id': CLIENT_ID
                }
            });
            userInfo = userResponse.data?.user || userResponse.data || null;
        } catch (userErr) {
            console.warn('[Auth Callback] No se pudo obtener userinfo:', userErr.response?.data || userErr.message);
        }

        const cookieOptions = {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SAMESITE,
            maxAge: (expires_in || 3600) * 1000
        };

        res.cookie('gp_auth', access_token, cookieOptions);

        if (refresh_token) {
            res.cookie('gp_refresh', refresh_token, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }

        return redirectToFrontend(res, {
            success: 'true',
            nonce: storedNonce || undefined,
            user: JSON.stringify(userInfo || {})
        }, effectiveRedirect);
    } catch (err) {
        console.error('[Auth Callback] Error al intercambiar código:', err.response?.data || err.message);
        return redirectToFrontend(res, { error: 'token_exchange_failed' }, effectiveRedirect);
    }
});

app.post('/api/auth/logout', async (req, res) => {
    res.clearCookie('gp_auth');
    res.clearCookie('gp_refresh');

    const token = req.cookies?.gp_auth ||
        req.cookies?.access_token ||
        (req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (token) {
        try {
            const url = `${process.env.AUTH_SYSTEM_URL}/api/auth/logout?all_sessions=true`;
            await axios.post(url, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Client-Id': process.env.OAUTH_CLIENT_ID
                },
                withCredentials: true
            });
        } catch (error) {
            console.warn('[Logout] Error al cerrar sesión en AuthSystem:', error.message);
        }
    }

    req.session.destroy((err) => {
        if (err) console.error('Error al destruir sesión:', err);
        res.json({ success: true, mensaje: 'Sesión cerrada' });
    });
});

const publicPaths = [
    '/api/health',
    '/api/auth/oauth-state',
    '/api/auth/callback',
    '/api/permissions/check',
    '/api/v1/notify'
];

app.use((req, res, next) => {
    const isPublic = publicPaths.some(path => req.path.startsWith(path));
    if (isPublic) {
        return next();
    }
    authMiddleware(req, res, next);
});

app.get('/api/menu', async (req, res) => {
    const token = req.cookies?.gp_auth ||
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);
    if (!token) {
        return res.status(401).json({ success: false, mensaje: 'No autenticado//' });
    }

    try {
        
        const appCode = process.env.APP_CODE || 'GESTION_PLANTA';
        const url = `${process.env.AUTH_SYSTEM_URL}/api/permissions/menu?app_code=${encodeURIComponent(appCode)}`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Client-Id': process.env.OAUTH_CLIENT_ID 
          },
          withCredentials: true
        });
        res.json(response.data);
    } catch (err) {
        console.error('[Menu] Error:', err.response?.data || err.message);
        res.status(err.response?.status || 500).json({
            success: false,
            mensaje: 'Error al obtener menú'
        });
    }
});
app.get('/api/applications', async (req, res) => {
  try {
    const token = req.cookies?.gp_auth ||
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);
    const url = `${process.env.AUTH_SYSTEM_URL}/api/applications`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-Id': process.env.OAUTH_CLIENT_ID
      },
      withCredentials: true
    });
    // Filtrar para mostrar solo las aplicaciones marcadas como visibles en el launcher
    const visibleApps = (response.data || []).filter(app => app.VISIBLE_LAUNCHER || app.visibleLauncher);
    res.json(visibleApps);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.response?.data?.error || error.message });
  }
});
app.get('/api/permissions/check', async (req, res) => {
    const token = req.cookies?.gp_auth;
    if (!token) {
        return res.status(401).json({ success: false, mensaje: 'No autenticado' });
    }

    const { functionality, action } = req.query;
    if (!functionality) {
        return res.status(400).json({ success: false, mensaje: 'Parámetro functionality requerido' });
    }

    try {
        const response = await axios.get(`${AUTH_SYSTEM_URL}/api/permissions/check`, {
            params: { functionality, action },
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Client-Id': CLIENT_ID
            }
        });
        res.json(response.data);
    } catch (err) {
        console.error('[Permissions] Error:', err.response?.data || err.message);
        res.status(err.response?.status || 500).json({
            success: false,
            mensaje: 'Error al verificar permiso'
        });
    }
});

app.get('/api/auth/me', (req, res) => {
    if (!req.user) { 
        return res.status(401).json({ success: false, mensaje: 'No autenticado' });
    }
    res.json({ success: true, user: req.user });
});

app.use('/api/v1', require('./routes/index'));

app.use((err, req, res, next) => {
    console.error('Error:', err);
    const data = {
        success: false,
        mensaje: err.message || 'Error interno del servidor'
    };
    if (err.productos) data.productos = err.productos;
    res.status(err.statusCode || err.status || 500).json(data);
});

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

async function startServer() {
    try {
        console.log('===========================================');
        console.log('  PLANTA Backend API v1.0.0 (RESTful)');
        console.log('===========================================');
        
        console.log('[DB] Probando conexión a base de datos...');
        const plantaOk = await testConnection('planta');
        if (!plantaOk) {
            console.warn('[DB] Advertencia: No se pudo conectar a la base de datos planta');
        } else {
            console.log('[DB] Conexión exitosa a planta');
        }

        const server = http.createServer(app);

        const io = initSocketIO(server, {
            cors: { origin: allowedOrigins, credentials: true }
        });

        configurarVapid(
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY,
            process.env.VAPID_SUBJECT || 'mailto:admin@capresso.com'
        );

        app.set('io', io);

        server.listen(PORT, () => {
            console.log(`  Puerto: ${PORT}`);
            console.log(`  Entorno: ${process.env.NODE_ENV}`);
            console.log(`  AuthSystem: ${AUTH_SYSTEM_URL}`);
            console.log(`  Socket.IO: activo`);
            console.log('===========================================');
            console.log('  Servidor iniciado correctamente');
            console.log(`  Health check: http://localhost:${PORT}/api/health`);
            console.log('===========================================');
        });
    } catch (err) {
        console.error('Error al iniciar servidor:', err);
        process.exit(1);
    }
}

startServer();

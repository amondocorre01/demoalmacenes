require('dotenv').config();

const sql = require('mssql');

const dbConfigs = {
    default: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_DEFAULT || 'BDGeneralImpuestos',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    permisos: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_PERMISSIONS || 'BDGestorPermisosDemo',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    planta: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_PLANTA || 'BdPlantaImpuestos',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    ventas: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_VENTAS || 'BDVentasImpuestos',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    ventasv3: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_VENTASV3 || 'BdVentasSucursalesCapresso',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    salamanca: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_SALAMANCA || 'BdVentasSucursalSalamanca',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    center: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_CENTER || 'BdVentasSucursalCenter',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    hupermall: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_HUPERMALL || 'BdVentasSucursalHupermall',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    aeste: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_AESTE || 'BdVentasSucursalAmericaE',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    aoeste: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_AOESTE || 'BdVentasSucursalAmericaO',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    pando: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_PANDO || 'BdVentasSucursalPando',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    lincoln: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_LINCOLN || 'BdVentasSucursalLincoln',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    jordan: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_JORDAN || 'BdVentasSucursalJordan',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    fidelanze: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_FIDELANZE || 'BdVentasSucursalFidelAnze',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },
    feria: {
        server: process.env.DB_SERVER || '192.168.10.160',
        database: process.env.DB_FERIA || 'BdPruebaF',
        user: process.env.DB_USER || 'capresso',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};

const pools = {};

async function getPool(dbName = 'planta') {
    if (!dbConfigs[dbName]) {
        console.warn(`[DB] Base de datos '${dbName}' no encontrada, usando 'planta'`);
        dbName = 'planta';
    }

    if (pools[dbName] && pools[dbName].connected) {
        return pools[dbName];
    }

    try {
        if (pools[dbName]) {
            await pools[dbName].connect();
            return pools[dbName];
        }
    } catch (e) {
        pools[dbName] = null;
    }

    console.log(`[DB] Conectando a base de datos: ${dbName} (${dbConfigs[dbName].database})`);
    pools[dbName] = new sql.ConnectionPool(dbConfigs[dbName]);
    await pools[dbName].connect();
    console.log(`[DB] Conexión establecida: ${dbName}`);
    return pools[dbName];
}

async function query(sqlQuery, params = [], dbName = 'planta', transaction = null) {
    let request;
    if (transaction) {
        request = transaction.request();
    } else {
        const pool = await getPool(dbName);
        request = pool.request();
    }
    if (params && params.length > 0) {
        for (const param of params) {
            if (param.type) {
                request.input(param.name, param.type, param.value);
            } else {
                request.input(param.name, param.value);
            }
        }
    }

    const result = await request.query(sqlQuery);
    return result;
}

async function rawQuery(sqlQuery, params = {}, dbName = 'planta', timeout = 15000, transaction = null) {
    let request;
    if (transaction) {
        request = transaction.request();
    } else {
        const pool = await getPool(dbName);
        request = pool.request();
    }
    request.timeout = timeout;

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                request.input(key, value);
            }
        }
    }

    const result = await request.query(sqlQuery);
    return result;
}

async function execute(spName, params = {}, dbName = 'planta') {
    const pool = await getPool(dbName);
    const request = pool.request();

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    return await request.execute(spName);
}

async function queryWithTransaction(transaction, sqlQuery, params = []) {
    const request = transaction.request();
    for (const param of params) {
        if (param.type) request.input(param.name, param.type, param.value);
        else request.input(param.name, param.value);
    }
    return await request.query(sqlQuery);
}

async function closePool(dbName) {
    if (pools[dbName]) {
        await pools[dbName].close();
        pools[dbName] = null;
    }
}

async function closeAll() {
    for (const dbName in pools) {
        await closePool(dbName);
    }
}

async function beginTransaction(dbName = 'planta') {
    const pool = await getPool(dbName);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    return transaction;
}

async function testConnection(dbName = 'planta') {
    try {
        const pool = await getPool(dbName);
        const result = await pool.request().query('SELECT 1 as test');
        return result.recordset[0].test === 1;
    } catch (error) {
        console.error(`[DB] Error en conexión ${dbName}:`, error.message);
        return false;
    }
}

module.exports = {
    getPool,
    query,
    rawQuery,
    queryWithTransaction,
    beginTransaction,
    execute,
    closePool,
    closeAll,
    testConnection,
    sql,
    dbConfigs
};

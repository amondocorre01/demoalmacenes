const logger = {
    info: (msg, meta = {}) => {
        console.log(JSON.stringify({ level: 'info', message: msg, ...meta, timestamp: new Date().toISOString() }));
    },
    warn: (msg, meta = {}) => {
        console.warn(JSON.stringify({ level: 'warn', message: msg, ...meta, timestamp: new Date().toISOString() }));
    },
    error: (msg, meta = {}) => {
        console.error(JSON.stringify({ level: 'error', message: msg, ...meta, timestamp: new Date().toISOString() }));
    },
};

module.exports = logger;

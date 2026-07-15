const logger = require('../helpers/logger');

const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path
    });
};

const handle = (err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';

    if (status >= 500) {
        logger.error(message, { stack: err.stack, path: req.path, method: req.method });
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(status).json({
            success: false,
            message,
            error: err.message,
            stack: err.stack
        });
    } else {
        res.status(status).json({
            success: false,
            message: status === 500 ? 'Error interno del servidor' : message
        });
    }
};

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    notFound,
    handle,
    AppError
};

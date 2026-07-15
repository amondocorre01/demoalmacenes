const getUserId = (req) => req.user?.ID_USUARIO || req.user?.id || req.user?.id_usuario;

module.exports = { getUserId };

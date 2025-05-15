const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

/**
 * Middleware para proteger rutas
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Obtener token de cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Obtener token de headers (opcional)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Si no hay token, devolver error de autorización
  if (!token) {
    res.status(401);
    throw new Error('No autorizado, no se proporcionó token');
  }

  try {
    // Verificar el token usando el secreto
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const [users] = await pool.query(
      'SELECT id, username, role, nombre FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    // Si el usuario no se encuentra en la base de datos, devolver error
    if (!users || users.length === 0) {
      res.status(401);
      throw new Error('Usuario no encontrado');
    }

    // Adjuntar el usuario al objeto request
    req.user = users[0];

    // Continuar con el siguiente middleware
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error.message);
    res.status(401);
    throw new Error('No autorizado, token inválido');
  }
});

/**
 * Middleware para restringir acceso a administradores
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Permitir acceso si el usuario es administrador
  } else {
    res.status(403);
    throw new Error('Acceso denegado, se requieren privilegios de administrador');
  }
};

module.exports = { protect, admin };

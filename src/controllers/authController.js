const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db'); // Corregido: Usamos el pool completo

// Constantes de configuración
const TOKEN_EXPIRATION = '1d'; // 1 día de expiración
const COOKIE_EXPIRATION = 24 * 60 * 60 * 1000; // 1 día en milisegundos

/**
 * Función para generar el token JWT
 * @param {Object} user - Usuario del que se generará el token
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

/**
 * Función para establecer la cookie de autenticación
 * @param {Object} res - Respuesta HTTP
 * @param {string} token - Token JWT
 */
const setAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo seguro en producción
    sameSite: 'strict',
    maxAge: COOKIE_EXPIRATION,
    domain: process.env.COOKIE_DOMAIN || 'localhost', // Ajusta según tu entorno
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
};

/**
 * Controlador para autenticación de usuarios
 */
const loginUser = async (req, res) => {
  console.log('Solicitud de login recibida desde:', req.ip);

  try {
    // Validación de los datos de entrada
    if (!req.body || typeof req.body !== 'object') {
      console.warn('Intento de login sin body válido');
      return res.status(400).json({
        success: false,
        message: 'Datos de solicitud no válidos',
      });
    }

    const { username, password } = req.body;

    // Validación de campos requeridos
    if (!username || !password) {
      console.warn('Campos requeridos faltantes', {
        usernameProvided: !!username,
        passwordProvided: !!password,
      });
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos',
      });
    }

    const cleanUsername = username.toString().trim();
    const cleanPassword = password.toString();

    // Buscar usuario en la base de datos usando pool.query
    const [users] = await pool.query(
      `SELECT id, username, password_hash, role, nombre 
       FROM usuarios 
       WHERE username = ? 
       LIMIT 1`,
      [cleanUsername]
    );

    if (!users || users.length === 0) {
      console.warn('Usuario no encontrado:', cleanUsername);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const user = users[0];

    // Comparación de contraseña con hash almacenado
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);

    if (!isPasswordValid) {
      console.warn('Contraseña incorrecta para usuario:', cleanUsername);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generación del token JWT
    const token = generateToken(user);

    // Configuración de la cookie de autenticación
    setAuthCookie(res, token);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nombre: user.nombre,
      },
      tokenExpiresIn: TOKEN_EXPIRATION,
    });
  } catch (error) {
    console.error('Error en el proceso de login:', {
      message: error.message,
      stack: error.stack,
      bodyReceived: req.body,
    });

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
      }),
    });
  }
};

/**
 * Controlador para cerrar sesión
 */
const logoutUser = (req, res) => {
  try {
    console.log('Solicitud de logout recibida');

    // Configuración para eliminar la cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo seguro en producción
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN || 'localhost', // Ajusta según tu entorno
      path: '/',
    };

    res.clearCookie('token', cookieOptions);

    console.log('Sesión cerrada correctamente');
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
    });
  }
};

/**
 * Controlador para obtener información del usuario actual
 */
const getMe = async (req, res) => {
  try {
    console.log('Solicitud de información de usuario recibida');

    if (!req.user || !req.user.id) {
      console.warn('Intento de acceso no autenticado');
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    // Buscar información del usuario en la base de datos
    const [users] = await pool.query(
      `SELECT id, username, role, nombre 
       FROM usuarios 
       WHERE id = ? 
       LIMIT 1`,
      [req.user.id]
    );

    if (!users || users.length === 0) {
      console.warn('Usuario no encontrado en DB aunque el token es válido');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    console.log('Información de usuario enviada');
    return res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del usuario',
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getMe,
};

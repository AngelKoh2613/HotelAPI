const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// Constantes de configuración
const TOKEN_EXPIRATION = '1d'; // 1 día de expiración
const COOKIE_EXPIRATION = 24 * 60 * 60 * 1000; // 1 día en milisegundos

/**
 * Controlador para autenticación de usuarios
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Object} Respuesta JSON con el resultado de la autenticación
 */
const loginUser = async (req, res) => {
  // Log de la solicitud
  console.log('Solicitud de login recibida desde:', req.ip);
  
  try {
    // 1. Validación de los datos de entrada
    if (!req.body || typeof req.body !== 'object') {
      console.warn('Intento de login sin body válido');
      return res.status(400).json({
        success: false,
        message: 'Datos de solicitud no válidos'
      });
    }

    const { username, password } = req.body;

    // 2. Validación de campos requeridos
    if (!username || !password) {
      console.warn('Campos requeridos faltantes', {
        usernameProvided: !!username,
        passwordProvided: !!password
      });
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // 3. Limpieza de inputs
    const cleanUsername = username.toString().trim();
    const cleanPassword = password.toString();

    // 4. Buscar usuario en la base de datos
    console.log(`Buscando usuario: ${cleanUsername}`);
    const users = await query(
      `SELECT id, username, password_hash, role, nombre 
       FROM usuarios 
       WHERE username = ? 
       LIMIT 1`,
      [cleanUsername]
    );

    // 5. Verificar si el usuario existe
    if (!users || users.length === 0) {
      console.warn('Usuario no encontrado:', cleanUsername);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];
    console.log(`Usuario encontrado: ID ${user.id}`);

    // 6. Comparación de contraseña con hash almacenado
    console.log('Verificando contraseña...');
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
    
    if (!isPasswordValid) {
      console.warn('Contraseña incorrecta para usuario:', cleanUsername);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 7. Generación del token JWT
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    console.log('Generando token JWT...');
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    // 8. Configuración de la cookie segura
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_EXPIRATION,
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      path: '/'
    };

    console.log('Estableciendo cookie de autenticación...');
    res.cookie('token', token, cookieOptions);

    // 9. Respuesta exitosa
    console.log(`Login exitoso para usuario: ${user.username}`);
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nombre: user.nombre
      },
      tokenExpiresIn: TOKEN_EXPIRATION
    });

  } catch (error) {
    console.error('Error en el proceso de login:', {
      message: error.message,
      stack: error.stack,
      bodyReceived: req.body
    });
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message
      })
    });
  }
};

/**
 * Controlador para cerrar sesión
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Object} Respuesta JSON confirmando el logout
 */
const logoutUser = (req, res) => {
  try {
    console.log('Solicitud de logout recibida');
    
    // Configuración para eliminar la cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      path: '/'
    };

    res.clearCookie('token', cookieOptions);
    
    console.log('Sesión cerrada correctamente');
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

/**
 * Controlador para obtener información del usuario actual
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Object} Respuesta JSON con los datos del usuario
 */
const getMe = async (req, res) => {
  try {
    console.log('Solicitud de información de usuario recibida');
    
    if (!req.user || !req.user.id) {
      console.warn('Intento de acceso no autenticado');
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    console.log(`Buscando información para usuario ID: ${req.user.id}`);
    const users = await query(
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
        message: 'Usuario no encontrado'
      });
    }

    console.log('Información de usuario enviada');
    return res.status(200).json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del usuario'
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  getMe
};
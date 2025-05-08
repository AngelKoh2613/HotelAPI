const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route POST /api/auth/login
 * @desc Autenticar usuario
 * @access Público
 */
router.post('/login', authController.loginUser);

/**
 * @route POST /api/auth/logout
 * @desc Cerrar sesión
 * @access Privado
 */
router.post('/logout', protect, authController.logoutUser);

/**
 * @route GET /api/auth/me
 * @desc Obtener datos del usuario actual
 * @access Privado
 */
router.get('/me', protect, authController.getMe);

module.exports = router;
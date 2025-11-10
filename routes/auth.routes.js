import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, changePassword } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
      .trim()
      .notEmpty().withMessage('El email es requerido')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'TEACHER', 'STUDENT']).withMessage('Rol inválido')
  ],
  validateRequest,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('El email es requerido')
      .isEmail().withMessage('Debe ser un email válido'),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida')
  ],
  validateRequest,
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario actual
 * @access  Private
 */
router.get('/me', auth, getMe);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword')
      .notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  validateRequest,
  changePassword
);

export default router;

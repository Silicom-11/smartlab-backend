import express from 'express';
import { body } from 'express-validator';
import {
  getAllLabs,
  getLabById,
  createLab,
  updateLab,
  deleteLab,
  getLabStats
} from '../controllers/labController.js';
import auth from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   GET /api/labs
 * @desc    Obtener todos los laboratorios
 * @access  Private
 */
router.get('/', auth, getAllLabs);

/**
 * @route   GET /api/labs/:id
 * @desc    Obtener laboratorio por ID
 * @access  Private
 */
router.get('/:id', auth, getLabById);

/**
 * @route   GET /api/labs/:id/stats
 * @desc    Obtener estadísticas del laboratorio
 * @access  Private
 */
router.get('/:id/stats', auth, getLabStats);

/**
 * @route   POST /api/labs
 * @desc    Crear nuevo laboratorio
 * @access  Private (ADMIN only)
 */
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('location')
      .trim()
      .notEmpty().withMessage('La ubicación es requerida'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    body('capacity')
      .optional()
      .isInt({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
    body('openingHours')
      .optional()
  ],
  validateRequest,
  createLab
);

/**
 * @route   PUT /api/labs/:id
 * @desc    Actualizar laboratorio
 * @access  Private (ADMIN only)
 */
router.put(
  '/:id',
  auth,
  isAdmin,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('location')
      .optional()
      .trim(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    body('capacity')
      .optional()
      .isInt({ min: 0 }).withMessage('La capacidad debe ser un número positivo'),
    body('active')
      .optional()
      .isBoolean().withMessage('Active debe ser un booleano')
  ],
  validateRequest,
  updateLab
);

/**
 * @route   DELETE /api/labs/:id
 * @desc    Eliminar laboratorio
 * @access  Private (ADMIN only)
 */
router.delete('/:id', auth, isAdmin, deleteLab);

export default router;

import express from 'express';
import { body } from 'express-validator';
import {
  createReservation,
  getUserReservations,
  getReservationById,
  lookupReservation,
  checkIn,
  checkOut,
  cancelReservation,
  getAllReservations
} from '../controllers/reservationController.js';
import {
  createBulkReservation,
  cancelBulkReservation
} from '../controllers/bulkReservationController.js';
import auth from '../middleware/auth.js';
import { isAdmin, isTeacher } from '../middleware/roleCheck.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   GET /api/reservations
 * @desc    Obtener todas las reservas (ADMIN)
 * @access  Private (ADMIN only)
 */
router.get('/', auth, isAdmin, getAllReservations);

/**
 * @route   POST /api/reservations/bulk
 * @desc    Reserva masiva de laboratorio completo (TEACHER only)
 * @access  Private (TEACHER role)
 */
router.post(
  '/bulk',
  auth,
  isTeacher,
  [
    body('userId')
      .notEmpty().withMessage('El ID del usuario es requerido')
      .isMongoId().withMessage('ID de usuario inválido'),
    body('labId')
      .notEmpty().withMessage('El ID del laboratorio es requerido')
      .isMongoId().withMessage('ID de laboratorio inválido'),
    body('start')
      .notEmpty().withMessage('La fecha de inicio es requerida')
      .isISO8601().withMessage('Fecha de inicio inválida'),
    body('end')
      .notEmpty().withMessage('La fecha de fin es requerida')
      .isISO8601().withMessage('Fecha de fin inválida'),
    body('purpose')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('El propósito no puede exceder 200 caracteres')
  ],
  validateRequest,
  createBulkReservation
);

/**
 * @route   DELETE /api/reservations/bulk
 * @desc    Cancelar reservas masivas (TEACHER only)
 * @access  Private (TEACHER role)
 */
router.delete(
  '/bulk',
  auth,
  isTeacher,
  [
    body('labId')
      .notEmpty().withMessage('El ID del laboratorio es requerido')
      .isMongoId().withMessage('ID de laboratorio inválido'),
    body('start')
      .notEmpty().withMessage('La fecha de inicio es requerida')
      .isISO8601().withMessage('Fecha de inicio inválida'),
    body('userId')
      .notEmpty().withMessage('El ID del usuario es requerido')
      .isMongoId().withMessage('ID de usuario inválido')
  ],
  validateRequest,
  cancelBulkReservation
);

/**
 * @route   POST /api/reservations
 * @desc    Crear nueva reserva
 * @access  Private
 */
router.post(
  '/',
  auth,
  [
    body('userId')
      .notEmpty().withMessage('El ID del usuario es requerido')
      .isMongoId().withMessage('ID de usuario inválido'),
    body('labId')
      .notEmpty().withMessage('El ID del laboratorio es requerido')
      .isMongoId().withMessage('ID de laboratorio inválido'),
    body('stationId')
      .notEmpty().withMessage('El ID de la estación es requerido')
      .isMongoId().withMessage('ID de estación inválido'),
    body('start')
      .notEmpty().withMessage('La fecha de inicio es requerida')
      .isISO8601().withMessage('Fecha de inicio inválida'),
    body('end')
      .notEmpty().withMessage('La fecha de fin es requerida')
      .isISO8601().withMessage('Fecha de fin inválida'),
    body('purpose')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('El propósito no puede exceder 200 caracteres')
  ],
  validateRequest,
  createReservation
);

/**
 * @route   GET /api/reservations/user/:userId
 * @desc    Obtener reservas de un usuario
 * @access  Private
 */
router.get('/user/:userId', auth, getUserReservations);

/**
 * @route   GET /api/reservations/lookup
 * @desc    Buscar reserva por código
 * @access  Private
 */
router.get('/lookup', auth, lookupReservation);

/**
 * @route   GET /api/reservations/:id
 * @desc    Obtener reserva por ID
 * @access  Private
 */
router.get('/:id', auth, getReservationById);

/**
 * @route   PUT /api/reservations/:id/checkin
 * @desc    Hacer check-in
 * @access  Private
 */
router.put(
  '/:id/checkin',
  auth,
  [
    body('method')
      .optional()
      .isIn(['qr', 'manual']).withMessage('Método inválido')
  ],
  validateRequest,
  checkIn
);

/**
 * @route   PUT /api/reservations/:id/checkout
 * @desc    Hacer check-out
 * @access  Private
 */
router.put(
  '/:id/checkout',
  auth,
  [
    body('method')
      .optional()
      .isIn(['qr', 'manual']).withMessage('Método inválido')
  ],
  validateRequest,
  checkOut
);

/**
 * @route   DELETE /api/reservations/:id
 * @desc    Cancelar reserva
 * @access  Private
 */
router.delete('/:id', auth, cancelReservation);

export default router;

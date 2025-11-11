import express from 'express';
import { body } from 'express-validator';
import {
  getAllStations,
  getStationById,
  getStationsByLab,
  createStation,
  updateStation,
  deleteStation,
  updateStationStatus,
  getStationActiveReservations
} from '../controllers/stationController.js';
import auth from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   GET /api/stations
 * @desc    Obtener todas las estaciones
 * @access  Private
 */
router.get('/', auth, getAllStations);

/**
 * @route   GET /api/stations/:id
 * @desc    Obtener estación por ID
 * @access  Private
 */
router.get('/:id', auth, getStationById);

/**
 * @route   GET /api/stations/:id/active-reservations
 * @desc    Obtener reservas activas de una estación
 * @access  Private
 */
router.get('/:id/active-reservations', auth, getStationActiveReservations);

/**
 * @route   GET /api/stations/lab/:labId
 * @desc    Obtener estaciones por laboratorio
 * @access  Private
 */
router.get('/lab/:labId', auth, getStationsByLab);

/**
 * @route   POST /api/stations
 * @desc    Crear nueva estación
 * @access  Private (ADMIN only)
 */
router.post(
  '/',
  auth,
  isAdmin,
  [
    body('labId')
      .notEmpty().withMessage('El ID del laboratorio es requerido')
      .isMongoId().withMessage('ID de laboratorio inválido'),
    body('code')
      .trim()
      .notEmpty().withMessage('El código es requerido')
      .matches(/^[A-Z0-9-]+$/).withMessage('El código solo puede contener letras mayúsculas, números y guiones'),
    body('name')
      .trim()
      .notEmpty().withMessage('El nombre es requerido'),
    body('specifications')
      .optional()
  ],
  validateRequest,
  createStation
);

/**
 * @route   PUT /api/stations/:id
 * @desc    Actualizar estación
 * @access  Private (ADMIN only)
 */
router.put(
  '/:id',
  auth,
  isAdmin,
  [
    body('name')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['free', 'reserved', 'occupied']).withMessage('Estado inválido'),
    body('active')
      .optional()
      .isBoolean().withMessage('Active debe ser un booleano')
  ],
  validateRequest,
  updateStation
);

/**
 * @route   PATCH /api/stations/:id/status
 * @desc    Cambiar estado de estación
 * @access  Private (ADMIN only)
 */
router.patch(
  '/:id/status',
  auth,
  isAdmin,
  [
    body('status')
      .notEmpty().withMessage('El estado es requerido')
      .isIn(['free', 'reserved', 'occupied']).withMessage('Estado inválido')
  ],
  validateRequest,
  updateStationStatus
);

/**
 * @route   DELETE /api/stations/:id
 * @desc    Eliminar estación
 * @access  Private (ADMIN only)
 */
router.delete('/:id', auth, isAdmin, deleteStation);

export default router;

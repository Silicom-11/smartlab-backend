import Reservation from '../models/Reservation.js';
import Station from '../models/Station.js';
import Lab from '../models/Lab.js';
import AccessLog from '../models/AccessLog.js';
import { RESERVATION_STATUS, STATION_STATUS, CHECK_IN_WINDOW_MINUTES } from '../config/constants.js';
import { generateQRCode } from '../services/qrService.js';
import { sendSSEEvent } from '../services/sseService.js';

/**
 * @desc    Crear nueva reserva
 * @route   POST /api/reservations
 * @access  Private
 */
export const createReservation = async (req, res, next) => {
  try {
    const { userId, labId, stationId, start, end, purpose } = req.body;

    // Verificar que la estación existe y está disponible
    const station = await Station.findById(stationId);
    
    if (!station) {
      return res.status(404).json({
        message: 'Estación no encontrada'
      });
    }

    if (!station.active) {
      return res.status(400).json({
        message: 'La estación no está activa'
      });
    }

    if (station.status !== STATION_STATUS.FREE) {
      return res.status(409).json({
        message: 'La estación no está disponible'
      });
    }

    // Convertir fechas
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    // Validar que las fechas sean válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Fechas inválidas'
      });
    }

    // Validar que la fecha de inicio no sea en el pasado
    if (startDate < now) {
      return res.status(400).json({
        message: 'No puedes reservar en una fecha pasada'
      });
    }

    // Validar duración (30 min - 4 horas)
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    
    if (durationMinutes < 30) {
      return res.status(400).json({
        message: 'La duración mínima de la reserva es 30 minutos'
      });
    }

    if (durationMinutes > 240) {
      return res.status(400).json({
        message: 'La duración máxima de la reserva es 4 horas (240 minutos)'
      });
    }

    // Detectar conflictos con otras reservas
    const conflictingReservation = await Reservation.findOne({
      stationId,
      status: { $in: [RESERVATION_STATUS.BOOKED, RESERVATION_STATUS.CHECKED_IN] },
      $or: [
        // La nueva reserva comienza durante una existente
        { start: { $lte: startDate }, end: { $gt: startDate } },
        // La nueva reserva termina durante una existente
        { start: { $lt: endDate }, end: { $gte: endDate } },
        // La nueva reserva engloba una existente
        { start: { $gte: startDate }, end: { $lte: endDate } }
      ]
    });

    if (conflictingReservation) {
      return res.status(409).json({
        message: 'Conflicto: Ya existe una reserva en ese horario',
        conflict: {
          start: conflictingReservation.start,
          end: conflictingReservation.end
        }
      });
    }

    // Crear reserva
    const reservation = await Reservation.create({
      userId,
      labId,
      stationId,
      start: startDate,
      end: endDate,
      purpose,
      status: RESERVATION_STATUS.BOOKED
    });

    // Generar código QR
    const qrCodeUrl = await generateQRCode(reservation.reservationCode);
    reservation.qrCodeUrl = qrCodeUrl;
    await reservation.save();

    // Actualizar estado de la estación
    station.status = STATION_STATUS.RESERVED;
    station.currentReservationId = reservation._id;
    await station.save();

    // Emitir evento SSE
    sendSSEEvent('reservation_created', {
      reservationId: reservation._id,
      stationId: station._id,
      userId
    });

    sendSSEEvent('station_updated', {
      stationId: station._id,
      status: STATION_STATUS.RESERVED
    });

    res.status(201).json({
      message: 'Reserva creada exitosamente',
      reservationId: reservation._id,
      reservationCode: reservation.reservationCode,
      qrCodeUrl: reservation.qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener reservas de un usuario
 * @route   GET /api/reservations/user/:userId
 * @access  Private
 */
export const getUserReservations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, active } = req.query;

    const filter = { userId };

    if (status) {
      filter.status = status;
    }

    if (active === 'true') {
      filter.status = { $in: [RESERVATION_STATUS.BOOKED, RESERVATION_STATUS.CHECKED_IN] };
    }

    const reservations = await Reservation.find(filter)
      .populate('stationId', 'name code')
      .populate('labId', 'name location')
      .sort({ start: -1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener reserva por ID
 * @route   GET /api/reservations/:id
 * @access  Private
 */
export const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('stationId', 'name code')
      .populate('labId', 'name location');

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Buscar reserva por código
 * @route   GET /api/reservations/lookup
 * @access  Private
 */
export const lookupReservation = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        message: 'Se requiere el código de reserva'
      });
    }

    const reservation = await Reservation.findOne({ reservationCode: code })
      .populate('userId', 'name email')
      .populate('stationId', 'name code')
      .populate('labId', 'name location');

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hacer check-in en una reserva
 * @route   PUT /api/reservations/:id/checkin
 * @access  Private
 */
export const checkIn = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que la reserva esté en estado "booked"
    if (!reservation.canCheckIn()) {
      return res.status(403).json({
        message: `No se puede hacer check-in. Estado actual: ${reservation.status}`
      });
    }

    // Verificar ventana de tiempo (primeros 10 minutos)
    if (!reservation.isWithinCheckInWindow(CHECK_IN_WINDOW_MINUTES)) {
      const now = new Date();
      
      if (now < reservation.start) {
        return res.status(403).json({
          message: 'Aún no es tiempo de check-in. La reserva comienza en el futuro.'
        });
      } else {
        return res.status(403).json({
          message: `La ventana de check-in ha expirado. Debías hacer check-in dentro de los primeros ${CHECK_IN_WINDOW_MINUTES} minutos.`
        });
      }
    }

    // Actualizar reserva
    reservation.status = RESERVATION_STATUS.CHECKED_IN;
    reservation.checkInTime = new Date();
    await reservation.save();

    // Actualizar estación
    const station = await Station.findById(reservation.stationId);
    if (station) {
      station.status = STATION_STATUS.OCCUPIED;
      await station.save();
    }

    // Registrar en AccessLog
    await AccessLog.create({
      userId: reservation.userId,
      reservationId: reservation._id,
      stationId: reservation.stationId,
      action: 'check_in',
      method: req.body.method || 'manual',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Emitir eventos SSE
    sendSSEEvent('reservation_checkin', {
      reservationId: reservation._id,
      stationId: reservation.stationId
    });

    sendSSEEvent('station_updated', {
      stationId: reservation.stationId,
      status: STATION_STATUS.OCCUPIED
    });

    res.json({
      message: 'Check-in exitoso',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hacer check-out de una reserva
 * @route   PUT /api/reservations/:id/checkout
 * @access  Private
 */
export const checkOut = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que la reserva esté en estado "checked_in"
    if (!reservation.canCheckOut()) {
      return res.status(403).json({
        message: `No se puede hacer check-out. Estado actual: ${reservation.status}`
      });
    }

    // Actualizar reserva
    reservation.status = RESERVATION_STATUS.FINISHED;
    reservation.checkOutTime = new Date();
    await reservation.save();

    // Liberar estación
    const station = await Station.findById(reservation.stationId);
    if (station) {
      station.status = STATION_STATUS.FREE;
      station.currentReservationId = null;
      await station.save();
    }

    // Registrar en AccessLog
    await AccessLog.create({
      userId: reservation.userId,
      reservationId: reservation._id,
      stationId: reservation.stationId,
      action: 'check_out',
      method: req.body.method || 'manual',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Emitir eventos SSE
    sendSSEEvent('reservation_checkout', {
      reservationId: reservation._id,
      stationId: reservation.stationId
    });

    sendSSEEvent('station_updated', {
      stationId: reservation.stationId,
      status: STATION_STATUS.FREE
    });

    res.json({
      message: 'Check-out exitoso',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancelar reserva
 * @route   DELETE /api/reservations/:id
 * @access  Private
 */
export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que se pueda cancelar
    if (!reservation.canCancel()) {
      return res.status(400).json({
        message: `No se puede cancelar la reserva. Estado actual: ${reservation.status}`
      });
    }

    // Actualizar reserva
    reservation.status = RESERVATION_STATUS.CANCELLED;
    await reservation.save();

    // Liberar estación
    const station = await Station.findById(reservation.stationId);
    if (station) {
      station.status = STATION_STATUS.FREE;
      station.currentReservationId = null;
      await station.save();
    }

    // Emitir eventos SSE
    sendSSEEvent('reservation_cancelled', {
      reservationId: reservation._id,
      stationId: reservation.stationId
    });

    sendSSEEvent('station_updated', {
      stationId: reservation.stationId,
      status: STATION_STATUS.FREE
    });

    res.json({
      message: 'Reserva cancelada exitosamente',
      reservation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener todas las reservas (ADMIN)
 * @route   GET /api/reservations
 * @access  Private (ADMIN only)
 */
export const getAllReservations = async (req, res, next) => {
  try {
    const { status, labId, date } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (labId) filter.labId = labId;
    
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.start = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    const reservations = await Reservation.find(filter)
      .populate('userId', 'name email')
      .populate('stationId', 'name code')
      .populate('labId', 'name location')
      .sort({ start: -1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

export default {
  createReservation,
  getUserReservations,
  getReservationById,
  lookupReservation,
  checkIn,
  checkOut,
  cancelReservation,
  getAllReservations
};

import Reservation from '../models/Reservation.js';
import Station from '../models/Station.js';
import Lab from '../models/Lab.js';
import User from '../models/User.js';
import { RESERVATION_STATUS, ROLES } from '../config/constants.js';
import { sendSSEEvent } from '../services/sseService.js';

/**
 * @desc    Reserva masiva de laboratorio completo (solo para profesores)
 * @route   POST /api/reservations/bulk
 * @access  Private (TEACHER role)
 */
export const createBulkReservation = async (req, res, next) => {
  try {
    const { userId, labId, start, end, purpose } = req.body;

    // Verificar que el usuario existe y es TEACHER
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    if (user.role !== ROLES.TEACHER) {
      return res.status(403).json({
        message: 'Solo los profesores pueden reservar laboratorios completos'
      });
    }

    // Verificar que el laboratorio existe
    const lab = await Lab.findById(labId);
    
    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    if (!lab.active) {
      return res.status(400).json({
        message: 'El laboratorio no está activo'
      });
    }

    // Convertir fechas
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    // Validar fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Fechas inválidas'
      });
    }

    if (startDate < now) {
      return res.status(400).json({
        message: 'No puedes reservar en una fecha pasada'
      });
    }

    // Validar duración (30 min - 8 horas para profesores)
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    
    if (durationMinutes < 30) {
      return res.status(400).json({
        message: 'La duración mínima de la reserva es 30 minutos'
      });
    }

    if (durationMinutes > 480) { // 8 horas máximo para profesores
      return res.status(400).json({
        message: 'La duración máxima de la reserva es 8 horas (480 minutos)'
      });
    }

    // Obtener todas las estaciones activas del laboratorio
    const stations = await Station.find({ 
      labId, 
      active: true 
    });

    if (stations.length === 0) {
      return res.status(400).json({
        message: 'No hay estaciones disponibles en este laboratorio'
      });
    }

    // Verificar conflictos para cada estación
    const availableStations = [];
    const conflictingStations = [];

    for (const station of stations) {
      // Buscar reservas activas que se solapen con el horario solicitado
      const conflicts = await Reservation.find({
        stationId: station._id,
        status: { $in: [RESERVATION_STATUS.BOOKED, RESERVATION_STATUS.CHECKED_IN] },
        $or: [
          // Nueva reserva empieza durante una existente
          { start: { $lte: startDate }, end: { $gt: startDate } },
          // Nueva reserva termina durante una existente
          { start: { $lt: endDate }, end: { $gte: endDate } },
          // Nueva reserva envuelve una existente
          { start: { $gte: startDate }, end: { $lte: endDate } }
        ]
      });

      if (conflicts.length === 0) {
        availableStations.push(station);
      } else {
        conflictingStations.push({
          stationId: station._id,
          code: station.code,
          conflicts: conflicts.length
        });
      }
    }

    if (availableStations.length === 0) {
      return res.status(409).json({
        message: 'No hay estaciones disponibles en este horario',
        totalStations: stations.length,
        conflictingStations,
        hint: 'Todas las estaciones tienen conflictos en el horario seleccionado. Intenta con otro horario.'
      });
    }

    // Crear reservas en lote
    const reservations = availableStations.map(station => ({
      userId,
      labId,
      stationId: station._id,
      start: startDate,
      end: endDate,
      purpose: purpose || 'Clase - Laboratorio completo',
      status: RESERVATION_STATUS.BOOKED,
      bulkReservation: true, // Marcar como reserva masiva
      teacherId: userId // Referencia al profesor
    }));

    // Insertar todas las reservas
    const createdReservations = await Reservation.insertMany(reservations);

    // Actualizar estado de las estaciones a 'reserved'
    await Station.updateMany(
      { _id: { $in: availableStations.map(s => s._id) } },
      { $set: { status: 'reserved' } }
    );

    // Emitir evento SSE para actualizar UI en tiempo real
    sendSSEEvent('reservation_created', {
      labId,
      stationIds: availableStations.map(s => s._id),
      count: createdReservations.length,
      teacher: user.name,
      start: startDate,
      end: endDate
    });

    res.status(201).json({
      success: true,
      message: `Laboratorio completo reservado exitosamente`,
      reservations: createdReservations,
      summary: {
        totalStations: stations.length,
        reservedStations: createdReservations.length,
        conflictingStations: conflictingStations.length,
        labName: lab.name,
        teacher: user.name,
        start: startDate,
        end: endDate,
        duration: `${Math.round(durationMinutes / 60 * 10) / 10} horas`
      },
      conflicts: conflictingStations.length > 0 ? conflictingStations : undefined
    });

  } catch (error) {
    console.error('Error creating bulk reservation:', error);
    next(error);
  }
};

/**
 * @desc    Cancelar todas las reservas de un laboratorio por horario (solo para profesores)
 * @route   DELETE /api/reservations/bulk
 * @access  Private (TEACHER role)
 */
export const cancelBulkReservation = async (req, res, next) => {
  try {
    const { labId, start, userId } = req.body;

    // Verificar que el usuario es TEACHER
    const user = await User.findById(userId);
    
    if (!user || user.role !== ROLES.TEACHER) {
      return res.status(403).json({
        message: 'Solo los profesores pueden cancelar reservas masivas'
      });
    }

    // Buscar todas las reservas del profesor en ese laboratorio y horario
    const reservations = await Reservation.find({
      userId,
      labId,
      start: new Date(start),
      status: { $in: [RESERVATION_STATUS.BOOKED, RESERVATION_STATUS.CHECKED_IN] }
    });

    if (reservations.length === 0) {
      return res.status(404).json({
        message: 'No se encontraron reservas para cancelar'
      });
    }

    // Cancelar todas las reservas
    const canceledIds = reservations.map(r => r._id);
    
    await Reservation.updateMany(
      { _id: { $in: canceledIds } },
      { 
        $set: { 
          status: RESERVATION_STATUS.CANCELLED,
          cancelledAt: new Date()
        } 
      }
    );

    // Actualizar estado de las estaciones a 'free'
    const stationIds = reservations.map(r => r.stationId);
    await Station.updateMany(
      { _id: { $in: stationIds } },
      { $set: { status: 'free' } }
    );

    // Emitir evento SSE
    sendSSEEvent('bulk_reservation_cancelled', {
      labId,
      count: canceledIds.length,
      teacher: user.name
    });

    res.json({
      success: true,
      message: `${canceledIds.length} reservas canceladas exitosamente`,
      cancelled: canceledIds.length
    });

  } catch (error) {
    console.error('Error cancelling bulk reservation:', error);
    next(error);
  }
};

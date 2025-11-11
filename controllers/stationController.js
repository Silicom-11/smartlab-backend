import Station from '../models/Station.js';
import Lab from '../models/Lab.js';
import Reservation from '../models/Reservation.js';
import { STATION_STATUS } from '../config/constants.js';
import { sendSSEEvent } from '../services/sseService.js';

/**
 * @desc    Obtener todas las estaciones
 * @route   GET /api/stations
 * @access  Private
 */
export const getAllStations = async (req, res, next) => {
  try {
    const { labId, status, active } = req.query;

    // Construir filtro
    const filter = {};
    
    if (labId) filter.labId = labId;
    if (status) filter.status = status;
    if (active !== undefined) filter.active = active === 'true';

    const stations = await Station.find(filter)
      .populate('labId', 'name location')
      .sort({ code: 1 });

    // Transformar labId a lab para compatibilidad frontend
    const stationsWithLab = stations.map(station => {
      const stationObj = station.toObject();
      return {
        ...stationObj,
        lab: stationObj.labId,
        labId: stationObj.labId?._id || stationObj.labId
      };
    });

    res.json({
      success: true,
      count: stationsWithLab.length,
      stations: stationsWithLab
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener estación por ID
 * @route   GET /api/stations/:id
 * @access  Private
 */
export const getStationById = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id)
      .populate('labId', 'name location')
      .populate('currentReservationId');

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Estación no encontrada'
      });
    }

    // Transformar labId a lab para compatibilidad frontend
    const stationObj = station.toObject();
    const stationWithLab = {
      ...stationObj,
      lab: stationObj.labId,
      labId: stationObj.labId?._id || stationObj.labId
    };

    res.json({
      success: true,
      station: stationWithLab
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener estaciones por laboratorio
 * @route   GET /api/stations/lab/:labId
 * @access  Private
 */
export const getStationsByLab = async (req, res, next) => {
  try {
    const { labId } = req.params;

    // Verificar que el laboratorio existe
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    const stations = await Station.find({ labId })
      .sort({ code: 1 });

    res.json(stations);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear nueva estación
 * @route   POST /api/stations
 * @access  Private (ADMIN only)
 */
export const createStation = async (req, res, next) => {
  try {
    const { labId, code, name, specifications } = req.body;

    // Verificar que el laboratorio existe
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    // Verificar que el código no exista
    const existingStation = await Station.findOne({ code: code.toUpperCase() });
    if (existingStation) {
      return res.status(400).json({
        message: 'El código de estación ya existe'
      });
    }

    const station = await Station.create({
      labId,
      code: code.toUpperCase(),
      name,
      specifications
    });

    // Actualizar capacidad del laboratorio
    const stationsCount = await Station.countDocuments({ labId });
    lab.capacity = stationsCount;
    await lab.save();

    // Emitir evento SSE
    sendSSEEvent('station_created', {
      stationId: station._id,
      labId: station.labId,
      code: station.code
    });

    res.status(201).json({
      message: 'Estación creada exitosamente',
      station
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar estación
 * @route   PUT /api/stations/:id
 * @access  Private (ADMIN only)
 */
export const updateStation = async (req, res, next) => {
  try {
    const { name, status, active, specifications } = req.body;

    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: 'Estación no encontrada'
      });
    }

    // Actualizar campos
    if (name !== undefined) station.name = name;
    if (status !== undefined) station.status = status;
    if (active !== undefined) station.active = active;
    if (specifications !== undefined) station.specifications = specifications;

    await station.save();

    // Emitir evento SSE
    sendSSEEvent('station_updated', {
      stationId: station._id,
      status: station.status,
      active: station.active
    });

    res.json({
      message: 'Estación actualizada exitosamente',
      station
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar estación
 * @route   DELETE /api/stations/:id
 * @access  Private (ADMIN only)
 */
export const deleteStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: 'Estación no encontrada'
      });
    }

    // Verificar si tiene reservas activas
    const activeReservations = await Reservation.countDocuments({
      stationId: station._id,
      status: { $in: ['booked', 'checked_in'] }
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la estación porque tiene reservas activas'
      });
    }

    const labId = station.labId;
    await station.deleteOne();

    // Actualizar capacidad del laboratorio
    const lab = await Lab.findById(labId);
    if (lab) {
      const stationsCount = await Station.countDocuments({ labId });
      lab.capacity = stationsCount;
      await lab.save();
    }

    res.json({
      message: 'Estación eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cambiar estado de estación manualmente
 * @route   PATCH /api/stations/:id/status
 * @access  Private (ADMIN only)
 */
export const updateStationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!Object.values(STATION_STATUS).includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido'
      });
    }

    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: 'Estación no encontrada'
      });
    }

    station.status = status;
    await station.save();

    // Emitir evento SSE
    sendSSEEvent('station_updated', {
      stationId: station._id,
      status: station.status
    });

    res.json({
      message: `Estado actualizado a ${status}`,
      station
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllStations,
  getStationById,
  getStationsByLab,
  createStation,
  updateStation,
  deleteStation,
  updateStationStatus
};

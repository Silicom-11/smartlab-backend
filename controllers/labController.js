import Lab from '../models/Lab.js';
import Station from '../models/Station.js';

/**
 * @desc    Obtener todos los laboratorios
 * @route   GET /api/labs
 * @access  Private
 */
export const getAllLabs = async (req, res, next) => {
  try {
    const { search, active } = req.query;

    // Construir filtro
    const filter = {};
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    // Búsqueda por texto
    let labs;
    if (search) {
      labs = await Lab.find({
        ...filter,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }).sort({ name: 1 });
    } else {
      labs = await Lab.find(filter).sort({ name: 1 });
    }

    res.json({
      success: true,
      count: labs.length,
      labs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener laboratorio por ID
 * @route   GET /api/labs/:id
 * @access  Private
 */
export const getLabById = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      });
    }

    // Obtener estaciones del laboratorio
    const stations = await Station.find({ labId: lab._id, active: true }).sort({ code: 1 });

    res.json({
      success: true,
      lab: {
        ...lab.toObject(),
        stationsCount: stations.length
      },
      stations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear nuevo laboratorio
 * @route   POST /api/labs
 * @access  Private (ADMIN only)
 */
export const createLab = async (req, res, next) => {
  try {
    const { name, location, description, capacity, openingHours } = req.body;

    const lab = await Lab.create({
      name,
      location,
      description,
      capacity,
      openingHours
    });

    res.status(201).json({
      message: 'Laboratorio creado exitosamente',
      lab
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar laboratorio
 * @route   PUT /api/labs/:id
 * @access  Private (ADMIN only)
 */
export const updateLab = async (req, res, next) => {
  try {
    const { name, location, description, capacity, openingHours, active } = req.body;

    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    // Actualizar campos
    if (name !== undefined) lab.name = name;
    if (location !== undefined) lab.location = location;
    if (description !== undefined) lab.description = description;
    if (capacity !== undefined) lab.capacity = capacity;
    if (openingHours !== undefined) lab.openingHours = openingHours;
    if (active !== undefined) lab.active = active;

    await lab.save();

    res.json({
      message: 'Laboratorio actualizado exitosamente',
      lab
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar laboratorio
 * @route   DELETE /api/labs/:id
 * @access  Private (ADMIN only)
 */
export const deleteLab = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    // Verificar si tiene estaciones asociadas
    const stationsCount = await Station.countDocuments({ labId: lab._id });

    if (stationsCount > 0) {
      return res.status(400).json({
        message: `No se puede eliminar el laboratorio porque tiene ${stationsCount} estación(es) asociada(s)`
      });
    }

    await lab.deleteOne();

    res.json({
      message: 'Laboratorio eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener estadísticas del laboratorio
 * @route   GET /api/labs/:id/stats
 * @access  Private
 */
export const getLabStats = async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({
        message: 'Laboratorio no encontrado'
      });
    }

    const stations = await Station.find({ labId: lab._id });
    
    const stats = {
      total: stations.length,
      free: stations.filter(s => s.status === 'free').length,
      reserved: stations.filter(s => s.status === 'reserved').length,
      occupied: stations.filter(s => s.status === 'occupied').length,
      active: stations.filter(s => s.active).length,
      inactive: stations.filter(s => !s.active).length
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllLabs,
  getLabById,
  createLab,
  updateLab,
  deleteLab,
  getLabStats
};

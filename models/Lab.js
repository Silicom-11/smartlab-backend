import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del laboratorio es requerido'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  location: {
    type: String,
    required: [true, 'La ubicación es requerida'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  capacity: {
    type: Number,
    default: 0,
    min: [0, 'La capacidad no puede ser negativa']
  },
  openingHours: {
    start: {
      type: String,
      default: '07:00'
    },
    end: {
      type: String,
      default: '21:00'
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas por nombre y ubicación
labSchema.index({ name: 'text', location: 'text' });

// Virtual para obtener estaciones del laboratorio
labSchema.virtual('stations', {
  ref: 'Station',
  localField: '_id',
  foreignField: 'labId'
});

// Configurar toJSON para incluir virtuals
labSchema.set('toJSON', { virtuals: true });
labSchema.set('toObject', { virtuals: true });

const Lab = mongoose.model('Lab', labSchema);

export default Lab;

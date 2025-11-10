import mongoose from 'mongoose';
import { STATION_STATUS } from '../config/constants.js';

const stationSchema = new mongoose.Schema({
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: [true, 'El ID del laboratorio es requerido']
  },
  code: {
    type: String,
    required: [true, 'El código de la estación es requerido'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'El nombre de la estación es requerido'],
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(STATION_STATUS),
    default: STATION_STATUS.FREE
  },
  currentReservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  specifications: {
    cpu: String,
    ram: String,
    storage: String,
    software: [String]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
stationSchema.index({ labId: 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ code: 1 });

// Métodos de utilidad
stationSchema.methods.isFree = function() {
  return this.status === STATION_STATUS.FREE;
};

stationSchema.methods.isReserved = function() {
  return this.status === STATION_STATUS.RESERVED;
};

stationSchema.methods.isOccupied = function() {
  return this.status === STATION_STATUS.OCCUPIED;
};

stationSchema.methods.isAvailable = function() {
  return this.status === STATION_STATUS.FREE && this.active;
};

// Extraer número del código (ej: ST-001 -> 1)
stationSchema.methods.getNumber = function() {
  const match = this.code.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

// Middleware para actualizar lastUpdated
stationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Station = mongoose.model('Station', stationSchema);

export default Station;

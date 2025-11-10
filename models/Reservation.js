import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RESERVATION_STATUS } from '../config/constants.js';

const reservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: [true, 'El ID del laboratorio es requerido']
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'El ID de la estación es requerido']
  },
  start: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  end: {
    type: Date,
    required: [true, 'La fecha de fin es requerida']
  },
  status: {
    type: String,
    enum: Object.values(RESERVATION_STATUS),
    default: RESERVATION_STATUS.BOOKED
  },
  reservationCode: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  qrCodeUrl: {
    type: String
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: [200, 'El propósito no puede exceder 200 caracteres']
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  _class: {
    type: String,
    default: 'com.smartlab.backend.models.Reservation'
  }
}, {
  timestamps: true,
  strict: false // Permite campos adicionales de Spring Boot
});

// Índices compuestos para búsquedas eficientes
reservationSchema.index({ stationId: 1, start: 1, end: 1 });
reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ reservationCode: 1 });
reservationSchema.index({ start: 1, end: 1 });

// Validación personalizada: end debe ser después de start
reservationSchema.pre('validate', function(next) {
  if (this.start && this.end && this.end <= this.start) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

// Métodos de utilidad
reservationSchema.methods.isActive = function() {
  return this.status === RESERVATION_STATUS.BOOKED || 
         this.status === RESERVATION_STATUS.CHECKED_IN;
};

reservationSchema.methods.canCheckIn = function() {
  return this.status === RESERVATION_STATUS.BOOKED;
};

reservationSchema.methods.canCheckOut = function() {
  return this.status === RESERVATION_STATUS.CHECKED_IN;
};

reservationSchema.methods.canCancel = function() {
  return this.status === RESERVATION_STATUS.BOOKED;
};

reservationSchema.methods.isFinished = function() {
  return this.status === RESERVATION_STATUS.FINISHED || 
         this.status === RESERVATION_STATUS.CANCELLED || 
         this.status === RESERVATION_STATUS.NO_SHOW;
};

// Calcular duración en minutos
reservationSchema.methods.getDurationMinutes = function() {
  if (!this.start || !this.end) return 0;
  return Math.floor((this.end - this.start) / (1000 * 60));
};

// Verificar si está dentro de la ventana de check-in
reservationSchema.methods.isWithinCheckInWindow = function(windowMinutes = 10) {
  const now = new Date();
  const windowEnd = new Date(this.start.getTime() + windowMinutes * 60000);
  return now >= this.start && now <= windowEnd;
};

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;

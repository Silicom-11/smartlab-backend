import mongoose from 'mongoose';
import { ACCESS_LOG_ACTIONS } from '../config/constants.js';

const accessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  action: {
    type: String,
    enum: Object.values(ACCESS_LOG_ACTIONS),
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['qr', 'manual'],
    default: 'manual'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
accessLogSchema.index({ userId: 1, timestamp: -1 });
accessLogSchema.index({ reservationId: 1 });
accessLogSchema.index({ stationId: 1, timestamp: -1 });
accessLogSchema.index({ timestamp: -1 });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

export default AccessLog;

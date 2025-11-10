import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Cargar variables de entorno
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import labRoutes from './routes/labs.routes.js';
import stationRoutes from './routes/stations.routes.js';
import reservationRoutes from './routes/reservations.routes.js';
import eventRoutes from './routes/events.routes.js';
import userRoutes from './routes/users.js';

// Configuración de variables de entorno
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Crear aplicación Express
const app = express();

// ==================== MIDDLEWARE ====================

// Seguridad HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para desarrollo
  crossOriginEmbedderPolicy: false
}));

// CORS - Configuración para permitir múltiples orígenes
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==================== RUTAS ====================

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartLab API funcionando correctamente',
    environment: NODE_ENV,
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// ==================== MANEJO DE ERRORES ====================
app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================

const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    console.log('✅ Base de datos conectada exitosamente');

    // El scheduler se auto-inicia en reservationScheduler.js
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`🚀 SmartLab Backend escuchando en puerto ${PORT}`);
      console.log(`📝 Entorno: ${NODE_ENV}`);
      console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err);
  console.log('🔴 Cerrando servidor...');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  console.log('🔴 Cerrando servidor...');
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

// Iniciar
startServer();

export default app;



import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Importar modelos
import Lab from '../models/Lab.js';
import Station from '../models/Station.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import AccessLog from '../models/AccessLog.js';

const cleanDatabase = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🗑️  LIMPIANDO BASE DE DATOS...\n');

    // Eliminar todas las colecciones EXCEPTO users
    const labsDeleted = await Lab.deleteMany({});
    console.log(`❌ Laboratorios eliminados: ${labsDeleted.deletedCount}`);

    const stationsDeleted = await Station.deleteMany({});
    console.log(`❌ Estaciones eliminadas: ${stationsDeleted.deletedCount}`);

    const reservationsDeleted = await Reservation.deleteMany({});
    console.log(`❌ Reservas eliminadas: ${reservationsDeleted.deletedCount}`);

    const accessLogsDeleted = await AccessLog.deleteMany({});
    console.log(`❌ Logs de acceso eliminados: ${accessLogsDeleted.deletedCount}`);

    console.log('\n✅ Base de datos limpiada exitosamente');
    console.log('ℹ️  Los usuarios NO fueron eliminados');

    await mongoose.connection.close();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error limpiando base de datos:', error);
    process.exit(1);
  }
};

cleanDatabase();

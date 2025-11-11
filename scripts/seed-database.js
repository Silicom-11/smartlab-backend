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

const seedDatabase = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('🌱 POBLANDO BASE DE DATOS...\n');

    // Crear laboratorios
    const labs = [
      {
        name: 'Laboratorio de Cómputo',
        location: 'Edificio A - Piso 2',
        description: 'Laboratorio principal de computación con equipos de última generación',
        capacity: 30,
        openingHours: { start: '07:00', end: '21:00' },
        active: true
      },
      {
        name: 'Laboratorio de Redes',
        location: 'Edificio B - Piso 1',
        description: 'Laboratorio especializado en redes y telecomunicaciones con equipamiento Cisco',
        capacity: 20,
        openingHours: { start: '08:00', end: '20:00' },
        active: true
      },
      {
        name: 'Laboratorio Multimedia',
        location: 'Edificio A - Piso 3',
        description: 'Laboratorio para diseño gráfico, edición de video y producción audiovisual',
        capacity: 25,
        openingHours: { start: '07:00', end: '22:00' },
        active: true
      },
      {
        name: 'Laboratorio de IA',
        location: 'Edificio C - Piso 4',
        description: 'Laboratorio especializado en Inteligencia Artificial y Machine Learning con GPUs',
        capacity: 15,
        openingHours: { start: '08:00', end: '18:00' },
        active: true
      }
    ];

    console.log('📦 Creando laboratorios...');
    const createdLabs = await Lab.insertMany(labs);
    console.log(`✅ ${createdLabs.length} laboratorios creados\n`);

    // Crear estaciones para cada laboratorio
    let totalStations = 0;

    // Prefijos únicos para cada lab
    const labPrefixes = {
      'Laboratorio de Cómputo': 'COMP',
      'Laboratorio de Redes': 'REDE',
      'Laboratorio Multimedia': 'MULT',
      'Laboratorio de IA': 'IALA'
    };

    for (const lab of createdLabs) {
      const labPrefix = labPrefixes[lab.name] || lab.name.split(' ')[0].toUpperCase().slice(0, 4);
      const stationsCount = lab.capacity; // Crear tantas estaciones como capacidad
      const stations = [];

      console.log(`🖥️  Creando ${stationsCount} estaciones para "${lab.name}" (${labPrefix})...`);

      for (let i = 1; i <= stationsCount; i++) {
        stations.push({
          labId: lab._id,
          code: `${labPrefix}-${String(i).padStart(2, '0')}`,
          name: `Estación ${i}`,
          status: 'free',
          active: true,
          specifications: {
            cpu: i <= 10 ? 'Intel Core i7-12700K' : 'Intel Core i5-11400',
            ram: i <= 10 ? '16GB DDR4' : '8GB DDR4',
            storage: i <= 10 ? '512GB NVMe SSD' : '256GB SSD',
            software: ['Windows 11', 'Office 365', 'Visual Studio Code']
          },
          lastUpdated: new Date()
        });
      }

      await Station.insertMany(stations);
      totalStations += stations.length;
      console.log(`  ✅ ${stations.length} estaciones creadas`);
    }

    console.log(`\n✅ Total: ${totalStations} estaciones creadas`);

    // Actualizar capacidad de labs basado en estaciones creadas
    for (const lab of createdLabs) {
      const stationCount = await Station.countDocuments({ labId: lab._id });
      await Lab.findByIdAndUpdate(lab._id, { capacity: stationCount });
    }

    console.log('\n🎉 Base de datos poblada exitosamente!\n');
    console.log('📊 RESUMEN:');
    console.log(`   - Laboratorios: ${createdLabs.length}`);
    console.log(`   - Estaciones: ${totalStations}`);
    console.log(`   - Promedio: ${Math.round(totalStations / createdLabs.length)} estaciones/lab`);

    await mongoose.connection.close();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error poblando base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();

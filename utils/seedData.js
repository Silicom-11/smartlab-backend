import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Lab from '../models/Lab.js';
import Station from '../models/Station.js';
import connectDB from '../config/database.js';
import { ROLES } from '../config/constants.js';

// Cargar variables de entorno
dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed de base de datos...\n');

    // Conectar a MongoDB
    await connectDB();

    // Limpiar colecciones existentes
    console.log('🗑️  Limpiando colecciones...');
    await User.deleteMany({});
    await Lab.deleteMany({});
    await Station.deleteMany({});
    console.log('✅ Colecciones limpiadas\n');

    // ==================== CREAR USUARIOS ====================
    console.log('👥 Creando usuarios...');
    
    const admin = await User.create({
      name: 'Admin SmartLab',
      email: 'admin@smartlab.com',
      password: 'Admin123!',
      role: ROLES.ADMIN
    });

    const teacher1 = await User.create({
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@smartlab.com',
      password: 'Teacher123!',
      role: ROLES.TEACHER
    });

    const teacher2 = await User.create({
      name: 'María González',
      email: 'maria.gonzalez@smartlab.com',
      password: 'Teacher123!',
      role: ROLES.TEACHER
    });

    const student1 = await User.create({
      name: 'Juan Pérez',
      email: 'juan.perez@smartlab.com',
      password: 'Student123!',
      role: ROLES.STUDENT
    });

    const student2 = await User.create({
      name: 'Ana Martínez',
      email: 'ana.martinez@smartlab.com',
      password: 'Student123!',
      role: ROLES.STUDENT
    });

    const student3 = await User.create({
      name: 'Luis García',
      email: 'luis.garcia@smartlab.com',
      password: 'Student123!',
      role: ROLES.STUDENT
    });

    console.log(`✅ ${await User.countDocuments()} usuarios creados\n`);

    // ==================== CREAR LABORATORIOS ====================
    console.log('🔬 Creando laboratorios...');

    const labComputo = await Lab.create({
      name: 'Laboratorio de Cómputo',
      code: 'LAB-COMP-01',
      description: 'Laboratorio principal de computación con equipos de última generación',
      location: 'Edificio A - Piso 2',
      capacity: 30,
      totalStations: 30,
      image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d'
    });

    const labRedes = await Lab.create({
      name: 'Laboratorio de Redes',
      code: 'LAB-REDES-01',
      description: 'Laboratorio especializado en redes y telecomunicaciones con equipamiento Cisco',
      location: 'Edificio B - Piso 1',
      capacity: 20,
      totalStations: 20,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31'
    });

    const labMultimedia = await Lab.create({
      name: 'Laboratorio Multimedia',
      code: 'LAB-MULTI-01',
      description: 'Laboratorio para diseño gráfico, edición de video y producción audiovisual',
      location: 'Edificio A - Piso 3',
      capacity: 25,
      totalStations: 25,
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2'
    });

    const labIA = await Lab.create({
      name: 'Laboratorio de IA',
      code: 'LAB-IA-01',
      description: 'Laboratorio especializado en Inteligencia Artificial y Machine Learning con GPUs',
      location: 'Edificio C - Piso 4',
      capacity: 15,
      totalStations: 15,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995'
    });

    console.log(`✅ ${await Lab.countDocuments()} laboratorios creados\n`);

    // ==================== CREAR ESTACIONES ====================
    console.log('💻 Creando estaciones...');

    const stations = [];

    // Estaciones para Lab de Cómputo (30 estaciones)
    for (let i = 1; i <= 30; i++) {
      stations.push({
        code: `COMP-${String(i).padStart(2, '0')}`,
        name: `Estación Cómputo ${i}`,
        labId: labComputo._id,
        specifications: {
          processor: 'Intel Core i7-12700',
          ram: '16GB DDR4',
          storage: '512GB SSD',
          gpu: 'NVIDIA GTX 1650',
          os: 'Windows 11 Pro'
        }
      });
    }

    // Estaciones para Lab de Redes (20 estaciones)
    for (let i = 1; i <= 20; i++) {
      stations.push({
        code: `REDES-${String(i).padStart(2, '0')}`,
        name: `Estación Redes ${i}`,
        labId: labRedes._id,
        specifications: {
          processor: 'Intel Core i5-11400',
          ram: '16GB DDR4',
          storage: '256GB SSD',
          network: 'Cisco Equipment',
          os: 'Ubuntu 22.04 LTS'
        }
      });
    }

    // Estaciones para Lab Multimedia (25 estaciones)
    for (let i = 1; i <= 25; i++) {
      stations.push({
        code: `MULTI-${String(i).padStart(2, '0')}`,
        name: `Estación Multimedia ${i}`,
        labId: labMultimedia._id,
        specifications: {
          processor: 'AMD Ryzen 9 5900X',
          ram: '32GB DDR4',
          storage: '1TB NVMe SSD',
          gpu: 'NVIDIA RTX 3060',
          monitor: 'Dell UltraSharp 27" 4K',
          os: 'Windows 11 Pro'
        }
      });
    }

    // Estaciones para Lab de IA (15 estaciones)
    for (let i = 1; i <= 15; i++) {
      stations.push({
        code: `IA-${String(i).padStart(2, '0')}`,
        name: `Estación IA ${i}`,
        labId: labIA._id,
        specifications: {
          processor: 'AMD Ryzen 9 5950X',
          ram: '64GB DDR4',
          storage: '2TB NVMe SSD',
          gpu: 'NVIDIA RTX 3090',
          cuda: 'CUDA 11.8',
          os: 'Ubuntu 22.04 LTS'
        }
      });
    }

    await Station.insertMany(stations);
    console.log(`✅ ${await Station.countDocuments()} estaciones creadas\n`);

    // ==================== RESUMEN ====================
    console.log('='.repeat(60));
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE\n');
    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${await User.countDocuments()}`);
    console.log(`      - Administradores: ${await User.countDocuments({ role: ROLES.ADMIN })}`);
    console.log(`      - Profesores: ${await User.countDocuments({ role: ROLES.TEACHER })}`);
    console.log(`      - Estudiantes: ${await User.countDocuments({ role: ROLES.STUDENT })}`);
    console.log(`   🔬 Laboratorios: ${await Lab.countDocuments()}`);
    console.log(`   💻 Estaciones: ${await Station.countDocuments()}\n`);
    
    console.log('🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 ADMIN:');
    console.log('      Email: admin@smartlab.com');
    console.log('      Password: Admin123!\n');
    console.log('   👨‍🏫 PROFESORES:');
    console.log('      Email: carlos.rodriguez@smartlab.com');
    console.log('      Password: Teacher123!');
    console.log('      Email: maria.gonzalez@smartlab.com');
    console.log('      Password: Teacher123!\n');
    console.log('   👨‍🎓 ESTUDIANTES:');
    console.log('      Email: juan.perez@smartlab.com');
    console.log('      Password: Student123!');
    console.log('      Email: ana.martinez@smartlab.com');
    console.log('      Password: Student123!');
    console.log('      Email: luis.garcia@smartlab.com');
    console.log('      Password: Student123!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
};

// Ejecutar seed
seedData();


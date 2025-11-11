import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lab from '../models/Lab.js';

dotenv.config();

// Mapeo de imágenes de alta calidad según el tipo de laboratorio
const labImageMappings = {
  // Laboratorios de computación/software
  'computo': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80', // Computer lab moderno
  'informatica': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', // Tech workspace
  'programacion': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', // Programming setup
  'software': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', // Coding workspace
  
  // Multimedia/diseño
  'multimedia': 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', // Design studio
  'diseño': 'https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=800&q=80', // Creative workspace
  'grafico': 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80', // Graphic design
  'edicion': 'https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=800&q=80', // Video editing
  
  // Redes/telecomunicaciones
  'redes': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', // Network cables
  'telecomunicaciones': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', // Server room
  'servidores': 'https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?w=800&q=80', // Data center
  
  // Hardware/electrónica
  'hardware': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80', // Hardware components
  'electronica': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80', // Electronics
  'robotica': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80', // Robotics
  
  // Ciencias/investigación
  'ciencias': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80', // Science lab
  'investigacion': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80', // Research
  'quimica': 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800&q=80', // Chemistry
  'fisica': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80', // Physics
  
  // Gaming/simulación
  'gaming': 'https://images.unsplash.com/photo-1598550487193-fe1803ea2506?w=800&q=80', // Gaming setup
  'simulacion': 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800&q=80', // VR/Simulation
  
  // General/default
  'default': 'https://images.unsplash.com/photo-1581093458791-9d42e72e2c0f?w=800&q=80' // Modern lab
};

// Función para encontrar la mejor imagen según el nombre del laboratorio
function getBestImageForLab(labName) {
  const name = labName.toLowerCase();
  
  // Buscar palabras clave en el nombre
  for (const [keyword, imageUrl] of Object.entries(labImageMappings)) {
    if (name.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Retornar imagen por defecto
  return labImageMappings.default;
}

async function updateLabImages() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener todos los laboratorios
    const labs = await Lab.find();
    console.log(`📚 Encontrados ${labs.length} laboratorios\n`);

    if (labs.length === 0) {
      console.log('⚠️  No hay laboratorios para actualizar');
      process.exit(0);
    }

    // Actualizar cada laboratorio
    let updated = 0;
    for (const lab of labs) {
      const bestImage = getBestImageForLab(lab.name);
      
      // Solo actualizar si no tiene imagen o tiene la imagen por defecto genérica
      if (!lab.image || lab.image.includes('placeholder') || lab.image === labImageMappings.default) {
        lab.image = bestImage;
        await lab.save();
        console.log(`✅ ${lab.name}`);
        console.log(`   📸 Imagen: ${bestImage}\n`);
        updated++;
      } else {
        console.log(`⏭️  ${lab.name} (ya tiene imagen personalizada)\n`);
      }
    }

    console.log(`\n🎉 Proceso completado!`);
    console.log(`   Actualizados: ${updated} laboratorios`);
    console.log(`   Sin cambios: ${labs.length - updated} laboratorios`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
updateLabImages();

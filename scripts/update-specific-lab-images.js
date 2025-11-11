import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lab from '../models/Lab.js';

dotenv.config();

// URLs específicas de alta calidad para cada laboratorio
const specificLabImages = {
  'Laboratorio de Cómputo': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&h=800&q=90&fit=crop',
  'Laboratorio de Redes': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=800&q=90&fit=crop',
  'Laboratorio Multimedia': 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=800&q=90&fit=crop',
  'Laboratorio de IA': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&q=90&fit=crop'
};

async function updateSpecificImages() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    for (const [labName, imageUrl] of Object.entries(specificLabImages)) {
      const result = await Lab.updateOne(
        { name: labName },
        { $set: { image: imageUrl } }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ ${labName}`);
        console.log(`   📸 ${imageUrl}\n`);
      } else {
        console.log(`⚠️  ${labName} - No encontrado\n`);
      }
    }

    console.log('🎉 Actualización completada!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
}

updateSpecificImages();

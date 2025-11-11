import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from './models/Station.js';
import Reservation from './models/Reservation.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const labId = '6731e61dbf4fe8d68c7fcb60';
  
  console.log('\n DIAGNÓSTICO LABORATORIO MULTIMEDIA\n');
  
  const stations = await Station.find({labId}).lean();
  console.log(' PRIMERAS 10 ESTACIONES ');
  stations.slice(0, 10).forEach(s => {
    console.log('- ' + s.name + ' (' + s.code + '): ' + s.status + ' | Reserva: ' + (s.currentReservationId || 'NINGUNA'));
  });
  
  const reserved = stations.filter(s => s.status === 'reserved');
  console.log('\nTotal estaciones RESERVED: ' + reserved.length);
  
  if(reserved.length > 0) {
    console.log('\n ESTACIONES EN ESTADO RESERVED ');
    for(const st of reserved) {
      console.log('\n' + st.name + ' (' + st.code + ')');
      if(st.currentReservationId) {
        const res = await Reservation.findById(st.currentReservationId).lean();
        if(!res) {
          console.log('   PROBLEMA: Reserva NO EXISTE (dato huérfano)');
        } else {
          const vencida = new Date(res.end) < new Date();
          console.log('  Estado reserva: ' + res.status);
          console.log('  Fin: ' + new Date(res.end).toLocaleString('es-PE'));
          console.log('  Vencida: ' + (vencida ? ' SÍ - DEBE LIMPIARSE' : ' NO - Válida'));
        }
      } else {
        console.log('   PROBLEMA: SIN currentReservationId pero status=reserved');
      }
    }
  }
  
  const activeRes = await Reservation.find({labId, status: {$in: ['booked','checked_in']}}).lean();
  console.log('\n RESERVAS ACTIVAS (booked/checked_in): ' + activeRes.length + ' ');
  
  process.exit(0);
};

run();

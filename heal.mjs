import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Station from './models/Station.js';
import Reservation from './models/Reservation.js';

dotenv.config();

const heal = async () => {
  console.log(' INICIANDO PROCESO DE SANACIÓN COMPLETA...\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Buscar estaciones en estado 'reserved' sin reserva válida
  console.log(' Paso 1: Buscando estaciones huérfanas...');
  const reservedStations = await Station.find({ status: 'reserved' });
  console.log('   Encontradas: ' + reservedStations.length + ' estaciones en estado reserved\n');
  
  let fixed = 0;
  
  for (const station of reservedStations) {
    if (!station.currentReservationId) {
      console.log(' Reparando: ' + station.name + ' - SIN reserva vinculada');
      station.status = 'free';
      station.currentReservationId = null;
      await station.save();
      fixed++;
    } else {
      const reservation = await Reservation.findById(station.currentReservationId);
      
      if (!reservation) {
        console.log(' Reparando: ' + station.name + ' - Reserva inexistente');
        station.status = 'free';
        station.currentReservationId = null;
        await station.save();
        fixed++;
      } else if (reservation.status === 'finished' || reservation.status === 'cancelled' || reservation.status === 'no_show') {
        console.log(' Reparando: ' + station.name + ' - Reserva en estado ' + reservation.status);
        station.status = 'free';
        station.currentReservationId = null;
        await station.save();
        fixed++;
      } else if (new Date(reservation.end) < new Date()) {
        console.log(' Reparando: ' + station.name + ' - Reserva vencida');
        reservation.status = 'no_show';
        await reservation.save();
        station.status = 'free';
        station.currentReservationId = null;
        await station.save();
        fixed++;
      } else {
        console.log(' OK: ' + station.name + ' - Tiene reserva válida');
      }
    }
  }
  
  // 2. Actualizar reservas vencidas
  console.log('\n Paso 2: Actualizando reservas vencidas...');
  const now = new Date();
  
  const expiredBooked = await Reservation.updateMany(
    { status: 'booked', end: { $lt: now } },
    { $set: { status: 'no_show' } }
  );
  
  const expiredCheckedIn = await Reservation.updateMany(
    { status: 'checked_in', end: { $lt: now } },
    { $set: { status: 'finished', checkOutTime: now } }
  );
  
  console.log('   Reservas BOOKED -> NO_SHOW: ' + expiredBooked.modifiedCount);
  console.log('   Reservas CHECKED_IN -> FINISHED: ' + expiredCheckedIn.modifiedCount);
  
  // 3. Resumen final
  console.log('\n');
  console.log(' SANACIÓN COMPLETADA');
  console.log('');
  console.log(' Estaciones reparadas: ' + fixed);
  console.log(' Reservas actualizadas: ' + (expiredBooked.modifiedCount + expiredCheckedIn.modifiedCount));
  console.log('\n ¡SISTEMA COMPLETAMENTE SANO!\n');
  
  process.exit(0);
};

heal().catch(err => {
  console.error(' Error:', err);
  process.exit(1);
});

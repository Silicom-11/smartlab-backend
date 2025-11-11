import cron from 'node-cron';
import Reservation from '../models/Reservation.js';
import Station from '../models/Station.js';
import { RESERVATION_STATUS, STATION_STATUS } from '../config/constants.js';
import { sendSSEEvent } from './sseService.js';

/**
 * Servicio de limpieza automática de reservas expiradas
 * Se ejecuta cada 5 minutos para actualizar reservas que ya pasaron su hora
 */

export const startReservationCleanup = () => {
  console.log('🧹 Iniciando servicio de limpieza automática de reservas...');

  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      await cleanupExpiredReservations();
    } catch (error) {
      console.error('❌ Error en limpieza automática de reservas:', error);
    }
  });

  // También ejecutar inmediatamente al iniciar
  setTimeout(async () => {
    try {
      await cleanupExpiredReservations();
    } catch (error) {
      console.error('❌ Error en limpieza inicial de reservas:', error);
    }
  }, 5000); // Esperar 5 segundos después de iniciar el servidor

  console.log('✅ Servicio de limpieza automática iniciado (se ejecuta cada 5 minutos)');
};

/**
 * Función principal de limpieza
 */
const cleanupExpiredReservations = async () => {
  const now = new Date();
  let totalUpdated = 0;

  console.log(`🧹 [${now.toLocaleString('es-PE')}] Ejecutando limpieza de reservas expiradas...`);

  // 1. Actualizar reservas BOOKED que ya pasaron (NO_SHOW)
  const expiredBookedReservations = await Reservation.find({
    status: RESERVATION_STATUS.BOOKED,
    end: { $lt: now }
  });

  if (expiredBookedReservations.length > 0) {
    console.log(`   ⏰ Encontradas ${expiredBookedReservations.length} reservas BOOKED expiradas`);

    for (const reservation of expiredBookedReservations) {
      reservation.status = RESERVATION_STATUS.NO_SHOW;
      await reservation.save();
      totalUpdated++;

      // Liberar la estación si estaba reservada
      const station = await Station.findById(reservation.stationId);
      if (station && station.currentReservationId?.toString() === reservation._id.toString()) {
        station.status = STATION_STATUS.FREE;
        station.currentReservationId = null;
        await station.save();

        // Emitir evento SSE
        sendSSEEvent('station_updated', {
          stationId: station._id,
          status: STATION_STATUS.FREE,
          reason: 'reservation_expired'
        });

        console.log(`      ✓ Liberada estación ${station.code} (${station.name})`);
      }
    }
  }

  // 2. Actualizar reservas CHECKED_IN que ya pasaron (FINISHED con auto-checkout)
  const expiredCheckedInReservations = await Reservation.find({
    status: RESERVATION_STATUS.CHECKED_IN,
    end: { $lt: now }
  });

  if (expiredCheckedInReservations.length > 0) {
    console.log(`   ⏰ Encontradas ${expiredCheckedInReservations.length} reservas CHECKED_IN expiradas`);

    for (const reservation of expiredCheckedInReservations) {
      reservation.status = RESERVATION_STATUS.FINISHED;
      reservation.checkOutTime = reservation.end; // Auto check-out en la hora programada
      await reservation.save();
      totalUpdated++;

      // Liberar la estación
      const station = await Station.findById(reservation.stationId);
      if (station && station.currentReservationId?.toString() === reservation._id.toString()) {
        station.status = STATION_STATUS.FREE;
        station.currentReservationId = null;
        await station.save();

        // Emitir evento SSE
        sendSSEEvent('station_updated', {
          stationId: station._id,
          status: STATION_STATUS.FREE,
          reason: 'auto_checkout'
        });

        console.log(`      ✓ Auto check-out y liberada estación ${station.code} (${station.name})`);
      }
    }
  }

  if (totalUpdated > 0) {
    console.log(`   ✅ Total de reservas actualizadas: ${totalUpdated}`);
  } else {
    console.log(`   ℹ️  No hay reservas expiradas para actualizar`);
  }
};

export default { startReservationCleanup };

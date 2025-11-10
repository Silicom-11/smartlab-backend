import cron from 'node-cron';
import Reservation from '../models/Reservation.js';
import Station from '../models/Station.js';
import { RESERVATION_STATUS, STATION_STATUS, CHECK_IN_WINDOW_MINUTES } from '../config/constants.js';
import { sendSSEEvent } from './sseService.js';

/**
 * Scheduler para revisar y actualizar reservas vencidas
 * Se ejecuta cada 5 minutos (configurable con env var)
 */
const startReservationScheduler = () => {
  const cronPattern = process.env.AUTO_CHECK_SCHEDULER_INTERVAL || '*/5 * * * *';
  
  console.log(`⏰ Iniciando scheduler de reservas: ${cronPattern}`);

  cron.schedule(cronPattern, async () => {
    try {
      await processExpiredReservations();
      await processFinishedReservations();
    } catch (error) {
      console.error('❌ Error en scheduler de reservas:', error);
    }
  });
};

/**
 * Procesa reservas que no tuvieron check-in a tiempo
 */
const processExpiredReservations = async () => {
  const now = new Date();
  const checkInDeadline = new Date(now.getTime() - CHECK_IN_WINDOW_MINUTES * 60000);

  try {
    // Buscar reservas "booked" cuyo tiempo de inicio + ventana ya pasó
    const expiredReservations = await Reservation.find({
      status: RESERVATION_STATUS.BOOKED,
      start: { $lt: checkInDeadline }
    });

    if (expiredReservations.length === 0) {
      return;
    }

    console.log(`🔄 Procesando ${expiredReservations.length} reserva(s) sin check-in...`);

    for (const reservation of expiredReservations) {
      // Marcar como "no_show"
      reservation.status = RESERVATION_STATUS.NO_SHOW;
      await reservation.save();

      // Liberar la estación
      const station = await Station.findById(reservation.stationId);
      if (station) {
        station.status = STATION_STATUS.FREE;
        station.currentReservationId = null;
        await station.save();

        // Emitir evento SSE
        sendSSEEvent('station_updated', {
          stationId: station._id,
          status: STATION_STATUS.FREE
        });
      }

      sendSSEEvent('reservation_no_show', {
        reservationId: reservation._id,
        stationId: reservation.stationId
      });

      console.log(`⚠️  Reserva ${reservation._id} marcada como NO_SHOW`);
    }
  } catch (error) {
    console.error('Error procesando reservas vencidas:', error);
  }
};

/**
 * Procesa reservas con check-in cuyo tiempo ya terminó
 */
const processFinishedReservations = async () => {
  const now = new Date();

  try {
    // Buscar reservas "checked_in" cuyo tiempo de fin ya pasó
    const finishedReservations = await Reservation.find({
      status: RESERVATION_STATUS.CHECKED_IN,
      end: { $lt: now }
    });

    if (finishedReservations.length === 0) {
      return;
    }

    console.log(`🔄 Auto-finalizando ${finishedReservations.length} reserva(s)...`);

    for (const reservation of finishedReservations) {
      // Marcar como "finished" automáticamente
      reservation.status = RESERVATION_STATUS.FINISHED;
      reservation.checkOutTime = now;
      await reservation.save();

      // Liberar la estación
      const station = await Station.findById(reservation.stationId);
      if (station) {
        station.status = STATION_STATUS.FREE;
        station.currentReservationId = null;
        await station.save();

        // Emitir evento SSE
        sendSSEEvent('station_updated', {
          stationId: station._id,
          status: STATION_STATUS.FREE
        });
      }

      sendSSEEvent('reservation_finished', {
        reservationId: reservation._id,
        stationId: reservation.stationId,
        autoFinished: true
      });

      console.log(`✅ Reserva ${reservation._id} auto-finalizada`);
    }
  } catch (error) {
    console.error('Error procesando reservas finalizadas:', error);
  }
};

/**
 * Ejecutar procesamiento manual (útil para testing)
 */
export const runManualCheck = async () => {
  console.log('🔧 Ejecutando revisión manual de reservas...');
  await processExpiredReservations();
  await processFinishedReservations();
  console.log('✅ Revisión manual completada');
};

// Iniciar scheduler automáticamente
startReservationScheduler();

export default {
  startReservationScheduler,
  runManualCheck
};

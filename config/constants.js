// Constantes de la aplicación
export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT'
};

export const STATION_STATUS = {
  FREE: 'free',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied'
};

export const RESERVATION_STATUS = {
  BOOKED: 'booked',
  CHECKED_IN: 'checked_in',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

export const CHECK_IN_WINDOW_MINUTES = parseInt(process.env.CHECK_IN_WINDOW_MINUTES) || 10;

export const ACCESS_LOG_ACTIONS = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out'
};

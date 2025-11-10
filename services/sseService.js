/**
 * Servicio de Server-Sent Events (SSE)
 * Permite enviar actualizaciones en tiempo real a los clientes conectados
 */

let clients = [];

/**
 * Agregar un nuevo cliente al pool de SSE
 * @param {object} res - Objeto response de Express
 */
export const addClient = (res) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Enviar comentario inicial para mantener conexión viva
  res.write(': connected\n\n');

  // Agregar cliente al array
  clients.push(res);
  console.log(`✅ SSE: Cliente conectado. Total: ${clients.length}`);

  // Mantener conexión viva enviando ping cada 30 segundos
  const keepAliveInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  // Manejar desconexión del cliente
  res.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter(client => client !== res);
    console.log(`❌ SSE: Cliente desconectado. Total: ${clients.length}`);
  });
};

/**
 * Enviar evento a todos los clientes conectados
 * @param {string} eventType - Tipo de evento (station_updated, reservation_created, etc.)
 * @param {object} data - Datos del evento
 */
export const sendSSEEvent = (eventType, data) => {
  if (clients.length === 0) {
    return; // No hay clientes conectados
  }

  const eventData = JSON.stringify(data);
  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;

  console.log(`📡 SSE: Enviando evento '${eventType}' a ${clients.length} cliente(s)`);

  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error al enviar evento SSE:', error);
    }
  });
};

/**
 * Cerrar todas las conexiones SSE
 */
export const closeAllConnections = () => {
  clients.forEach(client => {
    try {
      client.end();
    } catch (error) {
      console.error('Error al cerrar conexión SSE:', error);
    }
  });
  
  clients = [];
  console.log('🔌 SSE: Todas las conexiones cerradas');
};

/**
 * Obtener número de clientes conectados
 * @returns {number} Número de clientes
 */
export const getClientCount = () => {
  return clients.length;
};

export default {
  addClient,
  sendSSEEvent,
  closeAllConnections,
  getClientCount
};

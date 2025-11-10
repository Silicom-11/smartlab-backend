import express from 'express';
import { addClient } from '../services/sseService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/events/stream
 * @desc    Server-Sent Events stream para actualizaciones en tiempo real
 * @access  Private
 */
router.get('/stream', auth, (req, res) => {
  // Configurar SSE
  addClient(res);
  
  // Enviar evento de conexión exitosa
  res.write(`event: connected\ndata: ${JSON.stringify({ 
    message: 'Conectado al stream de eventos',
    userId: req.user.id,
    timestamp: new Date()
  })}\n\n`);
});

export default router;

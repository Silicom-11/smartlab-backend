import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acceso denegado. No se proporcionó token de autenticación.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuario
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        message: 'Usuario no encontrado.' 
      });
    }

    if (!user.active) {
      return res.status(401).json({ 
        message: 'Usuario inactivo.' 
      });
    }

    // Agregar usuario al request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.message === 'Invalid token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado. Por favor inicia sesión nuevamente.' 
      });
    }

    res.status(500).json({ 
      message: 'Error en la autenticación.' 
    });
  }
};

export default auth;

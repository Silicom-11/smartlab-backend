import { ROLES } from '../config/constants.js';

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * @param  {...string} allowedRoles - Roles permitidos (ADMIN, TEACHER, STUDENT)
 */
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'No autorizado. Se requiere autenticación.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Acceso denegado. No tienes permisos suficientes.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario sea ADMIN
 */
export const isAdmin = checkRole(ROLES.ADMIN);

/**
 * Middleware para verificar que el usuario sea ADMIN o TEACHER
 */
export const isAdminOrTeacher = checkRole(ROLES.ADMIN, ROLES.TEACHER);

/**
 * Middleware para verificar que el usuario esté autenticado (cualquier rol)
 */
export const isAuthenticated = checkRole(ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT);

export default {
  checkRole,
  isAdmin,
  isAdminOrTeacher,
  isAuthenticated
};

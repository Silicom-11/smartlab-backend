import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    // Solo los administradores pueden ver todos los usuarios
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    const usersWithPublicData = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      data: usersWithPublicData
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    // Solo los administradores pueden cambiar roles
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Validar el rol
    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // No permitir que un admin se quite sus propios permisos
    if (userId === req.user.id && role !== 'ADMIN') {
      return res.status(400).json({ 
        message: 'No puedes cambiar tu propio rol de administrador' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    // Solo los administradores pueden activar/desactivar usuarios
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    const { userId } = req.params;

    // No permitir que un admin se desactive a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ 
        message: 'No puedes desactivar tu propia cuenta' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Error al cambiar estado del usuario' });
  }
};

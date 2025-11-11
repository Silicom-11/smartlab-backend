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

export const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si se proporciona nueva contraseña, validar la actual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Proporciona tu contraseña actual' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      user.password = newPassword;
    }

    // Actualizar nombre y email
    if (name) user.name = name;
    if (email) {
      // Verificar si el email ya existe (excepto el usuario actual)
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

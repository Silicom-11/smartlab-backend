import express from 'express';
import * as userController from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', userController.getAllUsers);

// @route   PUT /api/users/:userId/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:userId/role', userController.updateUserRole);

// @route   PUT /api/users/:userId/toggle-status
// @desc    Toggle user active status (Admin only)
// @access  Private/Admin
router.put('/:userId/toggle-status', userController.toggleUserStatus);

export default router;

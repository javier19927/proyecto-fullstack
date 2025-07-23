import { Router } from 'express';
import { getProfile, login, logout, refreshToken, validateToken } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// RUTAS DE AUTENTICACION
// ============================================

// POST /api/auth/login - Iniciar sesion
router.post('/login', login);

// POST /api/auth/logout - Cerrar sesion  
router.post('/logout', logout);

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', verifyToken, getProfile);

// POST /api/auth/refresh - Renovar token
router.post('/refresh', verifyToken, refreshToken);

// GET /api/auth/validate - Validar token
router.get('/validate', verifyToken, validateToken);

export default router;
